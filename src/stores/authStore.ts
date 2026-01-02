import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';

interface AuthState {
    user: User | null;
    userId: string | null;
    email: string | null;
    displayName: string | null;
    avatarUrl: string | null;
    isLoading: boolean;
    isInitialized: boolean;
}

interface AuthActions {
    initialize: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshSession: () => Promise<void>;
}

const initialState: AuthState = {
    user: null,
    userId: null,
    email: null,
    displayName: null,
    avatarUrl: null,
    isLoading: true,
    isInitialized: false,
};

export const useAuthStore = create<AuthState & AuthActions>()(
    persist(
        (set, get) => ({
            ...initialState,

            initialize: async () => {
                if (get().isInitialized) return;

                set({ isLoading: true });

                try {
                    const supabase = getSupabaseClient();
                    const { data: { session } } = await supabase.auth.getSession();

                    if (session?.user) {
                        set({
                            user: session.user,
                            userId: session.user.id,
                            email: session.user.email || null,
                            displayName: session.user.user_metadata?.full_name ||
                                session.user.user_metadata?.name ||
                                session.user.email?.split('@')[0] ||
                                'User',
                            avatarUrl: session.user.user_metadata?.avatar_url ||
                                session.user.user_metadata?.picture ||
                                null,
                            isLoading: false,
                            isInitialized: true,
                        });
                    } else {
                        // No session - user needs to sign in
                        set({
                            isLoading: false,
                            isInitialized: true
                        });
                    }

                    // Listen for auth state changes
                    supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
                        if (session?.user) {
                            set({
                                user: session.user,
                                userId: session.user.id,
                                email: session.user.email || null,
                                displayName: session.user.user_metadata?.full_name ||
                                    session.user.user_metadata?.name ||
                                    session.user.email?.split('@')[0] ||
                                    'User',
                                avatarUrl: session.user.user_metadata?.avatar_url ||
                                    session.user.user_metadata?.picture ||
                                    null,
                            });
                        } else {
                            set({
                                user: null,
                                userId: null,
                                email: null,
                                displayName: null,
                                avatarUrl: null,
                            });
                        }
                    });
                } catch (error) {
                    console.error('Auth initialization error:', error);
                    set({ isLoading: false, isInitialized: true });
                }
            },

            signInWithGoogle: async () => {
                set({ isLoading: true });

                try {
                    const supabase = getSupabaseClient();
                    const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'google',
                        options: {
                            redirectTo: `${window.location.origin}/auth/callback`,
                            queryParams: {
                                access_type: 'offline',
                                prompt: 'consent',
                            },
                        },
                    });

                    if (error) throw error;
                    // OAuth redirect will happen automatically
                } catch (error) {
                    console.error('Google sign in error:', error);
                    set({ isLoading: false });
                    throw error;
                }
            },

            signOut: async () => {
                try {
                    const supabase = getSupabaseClient();
                    await supabase.auth.signOut();
                    set({
                        user: null,
                        userId: null,
                        email: null,
                        displayName: null,
                        avatarUrl: null,
                    });
                } catch (error) {
                    console.error('Sign out error:', error);
                }
            },

            refreshSession: async () => {
                try {
                    const supabase = getSupabaseClient();
                    const { data: { session }, error } = await supabase.auth.refreshSession();

                    if (error) throw error;

                    if (session?.user) {
                        set({
                            user: session.user,
                            userId: session.user.id,
                            email: session.user.email || null,
                            displayName: session.user.user_metadata?.full_name ||
                                session.user.user_metadata?.name ||
                                'User',
                            avatarUrl: session.user.user_metadata?.avatar_url ||
                                session.user.user_metadata?.picture ||
                                null,
                        });
                    }
                } catch (error) {
                    console.error('Session refresh error:', error);
                }
            },
        }),
        {
            name: 'blissmusic-auth',
            partialize: (state) => ({
                userId: state.userId,
                email: state.email,
                displayName: state.displayName,
                avatarUrl: state.avatarUrl,
            }),
        }
    )
);
