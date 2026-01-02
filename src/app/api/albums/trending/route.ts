import { NextResponse } from 'next/server';
import { searchYouTubeMusicNoQuota } from '@/lib/youtube/ytmusic-no-quota';
import type { Album } from '@/types';
import { smartGenerateContent } from '@/lib/gemini';

// Daily cache storage (Global to persist across hot reloads)
const globalCache = global as any;
if (!globalCache.trendingAlbumsCache) {
    globalCache.trendingAlbumsCache = new Map<string, { albums: Album[], cachedDate: string }>();
}
const trendingCache = globalCache.trendingAlbumsCache;

// Get today's date as cache key (YYYY-MM-DD)
function getTodayKey(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // "2026-01-01"
}

// Map common timezone prefixes to country codes
function getRegionFromTimezone(): string {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (timezone.includes('Calcutta') || timezone.includes('Kolkata') || timezone.includes('Asia')) return 'IN';
        if (timezone.includes('London') || timezone.includes('Europe')) return 'GB';
        if (timezone.includes('York') || timezone.includes('Angeles') || timezone.includes('America')) return 'US';
        return 'IN';
    } catch { return 'IN'; }
}

function getRegionName(code: string): string {
    const names: any = { 'IN': 'India', 'US': 'USA', 'GB': 'UK', 'KR': 'South Korea', 'JP': 'Japan' };
    return names[code] || 'Global';
}

export async function GET() {
    try {
        // Detect user's region
        const region = getRegionFromTimezone();
        const regionName = getRegionName(region);
        const today = getTodayKey();
        const cacheKey = `${region}:${today}`;

        console.log(`[TrendingAlbums] Checking cache for region: ${region} (${today})...`);

        // Check Cache
        const cached = trendingCache.get(cacheKey);
        if (cached && cached.cachedDate === today) {
            console.log(`[TrendingAlbums] 📦 Using cached albums for ${region}`);
            return NextResponse.json({ albums: cached.albums, region });
        }

        console.log(`[TrendingAlbums] 🔄 Cache miss. Fetching fresh albums via Gemini...`);

        // 1. Ask Gemini for Specific Albums (Smart Fallback)
        let albumQueries: string[] = [];
        try {
            const prompt = `
                You are a local music expert in ${regionName}.
                List 10 trending/popular music albums (from 2024-2026).
                For India/IN, heavily focus on: Arijit Singh, Diljit Dosanjh, AP Dhillon, Anirudh, and recent Bollywood movies (Animal, Jawan, etc).
                
                Return JSON ONLY:
                {
                    "albums": ["Artist - Album Name", "Movie Name OST", ...]
                }
            `;

            // Auto-fallback handles 429 Error
            const text = await smartGenerateContent(prompt);
            const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const data = JSON.parse(clean);
            albumQueries = data.albums || [];

        } catch (e) {
            console.error('[TrendingAlbums] Gemini failed', e);
            // Fallback hardcoded for safety
            albumQueries = region === 'IN' ?
                ['Arijit Singh Ultimate Love Songs', 'Animal Movie Songs', 'Diljit Dosanjh Ghost', 'Moosetape', 'Rockstar Album'] :
                ['The Weeknd After Hours', 'Taylor Swift Midnights', 'SZA SOS', 'Drake Her Loss', 'Metro Boomin Heroes & Villains'];
        }

        // 2. Search YouTube Music for these SPECIFIC albums
        const albums: Album[] = [];
        const seenIds = new Set<string>();

        // Process in batches
        const batchSize = 4;
        for (let i = 0; i < albumQueries.length; i += batchSize) {
            const batch = albumQueries.slice(i, i + batchSize);
            const results = await Promise.all(
                batch.map(query => searchYouTubeMusicNoQuota(query, 1)) // Search songs, but we want albums?
                // Wait, searchYouTubeMusicNoQuota main helper returns TRACKS. We need ALBUMS.
                // We should add a specific helper or just use the generic search properly?
                // Actually, let's use the helper but we might need to modify it to support 'album' type better
                // OR we just assume "Artist - Album" search with type 'album' works if we call client directly.
                // But `searchYouTubeMusicNoQuota` handles 400s.
                // Let's modify `searchYouTubeMusicNoQuota` to accept type? 
                // NO, let's just use it as is but pass "Album" in query string, and map results?
                // Better: Use `ytmusic-no-quota`'s internal client? 
                // Let's implement a small helper HERE or update `ytmusic-no-quota`?
                // Updating `ytmusic-no-quota` is risky.
                // Let's just import { getYTMusicClient } and do it here safely.
            );

            // Wait, the generic search returns *Tracks*. We need Albums.
            // I need to implement a robust `searchAlbums` helper.
            // I'll define it locally for now using the client.
        }

        // 2. Search exact ALBUMS
        // Now using proper 'album' type search to get MPREb/OLAK IDs.
        const client = await (await import('@/lib/youtube/ytmusic-no-quota')).getYTMusicClient();

        for (const query of albumQueries) {
            try {
                if (albums.length >= 10) break;

                const results = await client.search(query, 'album');

                if (results && results.length > 0) {
                    const top = results[0];
                    const realId = top.browseId || top.playlistId; // Critical for fetching tracks

                    if (realId && !seenIds.has(realId)) {
                        seenIds.add(realId);
                        albums.push({
                            id: realId,
                            title: top.name || top.title,
                            artist: top.artist?.name || top.artists?.[0]?.name || 'Unknown',
                            thumbnail: (top.thumbnails?.[top.thumbnails?.length - 1]?.url || top.thumbnail || '').replace(/w\d+-h\d+/, 'w544-h544'),
                            year: top.year || 2024,
                            trackCount: top.songCount || 10
                        });
                    }
                }
            } catch (e) {
                // console.warn('Album search failed for', query);
            }
        }

        // Update Cache
        if (albums.length > 0) {
            trendingCache.set(cacheKey, { albums, cachedDate: today });
            console.log(`[TrendingAlbums] ✅ Cached ${albums.length} albums for ${region}`);
        }

        return NextResponse.json({ albums, region });

    } catch (error) {
        console.error('[TrendingAlbums] Error:', error);
        return NextResponse.json(
            { error: 'Failed', albums: [], region: 'DEFAULT' },
            { status: 500 }
        );
    }
}
