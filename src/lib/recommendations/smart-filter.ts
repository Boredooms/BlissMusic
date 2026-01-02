/**
 * Advanced Smart Filtering System
 * Removes duplicates, similar songs, and non-music content
 */

import type { Track } from '@/types';

/**
 * Calculate string similarity (Levenshtein distance normalized)
 */
function stringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();

    if (s1 === s2) return 1;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    // Check if one contains the other (only for longer titles to avoid "Love" matching "I Love You")
    if (longer.length > 10 && longer.includes(shorter)) return 0.8;

    return 1 - levenshteinDistance(s1, s2) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[str2.length][str1.length];
}

/**
 * Normalize track title (remove common variations)
 */
function normalizeTitle(title: string): string {
    return title
        .toLowerCase()
        .replace(/\(.*?\)/g, '') // Remove parentheses content
        .replace(/\[.*?\]/g, '') // Remove brackets content
        .replace(/official|video|audio|lyric|full|song|hd|4k/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Check if track is likely non-music content
 * Only removes clear non-music like trailers, interviews, podcasts
 */
function isNonMusicContent(track: Track): boolean {
    const title = track.title.toLowerCase();
    const artist = track.artist.toLowerCase();

    // Only strict non-music keywords
    const nonMusicKeywords = [
        'interview', 'behind the scenes',
        'reaction video', 'review', 'tutorial', 'how to',
        'vlog', 'podcast', 'news broadcast',
        'making of', 'bts', 'unboxing',
        'documentary', 'press conference'
    ];

    return nonMusicKeywords.some(keyword =>
        title.includes(keyword) || artist.includes(keyword)
    );
}

/**
 * Check if tracks are similar (variations of same song)
 */
export function areSimilarTracks(track1: Track, track2: Track): boolean {
    // Check exact ID match
    if (track1.id === track2.id) return true;

    // Normalize titles
    const title1 = normalizeTitle(track1.title);
    const title2 = normalizeTitle(track2.title);

    // High title similarity
    if (stringSimilarity(title1, title2) > 0.85) {
        // Same artist or similar
        const artistSimilarity = stringSimilarity(track1.artist, track2.artist);
        if (artistSimilarity > 0.7) {
            return true;
        }
    }

    return false;
}

/**
 * Filter tracks for diversity and quality
 */
export function filterSmartRecommendations(
    newTracks: Track[],
    existingQueue: Track[]
): Track[] {
    const filtered: Track[] = [];
    const seenArtists: Map<string, number> = new Map();

    // Track existing queue artists
    existingQueue.forEach(track => {
        const artist = track.artist.toLowerCase();
        seenArtists.set(artist, (seenArtists.get(artist) || 0) + 1);
    });

    for (const track of newTracks) {
        // Filter non-music content
        if (isNonMusicContent(track)) {
            console.log(`[SmartFilter] Removed non-music: ${track.title}`);
            continue;
        }

        // Check for similar tracks in existing queue
        const isSimilarToExisting = existingQueue.some(existing =>
            areSimilarTracks(track, existing)
        );
        if (isSimilarToExisting) {
            console.log(`[SmartFilter] Removed similar to queue: ${track.title}`);
            continue;
        }

        // Check for similar tracks in filtered list
        const isSimilarToFiltered = filtered.some(existing =>
            areSimilarTracks(track, existing)
        );
        if (isSimilarToFiltered) {
            console.log(`[SmartFilter] Removed duplicate variation: ${track.title}`);
            continue;
        }

        // Limit same artist (max 2 songs per artist per batch)
        const artistLower = track.artist.toLowerCase();
        const artistCount = seenArtists.get(artistLower) || 0;
        if (artistCount >= 5) {
            console.log(`[SmartFilter] Too many from ${track.artist}`);
            continue;
        }

        // Add track
        filtered.push(track);
        seenArtists.set(artistLower, artistCount + 1);
    }

    console.log(`[SmartFilter] Filtered ${newTracks.length} -> ${filtered.length} tracks`);
    return filtered;
}

/**
 * Extract genre/mood from track using title/artist analysis
 */
export function extractGenreMood(track: Track): {
    genre: string[];
    mood: string[];
} {
    const title = track.title.toLowerCase();
    const artist = track.artist.toLowerCase();
    const combined = `${title} ${artist}`;

    const genres: string[] = [];
    const moods: string[] = [];

    // Genre detection
    if (combined.match(/rock|metal|punk/)) genres.push('rock');
    if (combined.match(/pop|chart|hit/)) genres.push('pop');
    if (combined.match(/hip.?hop|rap|trap/)) genres.push('hiphop');
    if (combined.match(/edm|electronic|dance|house|techno/)) genres.push('electronic');
    if (combined.match(/jazz|blues/)) genres.push('jazz');
    if (combined.match(/classical|orchestra|symphony/)) genres.push('classical');
    if (combined.match(/country|folk/)) genres.push('country');
    if (combined.match(/reggae|ska/)) genres.push('reggae');
    if (combined.match(/indie|alternative/)) genres.push('indie');
    if (combined.match(/bollywood|hindi|tamil|telugu/)) genres.push('bollywood');

    // Mood detection
    if (combined.match(/sad|emotional|cry|tear/)) moods.push('sad');
    if (combined.match(/happy|joy|celebration|party/)) moods.push('happy');
    if (combined.match(/romantic|love|heart/)) moods.push('romantic');
    if (combined.match(/energetic|power|workout|gym/)) moods.push('energetic');
    if (combined.match(/chill|relax|calm|peaceful/)) moods.push('chill');
    if (combined.match(/motivat|inspir|uplift/)) moods.push('motivational');

    return { genre: genres, mood: moods };
}
