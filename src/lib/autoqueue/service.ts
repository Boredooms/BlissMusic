/**
 * Auto-Queue Service
 * Hybrid approach: Algorithms + AI for cost optimization
 * - Uses cached data (80%+ hit rate)
 * - Falls back to algorithms
 * - Calls Gemini only when truly needed
 */

import type { Track } from '@/types';
import { autoQueueCache } from './cache';
import { listeningAnalytics } from './analytics';
import { generateSmartQueue } from '@/lib/gemini';
import { generateSmartQueueAlgo } from '@/lib/recommendations';
import { searchYouTubeMusic } from '@/lib/youtube/api';

interface AutoQueueConfig {
    minQueueSize: number; // Trigger when queue drops below this
    maxQueueSize: number; // Maximum songs to prefetch
    useAI: boolean; // Enable/disable AI (for cost control)
    cacheFirst: boolean; // Always try cache first
}

class AutoQueueService {
    private config: AutoQueueConfig = {
        minQueueSize: 3,
        maxQueueSize: 15,
        useAI: true,
        cacheFirst: true,
    };

    private isLoading = false;
    private lastAICall = 0;
    private AI_COOLDOWN = 5 * 60 * 1000; // 5 min cooldown between AI calls

    /**
     * Main method: Generate recommendations
     * Smart cost optimization with fallback chain
     */
    async generateRecommendations(
        currentTrack: Track,
        queueSize: number
    ): Promise<Track[]> {
        if (this.isLoading) {
            console.log('[AutoQueue] Already loading, skipping...');
            return [];
        }

        this.isLoading = true;

        try {
            // STEP 1: Try cache first (fastest, FREE)
            if (this.config.cacheFirst) {
                const cached = await this.getCachedRecommendations(currentTrack);
                if (cached.length > 0) {
                    console.log('[AutoQueue] ✅ Cache hit! (FREE)');
                    return cached;
                }
            }

            // STEP 2: Check if we should use AI
            const shouldUseAI = this.shouldUseAI();
            const sessionAnalysis = listeningAnalytics.analyzeSession();

            if (shouldUseAI && this.config.useAI) {
                // Use Gemini AI
                console.log('[AutoQueue] 🤖 Calling Gemini AI...');
                const aiRecs = await this.getAIRecommendations(currentTrack);

                if (aiRecs.length > 0) {
                    // Cache AI results for future use
                    await this.cacheRecommendations(currentTrack, aiRecs);
                    return aiRecs;
                }
            }

            // STEP 3: Fallback to algorithmic (FREE, always works)
            console.log('[AutoQueue] 🔄 Using algorithmic fallback (FREE)');
            const algoRecs = await this.getAlgorithmicRecommendations(currentTrack);

            // Cache algorithmic results too
            if (algoRecs.length > 0) {
                await this.cacheRecommendations(currentTrack, algoRecs);
            }

            return algoRecs;

        } catch (error) {
            console.error('[AutoQueue] Error:', error);
            // Emergency fallback: trending music
            return this.getEmergencyFallback();
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Get cached recommendations
     */
    private async getCachedRecommendations(track: Track): Promise<Track[]> {
        try {
            const cached = await autoQueueCache.getRecommendations(track.id);
            if (!cached) return [];

            // Convert cached track IDs to Track objects
            const tracks: Track[] = [];
            for (const trackId of cached.recommendations.slice(0, this.config.maxQueueSize)) {
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
            console.error('[AutoQueue] Cache error:', error);
            return [];
        }
    }

    /**
     * Get AI-powered recommendations from Gemini
     * COST: ~$0.001 per call (with caching)
     */
    private async getAIRecommendations(track: Track): Promise<Track[]> {
        try {
            this.lastAICall = Date.now();

            // Get session context for better recommendations
            const context = listeningAnalytics.getSessionContext();
            const recentTracks = listeningAnalytics['sessionData'].tracks.slice(-10);

            // Call Gemini
            const recommendations = await generateSmartQueue(track, this.config.maxQueueSize);

            // Convert AI queries to actual tracks
            const tracks: Track[] = [];
            for (const rec of recommendations) {
                const results = await searchYouTubeMusic(rec.query, 1);
                if (results.length > 0) {
                    tracks.push(results[0]);

                    // Cache track metadata
                    await autoQueueCache.storeTrackMetadata({
                        trackId: results[0].id,
                        title: results[0].title,
                        artist: results[0].artist,
                        thumbnail: results[0].thumbnail,
                        duration: results[0].duration,
                        videoId: results[0].videoId,
                        timestamp: Date.now(),
                    });
                }
            }

            console.log(`[AutoQueue] AI returned ${tracks.length} tracks`);
            return tracks;

        } catch (error) {
            console.error('[AutoQueue] AI error:', error);
            return [];
        }
    }

    /**
     * Get algorithmic recommendations (FREE)
     * Uses YouTube Data API directly instead of ytmusic library
     */
    private async getAlgorithmicRecommendations(track: Track): Promise<Track[]> {
        try {
            // More diverse search queries for variety
            const queries = [
                `${track.title} ${track.artist}`, // Similar to current
                `songs like ${track.title}`, // Similar style
                `${track.artist} best songs`, // Same artist
                `popular songs ${new Date().getFullYear()}`, // Trending this year
                `${track.artist} radio mix`, // Artist radio
                `best music 2024 2025`, // Recent popular
            ];

            // Shuffle queries for randomness
            const shuffledQueries = queries.sort(() => Math.random() - 0.5);

            const tracks: Track[] = [];
            const seenIds = new Set<string>([track.id]);

            for (const query of shuffledQueries) {
                if (tracks.length >= this.config.maxQueueSize) break;

                const results = await searchYouTubeMusic(query, 5);
                for (const result of results) {
                    if (!seenIds.has(result.id) && tracks.length < this.config.maxQueueSize) {
                        seenIds.add(result.id);
                        tracks.push(result);
                    }
                }
            }

            // Cache all tracks
            await autoQueueCache.batchStoreMetadata(
                tracks.map(t => ({
                    trackId: t.id,
                    title: t.title,
                    artist: t.artist,
                    thumbnail: t.thumbnail,
                    duration: t.duration,
                    videoId: t.videoId,
                    timestamp: Date.now(),
                }))
            );

            console.log(`[AutoQueue] Algorithmic returned ${tracks.length} diverse tracks`);
            return tracks;
        } catch (error) {
            console.error('[AutoQueue] Algorithmic error:', error);
            return [];
        }
    }

    /**
     * Emergency fallback: trending music
     */
    private async getEmergencyFallback(): Promise<Track[]> {
        try {
            const { fetchTrendingMusic } = await import('@/lib/youtube/api');
            return await fetchTrendingMusic({ maxResults: 10 });
        } catch (error) {
            console.error('[AutoQueue] Emergency fallback failed:', error);
            return [];
        }
    }

    /**
     * Cache recommendations for future use
     */
    private async cacheRecommendations(track: Track, recommendations: Track[]): Promise<void> {
        try {
            const analysis = listeningAnalytics.analyzeSession();

            await autoQueueCache.storeRecommendations({
                trackId: track.id,
                recommendations: recommendations.map(t => t.id),
                timestamp: Date.now(),
                context: {
                    mood: analysis.mood,
                    timeOfDay: analysis.timeOfDay,
                },
            });
        } catch (error) {
            console.error('[AutoQueue] Cache store error:', error);
        }
    }

    /**
     * Decide if we should use AI
     * Cost optimization logic
     */
    private shouldUseAI(): boolean {
        // Check cooldown (don't spam AI)
        const timeSinceLastCall = Date.now() - this.lastAICall;
        if (timeSinceLastCall < this.AI_COOLDOWN) {
            console.log(`[AutoQueue] AI cooldown (${Math.round((this.AI_COOLDOWN - timeSinceLastCall) / 1000)}s left)`);
            return false;
        }

        // Check if analytics suggest we need AI
        const shouldTrigger = listeningAnalytics.shouldTriggerAI();

        return shouldTrigger;
    }

    /**
     * Update configuration
     */
    updateConfig(config: Partial<AutoQueueConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current stats
     */
    async getStats(): Promise<{
        cacheSize: { recommendations: number; tracks: number };
        lastAICall: number;
        sessionTracks: number;
    }> {
        const cacheSize = await autoQueueCache.getStats();
        return {
            cacheSize,
            lastAICall: this.lastAICall,
            sessionTracks: listeningAnalytics['sessionData'].tracks.length,
        };
    }
}

// Singleton export
export const autoQueueService = new AutoQueueService();
