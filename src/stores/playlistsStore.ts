import { create } from 'zustand';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from './authStore';
import type { Track } from '@/types';

interface Playlist {
    id: string;
    user_id: string;
    name: string;
    description: string | null;
    thumbnail: string | null;
    created_at: number;
    updated_at: number;
}

interface PlaylistSong {
    song_id: string;
    title: string;
    artist: string;
    thumbnail: string | null;
    position: number;
    added_at: number;
}

interface PlaylistsState {
    playlists: Playlist[];
    currentPlaylistSongs: PlaylistSong[];
    isLoading: boolean;
}

interface PlaylistsActions {
    fetchPlaylists: () => Promise<void>;
    createPlaylist: (name: string, description?: string) => Promise<string | null>;
    deletePlaylist: (playlistId: string) => Promise<void>;
    fetchPlaylistSongs: (playlistId: string) => Promise<void>;
    addSongToPlaylist: (playlistId: string, track: Track) => Promise<void>;
    removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
}

const initialState: PlaylistsState = {
    playlists: [],
    currentPlaylistSongs: [],
    isLoading: false,
};

export const usePlaylistsStore = create<PlaylistsState & PlaylistsActions>()((set, get) => ({
    ...initialState,

    fetchPlaylists: async () => {
        const userId = useAuthStore.getState().userId;
        if (!userId) return;

        set({ isLoading: true });

        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('playlists')
                .select('*')
                .eq('user_id', userId)
                .order('updated_at', { ascending: false });

            if (error) throw error;

            set({ playlists: data || [], isLoading: false });
        } catch (error) {
            console.error('Error fetching playlists:', error);
            set({ isLoading: false });
        }
    },

    createPlaylist: async (name: string, description?: string) => {
        const userId = useAuthStore.getState().userId;
        if (!userId) return null;

        try {
            const supabase = getSupabaseClient();
            const now = Math.floor(Date.now() / 1000);

            const { data, error } = await supabase
                .from('playlists')
                .insert({
                    user_id: userId,
                    name,
                    description: description || null,
                    created_at: now,
                    updated_at: now,
                })
                .select()
                .single();

            if (error) throw error;

            // Add to local state
            set({ playlists: [data, ...get().playlists] });
            console.log(`[Playlists] Created playlist: ${name}`);

            return data.id;
        } catch (error) {
            console.error('Error creating playlist:', error);
            return null;
        }
    },

    deletePlaylist: async (playlistId: string) => {
        const userId = useAuthStore.getState().userId;
        if (!userId) return;

        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase
                .from('playlists')
                .delete()
                .eq('id', playlistId)
                .eq('user_id', userId);

            if (error) throw error;

            // Remove from local state
            set({ playlists: get().playlists.filter(p => p.id !== playlistId) });
            console.log(`[Playlists] Deleted playlist: ${playlistId}`);
        } catch (error) {
            console.error('Error deleting playlist:', error);
        }
    },

    fetchPlaylistSongs: async (playlistId: string) => {
        set({ isLoading: true });

        try {
            // Skip database query for YouTube Music playlists/albums
            // They start with RDCLAK, OLAK, or MPREb and aren't in our database
            // 1. Check for known YouTube Music ID prefixes
            const isKnownYouTubeId = playlistId.startsWith('RDCLAK') ||
                playlistId.startsWith('OLAK') ||
                playlistId.startsWith('MPREb');

            // 2. Check if it's a valid UUID (database ID)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(playlistId);

            // If it's a known YT ID *OR* simply NOT a UUID, treat as external/skip DB
            if (isKnownYouTubeId || !isUUID) {
                console.log(`[Playlists] Skipping database query for External/YouTube ID: ${playlistId}`);
                set({ currentPlaylistSongs: [], isLoading: false });
                return;
            }



            const supabase = getSupabaseClient();
            const { data, error } = await supabase
                .from('playlist_songs')
                .select('*')
                .eq('playlist_id', playlistId)
                .order('position', { ascending: true });

            if (error) throw error;

            set({ currentPlaylistSongs: data || [], isLoading: false });
        } catch (error) {
            console.error('Error fetching playlist songs:', error);
            set({ isLoading: false });
        }
    },

    addSongToPlaylist: async (playlistId: string, track: Track) => {
        try {
            const supabase = getSupabaseClient();

            // Get current max position
            const { data: existingSongs } = await supabase
                .from('playlist_songs')
                .select('position')
                .eq('playlist_id', playlistId)
                .order('position', { ascending: false })
                .limit(1);

            const nextPosition = existingSongs && existingSongs.length > 0
                ? existingSongs[0].position + 1
                : 0;

            const { error } = await supabase.from('playlist_songs').insert({
                playlist_id: playlistId,
                song_id: track.id,
                title: track.title,
                artist: track.artist,
                thumbnail: track.thumbnail,
                position: nextPosition,
                added_at: Math.floor(Date.now() / 1000),
            });

            if (error) throw error;

            // Update playlist's updated_at
            await supabase
                .from('playlists')
                .update({ updated_at: Math.floor(Date.now() / 1000) })
                .eq('id', playlistId);

            console.log(`[Playlists] Added song ${track.title} to playlist`);
        } catch (error) {
            console.error('Error adding song to playlist:', error);
        }
    },

    removeSongFromPlaylist: async (playlistId: string, songId: string) => {
        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase
                .from('playlist_songs')
                .delete()
                .eq('playlist_id', playlistId)
                .eq('song_id', songId);

            if (error) throw error;

            // Update local state
            set({
                currentPlaylistSongs: get().currentPlaylistSongs.filter(
                    s => s.song_id !== songId
                ),
            });

            console.log(`[Playlists] Removed song from playlist`);
        } catch (error) {
            console.error('Error removing song from playlist:', error);
        }
    },
}));
