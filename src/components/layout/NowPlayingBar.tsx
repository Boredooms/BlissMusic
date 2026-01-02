'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Heart,
    Maximize2,
} from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';
import { useQueueStore } from '@/stores/queueStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { cn } from '@/lib/utils';

export function NowPlayingBar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isHovered, setIsHovered] = useState(false);

    const {
        isPlaying,
        currentTime,
        duration,
        togglePlay,
    } = usePlayerStore();

    const queue = useQueueStore((state) => state.queue);
    const currentIndex = useQueueStore((state) => state.currentIndex);
    const playNext = useQueueStore((state) => state.playNext);
    const playPrevious = useQueueStore((state) => state.playPrevious);

    const toggleLike = useLibraryStore((state) => state.toggleLike);
    const likedSongIds = useLibraryStore((state) => state.likedSongIds);

    const isLiked = (id: string) => likedSongIds.has(id);

    const currentTrack = currentIndex >= 0 && currentIndex < queue.length
        ? queue[currentIndex]
        : null;

    const trackIsLiked = currentTrack ? isLiked(currentTrack.id) : false;

    // Don't show on Full Screen player
    if (pathname === '/now-playing') {
        return null;
    }

    if (!currentTrack) {
        return null;
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    const handleExpand = () => {
        router.push('/now-playing');
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Floating Glass Pill */}
                <div
                    className="relative rounded-full overflow-hidden shadow-2xl backdrop-blur-xl border border-white/10 group bg-black/80"
                >
                    {/* Progress Bar (Bottom Edge) */}
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/5">
                        <motion.div
                            className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            style={{ width: `${progress}%` }}
                            layoutId="pill-progress"
                        />
                    </div>

                    <div className="flex items-center justify-between p-2 h-14 md:h-16">

                        {/* Left: Track Info (Clickable) */}
                        <div
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group/info"
                            onClick={handleExpand}
                        >
                            {/* Spinning Vinyl Effect on Thumbnail */}
                            <div className="relative w-12 h-12 flex-shrink-0">
                                <motion.div
                                    animate={{ rotate: isPlaying ? 360 : 0 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                    className={cn(
                                        "w-full h-full rounded-full overflow-hidden ring-2 ring-white/10 shadow-lg relative z-10",
                                        !isPlaying && "delay-0" // Stop immediately if paused? better to just pause animation
                                    )}
                                    style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
                                >
                                    <Image
                                        src={currentTrack.thumbnail || '/placeholder.png'}
                                        alt={currentTrack.title}
                                        fill
                                        className="object-cover"
                                    />
                                    {/* Center hole for vinyl look */}
                                    <div className="absolute inset-0 bg-black/10 rounded-full" />
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-black rounded-full border border-white/20" />
                                </motion.div>
                            </div>

                            <div className="flex flex-col justify-center overflow-hidden">
                                <h4 className="text-sm font-bold text-white truncate group-hover/info:text-emerald-400 transition-colors">
                                    {currentTrack.title}
                                </h4>
                                <p className="text-xs text-white/50 truncate">
                                    {currentTrack.artist}
                                </p>
                            </div>
                        </div>

                        {/* Center: Primary Controls */}
                        <div className="flex items-center gap-1 mr-1 md:gap-2 md:mr-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); playPrevious(); }}
                                className="p-2 text-white/60 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                            >
                                <SkipBack className="w-5 h-5 fill-current" />
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                                className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-all shadow-lg"
                            >
                                {isPlaying ? (
                                    <Pause className="w-5 h-5 fill-current" />
                                ) : (
                                    <Play className="w-5 h-5 fill-current ml-0.5" />
                                )}
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); playNext(); }}
                                className="p-2 text-white/60 hover:text-white transition-colors hover:bg-white/10 rounded-full"
                            >
                                <SkipForward className="w-5 h-5 fill-current" />
                            </button>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-1 pl-2 border-l border-white/10">
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleLike(currentTrack); }}
                                className={cn(
                                    "p-2 rounded-full transition-colors hover:bg-white/10",
                                    trackIsLiked ? "text-emerald-400" : "text-white/40 hover:text-white"
                                )}
                            >
                                <Heart className={cn("w-5 h-5", trackIsLiked && "fill-current")} />
                            </button>

                            <button
                                onClick={handleExpand}
                                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                            >
                                <Maximize2 className="w-5 h-5" />
                            </button>
                        </div>

                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
