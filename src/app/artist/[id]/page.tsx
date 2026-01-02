'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Play, Heart, MoreHorizontal, Music2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/stores/queueStore';
import { usePlayerStore } from '@/stores/playerStore';
import { AlbumCard } from '@/components/cards';
import { cn } from '@/lib/utils';
import type { Artist, Track, Album } from '@/types';

type ArtistDetails = Artist & {
    songs: Track[];
    albums: Album[];
};

export default function ArtistPage() {
    const params = useParams();
    const id = params?.id as string;

    const [artist, setArtist] = useState<ArtistDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Queue store for playback control and queue management
    const setQueue = useQueueStore((state) => state.setQueue);
    const currentIndex = useQueueStore((state) => state.currentIndex);
    const queue = useQueueStore((state) => state.queue);

    // Derived state
    const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

    // Player store for playback state
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const togglePlayPause = usePlayerStore((state) => state.togglePlay);

    useEffect(() => {
        if (!id) return;

        async function fetchArtist() {
            try {
                const res = await fetch(`/api/artist?id=${id}`);
                if (!res.ok) throw new Error('Failed to fetch artist');
                const data = await res.json();
                setArtist(data);
            } catch (error) {
                console.error('Error fetching artist:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchArtist();
    }, [id]);

    const handlePlayTopSongs = () => {
        if (artist?.songs && artist.songs.length > 0) {
            setQueue(artist.songs, 0);
        }
    };

    const handlePlayTrack = (track: Track, index: number) => {
        if (artist?.songs) {
            setQueue(artist.songs, index);
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="p-6">
                <div className="flex flex-col md:flex-row gap-8 mb-8 items-center">
                    <div className="w-48 h-48 md:w-64 md:h-64 rounded-full skeleton shadow-2xl" />
                    <div className="flex-1 flex flex-col items-center md:items-start space-y-4">
                        <div className="h-6 w-24 rounded skeleton" />
                        <div className="h-16 w-3/4 rounded skeleton" />
                        <div className="h-6 w-48 rounded skeleton" />
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="h-64 w-full rounded-xl skeleton" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="aspect-square rounded-xl skeleton" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!artist) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
                <Users className="w-16 h-16 text-neutral-600 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Artist not found</h2>
                <p className="text-muted-foreground">The artist you're looking for doesn't exist or failed to load.</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-full pb-8">
            {/* Header Background Gradient */}
            <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-neutral-800/50 via-black/40 to-black pointer-events-none" />

            <div className="relative p-6 pt-10">
                {/* Artist Header */}
                <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-10">
                    <div className="relative w-48 h-48 md:w-64 md:h-64 rounded-full shadow-2xl overflow-hidden group flex-shrink-0 border-4 border-white/5">
                        <Image
                            src={artist.thumbnail || '/placeholder.png'}
                            alt={artist.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            priority
                        />
                    </div>

                    <div className="flex flex-col items-center md:items-start text-center md:text-left flex-1 min-w-0 pb-2">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                <Users className="w-3 h-3" /> Verified Artist
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 leading-tight">{artist.name}</h1>

                        <div className="flex items-center gap-4 text-neutral-300">
                            <span>{artist.subscribers} Subscribers</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-center md:justify-start gap-4 mb-10">
                    <Button
                        size="icon"
                        className="w-14 h-14 rounded-full bg-white hover:bg-neutral-200 text-black shadow-xl hover:scale-105 transition-all"
                        onClick={handlePlayTopSongs}
                    >
                        <Play className="w-6 h-6 ml-1 fill-current" />
                    </Button>
                    <Button className="rounded-full border border-white/10 hover:bg-white/10 bg-transparent text-white px-6 font-semibold uppercase tracking-wider text-sm h-10 transition-colors">
                        Subscribe
                    </Button>
                    <Button variant="ghost" size="icon" className="w-10 h-10 text-neutral-400 hover:text-white border border-transparent hover:border-white/10 rounded-full">
                        <MoreHorizontal className="w-6 h-6" />
                    </Button>
                </div>

                {/* Content Grid */}
                <div className="space-y-12">
                    {/* Top Songs */}
                    {artist.songs && artist.songs.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-6">Popular</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                                {artist.songs.slice(0, 30).map((track, index) => {
                                    const isCurrentTrack = currentTrack?.id === track.id;
                                    const isPlayingCurrent = isCurrentTrack && isPlaying;

                                    return (
                                        <div
                                            key={track.id}
                                            className={cn(
                                                "group flex items-center gap-4 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer",
                                                isCurrentTrack && "bg-white/5"
                                            )}
                                            onClick={() => handlePlayTrack(track, index)}
                                        >
                                            <div className="w-6 text-center text-sm text-neutral-400 group-hover:text-white font-tabular-nums relative flex items-center justify-center">
                                                <span className={cn("absolute transition-opacity", isPlayingCurrent ? "opacity-0" : "group-hover:opacity-0")}>
                                                    {index + 1}
                                                </span>
                                                <Play className={cn("w-3 h-3 fill-white absolute opacity-0 transition-opacity", isPlayingCurrent ? "opacity-0" : "group-hover:opacity-100")} />
                                                {isPlayingCurrent && (
                                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse absolute" />
                                                )}
                                            </div>

                                            <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={track.thumbnail || '/placeholder.png'}
                                                    alt={track.title}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className={cn("font-medium truncate", isCurrentTrack ? "text-green-500" : "text-white")}>
                                                    {track.title}
                                                </div>
                                                <div className="text-xs text-neutral-400 truncate">
                                                    {track.artist}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    )}

                    {/* Albums */}
                    {artist.albums && artist.albums.length > 0 && (
                        <section>
                            <h2 className="text-2xl font-bold mb-6">Albums</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                                {artist.albums.map((album) => (
                                    <AlbumCard key={album.id} album={album} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
