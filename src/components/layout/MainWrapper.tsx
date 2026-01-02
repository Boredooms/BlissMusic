'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function MainWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    // Check if the current page is an album or playlist page
    // These pages handle their own scrolling and padding for the split layout
    const isFullScreenPage = pathname?.startsWith('/album/') || pathname?.startsWith('/playlist/');

    return (
        <main
            className={cn(
                "flex-1 custom-scrollbar",
                // If it's a full screen page, disable main scroll and padding
                // Otherwise, keep default scroll and padding for player bar
                isFullScreenPage ? "overflow-hidden pb-0" : "overflow-y-auto pb-24"
            )}
        >
            {children}
        </main>
    );
}
