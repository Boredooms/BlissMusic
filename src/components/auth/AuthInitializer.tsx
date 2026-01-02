'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlaylistsStore } from '@/stores/playlistsStore';
import { useListeningHistory } from '@/stores/listeningHistoryStore';

export function AuthInitializer() {
    const initialize = useAuthStore((state) => state.initialize);
    const userId = useAuthStore((state) => state.userId);
    const fetchLikedSongs = useLibraryStore((state) => state.fetchLikedSongs);
    const fetchPlaylists = usePlaylistsStore((state) => state.fetchPlaylists);
    const syncHistory = useListeningHistory((state) => state.syncWithSupabase);

    // Initialize auth on mount
    useEffect(() => {
        initialize();
    }, [initialize]);

    // Fetch user data when authenticated
    useEffect(() => {
        if (userId) {
            fetchLikedSongs();
            fetchPlaylists();
            syncHistory();
        }
    }, [userId, fetchLikedSongs, fetchPlaylists, syncHistory]);

    return null;
}
