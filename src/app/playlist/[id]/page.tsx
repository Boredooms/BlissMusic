'use client';

import { useEffect, useState } from 'react';
import type { Track } from '@/types';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
    Play,
    Shuffle,
    MoreVertical,
    Heart,
    ListMusic,
    Trash2,
    Plus,
    Loader2,
    Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { usePlaylistsStore } from '@/stores/playlistsStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useQueueStore } from '@/stores/queueStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export default function PlaylistPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const playlistId = params.id as string;

    const urlTitle = searchParams.get('title');
    const urlArtist = searchParams.get('artist');
    const urlThumbnail = searchParams.get('thumbnail');

    const {
        playlists,
        currentPlaylistSongs,
        fetchPlaylistSongs,
        deletePlaylist,
        removeSongFromPlaylist,
        isLoading
    } = usePlaylistsStore();

    const { setQueue, addToQueue } = useQueueStore();
    const { isLiked, toggleLike } = useLibraryStore();
    const { setAddToPlaylistModalOpen, setSongToAdd } = useUIStore();

    const [apiSongs, setApiSongs] = useState<Track[]>([]);
    const [apiInfo, setApiInfo] = useState<{ title: string; artist: string; thumbnail: string } | null>(null);
    const [isApiLoading, setIsApiLoading] = useState(false);

    const localPlaylist = playlists.find(p => p.id === playlistId);

    useEffect(() => {
        if (playlistId) {
            // If it's NOT a UUID (36 chars with dashes), it's a YouTube/External playlist
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playlistId);
            const isYouTubeMusicId = !isUUID;

            if (isYouTubeMusicId) {
                setIsApiLoading(true);
                const query = new URLSearchParams();
                const title = localPlaylist?.name || urlTitle;
                const artist = urlArtist;

                if (title) query.set('title', title);
                if (artist) query.set('artist', artist);

                fetch(`/api/playlists/${playlistId}?${query.toString()}`)
                    .then(res => res.json())
                    .then(data => {
                        setApiSongs(data.tracks || []);
                        if (data.info) setApiInfo(data.info);
                    })
                    .catch(error => {
                        console.error('[Playlist] API fetch error:', error);
                        setApiSongs([]);
                    })
                    .finally(() => setIsApiLoading(false));
            } else {
                fetchPlaylistSongs(playlistId);
            }
        }
    }, [playlistId, fetchPlaylistSongs, localPlaylist?.name, urlTitle, urlArtist]);

    // Same check for render logic
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playlistId);
    const isYouTubeMusicPlaylist = !isUUID;

    const songs: Track[] = isYouTubeMusicPlaylist
        ? apiSongs
        : currentPlaylistSongs.map(s => ({
            id: s.song_id,
            videoId: s.song_id,
            title: s.title,
            artist: s.artist,
            thumbnail: s.thumbnail || '',
            duration: 0
        }));

    const displayPlaylist = localPlaylist || (apiInfo ? {
        id: playlistId,
        name: apiInfo.title,
        description: `Album by ${apiInfo.artist}`,
        thumbnail: apiInfo.thumbnail,
        owner_id: 'ytmusic'
    } : (urlTitle ? {
        id: playlistId,
        name: urlTitle,
        description: urlArtist ? `Album by ${urlArtist}` : 'Album',
        thumbnail: urlThumbnail || '',
        owner_id: 'ytmusic'
    } : null));

    const handlePlayPlaylist = () => {
        if (songs.length > 0) setQueue(songs);
    };

    const handleShufflePlaylist = () => {
        if (songs.length > 0) {
            const tracks = [...songs];
            for (let i = tracks.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
            }
            setQueue(tracks);
        }
    };

    const handleDeletePlaylist = async () => {
        if (confirm('Are you sure you want to delete this playlist?')) {
            await deletePlaylist(playlistId);
            router.push('/library');
        }
    };

    const isGlobalLoading = isLoading || (isApiLoading && !displayPlaylist);
    const hasData = !!displayPlaylist || songs.length > 0;

    if (!hasData && isGlobalLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/50 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p>Loading playlist...</p>
            </div>
        );
    }

    if (!hasData && !isGlobalLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-white/50">
                <p>Playlist not found</p>
                <Button variant="link" onClick={() => router.push('/library')}>
                    Return to Library
                </Button>
            </div>
        );
    }

    const artistName = apiInfo?.artist || urlArtist || 'Various Artists';
    const year = new Date().getFullYear();

    return (
        <div className="full-height-page h-full flex flex-col md:flex-row bg-background relative overflow-hidden">
            {/* Subpara Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-background to-black pointer-events-none" />

            {/* LEFT COLUMN: Fixed Info Panel (Compacted + Seamless Full Height) */}
            <div className="w-full md:w-[280px] lg:w-[320px] flex-shrink-0 h-auto md:h-full p-6 pb-32 flex flex-col items-center md:items-start text-center md:text-left z-10 md:overflow-y-auto border-b md:border-b-0 md:border-r border-white/5 bg-black/20 backdrop-blur-md [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">

                {/* Album Art (Compact) */}
                <div className="relative w-32 h-32 md:w-52 md:h-52 rounded-md shadow-2xl overflow-hidden mb-5 group flex-shrink-0 bg-neutral-800 mx-auto md:mx-0 border border-white/10">
                    {(displayPlaylist?.thumbnail || (songs.length > 0 && songs[0].thumbnail)) ? (
                        <Image
                            src={displayPlaylist?.thumbnail || songs[0].thumbnail || ''}
                            alt={displayPlaylist?.name || 'Album Art'}
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
                        {displayPlaylist?.name}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1 text-white/60 font-medium text-xs mb-4">
                        <span className="text-emerald-400 font-bold">{apiInfo || urlArtist ? 'Album' : 'Playlist'}</span>
                        <span>•</span>
                        <span className="text-white hover:underline cursor-pointer line-clamp-1">{artistName}</span>
                        <span>•</span>
                        <span>{year}</span>
                    </div>

                    <div className="text-white/40 text-[10px] font-medium uppercase tracking-wider mb-5 flex items-center justify-center md:justify-start gap-2">
                        <span>{songs.length} Songs</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <Button
                            size="lg"
                            className="w-12 h-12 rounded-full bg-white hover:bg-gray-200 text-black shadow-xl hover:scale-105 transition-all pl-3.5"
                            onClick={handlePlayPlaylist}
                            disabled={songs.length === 0}
                        >
                            <Play className="w-5 h-5 fill-black" />
                        </Button>

                        <Button
                            variant="secondary"
                            size="icon"
                            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/5"
                            onClick={handleShufflePlaylist}
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

                        {!apiInfo && !urlTitle && (
                            <Button
                                variant="secondary"
                                size="icon"
                                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/5 text-red-400 hover:text-red-300"
                                onClick={handleDeletePlaylist}
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>


            {/* RIGHT COLUMN: Scrollable Tracklist */}
            <div className="flex-1 overflow-y-auto bg-transparent z-10 w-full h-full pb-20 custom-scrollbar relative">
                {/* Sticky Header - Placed outside padding for true sticky behavior */}
                <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5 px-6 py-3 grid grid-cols-[50px_4fr_2fr_120px] gap-4 text-[10px] font-bold text-white/40 uppercase tracking-widest shadow-lg">
                    <div className="text-center">#</div>
                    <div>Title</div>
                    <div className="hidden md:block">Artist</div>
                    <div className="text-right pr-2">Actions</div>
                </div>

                <div className="px-6 pb-24 pt-2">
                    {/* Loader */}
                    {isApiLoading && songs.length === 0 && (
                        <div className="py-20 flex flex-col items-center text-white/40">
                            <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                            <p className="text-xs">Loading tracks...</p>
                        </div>
                    )}

                    {/* Songs List */}
                    <div className="flex flex-col gap-0.5">
                        {songs.map((song, index) => {
                            const songId = song.id || song.videoId;
                            const isCurrentLiked = isLiked(songId);

                            return (
                                <div
                                    key={`${songId}-${index}`}
                                    className="group grid grid-cols-[50px_4fr_2fr_120px] gap-4 py-2.5 rounded-md hover:bg-white/10 items-center transition-all duration-200 text-sm border border-transparent hover:border-white/5 active:scale-[0.99] px-2"
                                >
                                    {/* Index */}
                                    <div className="flex items-center justify-center text-white/50 font-medium font-mono text-center text-xs">
                                        <span className="group-hover:hidden">{index + 1}</span>
                                        <Play
                                            className="w-3 h-3 text-white hidden group-hover:block cursor-pointer fill-white"
                                            onClick={() => {
                                                const track = {
                                                    id: songId,
                                                    videoId: songId,
                                                    title: song.title,
                                                    artist: song.artist,
                                                    thumbnail: song.thumbnail || '',
                                                    duration: song.duration || 0
                                                };
                                                setQueue([track]);
                                                // Optional: play immediately
                                            }}
                                        />
                                    </div>

                                    {/* Title & Art */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative w-9 h-9 rounded flex-shrink-0 bg-neutral-800 shadow-md">
                                            {song.thumbnail && (
                                                <Image src={song.thumbnail} alt={song.title} fill className="object-cover rounded" />
                                            )}
                                        </div>
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
                                                toggleLike({
                                                    id: songId,
                                                    videoId: songId,
                                                    title: song.title,
                                                    artist: song.artist,
                                                    thumbnail: song.thumbnail || '',
                                                    duration: song.duration || 0
                                                });
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
                                                    onClick={() => addToQueue({
                                                        id: songId,
                                                        videoId: songId,
                                                        title: song.title,
                                                        artist: song.artist,
                                                        thumbnail: song.thumbnail || '',
                                                        duration: song.duration || 0
                                                    })}
                                                    className="cursor-pointer"
                                                >
                                                    <Plus className="w-4 h-4 mr-2" />
                                                    Add to Queue
                                                </DropdownMenuItem>

                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setSongToAdd({
                                                            id: songId,
                                                            videoId: songId,
                                                            title: song.title,
                                                            artist: song.artist,
                                                            thumbnail: song.thumbnail || '',
                                                            duration: song.duration || 0
                                                        });
                                                        setAddToPlaylistModalOpen(true);
                                                    }}
                                                    className="cursor-pointer"
                                                >
                                                    <ListMusic className="w-4 h-4 mr-2" />
                                                    Add to Playlist
                                                </DropdownMenuItem>

                                                {!apiInfo && !urlTitle && (
                                                    <DropdownMenuItem
                                                        onClick={() => removeSongFromPlaylist(playlistId, songId)}
                                                        className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Remove from Playlist
                                                    </DropdownMenuItem>
                                                )}
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
