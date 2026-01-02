'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueueStore } from '@/stores/queueStore';
import type { Track } from '@/types';

interface UseSmartQueueOptions {
    autoFillThreshold?: number; // How many tracks left before auto-fill
    autoFillCount?: number; // How many tracks to add
    enabled?: boolean;
}

export function useSmartQueue(options: UseSmartQueueOptions = {}) {
    const {
        autoFillThreshold = 2,
        autoFillCount = 5,
        enabled = true,
    } = options;

    const [isLoading, setIsLoading] = useState(false);
    const [lastFillTime, setLastFillTime] = useState(0);

    const { queue, currentIndex, addToQueue, getCurrentTrack } = useQueueStore();

    const currentTrack = getCurrentTrack();
    const remainingTracks = queue.length - currentIndex - 1;

    // Generate smart queue suggestions
    const fillSmartQueue = useCallback(async () => {
        if (!currentTrack || isLoading) return;

        // Prevent rapid consecutive fills (minimum 30 seconds between fills)
        if (Date.now() - lastFillTime < 30000) return;

        setIsLoading(true);
        setLastFillTime(Date.now());

        try {
            const res = await fetch('/api/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentTrack,
                    recentTracks: queue.slice(Math.max(0, currentIndex - 5), currentIndex + 1),
                    type: 'smart-queue',
                }),
            });

            const data = await res.json();

            if (data.tracks && data.tracks.length > 0) {
                // Filter out tracks already in queue
                const existingIds = new Set(queue.map((t) => t.videoId));
                const newTracks = data.tracks.filter(
                    (t: Track) => !existingIds.has(t.videoId)
                );

                // Add tracks to queue
                newTracks.slice(0, autoFillCount).forEach((track: Track) => {
                    addToQueue(track);
                });
            }
        } catch (error) {
            console.error('Smart queue error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [currentTrack, queue, currentIndex, addToQueue, isLoading, lastFillTime, autoFillCount]);

    // Auto-fill when queue is running low
    useEffect(() => {
        if (!enabled || !currentTrack) return;

        if (remainingTracks <= autoFillThreshold && !isLoading) {
            fillSmartQueue();
        }
    }, [remainingTracks, autoFillThreshold, enabled, currentTrack, isLoading, fillSmartQueue]);

    return {
        isLoading,
        fillSmartQueue,
        remainingTracks,
    };
}
