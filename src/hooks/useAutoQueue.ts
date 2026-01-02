/**
 * React Hook for Auto-Queue
 * Manages auto-queue state and integrates with player
 */

import { useEffect, useCallback } from 'react';
import { useQueueStore } from '@/stores/queueStore';
import { usePlayerStore } from '@/stores/playerStore';
import { autoQueueService } from '@/lib/autoqueue/service';
import { listeningAnalytics } from '@/lib/autoqueue/analytics';

export function useAutoQueue() {
    const { queue, currentIndex, addTracks, getCurrentTrack } = useQueueStore();
    const { isPlaying } = usePlayerStore();
    const currentTrack = getCurrentTrack();

    /**
     * Check if we should trigger auto-load
     */
    const checkAndLoad = useCallback(async () => {
        // Only auto-load when music is playing
        if (!isPlaying || !currentTrack) {
            return;
        }

        // Check remaining songs in queue
        const remainingSongs = queue.length - currentIndex - 1;

        // Trigger when less than 5 songs remaining (increased from 3 for better UX)
        if (remainingSongs < 5) {
            console.log(`[AutoQueue] Queue running low (${remainingSongs} remaining), loading more...`);

            try {
                // Use the smart recommendations API for better diversity
                const res = await fetch('/api/recommendations/smart', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentTrack,
                        queue, // Pass queue for duplicate filtering
                        queueLength: queue.length,
                        currentIndex,
                    }),
                });

                const data = await res.json();

                if (data.tracks && data.tracks.length > 0) {
                    // Tracks are already smartly filtered
                    addTracks(data.tracks);
                    console.log(`[AutoQueue] ✅ Added ${data.tracks.length} smart tracks (diversity: ${data.diversity})`);
                } else {
                    console.warn('[AutoQueue] ⚠️ Smart API returned 0 tracks');
                }
            } catch (error) {
                console.error('[AutoQueue] ❌ Error:', error);
            }
        }
    }, [isPlaying, currentTrack, queue, currentIndex, addTracks]);

    /**
     * Record track play for analytics
     */
    useEffect(() => {
        if (currentTrack && isPlaying) {
            listeningAnalytics.recordPlay(currentTrack);

            // Check if we should auto-load
            checkAndLoad();
        }
    }, [currentTrack?.id, isPlaying, checkAndLoad]);

    /**
     * Periodic cleanup of old cache
     */
    useEffect(() => {
        const cleanup = setInterval(async () => {
            const { autoQueueCache } = await import('@/lib/autoqueue/cache');
            await autoQueueCache.clearOldEntries();
        }, 24 * 60 * 60 * 1000); // Once per day

        return () => clearInterval(cleanup);
    }, []);

    return {
        checkAndLoad,
        recordSkip: (trackIndex: number) => {
            listeningAnalytics.recordSkip(trackIndex);
        },
    };
}
