import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track, RepeatMode } from '@/types';

interface QueueState {
    queue: Track[];
    originalQueue: Track[];
    currentIndex: number;
    isShuffled: boolean;
    repeatMode: RepeatMode;
    isAutoLoading: boolean;
}

interface QueueActions {
    setQueue: (tracks: Track[], startIndex?: number) => void;
    addToQueue: (track: Track) => void;
    addNext: (track: Track) => void;
    addTracks: (tracks: Track[]) => void; // For auto-queue
    removeFromQueue: (index: number) => void;
    clearQueue: () => void;
    reorderQueue: (from: number, to: number) => void;
    playTrack: (index: number) => void;
    playNext: () => Track | null;
    playPrevious: () => Track | null;
    toggleShuffle: () => void;
    cycleRepeat: () => void;
    getCurrentTrack: () => Track | null;
    trimOldTracks: () => void;
    autoLoadSongs: () => Promise<void>;
}

const initialState: QueueState = {
    queue: [],
    originalQueue: [],
    currentIndex: -1,
    isShuffled: false,
    repeatMode: 'off',
    isAutoLoading: false,
};

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export const useQueueStore = create<QueueState & QueueActions>()(
    persist(
        (set, get) => ({
            ...initialState,

            setQueue: (tracks, startIndex = 0) => {
                set({
                    queue: tracks,
                    originalQueue: tracks,
                    currentIndex: startIndex,
                    isShuffled: false,
                });
            },

            addToQueue: (track) => {
                set((state) => ({
                    queue: [...state.queue, track],
                    originalQueue: state.isShuffled ? state.originalQueue : [...state.queue, track],
                }));
            },

            addNext: (track) => {
                set((state) => {
                    const newQueue = [...state.queue];
                    newQueue.splice(state.currentIndex + 1, 0, track);
                    return {
                        queue: newQueue,
                        originalQueue: state.isShuffled ? state.originalQueue : newQueue,
                    };
                });
            },

            removeFromQueue: (index) => {
                set((state) => {
                    const newQueue = state.queue.filter((_, i) => i !== index);
                    let newIndex = state.currentIndex;
                    if (index < state.currentIndex) {
                        newIndex--;
                    } else if (index === state.currentIndex && index >= newQueue.length) {
                        newIndex = newQueue.length - 1;
                    }
                    return {
                        queue: newQueue,
                        currentIndex: newIndex,
                    };
                });
            },

            clearQueue: () => {
                set(initialState);
            },

            reorderQueue: (from, to) => {
                set((state) => {
                    const newQueue = [...state.queue];
                    const [removed] = newQueue.splice(from, 1);
                    newQueue.splice(to, 0, removed);

                    let newIndex = state.currentIndex;
                    if (from === state.currentIndex) {
                        newIndex = to;
                    } else if (from < state.currentIndex && to >= state.currentIndex) {
                        newIndex--;
                    } else if (from > state.currentIndex && to <= state.currentIndex) {
                        newIndex++;
                    }

                    return { queue: newQueue, currentIndex: newIndex };
                });
            },

            // Add tracks to the end of queue (for auto-queue)
            addTracks: (tracks) => {
                set((state) => {
                    const newQueue = [...state.queue, ...tracks];
                    console.log(`[QueueStore] Adding ${tracks.length} tracks. Queue: ${state.queue.length} -> ${newQueue.length}, Current: ${state.currentIndex}`);
                    return {
                        queue: newQueue,
                    };
                });
            },

            playTrack: (index) => {
                set({ currentIndex: index });
            },

            playNext: () => {
                const state = get();
                if (state.queue.length === 0) return null;

                let nextIndex: number;

                if (state.repeatMode === 'one') {
                    nextIndex = state.currentIndex;
                } else if (state.currentIndex >= state.queue.length - 1) {
                    if (state.repeatMode === 'all') {
                        nextIndex = 0;
                    } else {
                        return null; // End of queue
                    }
                } else {
                    nextIndex = state.currentIndex + 1;
                }

                set({ currentIndex: nextIndex });
                return state.queue[nextIndex];
            },

            playPrevious: () => {
                const state = get();
                if (state.queue.length === 0) return null;

                let prevIndex: number;

                if (state.currentIndex <= 0) {
                    if (state.repeatMode === 'all') {
                        prevIndex = state.queue.length - 1;
                    } else {
                        prevIndex = 0;
                    }
                } else {
                    prevIndex = state.currentIndex - 1;
                }

                set({ currentIndex: prevIndex });
                return state.queue[prevIndex];
            },

            toggleShuffle: () => {
                set((state) => {
                    if (state.isShuffled) {
                        // Restore original order
                        const currentTrack = state.queue[state.currentIndex];
                        const newIndex = state.originalQueue.findIndex((t) => t.id === currentTrack?.id);
                        return {
                            queue: [...state.originalQueue],
                            currentIndex: Math.max(0, newIndex),
                            isShuffled: false,
                        };
                    } else {
                        // Shuffle, keeping current track at position 0
                        const currentTrack = state.queue[state.currentIndex];
                        const rest = state.queue.filter((_, i) => i !== state.currentIndex);
                        const shuffledRest = shuffleArray(rest);
                        const newQueue = currentTrack ? [currentTrack, ...shuffledRest] : shuffledRest;
                        return {
                            originalQueue: [...state.queue],
                            queue: newQueue,
                            currentIndex: 0,
                            isShuffled: true,
                        };
                    }
                });
            },

            cycleRepeat: () => {
                set((state) => {
                    const modes: RepeatMode[] = ['off', 'all', 'one'];
                    const currentModeIndex = modes.indexOf(state.repeatMode);
                    const nextMode = modes[(currentModeIndex + 1) % modes.length];
                    return { repeatMode: nextMode };
                });
            },

            getCurrentTrack: () => {
                const state = get();
                if (state.currentIndex >= 0 && state.currentIndex < state.queue.length) {
                    return state.queue[state.currentIndex];
                }
                return null;
            },

            // Trim old played tracks, keeping only last 2
            trimOldTracks: () => {
                set((state) => {
                    if (state.currentIndex <= 2) return state;

                    // Keep only last 2 played + current + all upcoming
                    const keepFromIndex = Math.max(0, state.currentIndex - 2);
                    const newQueue = state.queue.slice(keepFromIndex);
                    const newIndex = state.currentIndex - keepFromIndex;

                    return {
                        queue: newQueue,
                        currentIndex: newIndex,
                    };
                });
            },

            // Auto-load songs when queue is running low
            autoLoadSongs: async () => {
                const state = get();
                const remainingSongs = state.queue.length - state.currentIndex - 1;

                // Only load if less than 3 songs remaining and not already loading
                if (remainingSongs < 3 && !state.isAutoLoading && state.currentIndex >= 0) {
                    set({ isAutoLoading: true });

                    try {
                        const currentTrack = state.queue[state.currentIndex];

                        // Validate track has required properties
                        if (!currentTrack || !currentTrack.title || !currentTrack.artist || !currentTrack.videoId) {
                            console.warn('[Auto-Queue] Invalid track data, skipping auto-load');
                            set({ isAutoLoading: false });
                            return;
                        }

                        // Call recommendations API
                        const response = await fetch('/api/recommendations', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                currentTrack,
                                type: 'related'
                            }),
                        });

                        if (response.ok) {
                            const data = await response.json();
                            const newTracks: Track[] = data.tracks || [];

                            // Add new tracks to queue
                            if (newTracks.length > 0) {
                                set((state) => ({
                                    queue: [...state.queue, ...newTracks],
                                    originalQueue: state.isShuffled ? state.originalQueue : [...state.queue, ...newTracks],
                                }));
                            }
                        }
                    } catch (error) {
                        console.error('Auto-load error:', error);
                    } finally {
                        set({ isAutoLoading: false });
                    }
                }
            },
        }),
        {
            name: 'blissmusic-queue',
            partialize: (state) => ({
                queue: state.queue,
                originalQueue: state.originalQueue,
                currentIndex: state.currentIndex,
                isShuffled: state.isShuffled,
                repeatMode: state.repeatMode,
            }),
        }
    )
);
