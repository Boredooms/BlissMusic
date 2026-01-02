/**
 * Algorithmic Query Generator - OPTIMIZED for SPEED
 * Uses ONLY proven, fast queries (artists only, NO generic terms)
 */

import type { Track } from '@/types';

/**
 * Generate FAST search queries - artist-based only (instant results!)
 */
export function generateAlgorithmicQueries(
    currentTrack: Track,
    favoriteArtists: string[] = [],
    diversity: 'low' | 'medium' | 'high' = 'medium'
): string[] {
    const queries: string[] = [];

    // 1. Primary: Current Artist (Safest bet)
    queries.push(`${currentTrack.artist} best songs`);
    queries.push(`${currentTrack.artist} similar artists`);

    // 2. Secondary: Favorite Artists (Personalized)
    if (favoriteArtists.length > 0) {
        // dynamic favorits
        const relevantFavorites = favoriteArtists
            .filter(artist => artist !== currentTrack.artist)
            .slice(0, 3);

        relevantFavorites.forEach(artist => {
            queries.push(`${artist} essentials`);
        });
    }

    // 3. Fallback / Discovery (Context-aware instead of hardcoded)
    if (queries.length < 4) {
        queries.push(`Songs like ${currentTrack.title}`);
        queries.push(`Music similar to ${currentTrack.artist}`);
    }

    console.log(`[AlgoQueries] ⚡ Generated ${queries.length} neutral fallback queries`);
    return queries.slice(0, 6);
}
