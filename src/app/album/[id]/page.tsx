'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    Play,
    Shuffle,
    Heart,
    MoreVertical,
    ListMusic,
    Loader2,
    Download,
    Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueueStore } from '@/stores/queueStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import type { Album, Track } from '@/types';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function AlbumPage() {
    const params = useParams();
    const router = useRouter();
    const id = params?.id as string;

    const [album, setAlbum] = useState<Album & { tracks?: Track[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const { setQueue, addToQueue } = useQueueStore();
    const { isLiked, toggleLike } = useLibraryStore();
    const { setAddToPlaylistModalOpen, setSongToAdd } = useUIStore();

    useEffect(() => {
        if (!id) return;

        async function fetchAlbum() {
            try {
                const res = await fetch(`/api/album?id=${id}`);
                if (!res.ok) throw new Error('Failed to fetch album');
                const data = await res.json();
                setAlbum(data);
            } catch (error) {
                console.error('Error fetching album:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAlbum();
    }, [id]);

    const handlePlayAlbum = () => {
        if (album?.tracks && album.tracks.length > 0) {
            setQueue(album.tracks, 0);
        }
    };

    const handleShuffleAlbum = () => {
        if (album?.tracks && album.tracks.length > 0) {
            const tracks = [...album.tracks];
            for (let i = tracks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
            }
            setQueue(tracks);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p>Loading album...</p>
            </div>
        );
    }

    if (!album) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/50">
                <p>Album not found</p>
                <Button variant="link" onClick={() => router.push('/library')}>
                    Return to Library
                </Button>
            </div>
        );
    }

    const songs = album.tracks || [];

    return (
        <div className="full-height-page h-full flex flex-col md:flex-row bg-background relative overflow-hidden">
            {/* Subpara Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-background to-black pointer-events-none" />

            {/* LEFT COLUMN: Fixed Info Panel (Compacted + Seamless Full Height) */}
            <div className="w-full md:w-[280px] lg:w-[320px] flex-shrink-0 h-auto md:h-full p-6 pb-32 flex flex-col items-center md:items-start text-center md:text-left z-10 md:overflow-y-auto border-b md:border-b-0 md:border-r border-white/5 bg-black/20 backdrop-blur-md [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                {/* Album Art (Compact) */}
                <div className="relative w-32 h-32 md:w-52 md:h-52 rounded-md shadow-2xl overflow-hidden mb-5 group flex-shrink-0 bg-neutral-800 mx-auto md:mx-0 border border-white/10">
                    {album.thumbnail ? (
                        <Image
                            src={album.thumbnail}
                            alt={album.title || 'Album Art'}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <ListMusic className="w-12 h-12 text-white/20 m-auto" />
                    )}
                </div>

                {/* Title & Metadata */}
                <div className="w-full">
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-white mb-2 leading-tight tracking-tight line-clamp-3">
                        {album.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1 text-white/60 font-medium text-xs mb-4">
                        <span className="text-emerald-400 font-bold">Album</span>
                        <span>•</span>
                        <span className="text-white hover:underline cursor-pointer line-clamp-1">{album.artist}</span>
                        <span>•</span>
                        <span>{album.year || new Date().getFullYear()}</span>
                    </div>

                    <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-5 flex items-center justify-center md:justify-start gap-2">
                        <span>{songs.length} Songs</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <Button
                            size="lg"
                            className="w-12 h-12 rounded-full bg-white hover:bg-gray-200 text-black shadow-xl hover:scale-105 transition-all pl-3.5"
                            onClick={handlePlayAlbum}
                            disabled={songs.length === 0}
                        >
                            <Play className="w-5 h-5 fill-black" />
                        </Button>

                        <Button
                            variant="secondary"
                            size="icon"
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/5"
                            onClick={handleShuffleAlbum}
                        >
                            <Shuffle className="w-4 h-4" />
                        </Button>

                        <Button
                            variant="secondary"
                            size="icon"
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/5"
                        >
                            <Download className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>


            {/* RIGHT COLUMN: Scrollable Tracklist */}
            <div className="flex-1 overflow-y-auto bg-transparent z-10 w-full h-full pb-20 custom-scrollbar">
                <div className="p-4 md:p-6 pb-24">
                    {/* Sticky Header for Table */}
                    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest sticky top-0 bg-[#0a0a0a] z-50 mb-2 rounded-t-md shadow-md">
                        <div className="w-8 text-center">#</div>
                        <div>Title</div>
                        <div className="hidden md:block">Artist</div>
                        <div className="text-right pr-2">Actions</div>
                    </div>

                    {/* Songs List */}
                    <div className="flex flex-col gap-0.5">
                        {songs.map((song, index) => {
                            const songId = song.id || song.videoId;
                            const isCurrentLiked = isLiked(songId);

                            return (
                                <div
                                    key={`${songId}-${index}`}
                                    className="group grid grid-cols-[auto_1fr_40px] md:grid-cols-[auto_1fr_1fr_auto] gap-4 px-4 py-2.5 rounded-md hover:bg-white/10 items-center transition-all duration-200 text-sm border border-transparent hover:border-white/5 active:scale-[0.99]"
                                >
                                    {/* Index */}
                                    <div className="w-8 flex items-center justify-center text-white/50 font-medium font-mono text-center text-xs">
                                        <span className="group-hover:hidden">{index + 1}</span>
                                        <Play
                                            className="w-3 h-3 text-white hidden group-hover:block cursor-pointer fill-white"
                                            onClick={() => setQueue(songs, index)}
                                        />
                                    </div>

                                    {/* Title & Art */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="min-w-0">
                                            <div className="font-medium text-white truncate text-sm">{song.title}</div>
                                            <div className="text-white/50 text-[10px] md:hidden truncate">{song.artist}</div>
                                        </div>
                                    </div>

                                    {/* Artist (Desktop) */}
                                    <div className="hidden md:block text-white/50 text-xs font-medium truncate hover:text-white transition-colors cursor-pointer hover:underline">
                                        {song.artist}
                                    </div>

                                    {/* Actions (Replaces Duration) */}
                                    <div className="flex items-center justify-end gap-2 text-right">
                                        <button
                                            className={cn(
                                                "p-2 rounded-full hover:bg-white/10 transition-colors",
                                                isCurrentLiked ? "text-emerald-500" : "text-white/40 hover:text-white"
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleLike(song);
                                            }}
                                        >
                                            <Heart className={cn("w-4 h-4", isCurrentLiked && "fill-current")} />
                                        </button>

                                        <button
                                            className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setQueue(songs, index);
                                            }}
                                        >
                                            <Play className="w-4 h-4" />
                                        </button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-neutral-900 border-white/10">
                                                <DropdownMenuItem
                                                    onClick={() => addToQueue(song)}
                                                    className="cursor-pointer"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add to Queue
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSongToAdd(song);
                                                        setAddToPlaylistModalOpen(true);
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <ListMusic className="w-4 h-4 mr-2" />
                                                    Add to Playlist
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
