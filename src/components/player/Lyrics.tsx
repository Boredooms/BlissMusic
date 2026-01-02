'use client';

import { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { get, set } from 'idb-keyval';

interface LyricLine {
    time: number;
    text: string;
}

interface LyricsProps {
    title: string;
    artist: string;
}

interface CachedLyrics {
    lines: LyricLine[];
    synced: boolean;
    timestamp: number;
}

const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days - lyrics don't change

function getLyricsCacheKey(title: string, artist: string): string {
    return `lyrics_${title.toLowerCase()}_${artist.toLowerCase()}`;
}

export function Lyrics({ title, artist }: LyricsProps) {
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch lyrics with caching (NO TIME SYNC)
    useEffect(() => {
        async function fetchLyrics() {
            if (!title || !artist) return;

            setIsLoading(true);
            const cacheKey = getLyricsCacheKey(title, artist);

            try {
                // 1. CHECK CACHE FIRST
                const cached = await get<CachedLyrics>(cacheKey);
                if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
                    console.log('[Lyrics] ⚡ Using cached lyrics for:', title);
                    setLyrics(cached.lines);
                    setIsLoading(false);
                    return;
                }

                // 2. FETCH FROM API
                console.log('[Lyrics] 🔍 Fetching lyrics for:', title);
                const res = await fetch(
                    `/api/lyrics/track?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
                );
                const data = await res.json();

                const lines = data.lines || [];

                setLyrics(lines);

                // 3. CACHE THE RESULT (even if empty - prevents repeated failed fetches)
                await set(cacheKey, {
                    lines,
                    synced: data.synced || false,
                    timestamp: Date.now()
                });

                console.log('[Lyrics] ✅ Cached lyrics for future use');

            } catch (error) {
                console.error('[Lyrics] Failed to fetch:', error);
                setLyrics([]);
            } finally {
                setIsLoading(false);
            }
        }

        fetchLyrics();
    }, [title, artist]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Loading lyrics...</span>
            </div>
        );
    }

    if (lyrics.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <span className="text-lg">No lyrics available</span>
                <span className="text-sm mt-2">Lyrics for this song weren't found</span>
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-6 space-y-3">
                {lyrics.map((line, index) => (
                    <p
                        key={index}
                        className="text-lg font-medium text-white/80 leading-relaxed"
                    >
                        {line.text}
                    </p>
                ))}
            </div>
        </ScrollArea>
    );
}
