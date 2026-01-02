'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Library as LibraryIcon, Heart, Clock, ListMusic, Plus, Play, Loader2, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlaylistsStore } from '@/stores/playlistsStore';
import { useAuthStore } from '@/stores/authStore';
import { useQueueStore } from '@/stores/queueStore';
import { useUIStore } from '@/stores/uiStore';
import { LoginModal } from '@/components/auth/LoginModal';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

export default function LibraryPage() {
    const router = useRouter();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const { setCreatePlaylistModalOpen } = useUIStore();

    const userId = useAuthStore((state) => state.userId);
    const likedSongs = useLibraryStore((state) => state.likedSongs);
    const isLoadingLikes = useLibraryStore((state) => state.isLoading);
    const playlists = usePlaylistsStore((state) => state.playlists);
    const isLoadingPlaylists = usePlaylistsStore((state) => state.isLoading);
    const deletePlaylist = usePlaylistsStore((state) => state.deletePlaylist);
    const addToQueue = useQueueStore((state) => state.addToQueue);

    const handleDeletePlaylist = async (e: React.MouseEvent, playlistId: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this playlist?')) {
            await deletePlaylist(playlistId);
        }
    };

    const playLikedSong = (index: number) => {
        const song = likedSongs[index];
        if (song) {
            addToQueue({
                id: song.song_id,
                title: song.title,
                artist: song.artist,
                thumbnail: song.thumbnail || '',
                videoId: song.song_id,
                duration: 0,
            });
        }
    };

    // Show sign-in prompt if not authenticated
    if (!userId) {
        return (
            <>
                <div className="p-6 page-transition">
                    <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
                        <LibraryIcon className="w-16 h-16 text-white/20 mb-4" />
                        <h2 className="text-2xl font-bold mb-2">Your Library</h2>
                        <p className="text-white/60 mb-6 max-w-md">
                            Sign in to access your liked songs, playlists, and personalized recommendations
                        </p>
                        <Button
                            onClick={() => setIsLoginModalOpen(true)}
                            className="bg-white hover:bg-gray-200 text-black font-medium px-8"
                        >
                            Sign In to BlissMusic
                        </Button>
                    </div>
                </div>
                <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
            </>
        );
    }

    return (
        <>
            <div className="p-6 page-transition">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Your Library</h1>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setCreatePlaylistModalOpen(true)}
                        className="hover:bg-white/10"
                        title="Create Playlist"
                    >
                        <Plus className="w-5 h-5" />
                    </Button>
                </div>

                <div className="space-y-6">
                    {/* Liked Songs Section */}
                    <div>
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                            Collections
                        </h3>

                        <div className="space-y-2">
                            {/* Liked Songs */}
                            <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                                <div className="w-14 h-14 rounded bg-gradient-to-br from-purple-600 to-blue-400 flex items-center justify-center flex-shrink-0">
                                    <Heart className="w-7 h-7 text-white fill-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium">Liked Songs</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {isLoadingLikes ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                Loading...
                                            </span>
                                        ) : (
                                            `${likedSongs.length} songs`
                                        )}
                                    </p>
                                </div>
                                {likedSongs.length > 0 && (
                                    <Button
                                        size="icon"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-600 hover:bg-emerald-500"
                                        onClick={() => playLikedSong(0)}
                                    >
                                        <Play className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>

                            {/* Recently Played */}
                            <Link href="/history">
                                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group">
                                    <div className="w-14 h-14 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium">Recently Played</h4>
                                        <p className="text-sm text-muted-foreground">History</p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Liked Songs List */}
                    {likedSongs.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                                Your Liked Songs
                            </h3>
                            <div className="space-y-1">
                                {likedSongs.slice(0, 10).map((song, index) => (
                                    <div
                                        key={song.song_id}
                                        onClick={() => playLikedSong(index)}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                                    >
                                        <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                            <Image
                                                src={song.thumbnail || '/placeholder.png'}
                                                alt={song.title}
                                                fill
                                                className="object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Play className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium truncate">{song.title}</h4>
                                            <p className="text-xs text-white/50 truncate">{song.artist}</p>
                                        </div>
                                        <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))}
                            </div>
                            {likedSongs.length > 10 && (
                                <p className="text-sm text-muted-foreground text-center mt-4">
                                    and {likedSongs.length - 10} more...
                                </p>
                            )}
                        </div>
                    )}

                    {/* Playlists Section */}
                    <div className="pt-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-3">
                            Playlists
                        </h3>

                        {isLoadingPlaylists ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : playlists.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <ListMusic className="w-12 h-12 text-muted-foreground mb-4" />
                                <h4 className="font-medium mb-1">Create your first playlist</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    It&apos;s easy, we&apos;ll help you
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCreatePlaylistModalOpen(true)}
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create playlist
                                </Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {playlists.map((playlist) => (
                                    <div
                                        key={playlist.id}
                                        onClick={() => router.push(`/playlist/${playlist.id}`)}
                                        className="relative p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                                    >
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-neutral-900 border-white/10">
                                                    <DropdownMenuItem
                                                        onClick={(e) => handleDeletePlaylist(e, playlist.id)}
                                                        className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete Playlist
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="aspect-square rounded bg-white/10 mb-3 flex items-center justify-center">
                                            {playlist.thumbnail ? (
                                                <Image
                                                    src={playlist.thumbnail}
                                                    alt={playlist.name}
                                                    width={160}
                                                    height={160}
                                                    className="w-full h-full object-cover rounded"
                                                />
                                            ) : (
                                                <ListMusic className="w-12 h-12 text-white/40" />
                                            )}
                                        </div>
                                        <h4 className="font-medium truncate mb-1">{playlist.name}</h4>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {playlist.description || 'Playlist'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* CreatePlaylistDialog removed from here */}
        </>
    );
}
