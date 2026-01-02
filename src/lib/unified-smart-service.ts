/**
 * Unified Smart Recommendation Service
 * Combines: IndexedDB Cache + Gemini AI + Smart Filtering + Progressive Discovery
 */

import type { Track } from '@/types';
import { autoQueueCache } from '@/lib/autoqueue/cache';
import { listeningAnalytics } from '@/lib/autoqueue/analytics';
import { searchYouTubeMusic } from '@/lib/youtube/api';
import {
    fetchGeminiRecommendations as getGeminiSmartRecommendations,
    calculateDiversityLevel,
    getTimeBasedMood
} from './recommendations/gemini-engine';
import { filterSmartRecommendations } from './recommendations/smart-filter';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface UnifiedRecommendationRequest {
    currentTrack: Track;
    existingQueue: Track[];
    sessionLength?: number;
    skipRate?: number;
}

class UnifiedSmartService {
    private isLoading = false;
    private lastAICall = 0;
    private AI_COOLDOWN = 3 * 60 * 1000; // 3 min cooldown (cost optimization)

    /**
     * Generate smart recommendations with full integration
     * Flow: Cache → Gemini AI → YouTube Search → Smart Filter
     */
    async generateRecommendations(
        request: UnifiedRecommendationRequest
    ): Promise<{
        tracks: Track[];
        source: 'cache' | 'ai' | 'fallback';
        diversity: 'low' | 'medium' | 'high';
    }> {
        if (this.isLoading) {
            console.log('[UnifiedSmart] ⏳ Already loading, please wait...');
            return { tracks: [], source: 'fallback', diversity: 'medium' };
        }

        this.isLoading = true;

        try {
            const { currentTrack, existingQueue, sessionLength = 0, skipRate = 0.1 } = request;

            // Step 1: Try IndexedDB cache (fastest, free)
            const cached = await this.getCachedRecommendations(currentTrack);
            if (cached.length > 0) {
                console.log('[UnifiedSmart] ⚡ Cache hit! (FREE)');
                // Filter cached results
                const filtered = filterSmartRecommendations(cached, existingQueue);
                if (filtered.length > 0) {
                    return {
                        tracks: filtered.slice(0, 20),
                        source: 'cache',
                        diversity: 'medium'
                    };
                }
            }

            // Step 2: Calculate diversity level
            const diversity = calculateDiversityLevel(sessionLength, skipRate);
            console.log(`[UnifiedSmart] 📊 Diversity: ${diversity}`);

            // Step 3: Check if we should use Gemini AI
            const shouldUseAI = this.shouldUseAI();

            let searchQueries: string[];
            let source: 'ai' | 'fallback' = 'fallback';

            if (shouldUseAI) {
                // Step 4: Get intelligent queries from Gemini
                console.log('[UnifiedSmart] 🤖 Using Gemini 2.0 Flash...');
                try {
                    const sessionAnalysis = listeningAnalytics.analyzeSession();

                    searchQueries = await getGeminiSmartRecommendations({
                        currentTrack,
                        listeningHistory: [], // TODO: Get from analytics
                        diversityLevel: diversity,
                        currentMood: getTimeBasedMood(),
                    });

                    source = 'ai';
                    this.lastAICall = Date.now();
                } catch (aiError) {
                    console.error('[UnifiedSmart] Gemini error, using fallback:', aiError);
                    searchQueries = this.getFallbackQueries(currentTrack, diversity);
                }
            } else {
                // Step 5: Use fallback queries (no AI)
                console.log('[UnifiedSmart] 🔄 AI on cooldown, using smart fallback');
                searchQueries = this.getFallbackQueries(currentTrack, diversity);
            }

            // Step 6: Fetch tracks from YouTube Music
            const allTracks = await this.fetchFromQueries(searchQueries, currentTrack);
            console.log(`[UnifiedSmart] 📥 Fetched ${allTracks.length} tracks total`);

            // Step 7: Apply smart filtering
            const filtered = filterSmartRecommendations(allTracks, existingQueue);
            console.log(`[UnifiedSmart] ✅ After filtering: ${filtered.length} unique tracks`);

            // Step 8: Shuffle and take top 20
            const shuffled = filtered.sort(() => Math.random() - 0.5);
            const final = shuffled.slice(0, 20);

            // Step 9: Cache results for future use
            if (final.length > 0) {
                await this.cacheRecommendations(currentTrack, final);
            }

            return { tracks: final, source, diversity };

        } catch (error) {
            console.error('[UnifiedSmart] Error:', error);
            return { tracks: [], source: 'fallback', diversity: 'medium' };
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Get cached recommendations from IndexedDB
     */
    private async getCachedRecommendations(track: Track): Promise<Track[]> {
        try {
            const cached = await autoQueueCache.getRecommendations(track.id);
            if (!cached) return [];

            // Fetch track metadata for cached IDs
            const tracks: Track[] = [];
            for (const trackId of cached.recommendations) {
                const metadata = await autoQueueCache.getTrackMetadata(trackId);
                if (metadata) {
                    tracks.push({
                        id: metadata.trackId,
                        title: metadata.title,
                        artist: metadata.artist,
                        thumbnail: metadata.thumbnail,
                        duration: metadata.duration,
                        videoId: metadata.videoId,
                    });
                }
            }

            return tracks;
        } catch (error) {
            console.error('[UnifiedSmart] Cache error:', error);
            return [];
        }
    }

    /**
     * Cache recommendations to IndexedDB
     */
    private async cacheRecommendations(track: Track, recommendations: Track[]): Promise<void> {
        try {
            // Store recommendation IDs
            await autoQueueCache.storeRecommendations({
                trackId: track.id,
                recommendations: recommendations.map(r => r.id),
                timestamp: Date.now(),
                context: {
                    mood: getTimeBasedMood(),
                    timeOfDay: new Date().getHours().toString(),
                },
            });

            // Store track metadata
            await autoQueueCache.batchStoreMetadata(
                recommendations.map(t => ({
                    trackId: t.id,
                    title: t.title,
                    artist: t.artist,
                    thumbnail: t.thumbnail,
                    duration: t.duration,
                    videoId: t.videoId,
                    timestamp: Date.now(),
                }))
            );

            console.log(`[UnifiedSmart] 💾 Cached ${recommendations.length} tracks to IndexedDB`);
        } catch (error) {
            console.error('[UnifiedSmart] Cache store error:', error);
        }
    }

    /**
     * Check if we should use AI (cooldown + cost control)
     */
    private shouldUseAI(): boolean {
        const timeSinceLastCall = Date.now() - this.lastAICall;
        return timeSinceLastCall >= this.AI_COOLDOWN;
    }

    /**
     * Get fallback queries when AI is unavailable
     */
    private getFallbackQueries(
        track: Track,
        diversity: 'low' | 'medium' | 'high'
    ): string[] {
        const baseQueries = [
            `${track.title} ${track.artist}`,
            `songs like ${track.title}`,
            `${track.artist} popular songs`,
        ];

        const explorationQueries = diversity === 'high' ? [
            `popular music ${new Date().getFullYear()}`,
            `trending songs worldwide`,
            `best music 2024 2025`,
        ] : diversity === 'medium' ? [
            `${track.artist} radio mix`,
            `similar to ${track.title}`,
        ] : [];

        return [...baseQueries, ...explorationQueries];
    }

    /**
     * Fetch tracks from  all search queries
     */
    private async fetchFromQueries(
        queries: string[],
        currentTrack: Track
    ): Promise<Track[]> {
        const allTracks: Track[] = [];
        const seenIds = new Set<string>([currentTrack.id]);

        for (const query of queries) {
            try {
                console.log(`[UnifiedSmart] 🔍 Searching: "${query}"`);
                const results = await searchYouTubeMusic(query, 4);

                for (const track of results) {
                    if (!seenIds.has(track.id)) {
                        seenIds.add(track.id);
                        allTracks.push(track);
                    }
                }
            } catch (error) {
                console.error(`[UnifiedSmart] Search error for "${query}":`, error);
            }
        }

        return allTracks;
    }
}

// Singleton instance
export const unifiedSmartService = new UnifiedSmartService();
