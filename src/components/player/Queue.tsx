'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Play, Sparkles, MoreHorizontal, ListMusic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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

interface SortableTrackProps {
    track: Track;
    index: number;
    isCurrentTrack: boolean;
    onPlay: () => void;
    onRemove: () => void;
}

function SortableTrack({
    track,
    index,
    isCurrentTrack,
    onPlay,
    onRemove,
}: SortableTrackProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: track.id });

    const { setAddToPlaylistModalOpen, setSongToAdd } = useUIStore();

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'group flex items-center gap-3 p-2 rounded-lg transition-colors',
                isDragging && 'bg-white/20 shadow-lg',
                isCurrentTrack ? 'bg-white/10' : 'hover:bg-white/5'
            )}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-white"
            >
                <GripVertical className="w-4 h-4" />
            </button>

            {/* Index or Playing Indicator */}
            <span className="w-6 text-center text-sm text-muted-foreground">
                {isCurrentTrack ? (
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                ) : (
                    index + 1
                )}
            </span>

            {/* Thumbnail */}
            <div
                className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 cursor-pointer"
                onClick={onPlay}
            >
                <Image
                    src={track.thumbnail || '/placeholder.png'}
                    alt={track.title}
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-4 h-4" />
                </div>
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0" onClick={onPlay} title={`${track.title} • ${track.artist}`}>
                <h4
                    className={cn(
                        'text-sm font-medium line-clamp-1 cursor-pointer',
                        isCurrentTrack && 'text-green-400'
                    )}
                >
                    {track.title}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-1">{track.artist}</p>
            </div>

            {/* Actions Menu */}
            <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white"
                        >
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-800">
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
                        <DropdownMenuItem
                            onClick={onRemove}
                            className="cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Remove
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

interface QueueProps {
    // No props needed - all logic is self-contained
}

export function Queue({ }: QueueProps = {}) {
    const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

    // Use proper selectors to ensure reactivity
    const queue = useQueueStore((state) => state.queue);
    const currentIndex = useQueueStore((state) => state.currentIndex);
    const reorderQueue = useQueueStore((state) => state.reorderQueue);
    const removeFromQueue = useQueueStore((state) => state.removeFromQueue);
    const playTrack = useQueueStore((state) => state.playTrack);
    const clearQueue = useQueueStore((state) => state.clearQueue);
    const addTracks = useQueueStore((state) => state.addTracks);
    const getCurrentTrack = useQueueStore((state) => state.getCurrentTrack);
    const { isPlaying } = usePlayerStore();

    const currentTrack = getCurrentTrack();

    /**
     * Load smart recommendations using advanced AI engine
     */
    const handleSmartFill = async () => {
        if (!currentTrack || isLoadingRecommendations) return;

        setIsLoadingRecommendations(true);
        try {
            console.log('[Queue] 🎵 Starting Smart Fill with advanced AI...');

            // Call the enhanced recommendations API
            const res = await fetch('/api/recommendations/smart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentTrack,
                    queue, // Pass for duplicate filtering
                    queueLength: queue.length,
                    currentIndex,
                }),
            });

            const data = await res.json();

            if (data.tracks && data.tracks.length > 0) {
                console.log(`[Queue] ✅ Received ${data.tracks.length} smart recommendations`);
                console.log(`[Queue] 📊 Diversity: ${data.diversity || 'medium'}`);

                // Tracks are already filtered by the API
                addTracks(data.tracks);
                console.log(`[Queue] 🎉 Added ${data.tracks.length} unique, diverse tracks`);
            } else {
                console.warn('[Queue] ⚠️ No recommendations received');
            }
        } catch (error) {
            console.error('[Queue] ❌ Failed to load smart recommendations:', error);
        } finally {
            setIsLoadingRecommendations(false);
        }
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = queue.findIndex((t) => t.id === active.id);
            const newIndex = queue.findIndex((t) => t.id === over.id);
            reorderQueue(oldIndex, newIndex);
        }
    };

    if (queue.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <span className="text-lg">Queue is empty</span>
                <span className="text-sm mt-2">Search for songs to add to your queue</span>
            </div>
        );
    }

    const upNextTracks = queue.slice(currentIndex + 1);
    const playedTracks = queue.slice(0, currentIndex);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="font-semibold">Queue</h3>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSmartFill}
                        disabled={isLoadingRecommendations || !currentTrack}
                        className="gap-2"
                    >
                        <Sparkles className="w-4 h-4" />
                        {isLoadingRecommendations ? 'Loading...' : 'Smart Fill'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={clearQueue}>
                        Clear
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    {/* Now Playing */}
                    {currentIndex >= 0 && queue[currentIndex] && (
                        <div className="p-4">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Now Playing
                            </h4>
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10">
                                <span className="w-6 flex justify-center">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                </span>
                                <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                    <Image
                                        src={queue[currentIndex].thumbnail || '/placeholder.png'}
                                        alt={queue[currentIndex].title}
                                        fill
                                        className="object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0" title={`${queue[currentIndex].title} • ${queue[currentIndex].artist}`}>
                                    <h4 className="text-sm font-medium line-clamp-1 text-green-400">
                                        {queue[currentIndex].title}
                                    </h4>
                                    <p className="text-xs text-muted-foreground line-clamp-1">
                                        {queue[currentIndex].artist}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Up Next */}
                    {upNextTracks.length > 0 && (
                        <div className="p-4 pt-0">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Up Next ({upNextTracks.length})
                            </h4>
                            <SortableContext
                                items={upNextTracks.map((t) => t.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-1">
                                    {upNextTracks.map((track, index) => (
                                        <SortableTrack
                                            key={`${track.id}-${currentIndex + 1 + index}`}
                                            track={track}
                                            index={currentIndex + 1 + index}
                                            isCurrentTrack={false}
                                            onPlay={() => playTrack(currentIndex + 1 + index)}
                                            onRemove={() => removeFromQueue(currentIndex + 1 + index)}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </div>
                    )}

                    {/* Previously Played - Only last 2 */}
                    {playedTracks.length > 0 && (
                        <div className="p-4 pt-0 opacity-60">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Previously Played ({Math.min(playedTracks.length, 2)})
                            </h4>
                            <div className="space-y-1">
                                {playedTracks.slice(-2).map((track, index) => (
                                    <div
                                        key={`${track.id}-${index}`}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5"
                                    >
                                        <span className="w-6 text-center text-sm text-muted-foreground">
                                            {index + 1}
                                        </span>
                                        <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                                            <Image
                                                src={track.thumbnail || '/placeholder.png'}
                                                alt={track.title}
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0" title={`${track.title} • ${track.artist}`}>
                                            <h4 className="text-sm font-medium line-clamp-1">
                                                {track.title}
                                            </h4>
                                            <p className="text-xs text-muted-foreground line-clamp-1">
                                                {track.artist}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </DndContext>
            </ScrollArea>
        </div>
    );
}
