import { get, set } from 'idb-keyval';
import type { Track } from '@/types';
import { useListeningHistory } from '@/stores/listeningHistoryStore';
import { useLibraryStore } from '@/stores/libraryStore';

const CACHE_KEY = 'bliss_made_for_you_cache';
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

interface CachedMix {
    timestamp: number;
    tracks: Track[];
    reason: string;
    context: string;
}

export interface RecommendationContext {
    timeOfDay: string;
    dayType: 'weekday' | 'weekend';
    recentArtists: string[];
    topGenres: string[];
    likedTracksSample: string[];
}

export class RecommendationService {
    /**
     * Main entry point to get the "Made For You" mix.
     * Checks cache -> Gathers Context -> Calls API -> Caches Result
     */
    static async getPersonalizedMix(): Promise<{ tracks: Track[]; reason: string }> {
        try {
            // 1. Check Cache
            const cached = await this.getFromCache();
            if (cached) {
                console.log('[RecService] ⚡ Using cached mix');
                return { tracks: cached.tracks, reason: cached.reason };
            }

            // 2. Gather Context
            const context = this.gatherUserContext();
            console.log('[RecService] 🧠 Context gathered:', context);

            // 3. Call API (Made for You - uses curated playlists)
            const response = await fetch('/api/recommendations/made-for-you', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...context,
                    seed: Date.now() // Add randomness for variety on each fetch
                }),
            });

            if (!response.ok) throw new Error('API request failed');

            const data = await response.json();

            // 4. Cache Result
            if (data.tracks && data.tracks.length > 0) {
                await this.saveToCache(data.tracks, data.reason, JSON.stringify(context));
                return { tracks: data.tracks, reason: data.reason };
            }

            throw new Error('No tracks returned');

        } catch (error) {
            console.error('[RecService] Failed to get mix:', error);
            // Fallback: Return recently liked songs if everything fails
            const liked = useLibraryStore.getState().likedSongs.slice(0, 20);
            return {
                tracks: liked.map(s => ({
                    id: s.song_id,
                    title: s.title,
                    artist: s.artist,
                    thumbnail: s.thumbnail || '',
                    duration: 0,
                    videoId: s.song_id
                })),
                reason: "We're having trouble reaching our AI DJ, so here are your favorites!"
            };
        }
    }

    private static async getFromCache(): Promise<CachedMix | null> {
        try {
            const cached = await get<CachedMix>(CACHE_KEY);
            if (!cached) return null;

            const age = Date.now() - cached.timestamp;
            if (age > CACHE_DURATION) {
                console.log('[RecService] 🕒 Cache expired');
                return null;
            }

            return cached;
        } catch (e) {
            console.warn('Cache read error', e);
            return null;
        }
    }

    private static async saveToCache(tracks: Track[], reason: string, context: string) {
        try {
            await set(CACHE_KEY, {
                timestamp: Date.now(),
                tracks,
                reason,
                context
            });
        } catch (e) {
            console.warn('Cache write error', e);
        }
    }

    private static gatherUserContext(): RecommendationContext {
        const historyStore = useListeningHistory.getState();
        const libraryStore = useLibraryStore.getState();

        // Time Context (IST - Indian Standard Time)
        const hour = new Date().getHours();
        const day = new Date().getDay();

        console.log(`[RecService] 🕐 Current hour: ${hour}`);

        let timeOfDay = 'late_night';
        if (hour >= 5 && hour < 12) timeOfDay = 'morning';          // 5 AM - 12 PM
        else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';  // 12 PM - 5 PM
        else if (hour >= 17 && hour < 22) timeOfDay = 'evening';    // 5 PM - 10 PM
        // else late_night (10 PM - 5 AM)

        const dayType = (day === 0 || day === 6) ? 'weekend' : 'weekday';

        // User Data
        const recentArtists = historyStore.getRecentArtists(5);
        const topGenres = historyStore.getTopGenres(); // This needs to be real later
        const likedTracksSample = libraryStore.likedSongs
            .slice(0, 10)
            .map(s => `${s.title} - ${s.artist}`);

        return {
            timeOfDay,
            dayType,
            recentArtists,
            topGenres,
            likedTracksSample
        };
    }

    // Debug method to force clear cache
    static async clearCache() {
        await set(CACHE_KEY, null);
        console.log('[RecService] 🧹 Cache cleared');
    }
}
