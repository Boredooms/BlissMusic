'use client';

import { useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, ListMusic, Check } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { usePlaylistsStore } from '@/stores/playlistsStore';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function AddToPlaylistDialog() {
    const {
        isAddToPlaylistModalOpen,
        setAddToPlaylistModalOpen,
        songToAdd,
        setSongToAdd,
        setCreatePlaylistModalOpen
    } = useUIStore();

    const { playlists, fetchPlaylists, addSongToPlaylist } = usePlaylistsStore();
    const [addedInfo, setAddedInfo] = useState<string | null>(null);

    useEffect(() => {
        if (isAddToPlaylistModalOpen) {
            fetchPlaylists();
            setAddedInfo(null);
        }
    }, [isAddToPlaylistModalOpen, fetchPlaylists]);

    const handleClose = () => {
        setAddToPlaylistModalOpen(false);
        setTimeout(() => setSongToAdd(null), 300); // Clear after animation
    };

    const handleAddToPlaylist = async (playlistId: string, playlistName: string) => {
        if (!songToAdd) return;

        await addSongToPlaylist(playlistId, songToAdd);

        // Show temporary success state
        setAddedInfo(playlistId);

        // Close after brief delay
        setTimeout(() => {
            handleClose();
        }, 800);
    };

    const handleCreateNew = () => {
        setAddToPlaylistModalOpen(false);
        setCreatePlaylistModalOpen(true);
    };

    if (!songToAdd) return null;

    return (
        <Dialog open={isAddToPlaylistModalOpen} onOpenChange={setAddToPlaylistModalOpen}>
            <DialogContent className="sm:max-w-[425px] bg-neutral-900 border-neutral-800 text-white p-0 overflow-hidden gap-0">
                <DialogHeader className="p-6 pb-4 border-b border-white/5 bg-neutral-900/50 backdrop-blur-xl">
                    <DialogTitle className="text-xl font-bold flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded overflow-hidden bg-neutral-800 flex-shrink-0">
                            {songToAdd.thumbnail ? (
                                <Image
                                    src={songToAdd.thumbnail}
                                    alt={songToAdd.title}
                                    fill
                                    className="object-cover"
                                />
                            ) : (
                                <ListMusic className="w-5 h-5 text-white/40 m-auto" />
                            )}
                        </div>
                        <div className="flex flex-col min-w-0 text-left">
                            <span className="text-sm font-normal text-white/60">Add to playlist</span>
                            <span className="truncate">{songToAdd.title}</span>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                    <div className="space-y-1">
                        <button
                            onClick={handleCreateNew}
                            className="w-full flex items-center gap-4 p-3 rounded-md hover:bg-white/5 transition-colors group text-left"
                        >
                            <div className="w-12 h-12 rounded bg-neutral-800 border-2 border-dashed border-white/20 flex items-center justify-center group-hover:border-white/40 transition-colors">
                                <Plus className="w-5 h-5 text-white/40 group-hover:text-white transition-colors" />
                            </div>
                            <span className="font-medium">New playlist</span>
                        </button>

                        <div className="h-px bg-white/5 my-2 mx-3" />

                        {playlists.map((playlist) => {
                            const isAdded = addedInfo === playlist.id;

                            return (
                                <button
                                    key={playlist.id}
                                    onClick={() => handleAddToPlaylist(playlist.id, playlist.name)}
                                    disabled={!!addedInfo}
                                    className="w-full flex items-center justify-between p-3 rounded-md hover:bg-white/5 transition-colors group text-left relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-4 min-w-0 z-10">
                                        <div className="relative w-12 h-12 rounded overflow-hidden bg-neutral-800 flex-shrink-0">
                                            {playlist.thumbnail ? (
                                                <Image
                                                    src={playlist.thumbnail}
                                                    alt={playlist.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <ListMusic className="w-6 h-6 text-white/20 m-auto absolute inset-0" />
                                            )}

                                            {/* Success Overlay */}
                                            <div className={cn(
                                                "absolute inset-0 bg-emerald-500/90 flex items-center justify-center transition-opacity duration-300",
                                                isAdded ? "opacity-100" : "opacity-0"
                                            )}>
                                                <Check className="w-6 h-6 text-white" />
                                            </div>
                                        </div>

                                        <div className="flex flex-col min-w-0">
                                            <span className={cn(
                                                "font-medium truncate transition-colors",
                                                isAdded ? "text-emerald-500" : "group-hover:text-white"
                                            )}>
                                                {playlist.name}
                                            </span>
                                            <span className="text-xs text-white/40 truncate">
                                                {playlist.description || `${0} songs`}
                                                {/* Note: Playlist song count might need a separate query or optimization if checking individual counts is heavy */}
                                            </span>
                                        </div>
                                    </div>

                                    {isAdded && (
                                        <div className="absolute inset-0 bg-emerald-500/5 z-0" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
