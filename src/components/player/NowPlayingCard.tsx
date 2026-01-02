'use client';

import { useState, useEffect, useRef } from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useUIStore } from '@/stores/uiStore';
import { PlusCircle, User, Disc, Share2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ChevronDown,
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Shuffle,
    Repeat,
    Repeat1,
    Heart,
    MoreHorizontal,
    ListMusic,
    Mic2,
    Radio,
    Volume2,
    VolumeX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Queue } from './Queue';
import { Lyrics } from './Lyrics';
import { AmbientBackground } from './AmbientBackground';
import { usePlayerStore } from '@/stores/playerStore';
import { useQueueStore } from '@/stores/queueStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useListeningHistory } from '@/stores/listeningHistoryStore';
import type { Track } from '@/types';
import { cn } from '@/lib/utils';

function formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get YouTube video ID from thumbnail URL or videoId
 */
function extractVideoId(url: string, videoId?: string): string | null {
    if (videoId) return videoId;
    const match = url.match(/\/vi\/([^\/]+)\//);
    return match ? match[1] : null;
}

/**
 * MULTI-SOURCE CASCADING THUMBNAIL FALLBACK SYSTEM
 * Uses multiple sources for maximum reliability
 */
function getThumbnailFallbacks(url: string, videoId?: string): string[] {
    const extractedId = extractVideoId(url, videoId);

    if (!extractedId) {
        // Non-YouTube URL, try googleusercontent optimization
        if (url.includes('googleusercontent.com')) {
            return [url.replace(/=w\d+-h\d+/, '=w1080-h1080'), url];
        }
        return [url];
    }

    // MULTI-SOURCE STRATEGY: Try multiple CDNs and proxies
    return [
        // SOURCE 1: YouTube's img CDN (more reliable than i.ytimg.com)
        `https://img.youtube.com/vi/${extractedId}/maxresdefault.jpg`,  // 1280x720
        `https://img.youtube.com/vi/${extractedId}/hqdefault.jpg`,      // 480x360

        // SOURCE 2: Invidious public instances (reliable proxy)
        `https://inv.tux.pizza/vi/${extractedId}/maxresdefault.jpg`,
        `https://invidious.nerdvpn.de/vi/${extractedId}/hqdefault.jpg`,

        // SOURCE 3: Original i.ytimg.com (fallback)
        `https://i.ytimg.com/vi/${extractedId}/sddefault.jpg`,         // 640x480
        `https://i.ytimg.com/vi/${extractedId}/mqdefault.jpg`,         // 320x180  
        `https://i.ytimg.com/vi/${extractedId}/default.jpg`,            // 120x90 (always exists)
    ];
}

interface NowPlayingCardProps {
    onClose?: () => void;
}

export function NowPlayingCard({ onClose }: NowPlayingCardProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('queue');
    const [relatedTracks, setRelatedTracks] = useState<Track[]>([]);

    // Thumbnail fallback state
    const [thumbnailFallbackIndex, setThumbnailFallbackIndex] = useState(0);
    const thumbnailFallbacksRef = useRef<string[]>([]);

    // Cache for related tracks (prevents repeated API calls)
    const relatedCacheRef = useRef<Map<string, Track[]>>(new Map());

    const {
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        togglePlay,
        setCurrentTime,
        setVolume,
        toggleMute,
    } = usePlayerStore();

    const queue = useQueueStore((state) => state.queue);
    const currentIndex = useQueueStore((state) => state.currentIndex);
    const setQueue = useQueueStore((state) => state.setQueue);
    const playNext = useQueueStore((state) => state.playNext);
    const playPrevious = useQueueStore((state) => state.playPrevious);
    const isShuffled = useQueueStore((state) => state.isShuffled);
    const repeatMode = useQueueStore((state) => state.repeatMode);
    const toggleShuffle = useQueueStore((state) => state.toggleShuffle);
    const cycleRepeat = useQueueStore((state) => state.cycleRepeat);
    const addToQueue = useQueueStore((state) => state.addToQueue);

    const toggleLike = useLibraryStore((state) => state.toggleLike);
    const likedSongIds = useLibraryStore((state) => state.likedSongIds);

    const isLiked = (id: string) => likedSongIds.has(id);

    const listeningHistory = useListeningHistory((state) => state.history);

    const currentTrack = currentIndex >= 0 && currentIndex < queue.length
        ? queue[currentIndex]
        : null;

    // Reset thumbnail fallbacks when track changes
    useEffect(() => {
        if (currentTrack) {
            thumbnailFallbacksRef.current = getThumbnailFallbacks(
                currentTrack.thumbnail || '',
                currentTrack.videoId
            );
            setThumbnailFallbackIndex(0);
        }
    }, [currentTrack?.id]);

    // Handle thumbnail load errors with cascading fallback
    const handleThumbnailError = () => {
        const nextIndex = thumbnailFallbackIndex + 1;
        if (nextIndex < thumbnailFallbacksRef.current.length) {
            console.log(`[Thumbnail] Fallback ${nextIndex}/${thumbnailFallbacksRef.current.length}`);
            setThumbnailFallbackIndex(nextIndex);
        } else {
            console.warn('[Thumbnail] All fallbacks exhausted, using gradient');
        }
    };

    const currentThumbnailUrl = thumbnailFallbacksRef.current[thumbnailFallbackIndex] || '/placeholder.png';
    const allThumbnailsFailed = thumbnailFallbackIndex >= thumbnailFallbacksRef.current.length;

    const { setAddToPlaylistModalOpen, setSongToAdd } = useUIStore();

    // Fetch related tracks when track changes (with caching)
    useEffect(() => {
        const fetchRelated = async () => {
            if (!currentTrack?.videoId) return;

            // Check cache first
            const cached = relatedCacheRef.current.get(currentTrack.videoId);
            if (cached) {
                console.log('[Related] Using cached recommendations');
                setRelatedTracks(cached);
                return;
            }

            try {
                // Fetch from API
                const res = await fetch(`/api/recommendations/related?videoId=${currentTrack.videoId}&title=${encodeURIComponent(currentTrack.title)}&artist=${encodeURIComponent(currentTrack.artist)}`);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        // Cache for this session
                        relatedCacheRef.current.set(currentTrack.videoId, data);
                        setRelatedTracks(data);
                    }
                }
            } catch (err) {
                console.error('Failed to load related tracks', err);
            }
        };

        // Clear previous
        setRelatedTracks([]);
        fetchRelated();
    }, [currentTrack?.videoId]);

    if (!currentTrack) return null;

    const trackIsLiked = isLiked(currentTrack.id);
    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
    const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat;
    const VolumeIcon = isMuted || volume === 0 ? VolumeX : Volume2;

    const handleShare = () => {
        const url = `${window.location.origin}/search?q=${encodeURIComponent(currentTrack.title + ' ' + currentTrack.artist)}`;
        navigator.clipboard.writeText(url);
    };



    return (
        <AmbientBackground imageUrl={currentThumbnailUrl}>
            <div className="flex flex-col h-full overflow-hidden">

                {/* Header Actions */}
                <div className="flex justify-between items-center p-6 z-20">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-colors"
                        onClick={onClose || (() => router.back())}
                    >
                        <ChevronDown className="w-6 h-6" />
                    </Button>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-white/40 uppercase">
                        Now Playing
                    </span>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md"
                            >
                                <MoreHorizontal className="w-6 h-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-black/90 backdrop-blur-xl border-white/10 text-white min-w-[200px]">
                            <DropdownMenuItem
                                className="gap-3 p-3 focus:bg-white/10 cursor-pointer"
                                onClick={() => {
                                    setSongToAdd(currentTrack);
                                    setAddToPlaylistModalOpen(true);
                                }}
                            >
                                <PlusCircle className="w-4 h-4 text-emerald-400" />
                                <span>Add to Playlist</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                                className="gap-3 p-3 focus:bg-white/10 cursor-pointer"
                                onClick={() => {
                                    if (onClose) onClose();
                                    router.push(`/search?q=${encodeURIComponent(currentTrack.artist)}`);
                                }}
                            >
                                <User className="w-4 h-4 text-purple-400" />
                                <span>Go to Artist</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="bg-white/10" />

                            <DropdownMenuItem
                                className="gap-3 p-3 focus:bg-white/10 cursor-pointer"
                                onClick={handleShare}
                            >
                                <Share2 className="w-4 h-4 text-blue-400" />
                                <span>Share</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col lg:flex-row min-h-0 container mx-auto px-4 pb-8 lg:gap-12">

                    {/* LEFT: Hero Section (Album Art + Controls) */}
                    <div className="flex-1 flex flex-col justify-center items-center lg:items-start lg:justify-center min-w-0 z-10">

                        {/* Album Art Container */}
                        <div className="relative w-full max-w-[240px] md:max-w-[280px] lg:max-w-[340px] aspect-square mb-6 lg:mb-8 self-center lg:self-center shadow-2xl">
                            <motion.div
                                key={currentTrack.id}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 20 }}
                                className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-neutral-900"
                            >
                                {!allThumbnailsFailed ? (
                                    <Image
                                        src={currentThumbnailUrl}
                                        alt={currentTrack.title}
                                        fill
                                        className="object-cover"
                                        priority
                                        onError={handleThumbnailError}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                                        <Disc className="w-20 h-20 text-white/20 animate-spin-slow" />
                                    </div>
                                )}
                            </motion.div>
                        </div>

                        {/* Title & Artist & Heart - Flex Row Aligned with Art */}
                        <div className="w-full max-w-[240px] md:max-w-[280px] lg:max-w-[340px] mx-auto flex justify-between items-end mb-3 px-2 z-10">

                            {/* Text Block - Left Aligned & Compact */}
                            <div className="flex flex-col items-start min-w-0 pr-4 flex-1">
                                {/* Title - Scroll if long */}
                                {currentTrack.title.length > 25 ? (
                                    <div className="w-full overflow-hidden mask-fade-edges mb-1 pb-1">
                                        <div className="animate-marquee">
                                            <h1 className="text-base md:text-lg font-bold text-white whitespace-nowrap px-4 leading-tight tracking-tight">
                                                {currentTrack.title}
                                            </h1>
                                            <h1 className="text-base md:text-lg font-bold text-white whitespace-nowrap px-4 leading-tight tracking-tight">
                                                {currentTrack.title}
                                            </h1>
                                        </div>
                                    </div>
                                ) : (
                                    <h1 className="text-base md:text-lg font-bold text-white mb-1 pb-1 truncate w-full leading-tight tracking-tight text-left">
                                        {currentTrack.title}
                                    </h1>
                                )}

                                {/* Artist - Compact & Scroll */}
                                {currentTrack.artist.length > 40 ? (
                                    <div className="w-full overflow-hidden mask-fade-edges">
                                        <div className="animate-marquee">
                                            <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest whitespace-nowrap px-4">
                                                {currentTrack.artist}
                                            </span>
                                            <span className="text-[9px] text-white/50 font-bold uppercase tracking-widest whitespace-nowrap px-4">
                                                {currentTrack.artist}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-[9px] text-white/50 font-bold uppercase tracking-widest line-clamp-1 text-left">
                                        {currentTrack.artist}
                                    </p>
                                )}
                            </div>

                            {/* Heart Icon - Right Aligned (In Flex) */}
                            <button
                                onClick={() => toggleLike(currentTrack)}
                                className={cn("p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 mb-0.5", trackIsLiked ? "text-emerald-400" : "text-white/40")}
                            >
                                <Heart className={cn("w-6 h-6", trackIsLiked && "fill-current")} />
                            </button>
                        </div>

                        {/* Progress Bar - Compact & Centered */}
                        <div className="w-full max-w-[240px] md:max-w-[280px] lg:max-w-[340px] mx-auto mb-2">
                            <Slider
                                value={[progress]}
                                max={100}
                                step={0.1}
                                onValueChange={([value]) => setCurrentTime((value / 100) * duration)}
                                className="mb-2 h-1.5"
                            />
                            <div className="flex justify-between text-xs font-medium text-white/50">
                                <span>{formatTime(currentTime)}</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        {/* Primary Controls - Compact & Aligned */}
                        <div className="w-full max-w-[240px] md:max-w-[280px] lg:max-w-[340px] mx-auto flex items-center justify-between mt-1">

                            {/* Shuffle */}
                            <button
                                onClick={toggleShuffle}
                                className={cn("p-2 transition-colors", isShuffled ? "text-emerald-400" : "text-white/40 hover:text-white")}
                            >
                                <Shuffle className="w-4 h-4 md:w-5 md:h-5" />
                            </button>

                            {/* Prev */}
                            <button onClick={() => playPrevious()} className="text-white hover:text-emerald-400 transition-colors">
                                <SkipBack className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                            </button>

                            {/* Play/Pause */}
                            <button
                                onClick={togglePlay}
                                className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                            >
                                {isPlaying ? <Pause className="w-5 h-5 md:w-6 md:h-6 fill-current" /> : <Play className="w-5 h-5 md:w-6 md:h-6 fill-current ml-1" />}
                            </button>

                            {/* Next */}
                            <button onClick={() => playNext()} className="text-white hover:text-emerald-400 transition-colors">
                                <SkipForward className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                            </button>

                            {/* Repeat */}
                            <button
                                onClick={cycleRepeat}
                                className={cn("p-2 transition-colors", repeatMode !== 'off' ? "text-emerald-400" : "text-white/40 hover:text-white")}
                            >
                                <RepeatIcon className="w-4 h-4 md:w-5 md:h-5" />
                            </button>


                        </div>
                    </div>

                    {/* RIGHT: Floating Sidebar (Queue/Lyrics) */}
                    <div className="hidden lg:block w-[350px] xl:w-[400px] h-full flex-shrink-0 z-20 pb-6 pr-6">
                        <div className="h-full bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                                <div className="p-4 border-b border-white/5">
                                    <TabsList className="bg-white/5 w-full p-1 rounded-lg grid grid-cols-3">
                                        <TabsTrigger value="queue" className="rounded-md data-[state=active]:bg-white/10">Queue</TabsTrigger>
                                        <TabsTrigger value="lyrics" className="rounded-md data-[state=active]:bg-white/10">Lyrics</TabsTrigger>
                                        <TabsTrigger value="related" className="rounded-md data-[state=active]:bg-white/10">Related</TabsTrigger>
                                    </TabsList>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                                    <TabsContent value="queue" className="m-0 h-full">
                                        <Queue />
                                    </TabsContent>
                                    <TabsContent value="lyrics" className="m-0 h-full">
                                        <Lyrics title={currentTrack.title} artist={currentTrack.artist} />
                                    </TabsContent>
                                    <TabsContent value="related" className="m-0 h-full p-4 space-y-2">
                                        {relatedTracks.map((track, idx) => (
                                            <div
                                                key={track.id}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer group transition-colors"
                                                onClick={() => {
                                                    // Play this track immediately + load rest of related tracks
                                                    const newQueue = [track, ...relatedTracks.filter((_, i) => i !== idx)];
                                                    setQueue(newQueue, 0);
                                                }}
                                            >
                                                <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                                    <Image src={track.thumbnail || ''} alt={track.title} fill className="object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                        <Play className="w-6 h-6 text-white" />
                                                    </div>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-medium text-white truncate">{track.title}</div>
                                                    <div className="text-xs text-white/50 truncate">{track.artist}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </TabsContent>
                                </div>
                            </Tabs>
                        </div>
                    </div>

                </div>
            </div>
        </AmbientBackground>
    );
}
