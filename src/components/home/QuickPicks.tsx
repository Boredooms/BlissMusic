'use client';

import { useEffect, useState } from 'react';
import { TrackCard } from '@/components/cards';
import { RefreshCw, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuickPicksService, QuickPicksResponse } from '@/lib/recommendations/quick-picks-service';
import type { Track } from '@/types';

// Extend Track to include our hybrid reason
interface HybridTrack extends Track {
    reason?: string;
}

export function QuickPicks() {
    const [tracks, setTracks] = useState<HybridTrack[]>([]);
    const [metadata, setMetadata] = useState<QuickPicksResponse['metadata'] | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const loadPicks = async (forceRefresh = false) => {
        setIsLoading(true);
        try {
            if (forceRefresh) {
                await QuickPicksService.clearCache();
            }
            const data = await QuickPicksService.getQuickPicks(forceRefresh);
            setTracks(data.recommendations);
            setMetadata(data.metadata);
        } catch (error) {
            console.error('Failed to load Quick Picks:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadPicks();
    }, []);

    if (isLoading && tracks.length === 0) {
        return (
            <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold tracking-tight">Quick Picks</h2>
                        <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 animate-pulse">
                            <div className="w-12 h-12 rounded-md bg-white/10" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 rounded bg-white/10 w-3/4" />
                                <div className="h-3 rounded bg-white/10 w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    const greeting = metadata?.timeOfDay === 'morning' ? '☀️ Good Morning' :
        metadata?.timeOfDay === 'afternoon' ? '🌅 Good Afternoon' :
            metadata?.timeOfDay === 'evening' ? '🌆 Good Evening' : '🌙 Late Night';

    return (
        <section className="mb-12">
            <div className="flex items-end justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight mb-1">Quick Picks</h2>
                    {metadata && (
                        <div className="flex items-center gap-3 text-sm text-white/60">
                            <span className="flex items-center gap-1.5 font-medium text-white/80">
                                {greeting}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5" />
                                Trending in {metadata.region}
                            </span>
                        </div>
                    )}
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.preventDefault();
                        loadPicks(true);
                    }}
                    disabled={isLoading}
                    className="text-white/40 hover:text-white"
                    title="Refresh Mix"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {tracks.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-white/10 rounded-xl">
                    <p className="text-white/40 mb-4">No picks found for your region yet.</p>
                    <Button onClick={() => loadPicks(true)} variant="secondary" size="sm">
                        Try Again
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3">
                    {tracks.map((track, index) => (
                        <div key={`${track.id}-${index}`} className="group relative transition-colors hover:bg-white/5 p-2 rounded-xl -mx-2">
                            <TrackCard
                                track={track}
                                index={index + 1}
                                isCompact
                                showIndex
                                showDuration={false}
                            />
                            {/* Intelligent Reason Badge */}
                            {track.reason && (
                                <div className="absolute top-2 right-2 max-w-[150px] text-right pointer-events-none">
                                    <span className="inline-block px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/5 text-[10px] font-medium text-white/70 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                        {track.reason}
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
