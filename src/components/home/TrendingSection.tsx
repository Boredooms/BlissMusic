'use client';

import { useEffect, useState } from 'react';
import { TrackCard } from '@/components/cards';
import type { Track } from '@/types';

export function TrendingSection() {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchTrending() {
            try {
                const res = await fetch('/api/trending');
                const data = await res.json();
                setTracks(data.tracks || []);
            } catch (error) {
                console.error('Failed to fetch trending:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchTrending();
    }, []);

    if (isLoading) {
        return (
            <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Trending Now</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="aspect-square rounded-lg skeleton" />
                            <div className="h-4 rounded skeleton w-3/4" />
                            <div className="h-3 rounded skeleton w-1/2" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (tracks.length === 0) {
        return null;
    }

    return (
        <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Trending Now</h2>

            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {tracks.slice(0, 12).map((track) => (
                    <TrackCard key={track.id} track={track} />
                ))}
            </div>
        </section>
    );
}
