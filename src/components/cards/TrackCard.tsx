'use client';

import Image from 'next/image';
import { Play, Pause, MoreHorizontal, ListMusic, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/stores/queueStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useUIStore } from '@/stores/uiStore';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Track } from '@/types';
import { cn } from '@/lib/utils';

interface TrackCardProps {
    track: Track;
    index?: number;
    showIndex?: boolean;
    isCompact?: boolean;
    showDuration?: boolean;
    onPlay?: () => void;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function TrackCard({
    track,
    index,
    showIndex = false,
    isCompact = false,
    showDuration = true,
    onPlay,
}: TrackCardProps) {
    const setQueue = useQueueStore((state) => state.setQueue);
    const addToQueue = useQueueStore((state) => state.addToQueue);
    // Use direct state slices for reactivity - NOT getCurrentTrack() function!
    const queue = useQueueStore((state) => state.queue);
    const currentIndex = useQueueStore((state) => state.currentIndex);
    const isPlaying = usePlayerStore((state) => state.isPlaying);
    const togglePlay = usePlayerStore((state) => state.togglePlay);

    const { setAddToPlaylistModalOpen, setSongToAdd } = useUIStore();

    // Derive current track from reactive state
    const currentTrack = currentIndex >= 0 && currentIndex < queue.length
        ? queue[currentIndex]
        : null;
    const isCurrentTrack = currentTrack?.id === track.id;


    const handlePlay = () => {
        if (onPlay) {
            onPlay();
        } else {
            setQueue([track], 0);
        }
    };

    if (isCompact) {
        return (
            <div
                className={cn(
                    'group flex items-center gap-3 p-2 rounded-lg transition-colors cursor-pointer',
                    isCurrentTrack ? 'bg-white/10' : 'hover:bg-white/5'
                )}
                onClick={handlePlay}
            >
                {showIndex && (
                    <span className="w-6 text-center text-sm text-muted-foreground">
                        {isCurrentTrack && isPlaying ? (
                            <span className="inline-block w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                        ) : (
                            index
                        )}
                    </span>
                )}
                <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                    <Image
                        src={track.thumbnail || '/placeholder.png'}
                        alt={track.title}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {isCurrentTrack && isPlaying ? (
                            <Pause className="w-4 h-4" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h4
                        className={cn(
                            'text-sm font-medium truncate',
                            isCurrentTrack && 'text-green-400'
                        )}
                    >
                        {track.title}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                </div>
                {showDuration && (
                    <span className="text-xs text-muted-foreground mr-2">
                        {formatDuration(track.duration)}
                    </span>
                )}

                <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white hover:bg-white/10">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800">
                            <DropdownMenuItem
                                onClick={() => addToQueue(track)}
                                className="cursor-pointer text-white focus:bg-white/10"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add to Queue
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => {
                                    setSongToAdd(track);
                                    setAddToPlaylistModalOpen(true);
                                }}
                                className="cursor-pointer text-white focus:bg-white/10"
                            >
                                <ListMusic className="w-4 h-4 mr-2" />
                                Add to Playlist
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        );
    }

    return (
        <div className="group relative">
            <div
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer"
                onClick={handlePlay}
            >
                <Image
                    src={track.thumbnail || '/placeholder.png'}
                    alt={track.title}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/40 hover:bg-black/60 rounded-full text-white">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 bg-neutral-900 border-neutral-800">
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addToQueue(track);
                                }}
                                className="cursor-pointer text-white focus:bg-white/10"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add to Queue
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSongToAdd(track);
                                    setAddToPlaylistModalOpen(true);
                                }}
                                className="cursor-pointer text-white focus:bg-white/10"
                            >
                                <ListMusic className="w-4 h-4 mr-2" />
                                Add to Playlist
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Button
                    size="icon"
                    className={cn(
                        'absolute bottom-2 right-2 w-12 h-12 rounded-full bg-white text-black shadow-lg',
                        'opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0',
                        'transition-all duration-200 hover:scale-105'
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isCurrentTrack) {
                            togglePlay();
                        } else {
                            handlePlay();
                        }
                    }}
                >
                    {isCurrentTrack && isPlaying ? (
                        <Pause className="w-6 h-6" />
                    ) : (
                        <Play className="w-6 h-6 ml-1" />
                    )}
                </Button>
            </div>
            <div className="mt-3">
                <h4 className="font-medium truncate text-sm">{track.title}</h4>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {track.artist}
                </p>
            </div>
        </div>
    );
}
