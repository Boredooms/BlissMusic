'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Music2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';
import Image from 'next/image';
import { Logo } from '@/components/ui/Logo';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
    const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        try {
            await signInWithGoogle();
            // User will be redirected to Google OAuth flow
        } catch (error) {
            console.error('Sign in failed:', error);
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-md overflow-hidden rounded-2xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(30, 30, 35, 0.98) 0%, rgba(20, 20, 25, 0.98) 100%)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                            }}
                        >
                            {/* Close button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            {/* Header with gradient */}
                            <div className="relative p-8 pb-6">
                                {/* Gradient overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-transparent" />

                                <div className="relative flex flex-col items-center text-center">
                                    {/* Logo/Icon */}
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                                        className="mb-4 relative"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 blur-2xl opacity-50" />
                                        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                            <Music2 className="w-8 h-8 text-white" />
                                        </div>
                                    </motion.div>

                                    {/* Title */}
                                    <motion.h2
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent"
                                    >
                                        <Logo width={200} height={50} className="mb-2" />
                                    </motion.h2>

                                    <motion.p
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-white/60 text-sm"
                                    >
                                        Sign in to access your library, playlists, and personalized recommendations
                                    </motion.p>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-8 pt-4 space-y-4">
                                {/* Features list */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="space-y-3 mb-6"
                                >
                                    {[
                                        { icon: '❤️', text: 'Save your favorite songs' },
                                        { icon: '📝', text: 'Create custom playlists' },
                                        { icon: '🎯', text: 'Get personalized recommendations' },
                                        { icon: '📊', text: 'Track your listening history' },
                                    ].map((feature, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ x: -20, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: 0.5 + index * 0.1 }}
                                            className="flex items-center gap-3 text-sm"
                                        >
                                            <span className="text-xl">{feature.icon}</span>
                                            <span className="text-white/70">{feature.text}</span>
                                        </motion.div>
                                    ))}
                                </motion.div>

                                {/* Google Sign In Button */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.9 }}
                                >
                                    <Button
                                        onClick={handleGoogleSignIn}
                                        disabled={isLoading}
                                        className="w-full h-12 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 group"
                                    >
                                        {isLoading ? (
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                                                <span>Connecting...</span>
                                            </div>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                                    <path
                                                        fill="#4285F4"
                                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    />
                                                    <path
                                                        fill="#34A853"
                                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    />
                                                    <path
                                                        fill="#FBBC05"
                                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                    />
                                                    <path
                                                        fill="#EA4335"
                                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                    />
                                                </svg>
                                                <span>Continue with Google</span>
                                            </>
                                        )}
                                    </Button>
                                </motion.div>

                                {/* Privacy note */}
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 1.0 }}
                                    className="text-xs text-white/40 text-center mt-4"
                                >
                                    By continuing, you agree to BlissMusic's Terms of Service and Privacy Policy
                                </motion.p>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
}
