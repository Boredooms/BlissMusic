import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeMusicNoQuota } from '@/lib/youtube/ytmusic-no-quota';
import type { Track } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            timeOfDay = 'afternoon',
            dayType = 'weekday',
            recentArtists = [],
            topGenres = [],
        } = body;

        console.log('[MadeForYou] 🎨 Curating playlists...', { timeOfDay, dayType });

        // Generate smart playlist queries
        const playlistQueries = generatePlaylistQueries(
            timeOfDay,
            dayType,
            recentArtists,
            topGenres
        );

        console.log('[MadeForYou] 🔍 Playlist queries:', playlistQueries);

        const allTracks: Track[] = [];
        const seenIds = new Set<string>();
        const seenTitles = new Set<string>();

        // Deduplication helpers
        const isDuplicate = (track: Track): boolean => {
            const titleKey = `${track.title.toLowerCase()}-${track.artist.toLowerCase()}`;
            return seenIds.has(track.videoId) || seenIds.has(track.id) || seenTitles.has(titleKey);
        };

        const addTrack = (track: Track) => {
            const titleKey = `${track.title.toLowerCase()}-${track.artist.toLowerCase()}`;
            seenIds.add(track.videoId);
            seenIds.add(track.id);
            seenTitles.add(titleKey);
            allTracks.push(track);
        };

        // Execute all searches in parallel
        const searchPromises = playlistQueries.map(query =>
            searchYouTubeMusicNoQuota(query, 4).catch(() => [])
        );

        const results = await Promise.all(searchPromises);

        // Combine and deduplicate
        results.forEach(trackList => {
            trackList.forEach(track => {
                if (!isDuplicate(track)) {
                    addTrack(track);
                }
            });
        });

        // Shuffle for variety, limit to 20
        const shuffled = allTracks.sort(() => Math.random() - 0.5);
        const final = shuffled.slice(0, 20);

        console.log(`[MadeForYou] ✅ Generated ${final.length} curated tracks`);

        const reason = generateReason(timeOfDay, dayType, recentArtists);

        return NextResponse.json({
            tracks: final,
            reason,
            playlistName: `Made for You • ${timeOfDay}`
        });

    } catch (error) {
        console.error('[MadeForYou] Error:', error);
        return NextResponse.json({ tracks: [] }, { status: 500 });
    }
}

/**
 * Generate playlist queries based on time, mood, and listening history
 */
function generatePlaylistQueries(
    timeOfDay: string,
    dayType: string,
    recentArtists: string[],
    topGenres: string[]
): string[] {
    const queries: string[] = [];

    // ===== STRATEGY 1: TIME-BASED ENERGY MATCHING =====
    const timeQueries = getTimeBasedQueries(timeOfDay, dayType);
    queries.push(...timeQueries);

    // ===== STRATEGY 2: "BEST OF" ARTIST PLAYLISTS =====
    // For top 2-3 recent artists, search for curated playlists
    const topArtists = recentArtists.slice(0, 3);
    topArtists.forEach(artist => {
        if (artist && !isObscureArtist(artist)) {
            queries.push(`Best of ${artist}`);
            queries.push(`${artist} greatest hits`);
        }
    });

    // ===== STRATEGY 3: REGIONAL/LANGUAGE PLAYLISTS =====
    const region = detectRegion(recentArtists);
    const regionalQueries = getRegionalPlaylists(region, timeOfDay);
    queries.push(...regionalQueries);

    // ===== STRATEGY 4: GENRE MIX PLAYLISTS =====
    if (topGenres.length > 0 && topGenres[0] !== 'Mixed') {
        queries.push(`${topGenres[0]} mix playlist`);
    }

    // Shuffle queries for variety on each request
    const uniqueQueries = [...new Set(queries)];
    const shuffled = uniqueQueries.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 8); // Max 8 unique queries, randomized
}

/**
 * Time-based energy matching
 */
function getTimeBasedQueries(timeOfDay: string, dayType: string): string[] {
    const queries: string[] = [];

    switch (timeOfDay) {
        case 'morning': // 5-11 AM - Energetic, upbeat
            queries.push('Morning motivation songs');
            queries.push('Feel good music playlist');
            if (dayType === 'weekday') {
                queries.push('Work from home playlist');
            } else {
                queries.push('Weekend vibes playlist');
            }
            break;

        case 'afternoon': // 11-5 PM - Balanced energy
            queries.push('Afternoon chill playlist');
            queries.push('Background music for work');
            queries.push('Relaxing playlist');
            break;

        case 'evening': // 5-10 PM - Winding down
            queries.push('Evening relax music');
            queries.push('Sunset vibes playlist');
            if (dayType === 'weekend') {
                queries.push('Party songs playlist');
            }
            break;

        case 'late_night': // 10 PM - 5 AM - Chill, romantic, lofi
            queries.push('Late night music playlist');
            queries.push('Midnight vibes');
            queries.push('Lofi chill beats playlist');
            break;
    }

    return queries;
}

/**
 * Detect region from recent artists
 */
function detectRegion(recentArtists: string[]): string {
    const combined = recentArtists.join(' ').toLowerCase();

    if (/arijit|shreya|sonu|pritam|badshah|ali zafar|atif|coke studio|honey|diljit/i.test(combined)) {
        return 'south-asian';
    }
    if (/tamil|telugu|sid sriram|anirudh/i.test(combined)) {
        return 'south-indian';
    }
    if (/bts|blackpink|twice|txt/i.test(combined)) {
        return 'kpop';
    }
    if (/bad bunny|maluma|ozuna/i.test(combined)) {
        return 'latin';
    }
    return 'western';
}

/**
 * Regional playlist queries
 */
function getRegionalPlaylists(region: string, timeOfDay: string): string[] {
    const queries: string[] = [];

    switch (region) {
        case 'south-asian':
            queries.push('Bollywood hits playlist');
            queries.push('Evergreen Hindi songs');
            if (timeOfDay === 'late_night') {
                queries.push('Romantic Hindi songs playlist');
                queries.push('Bollywood Sukoon mix');
            } else if (timeOfDay === 'morning') {
                queries.push('Bollywood workout songs');
            }
            break;

        case 'south-indian':
            queries.push('Tamil hits playlist');
            queries.push('Evergreen Tamil songs');
            break;

        case 'kpop':
            queries.push('K-pop hits playlist');
            queries.push('Latest K-pop songs');
            break;

        case 'latin':
            queries.push('Latin hits playlist');
            queries.push('Reggaeton mix');
            break;

        case 'western':
            queries.push('Pop hits playlist');
            queries.push('Viral songs playlist');
            if (timeOfDay === 'late_night') {
                queries.push('Chill pop playlist');
            }
            break;
    }

    return queries;
}

/**
 * Check if artist name is obscure (multiple artists, features)
 */
function isObscureArtist(artist: string): boolean {
    return artist.includes(',') || artist.includes('&') || artist.includes(' feat') || artist.length > 40;
}

/**
 * Generate user-facing reason
 */
function generateReason(timeOfDay: string, dayType: string, recentArtists: string[]): string {
    const time = timeOfDay.replace('_', ' ');
    const topArtist = recentArtists[0] || 'your favorites';

    const reasons = {
        morning: `Good morning! Here's an energizing ${time} mix featuring ${topArtist}`,
        afternoon: `Your ${time} soundtrack with ${topArtist} and similar vibes`,
        evening: `Unwinding with ${topArtist} this ${time}`,
        late_night: `Late night chill featuring ${topArtist} and mellow beats`
    };

    return reasons[timeOfDay as keyof typeof reasons] || `Curated ${time} mix for you`;
}
