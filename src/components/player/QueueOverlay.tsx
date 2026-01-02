'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
    X,
    Play,
    Pause,
    Sparkles,
    GripVertical,
    Trash2,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQueueStore } from '@/stores/queueStore';
import { usePlayerStore } from '@/stores/playerStore';
import type { Track } from '@/types';
import { cn } from '@/lib/utils';

interface QueueOverlayProps {
    onClose: () => void;
}

interface SortableTrackItemProps {
    id: string; // Unique ID for sortable
    track: Track;
    index: number;
    isCurrentTrack: boolean;
    onPlay: () => void;
    onRemove: () => void;
}

function SortableTrackItem({
    id,
    track,
    index,
    isCurrentTrack,
    onPlay,
    onRemove,
}: SortableTrackItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <motion.div
            ref={setNodeRef}
            style={style}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={cn(
                'group flex items-center gap-3 p-2 rounded-lg transition-all',
                isDragging && 'bg-white/20 shadow-lg scale-105',
                isCurrentTrack ? 'bg-white/15' : 'hover:bg-white/10'
            )}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-1 text-white/40 hover:text-white/80"
            >
                <GripVertical className="w-4 h-4" />
            </button>

            {/* Index or Playing Indicator */}
            <span className="w-5 text-center text-sm text-white/60">
                {isCurrentTrack ? (
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                ) : (
                    index + 1
                )}
            </span>

            {/* Thumbnail */}
            <div
                className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 cursor-pointer group/thumb"
                onClick={onPlay}
            >
                <Image
                    src={track.thumbnail || '/placeholder.png'}
                    alt={track.title}
                    fill
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="w-4 h-4" />
                </div>
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0 cursor-pointer" onClick={onPlay}>
                <h4
                    className={cn(
                        'text-sm font-medium truncate',
                        isCurrentTrack && 'text-green-400'
                    )}
                >
                    {track.title}
                </h4>
                <p className="text-xs text-white/50 truncate">{track.artist}</p>
            </div>

            {/* Remove Button */}
            <button
                onClick={onRemove}
                className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-red-400"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </motion.div>
    );
}

export function QueueOverlay({ onClose }: QueueOverlayProps) {
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const queue = useQueueStore((state) => state.queue);
    const currentIndex = useQueueStore((state) => state.currentIndex);
    const reorderQueue = useQueueStore((state) => state.reorderQueue);
    const removeFromQueue = useQueueStore((state) => state.removeFromQueue);
    const playTrack = useQueueStore((state) => state.playTrack);
    const clearQueue = useQueueStore((state) => state.clearQueue);
    const addToQueue = useQueueStore((state) => state.addToQueue);

    const isPlaying = usePlayerStore((state) => state.isPlaying);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const currentTrack = currentIndex >= 0 && currentIndex < queue.length
        ? queue[currentIndex]
        : null;

    const upNextTracks = queue.slice(currentIndex + 1);

    console.log('[QueueOverlay Debug]', {
        totalQueue: queue.length,
        currentIndex,
        upNextCount: upNextTracks.length,
    });

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = queue.findIndex((t) => t.id === active.id);
            const newIndex = queue.findIndex((t) => t.id === over.id);
            reorderQueue(oldIndex, newIndex);
        }
    };

    // Load more songs when queue is low
    const handleLoadMore = async () => {
        if (!currentTrack || isLoadingMore) return;

        setIsLoadingMore(true);
        try {
            const res = await fetch('/api/recommendations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentTrack,
                    type: 'smart-queue',
                }),
            });
            const data = await res.json();

            if (data.tracks && data.tracks.length > 0) {
                // Add tracks to queue, avoiding duplicates
                const existingIds = new Set(queue.map(t => t.id));
                let added = 0;
                for (const track of data.tracks) {
                    if (!existingIds.has(track.id)) {
                        addToQueue(track);
                        existingIds.add(track.id);
                        added++;
                    }
                }
                console.log(`[Queue] Added ${added} new songs to queue`);
            }
        } catch (error) {
            console.error('Failed to load more songs:', error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    // Auto-load more when queue runs low (less than 5 upcoming songs)
    useEffect(() => {
        if (upNextTracks.length < 5 && currentTrack && !isLoadingMore) {
            handleLoadMore();
        }
    }, [currentIndex, queue.length]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 w-96 max-h-[70vh] z-[60] rounded-2xl overflow-hidden shadow-2xl"
            style={{
                background: 'rgba(20, 20, 25, 0.85)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="font-semibold text-lg">Queue</h3>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearQueue}
                        className="text-white/60 hover:text-white"
                    >
                        Clear
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="w-8 h-8 text-white/60 hover:text-white"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </div>
            </div>

            {queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-white/50">
                    <p className="text-lg">Queue is empty</p>
                    <p className="text-sm mt-1">Search for songs to add</p>
                </div>
            ) : (
                <ScrollArea className="h-[calc(70vh-140px)]">
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        {/* Now Playing */}
                        {currentTrack && (
                            <div className="p-4 pb-2">
                                <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                                    Now Playing
                                </h4>
                                <div className="flex items-center gap-3 p-2 rounded-lg bg-white/10">
                                    <span className="w-5 flex justify-center">
                                        <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                                    </span>
                                    <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0">
                                        <Image
                                            src={currentTrack.thumbnail || '/placeholder.png'}
                                            alt={currentTrack.title}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium truncate text-green-400">
                                            {currentTrack.title}
                                        </h4>
                                        <p className="text-xs text-white/50 truncate">
                                            {currentTrack.artist}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Up Next */}
                        {upNextTracks.length > 0 && (
                            <div className="p-4 pt-2">
                                <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
                                    Up Next ({upNextTracks.length})
                                </h4>
                                <SortableContext
                                    items={upNextTracks.map((t, i) => `up-next-${t.id}-${i}`)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-1">
                                        {upNextTracks.map((track, index) => {
                                            const uniqueId = `up-next-${track.id}-${index}`;
                                            return (
                                                <SortableTrackItem
                                                    key={uniqueId}
                                                    id={uniqueId}
                                                    track={track}
                                                    index={index}
                                                    isCurrentTrack={false}
                                                    onPlay={() => playTrack(currentIndex + 1 + index)}
                                                    onRemove={() => removeFromQueue(currentIndex + 1 + index)}
                                                />
                                            );
                                        })}
                                    </div>
                                </SortableContext>
                            </div>
                        )}
                    </DndContext>
                </ScrollArea>
            )}

            {/* Footer with Smart Fill */}
            <div className="p-4 border-t border-white/10">
                <Button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore || !currentTrack}
                    className="w-full gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                    <Sparkles className="w-4 h-4" />
                    {isLoadingMore ? 'Loading similar songs...' : 'Load 25 Similar Songs'}
                </Button>
            </div>
        </motion.div>
    );
}
