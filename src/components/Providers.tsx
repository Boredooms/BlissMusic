'use client';

import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { Logo } from './ui/Logo';

interface ProvidersProps {
    children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
    const [mounted, setMounted] = useState(false);
    const { initialize } = useAuthStore();

    useEffect(() => {
        setMounted(true);
        // Initialize auth on app load
        initialize();
    }, [initialize]);

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-black">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <Logo width={60} height={60} className="animate-pulse" />
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-2xl animate-pulse" />
                    </div>
                    <span className="font-semibold text-lg tracking-tight">BlissMusic</span>
                    <span className="text-white/60 text-sm animate-pulse">Preparing your bliss...</span>
                </div>
            </div>
        );
    }

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
        >
            {children}
        </ThemeProvider>
    );
}
