import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from './authStore';
import type { Track } from '@/types';

interface LikedSong {
    song_id: string;
    title: string;
    artist: string;
    thumbnail: string;
    liked_at: number;
}

interface LibraryState {
    likedSongs: LikedSong[];
    likedSongIds: Set<string>;
    isLoading: boolean;
}

interface LibraryActions {
    fetchLikedSongs: () => Promise<void>;
    toggleLike: (track: Track) => Promise<void>;
    isLiked: (songId: string) => boolean;
    trackListeningHistory: (track: Track, duration: number, completed: boolean, skipped: boolean) => Promise<void>;
}

const initialState: LibraryState = {
    likedSongs: [],
    likedSongIds: new Set(),
    isLoading: false,
};

export const useLibraryStore = create<LibraryState & LibraryActions>()((set, get) => ({
    ...initialState,

    fetchLikedSongs: async () => {
        const userId = useAuthStore.getState().userId;
        if (!userId) return;

        set({ isLoading: true });

        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('liked_songs')
                .select('*')
                .eq('user_id', userId)
                .order('liked_at', { ascending: false });

            if (error) throw error;

            const likedSongs = data || [];
            const songIds: string[] = likedSongs.map((s: LikedSong) => s.song_id);
            const likedSongIds = new Set<string>(songIds);

            set({ likedSongs, likedSongIds, isLoading: false });
        } catch (error) {
            console.error('Error fetching liked songs:', error);
            set({ isLoading: false });
        }
    },

    toggleLike: async (track: Track) => {
        const userId = useAuthStore.getState().userId;
        if (!userId) {
            console.warn('User not authenticated');
            return;
        }

        const supabase = getSupabaseClient();
        const { likedSongIds, likedSongs } = get();
        const isCurrentlyLiked = likedSongIds.has(track.id);

        // OPTIMISTIC UPDATE: Update local state immediately
        if (isCurrentlyLiked) {
            const newLikedSongs = likedSongs.filter(s => s.song_id !== track.id);
            const newLikedSongIds = new Set(likedSongIds);
            newLikedSongIds.delete(track.id);
            set({ likedSongs: newLikedSongs, likedSongIds: newLikedSongIds });
            console.log(`[Library] Unliked (Optimistic): ${track.title}`);
        } else {
            const liked_at = Math.floor(Date.now() / 1000);
            const newLikedSong: LikedSong = {
                song_id: track.id,
                title: track.title,
                artist: track.artist,
                thumbnail: track.thumbnail,
                liked_at,
            };
            const newLikedSongs = [newLikedSong, ...likedSongs];
            const newLikedSongIds = new Set(likedSongIds);
            newLikedSongIds.add(track.id);
            set({ likedSongs: newLikedSongs, likedSongIds: newLikedSongIds });
            console.log(`[Library] Liked (Optimistic): ${track.title}`);
        }

        try {
            if (isCurrentlyLiked) {
                const { error } = await supabase
                    .from('liked_songs')
                    .delete()
                    .eq('user_id', userId)
                    .eq('song_id', track.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('liked_songs')
                    .insert({
                        user_id: userId,
                        song_id: track.id,
                        title: track.title,
                        artist: track.artist,
                        thumbnail: track.thumbnail,
                        liked_at: Math.floor(Date.now() / 1000),
                    });
                if (error) throw error;
            }
        } catch (error) {
            console.error('Error toggling like (Reverting):', error);
            // Revert state on error
            set({ likedSongs, likedSongIds });
        }
    },

    isLiked: (songId: string) => {
        return get().likedSongIds.has(songId);
    },

    trackListeningHistory: async (track: Track, duration: number, completed: boolean, skipped: boolean) => {
        const userId = useAuthStore.getState().userId;
        if (!userId) return;

        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.from('listening_history').insert({
                user_id: userId,
                song_id: track.id,
                title: track.title,
                artist: track.artist,
                played_at: Math.floor(Date.now() / 1000),
                play_duration: Math.min(duration, 32767), // INT2 max
                completed,
                skipped,
            });

            if (error) throw error;
        } catch (error) {
            console.error('Error tracking listening history:', error);
        }
    },
}));
