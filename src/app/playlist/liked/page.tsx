'use client';

/**
 * Liked Songs Playlist Page
 * Shows all songs liked by the user
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { usePlayerStore } from '@/stores/playerStore';
import { useQueueStore } from '@/stores/queueStore';
import { Play, Pause, Heart } from 'lucide-react';

interface LikedSong {
    id: string; // song_id
    title: string;
    artist: string;
    thumbnail: string;
    liked_at: number;
}

export default function LikedSongsPage() {
    const router = useRouter();
    const [songs, setSongs] = useState<LikedSong[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    const { isPlaying, setIsPlaying } = usePlayerStore();
    const { setQueue, queue, currentIndex } = useQueueStore();

    useEffect(() => {
        async function fetchLikedSongs() {
            const supabase = createClient();

            // Check authentication
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }
            setUser(user);

            // Fetch liked songs
            const { data, error } = await supabase
                .from('liked_songs')
                .select('*')
                .eq('user_id', user.id)
                .order('liked_at', { ascending: false });

            if (data) {
                // Transform data to match interface
                const mappedSongs = data.map((item: any) => ({
                    id: item.song_id,
                    title: item.title,
                    artist: item.artist,
                    thumbnail: item.thumbnail,
                    liked_at: item.liked_at
                }));
                setSongs(mappedSongs);
            }
            setLoading(false);
        }

        fetchLikedSongs();
    }, [router]);

    const handlePlay = (index: number) => {
        // Create full track objects for the queue
        const trackList = songs.map(song => ({
            id: song.id,
            title: song.title,
            artist: song.artist,
            thumbnail: song.thumbnail,
            duration: 0, // Duration might not be stored in liked_songs
            videoId: song.id // Assuming ID is videoId
        }));

        // Set queue with all liked songs and start playing from selected index
        setQueue(trackList, index);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-emerald-400">Loading liked songs...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 pb-24">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8 text-center md:text-left">
                    <div className="w-40 h-40 md:w-52 md:h-52 bg-gradient-to-br from-indigo-800 to-purple-900 rounded shadow-2xl flex items-center justify-center flex-shrink-0">
                        <Heart className="w-16 h-16 md:w-20 md:h-20 text-white fill-white" />
                    </div>
                    <div>
                        <div className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Playlist</div>
                        <h1 className="text-3xl md:text-6xl font-black mb-4">Liked Songs</h1>
                        <div className="text-gray-300 font-medium">
                            {user?.email} • {songs.length} songs
                        </div>
                    </div>
                </div>

                {/* Play Button */}
                <div className="mb-8 flex justify-center md:justify-start">
                    <button
                        onClick={() => handlePlay(0)}
                        className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center hover:scale-105 transition shadow-lg text-black"
                    >
                        <Play className="w-7 h-7 fill-black ml-1" />
                    </button>
                </div>

                {/* Song List */}
                {songs.length === 0 ? (
                    <div className="text-gray-500 py-12 text-center">
                        You haven't liked any songs yet.
                    </div>
                ) : (
                    <div className="space-y-1">
                        {/* Table Header */}
                        <div className="grid grid-cols-[16px_1fr_40px] md:grid-cols-[16px_1fr_1fr_40px] gap-4 px-4 py-2 text-gray-400 text-sm border-b border-white/10 mb-2">
                            <div>#</div>
                            <div>Title</div>
                            <div className="hidden md:block">Artist</div>
                            <div><Heart className="w-4 h-4" /></div>
                        </div>

                        {/* Rows */}
                        {songs.map((song, index) => {
                            const isCurrent = queue[currentIndex]?.id === song.id;

                            return (
                                <div
                                    key={song.id}
                                    onClick={() => handlePlay(index)}
                                    className={`group grid grid-cols-[16px_1fr_40px] md:grid-cols-[16px_1fr_1fr_40px] gap-4 px-4 py-2 rounded-md hover:bg-white/10 cursor-pointer items-center transition ${isCurrent ? 'text-emerald-400' : 'text-gray-300'}`}
                                >
                                    <div className="text-sm">
                                        <span className="group-hover:hidden">{index + 1}</span>
                                        <Play className="w-4 h-4 hidden group-hover:block fill-current" />
                                    </div>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <img src={song.thumbnail} alt={song.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                                        <div className="font-medium truncate">
                                            {song.title}
                                            <span className="block md:hidden text-xs text-muted-foreground mt-0.5">{song.artist}</span>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-400 truncate group-hover:text-white hidden md:block">
                                        {song.artist}
                                    </div>
                                    <div>
                                        <Heart className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
