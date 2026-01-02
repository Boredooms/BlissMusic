'use client';

import { useEffect, useState } from 'react';
import { TrackCard } from '@/components/cards';
import { Sparkles, RefreshCw, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/stores/queueStore';
import { RecommendationService } from '@/lib/recommendations/recommendation-service';
import type { Track } from '@/types';

// Distinct Styles for the AI Section
const GRADIENT_TEXT = "bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400";

interface MadeForYouProps {
    mood?: string;
}

export function MadeForYou({ mood }: MadeForYouProps) {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [reason, setReason] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { setQueue } = useQueueStore();

    async function loadMix(forceRefresh = false) {
        setIsLoading(true);
        setError(null);

        try {
            if (forceRefresh) {
                await RecommendationService.clearCache();
            }
            const mix = await RecommendationService.getPersonalizedMix();
            setTracks(mix.tracks);
            setReason(mix.reason);
        } catch (err) {
            console.error('MadeForYou error:', err);
            setError('Could not curate your mix. Try again later.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadMix();
    }, []);

    const handlePlayAll = () => {
        if (tracks.length > 0) {
            setQueue(tracks, 0);
        }
    };

    if (error) {
        return (
            <section className="mb-12">
                <div className="flex items-center justify-between mb-4">
                    <h2 className={`text-2xl font-bold ${GRADIENT_TEXT}`}>Made for You</h2>
                    <Button variant="ghost" size="sm" onClick={() => loadMix(true)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                </div>
                <p className="text-muted-foreground text-sm">{error}</p>
            </section>
        );
    }

    return (
        <section className="mb-12 relative group/section">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-purple-400 animate-pulse" />
                        <h2 className={`text-2xl font-bold tracking-tight ${GRADIENT_TEXT}`}>
                            Made for You
                        </h2>
                    </div>

                    {/* Living Context Description */}
                    <div className="h-6">
                        {!isLoading && reason && (
                            <p className="text-sm text-white/60 font-medium animate-in fade-in slide-in-from-left-2 duration-500">
                                {reason}
                            </p>
                        )}
                        {isLoading && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-white/40">Curating your vibe...</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {tracks.length > 0 && (
                        <Button
                            onClick={handlePlayAll}
                            className="bg-white text-black hover:bg-white/90 font-semibold shadow-lg shadow-purple-500/20"
                        >
                            <Radio className="w-4 h-4 mr-2" />
                            Play Mix
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => loadMix(true)}
                        title="Refresh Mix (Clears Cache)"
                        className="text-white/40 hover:text-white"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="aspect-square rounded-xl bg-white/5 animate-pulse" />
                            <div className="h-4 rounded bg-white/5 w-3/4 animate-pulse" />
                            <div className="h-3 rounded bg-white/5 w-1/2 animate-pulse" />
                        </div>
                    ))}
                </div>
            ) : tracks.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {tracks.map((track, index) => (
                        <div key={track.id} className="relative group">
                            <TrackCard
                                track={track}
                                onPlay={() => setQueue(tracks, index)}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5">
                    <Sparkles className="w-12 h-12 text-white/20 mx-auto mb-4" />
                    <p className="text-white/60">
                        Start listening to some music to unlock your personalized mix!
                    </p>
                </div>
            )}
        </section>
    );
}
