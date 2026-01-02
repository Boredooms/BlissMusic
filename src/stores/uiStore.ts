import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Track } from '@/types';

interface UIStore {
    isSidebarCollapsed: boolean;
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;

    isCreatePlaylistModalOpen: boolean;
    setCreatePlaylistModalOpen: (isOpen: boolean) => void;

    isAddToPlaylistModalOpen: boolean;
    setAddToPlaylistModalOpen: (isOpen: boolean) => void;
    songToAdd: Track | null;
    setSongToAdd: (song: Track | null) => void;
}

export const useUIStore = create<UIStore>()(
    persist(
        (set) => ({
            isSidebarCollapsed: false,
            toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
            setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),

            isCreatePlaylistModalOpen: false,
            setCreatePlaylistModalOpen: (isOpen) => set({ isCreatePlaylistModalOpen: isOpen }),

            isAddToPlaylistModalOpen: false,
            setAddToPlaylistModalOpen: (isOpen) => set({ isAddToPlaylistModalOpen: isOpen }),
            songToAdd: null,
            setSongToAdd: (song) => set({ songToAdd: song }),
        }),
        {
            name: 'ui-storage',
            partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }), // Only persist sidebar state, not modals
        }
    )
);
