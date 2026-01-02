/**
 * User Listening History Store
 * Tracks what user plays, skips, likes for personalized recommendations
 */

import { useAuthStore } from './authStore';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from '@/types';

interface ListeningHistoryEntry {
    track: Track;
    playedAt: number;
    completionRate: number; // 0-1 (how much of song was played)
    skipped: boolean;
    liked: boolean;
}

interface UserPreferences {
    favoriteArtists: Map<string, number>; // artist -> play count
    favoriteGenres: Map<string, number>; // genre -> play count
    recentlyPlayed: Track[];
    totalPlays: number;
    averageSessionLength: number;
}

interface ListeningHistoryState {
    history: ListeningHistoryEntry[];
    preferences: UserPreferences;

    // Actions
    trackPlay: (track: Track, completionRate: number, skipped: boolean) => void;
    trackLike: (track: Track) => void;
    syncWithSupabase: () => Promise<void>;
    getRecentArtists: (limit?: number) => string[];
    getTopGenres: () => string[];
    getListeningPattern: () => {
        preferredTimeOfDay: string;
        averageSkipRate: number;
        diversityPreference: 'low' | 'medium' | 'high';
    };
    clearHistory: () => void;
}

export const useListeningHistory = create<ListeningHistoryState>()(
    persist(
        (set, get) => ({
            history: [],
            preferences: {
                favoriteArtists: new Map(),
                favoriteGenres: new Map(),
                recentlyPlayed: [],
                totalPlays: 0,
                averageSessionLength: 0,
            },

            trackPlay: (track, completionRate, skipped) => {
                const entry: ListeningHistoryEntry = {
                    track,
                    playedAt: Date.now(),
                    completionRate,
                    skipped,
                    liked: false,
                };

                set((state) => {
                    const newHistory = [entry, ...state.history].slice(0, 500); // Keep last 500

                    // Update favorite artists
                    const favoriteArtists = new Map(state.preferences.favoriteArtists);
                    if (!skipped && completionRate > 0.5) {
                        favoriteArtists.set(
                            track.artist,
                            (favoriteArtists.get(track.artist) || 0) + 1
                        );
                    }

                    // Update recently played
                    const recentlyPlayed = [track, ...state.preferences.recentlyPlayed]
                        .filter((t, i, arr) => arr.findIndex(x => x.id === t.id) === i)
                        .slice(0, 50);

                    return {
                        history: newHistory,
                        preferences: {
                            ...state.preferences,
                            favoriteArtists,
                            recentlyPlayed,
                            totalPlays: state.preferences.totalPlays + 1,
                        },
                    };
                });
            },

            trackLike: (track) => {
                set((state) => ({
                    history: state.history.map((entry) =>
                        entry.track.id === track.id
                            ? { ...entry, liked: true }
                            : entry
                    ),
                }));
            },

            syncWithSupabase: async () => {
                const userId = useAuthStore.getState().userId;
                if (!userId) return;

                try {
                    // Use the same API endpoint as the History page for consistency
                    const res = await fetch('/api/history?days=30&limit=500');
                    const data = await res.json();

                    if (res.ok && data.history) {
                        // Flatten history object (grouped by date) into array
                        const flatHistory: ListeningHistoryEntry[] = [];

                        Object.values(data.history).forEach((dayEntries: any) => {
                            dayEntries.forEach((item: any) => {
                                flatHistory.push({
                                    track: {
                                        id: item.track.id,
                                        title: item.track.title,
                                        artist: item.track.artist,
                                        thumbnail: item.track.thumbnail || '',
                                        duration: item.track.duration || 0,
                                        videoId: item.track.id, // Map id to videoId as they are usually the same for YT tracks
                                    },
                                    playedAt: new Date(item.playedAt).getTime(),
                                    completionRate: item.completionRate,
                                    skipped: item.skipped,
                                    liked: false,
                                });
                            });
                        });

                        // Sort by playedAt desc
                        flatHistory.sort((a, b) => b.playedAt - a.playedAt);

                        const history = flatHistory.slice(0, 500);

                        // Rebuild preferences
                        const favoriteArtists = new Map<string, number>();
                        const recentlyPlayed: Track[] = [];
                        let totalPlays = 0;

                        history.forEach(entry => {
                            totalPlays++;

                            // Favorite Artists
                            if (!entry.skipped) {
                                const count = favoriteArtists.get(entry.track.artist) || 0;
                                favoriteArtists.set(entry.track.artist, count + 1);
                            }

                            // Recently Played
                            if (!recentlyPlayed.some(t => t.id === entry.track.id)) {
                                recentlyPlayed.push(entry.track);
                            }
                        });

                        set({
                            history,
                            preferences: {
                                ...get().preferences,
                                favoriteArtists,
                                recentlyPlayed: recentlyPlayed.slice(0, 50),
                                totalPlays,
                            }
                        });
                        console.log(`[History] Synced ${history.length} tracks from API`);
                    }
                } catch (error) {
                    console.error('Failed to sync history:', error);
                }
            },

            getRecentArtists: (limit = 10) => {
                const state = get();
                return Array.from(state.preferences.favoriteArtists.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, limit)
                    .map(([artist]) => artist);
            },

            getTopGenres: () => {
                // TODO: Extract from track metadata
                return ['pop', 'bollywood', 'tamil'];
            },

            getListeningPattern: () => {
                const state = get();
                const recentHistory = state.history.slice(0, 50);

                // Calculate skip rate
                const skipRate = recentHistory.length > 0
                    ? recentHistory.filter(h => h.skipped).length / recentHistory.length
                    : 0.1;

                // Determine diversity preference
                const uniqueArtists = new Set(recentHistory.map(h => h.track.artist)).size;
                const diversityRatio = recentHistory.length > 0
                    ? uniqueArtists / Math.min(recentHistory.length, 20)
                    : 0.5;

                const diversityPreference: 'low' | 'medium' | 'high' =
                    diversityRatio > 0.7 ? 'high' :
                        diversityRatio > 0.4 ? 'medium' : 'low';

                return {
                    preferredTimeOfDay: 'any',
                    averageSkipRate: skipRate,
                    diversityPreference,
                };
            },

            clearHistory: () => {
                set({
                    history: [],
                    preferences: {
                        favoriteArtists: new Map(),
                        favoriteGenres: new Map(),
                        recentlyPlayed: [],
                        totalPlays: 0,
                        averageSessionLength: 0,
                    },
                });
            },
        }),
        {
            name: 'listening-history',
            partialize: (state) => ({
                history: state.history,
                preferences: {
                    ...state.preferences,
                    favoriteArtists: Array.from(state.preferences.favoriteArtists.entries()),
                    favoriteGenres: Array.from(state.preferences.favoriteGenres.entries()),
                },
            }),
        }
    )
);
