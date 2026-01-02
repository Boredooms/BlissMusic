import { get, set } from 'idb-keyval';
import type { Track } from '@/types';
import { useListeningHistory } from '@/stores/listeningHistoryStore';
import { useAuthStore } from '@/stores/authStore';

const CACHE_KEY = 'bliss_quick_picks_cache';
const CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour - updates every hour for freshness

export interface QuickPicksResponse {
    recommendations: Track[];
    metadata: {
        region: string;
        timeOfDay: string;
        mood: string;
    };
}

export class QuickPicksService {
    static async getQuickPicks(forceRefresh = false): Promise<QuickPicksResponse> {
        // 1. Check Cache (if not forced)
        if (!forceRefresh) {
            const cached = await this.getFromCache();
            if (cached) {
                console.log('[QuickPicks] ⚡ Using cached mix (10h TTL)');
                return cached;
            }
        }

        // 2. Gather simple context (UserId for history)
        const userId = useAuthStore.getState().userId;
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        // 3. Fetch from robust API
        try {
            const res = await fetch(`/api/recommendations/quick-picks?userId=${userId || ''}&timezone=${timezone}&refresh=${forceRefresh}`);
            if (!res.ok) throw new Error('API failed');

            const data: QuickPicksResponse = await res.json();

            // 4. Cache it
            if (data.recommendations && data.recommendations.length > 0) {
                await this.saveToCache(data);
                return data;
            }

            throw new Error('No tracks found');
        } catch (e) {
            console.error('[QuickPicks] Service error:', e);
            throw e;
        }
    }

    private static async getFromCache(): Promise<QuickPicksResponse | null> {
        try {
            const cached = await get<{ timestamp: number; data: QuickPicksResponse }>(CACHE_KEY);
            if (!cached) return null;

            if (Date.now() - cached.timestamp > CACHE_DURATION) {
                console.log('[QuickPicks] 🕒 Cache expired');
                return null;
            }
            return cached.data;
        } catch (e) {
            return null;
        }
    }

    private static async saveToCache(data: QuickPicksResponse) {
        await set(CACHE_KEY, { timestamp: Date.now(), data });
    }

    static async clearCache() {
        await set(CACHE_KEY, null);
    }
}
