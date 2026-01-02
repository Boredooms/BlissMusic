/**
 * Smart Recommendations API (Server-Side)
 * Uses Gemini 2.5 Flash + Smart Filtering + QUOTA-FREE ytmusic-api
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeMusicNoQuota } from '@/lib/youtube/ytmusic-no-quota';
import { fetchGeminiRecommendations, calculateDiversityLevel, getTimeBasedMood } from '@/lib/recommendations/gemini-engine';
import { filterSmartRecommendations } from '@/lib/recommendations/smart-filter';
import type { Track } from '@/types';
import { smartGenerateContent } from '@/lib/gemini';
import { geminiQueryCache } from '@/lib/recommendations/gemini-cache';

export async function POST(request: NextRequest) {
    // Parse body OUTSIDE try-catch so variables are accessible in catch block
    const body = await request.json();
    const {
        timeOfDay = 'evening',
        dayType = 'weekday',
        recentArtists = [],
        topGenres = [],
        likedTracksSample = [],
        currentTrack = null
    } = body;


    try {
        console.log('[SmartAPI] 🎯 Generating algorithmic recommendations (NO AI)...');

        // Generate queries using pure algorithms
        const queries = generateSmartAlgorithmicQueries(currentTrack, recentArtists, topGenres);

        console.log('[SmartAPI] 🔍 Search queries:', queries);

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

        // Execute all searches in parallel for speed
        const searchPromises = queries.map(query =>
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

        console.log(`[SmartAPI] ✅ Generated ${final.length} algorithmic recommendations`);

        return NextResponse.json({
            tracks: final,
            playlistName: `Smart Mix • ${currentTrack?.artist || 'For You'}`,
            reason: 'AI-free algorithmic curation'
        });

    } catch (error) {
        console.error('[SmartAPI] Algorithmic recommendation failed:', error);
        return NextResponse.json({ tracks: [] }, { status: 500 });
    }
}

/**
 * SMART ALGORITHMIC QUERY GENERATOR (Main Logic - NO AI)
 * Generates context-aware queries for the main Smart Mix
 */
function generateSmartAlgorithmicQueries(
    currentTrack: Track | null,
    recentArtists: string[],
    topGenres: string[]
): string[] {
    const queries: string[] = [];

    // Helper: Check if obscure multi-artist
    const isObscure = (artist: string) =>
        artist.includes(',') || artist.includes('&') || artist.includes(' feat') || artist.length > 40;

    // ===== STRATEGY 1: DETECT REGION/LANGUAGE =====
    const detectRegion = (artist: string, title: string): string => {
        const combined = `${artist} ${title}`.toLowerCase();

        // South Asian (Hindi/Urdu/Punjabi/Pakistani)
        if (/arijit|shreya|sonu|ar rahman|pritam|badshah|yo yo|king|ali zafar|atif aslam|rahat|nusrat|coke studio|honey singh|diljit|guru randhawa|neha kakkar/i.test(artist)) {
            return 'south-asian';
        }
        // Tamil/Telugu
        if (/tamil|telugu|malayalam|sid sriram|anirudh|yuvan|devi sri/i.test(combined)) {
            return 'south-indian';
        }
        // Korean
        if (/bts|blackpink|twice|txt|enhypen|ive|newjeans|stray kids|seventeen/i.test(artist)) {
            return 'kpop';
        }
        // Spanish/Latin
        if (/bad bunny|maluma|ozuna|karol g|j balvin|shakira|daddy yankee/i.test(artist)) {
            return 'latin';
        }
        // Western/English
        return 'western';
    };

    const region = currentTrack ? detectRegion(currentTrack.artist, currentTrack.title) : 'western';

    // ===== STRATEGY 2: CURRENT ARTIST + SIMILAR (if not obscure) =====
    if (currentTrack?.artist && !isObscure(currentTrack.artist)) {
        queries.push(`${currentTrack.artist} best songs`);

        // Add similar regional artists
        const similarArtists = getSimilarArtists(currentTrack.artist, region);
        similarArtists.forEach(artist => queries.push(`${artist} songs`));
    }

    // ===== STRATEGY 3: MOOD/GENRE FROM TITLE =====
    const moods = extractMoodKeywords(currentTrack?.title || '');
    if (moods.length > 0) {
        // Combine mood with region for better targeting
        if (region === 'south-asian') {
            queries.push(`${moods[0]} Hindi songs`);
        } else if (region === 'south-indian') {
            queries.push(`${moods[0]} Tamil songs`);
        } else {
            queries.push(`${moods[0]} music`);
        }
    }

    // ===== STRATEGY 4: REGIONAL TRENDING (NO GENERIC QUERIES) =====
    if (region === 'south-asian') {
        queries.push('Latest Bollywood songs');
        queries.push('Coke Studio hits');
    } else if (region === 'south-indian') {
        queries.push('Latest Tamil hits');
    } else if (region === 'kpop') {
        queries.push('K-pop trending');
    } else if (region === 'latin') {
        queries.push('Latin music hits');
    } else {
        // Western - use TOP genres instead of generic
        if (topGenres.length > 0 && topGenres[0] !== 'Mixed') {
            queries.push(`${topGenres[0]} trending`);
        } else {
            queries.push('Viral music hits');
        }
    }

    // ===== STRATEGY 5: HISTORY-BASED (top 2 non-obscure artists) =====
    recentArtists.slice(0, 2).forEach(artist => {
        if (artist !== currentTrack?.artist && !isObscure(artist)) {
            queries.push(`${artist} songs`);
        }
    });

    return [...new Set(queries)].slice(0, 8); // Max 8 unique queries
}

/**
 * Get similar artists based on region
 */
function getSimilarArtists(artist: string, region: string): string[] {
    const artistLower = artist.toLowerCase();

    // South Asian similar artists
    if (region === 'south-asian') {
        if (artistLower.includes('arijit')) return ['Atif Aslam', 'Jubin Nautiyal'];
        if (artistLower.includes('ali zafar') || artistLower.includes('atif')) return ['Arijit Singh', 'Rahat Fateh Ali Khan'];
        if (artistLower.includes('badshah') || artistLower.includes('honey')) return ['Yo Yo Honey Singh', 'King'];
        return ['Arijit Singh']; // Default Bollywood
    }

    // Tamil similar artists
    if (region === 'south-indian') {
        return ['Sid Sriram', 'Anirudh'];
    }

    // K-pop similar
    if (region === 'kpop') {
        if (artistLower.includes('bts')) return ['TXT', 'Seventeen'];
        if (artistLower.includes('blackpink')) return ['Twice', 'NewJeans'];
        return [];
    }

    return [];
}

/**
 * SMART FALLBACK QUERY GENERATOR (NO AI)
 * Generates context-aware queries based on current track + history
 */
function generateSmartFallbackQueries(currentTrack: Track | null, history: any[]): string[] {
    const queries: string[] = [];

    // Helper: Check if artist name is too obscure/complex (multiple artists, commas, &)
    const isObscureArtist = (artist: string): boolean => {
        return artist.includes(',') || artist.includes('&') || artist.includes(' feat') || artist.length > 40;
    };

    // STRATEGY 1: Artist-based (only if NOT obscure)
    if (currentTrack?.artist && !isObscureArtist(currentTrack.artist)) {
        queries.push(`${currentTrack.artist} songs`);
    }

    // STRATEGY 2: Mood detection from title (PRIORITIZE THIS)
    const moodKeywords = extractMoodKeywords(currentTrack?.title || '');
    if (moodKeywords.length > 0) {
        queries.push(`${moodKeywords[0]} music`);
        queries.push(`best ${moodKeywords[0]} songs`);
    }

    // STRATEGY 3: Language/Region detection
    const isLikelyIndian = currentTrack?.artist && (
        /arijit|shreya|sonu|ar rahman|vishal|pritam|badshah|honey|yo yo|king|tamil|telugu/i.test(currentTrack.artist)
    );

    if (isLikelyIndian) {
        queries.push('Bollywood hits');
        queries.push('Latest Hindi songs');
    } else {
        // Use mood-based instead of generic "Top English" if we have mood
        if (moodKeywords.length === 0) {
            queries.push('Popular English songs');
        }
    }

    // STRATEGY 4: Industry-specific (movie soundtracks)
    if (currentTrack?.title && /from|ost|soundtrack|movie|film/i.test(currentTrack.title)) {
        queries.push('Movie soundtrack songs');
    }

    // STRATEGY 5: History-based (only if NOT obscure)
    if (history.length > 0) {
        const topArtists = getTopArtistsFromHistory(history);
        const validArtist = topArtists.find(a => a !== currentTrack?.artist && !isObscureArtist(a));
        if (validArtist) {
            queries.push(`${validArtist} songs`);
        }
    }

    // Return max 5 unique queries
    return [...new Set(queries)].slice(0, 5);
}

/**
 * Extract mood keywords from song title (same logic as Related tab)
 */
function extractMoodKeywords(title: string): string[] {
    const lower = title.toLowerCase();
    const keywords: string[] = [];

    const moodMap: Record<string, string[]> = {
        'romantic': ['love', 'romantic', 'ishq', 'pyaar', 'dil'],
        'sad': ['sad', 'dard', 'broken', 'alone', 'tears'],
        'party': ['party', 'dance', 'dj', 'remix', 'club'],
        'chill': ['chill', 'lofi', 'relax', 'calm']
    };

    for (const [mood, patterns] of Object.entries(moodMap)) {
        if (patterns.some(p => lower.includes(p))) {
            keywords.push(mood);
        }
    }

    return keywords;
}

/**
 * Get top artists from listening history
 */
function getTopArtistsFromHistory(history: any[]): string[] {
    const artistCounts = new Map<string, number>();

    history.slice(0, 10).forEach((entry: any) => {
        const artist = entry.track?.artist;
        if (artist) {
            artistCounts.set(artist, (artistCounts.get(artist) || 0) + 1);
        }
    });

    return Array.from(artistCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([artist]) => artist);
}
