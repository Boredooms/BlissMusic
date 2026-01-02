'use client';

import { NowPlayingCard } from '@/components/player/NowPlayingCard';
import { useRouter } from 'next/navigation';
import { useQueueStore } from '@/stores/queueStore';
import { useEffect } from 'react';

export default function NowPlayingPage() {
    const router = useRouter();
    const { getCurrentTrack } = useQueueStore();
    const currentTrack = getCurrentTrack();

    // Redirect to home if no track is playing
    useEffect(() => {
        if (!currentTrack) {
            router.push('/');
        }
    }, [currentTrack, router]);

    if (!currentTrack) {
        return (
            <div className="flex items-center justify-center h-screen bg-black">
                <p className="text-muted-foreground">No track playing</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-black">
            <NowPlayingCard onClose={() => router.back()} />
        </div>
    );
}
