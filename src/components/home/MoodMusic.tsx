'use client';

import { useEffect, useState, useRef } from 'react';
import { TrackCard } from '@/components/cards';
import { Music2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/stores/queueStore';
import type { Track } from '@/types';

interface MoodMusicProps {
    mood: string | null;
}

export function MoodMusic({ mood }: MoodMusicProps) {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { setQueue } = useQueueStore();
    const currentMoodRef = useRef(mood);

    // Keep ref in sync with prop for checking inside async operations
    useEffect(() => {
        currentMoodRef.current = mood;
    }, [mood]);

    async function fetchMoodMusic() {
        if (!mood) {
            setTracks([]);
            return;
        }

        // Capture the mood meant for this request
        const requestingMood = mood;

        // Clear tracks immediately for visual feedback
        setTracks([]);
        setIsLoading(true);

        try {
            console.log(`[MoodMusic] Fetching for: ${requestingMood}`);
            const res = await fetch(`/api/mood?mood=${encodeURIComponent(requestingMood)}&limit=20`);
            if (!res.ok) throw new Error('Failed to fetch');

            const data = await res.json();

            // Race Condition Check:
            // Only update if the mood we fetched for is STILL the current mood component prop.
            if (requestingMood === currentMoodRef.current) {
                console.log(`[MoodMusic] Loaded ${data.tracks?.length} tracks for ${requestingMood}`);
                setTracks(data.tracks || []);
            } else {
                console.log(`[MoodMusic] Ignoring stale result for ${requestingMood} (Current: ${currentMoodRef.current})`);
            }
        } catch (error) {
            if (requestingMood === currentMoodRef.current) {
                console.error('MoodMusic error:', error);
                setTracks([]);
            }
        } finally {
            if (requestingMood === currentMoodRef.current) {
                setIsLoading(false);
            }
        }
    }

    // Trigger fetch when mood changes
    useEffect(() => {
        fetchMoodMusic();
    }, [mood]);

    if (!mood) return null;

    if (isLoading) {
        return (
            <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                    <Music2 className="w-6 h-6 text-emerald-400" />
                    <h2 className="text-2xl font-bold">{mood} Vibes</h2>
                </div>
                <div className="text-white/50 text-sm">Loading {mood.toLowerCase()} music...</div>
            </div>
        );
    }

    if (tracks.length === 0) return null;

    return (
        <div className="mb-12">
            <div className="flex items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                    <Music2 className="w-6 h-6 text-emerald-400" />
                    <h2 className="text-2xl font-bold">{mood} Vibes</h2>
                    <span className="text-sm text-white/50">• {tracks.length} songs</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchMoodMusic}
                    disabled={isLoading}
                    className="text-white/70 hover:text-white"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {tracks.map((track) => (
                    <TrackCard key={track.id} track={track} />
                ))}
            </div>
        </div>
    );
}
