'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrackCard } from '@/components/cards';
import { Loader2, Music } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Track } from '@/types';

interface PlaylistDialogProps {
    playlistId: string | null;
    playlistTitle: string;
    onClose: () => void;
}

export function PlaylistDialog({ playlistId, playlistTitle, onClose }: PlaylistDialogProps) {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!playlistId) return;

        async function fetchPlaylistSongs() {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/playlists/${playlistId}`);
                const data = await res.json();
                setTracks(data.tracks || []);
            } catch (error) {
                console.error('Failed to fetch playlist songs:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchPlaylistSongs();
    }, [playlistId]);

    return (
        <Dialog open={!!playlistId} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{playlistTitle}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                        </div>
                    ) : tracks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Music className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No songs found in this playlist</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tracks.map((track, index) => (
                                <TrackCard
                                    key={track.id}
                                    track={track}
                                    index={index + 1}
                                    isCompact
                                    showIndex
                                />
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
