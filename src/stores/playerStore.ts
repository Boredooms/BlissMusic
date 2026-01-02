import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from '@/types';

interface PlayerState {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    isLoading: boolean;
    hdMode: boolean;
}

interface PlayerActions {
    setIsPlaying: (playing: boolean) => void;
    togglePlay: () => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    setLoading: (loading: boolean) => void;
    toggleHdMode: () => void;
    reset: () => void;
}

const initialState: PlayerState = {
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    isMuted: false,
    isLoading: false,
    hdMode: false,
};

export const usePlayerStore = create<PlayerState & PlayerActions>()(
    persist(
        (set, get) => ({
            ...initialState,

            setIsPlaying: (playing) => set({ isPlaying: playing }),

            togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),

            setCurrentTime: (time) => set({ currentTime: time }),

            setDuration: (duration) => set({ duration }),

            setVolume: (volume) => set({ volume, isMuted: volume === 0 }),

            toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

            setLoading: (loading) => set({ isLoading: loading }),

            toggleHdMode: () => set((state) => ({ hdMode: !state.hdMode })),

            reset: () => set({ ...initialState, volume: get().volume, hdMode: get().hdMode }),
        }),
        {
            name: 'blissmusic-player',
            partialize: (state) => ({
                volume: state.volume,
                isMuted: state.isMuted,
                hdMode: state.hdMode,
            }),
        }
    )
);
