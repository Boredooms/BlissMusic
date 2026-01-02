/**
 * Get Playlist Songs API - Fetches REAL YouTube Music playlists
 * Cached daily - refreshes once per day at midnight
 */

import { NextRequest, NextResponse } from 'next/server';
import { getYTMusicPlaylist } from '@/lib/youtube/ytmusic-no-quota';

// Playlist metadata for fallback (ONLY 3 high-quality playlists)
const PLAYLIST_TITLES: Record<string, string> = {
    'RDCLAK5uy_lyVnWI5JnuwKJiuE-n1x-Un0mj9WlEyZw': 'Trending India',
    'RDCLAK5uy_n9Fbdw7e6ap-98_A-8JYBmPv64v-Uaq1g': 'Bollywood Hits',
    'RDCLAK5uy_mmWwHb0NRnHQFFWtx4jZRULqD2VdR5pqI': 'South Cinema',
};

// Daily cache storage
const playlistCache = new Map<string, { tracks: any[], info: any, cachedDate: string }>();

// Get today's date as cache key (YYYY-MM-DD)
function getTodayKey(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // "2026-01-01"
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // Await params (Next.js 15 requirement)
        const { id: playlistId } = await params;

        // Parse query params for metadata from client (e.g. from Trending Albums click)
        const searchParams = request.nextUrl.searchParams;
        const queryTitle = searchParams.get('title');
        const queryArtist = searchParams.get('artist');

        // Use hardcoded title if available, otherwise query param
        const playlistTitle = PLAYLIST_TITLES[playlistId] || queryTitle || undefined;
        // Artist is optional, mainly for albums
        const artistName = queryArtist || undefined;

        const today = getTodayKey();
        const cacheKey = `${playlistId}:${today}`;

        // Check if we have cached data for TODAY
        const cached = playlistCache.get(cacheKey);
        if (cached && cached.cachedDate === today) {
            console.log(`[Playlist] 📦 Using cached "${playlistTitle}" from ${today}`);
            return NextResponse.json({ tracks: cached.tracks, info: cached.info });
        }

        console.log(`[Playlist] 🔄 Fetching "${playlistId}" (${playlistTitle || 'Album/Unknown'}) for ${today}`);

        // Fetch YouTube Music playlist with fallback
        const { tracks, info } = await getYTMusicPlaylist(playlistId, playlistTitle, artistName);

        // Cache for the entire day
        playlistCache.set(cacheKey, { tracks, info, cachedDate: today });

        // Clean up old cache entries (keep only today's)
        for (const [key, value] of playlistCache.entries()) {
            if (value.cachedDate !== today) {
                playlistCache.delete(key);
            }
        }

        console.log(`[Playlist] ✅ Loaded & cached ${tracks.length} tracks from "${info?.title || playlistTitle}"`);

        return NextResponse.json({ tracks, info });

    } catch (error) {
        console.error('[Playlist] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch playlist songs' },
            { status: 500 }
        );
    }
}
