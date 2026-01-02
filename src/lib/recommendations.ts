/**
 * Algorithmic Music Recommendations
 * Uses YouTube Music's related tracks and metadata matching
 * instead of AI to avoid rate limits and provide instant results
 */

import { searchSongs, getArtist } from './ytmusic';
import type { Track } from '@/types';

interface RecommendationResult {
    track: Track;
    reason: string;
    score: number;
}

// Genre/mood mappings for algorithmic matching
const MOOD_SEARCH_TERMS: Record<string, string[]> = {
    chill: ['lofi beats', 'relaxing music', 'acoustic chill', 'ambient'],
    energetic: ['upbeat pop', 'workout music', 'electronic dance', 'hype songs'],
    happy: ['feel good hits', 'happy pop songs', 'summer vibes'],
    sad: ['emotional songs', 'sad piano', 'melancholic ballads'],
    focus: ['study music', 'concentration', 'instrumental focus'],
    party: ['party hits', 'dance music', 'club bangers'],
    romantic: ['love songs', 'romantic ballads', 'couple songs'],
    workout: ['gym motivation', 'running music', 'high energy workout'],
};

/**
 * Get recommendations based on current track using algorithmic approach
 * Much faster and doesn't hit API rate limits
 */
export async function getAlgorithmicRecommendations(
    currentTrack: Track | null,
    recentTracks: Track[] = [],
    mood?: string
): Promise<RecommendationResult[]> {
    const recommendations: RecommendationResult[] = [];
    const seenIds = new Set<string>();

    // Add current track and recent tracks to seen
    if (currentTrack) seenIds.add(currentTrack.id);
    recentTracks.forEach(t => seenIds.add(t.id));

    try {
        // Strategy 1: Search for "song + artist radio/mix"
        if (currentTrack) {
            const radioQuery = `${currentTrack.title} ${currentTrack.artist} radio mix`;
            const radioResults = await searchSongs(radioQuery);

            for (const track of radioResults.slice(0, 3)) {
                if (!seenIds.has(track.id)) {
                    seenIds.add(track.id);
                    recommendations.push({
                        track,
                        reason: `Similar to "${currentTrack.title}"`,
                        score: 0.9
                    });
                }
            }
        }

        // Strategy 2: Search for more songs by the same artist
        if (currentTrack) {
            const artistQuery = `${currentTrack.artist} top songs`;
            const artistResults = await searchSongs(artistQuery);

            for (const track of artistResults.slice(0, 3)) {
                if (!seenIds.has(track.id)) {
                    seenIds.add(track.id);
                    recommendations.push({
                        track,
                        reason: `More from ${currentTrack.artist}`,
                        score: 0.85
                    });
                }
            }
        }

        // Strategy 3: Search based on mood if provided
        if (mood && MOOD_SEARCH_TERMS[mood.toLowerCase()]) {
            const moodTerms = MOOD_SEARCH_TERMS[mood.toLowerCase()];
            const randomTerm = moodTerms[Math.floor(Math.random() * moodTerms.length)];
            const moodResults = await searchSongs(randomTerm);

            for (const track of moodResults.slice(0, 3)) {
                if (!seenIds.has(track.id)) {
                    seenIds.add(track.id);
                    recommendations.push({
                        track,
                        reason: `Matches your "${mood}" mood`,
                        score: 0.75
                    });
                }
            }
        }

        // Strategy 4: Use collaborative filtering from recent tracks
        if (recentTracks.length > 0) {
            // Group by artist and find the most listened
            const artistCounts = new Map<string, number>();
            recentTracks.forEach(t => {
                artistCounts.set(t.artist, (artistCounts.get(t.artist) || 0) + 1);
            });

            // Sort by count and get top artist
            const sortedArtists = [...artistCounts.entries()]
                .sort((a, b) => b[1] - a[1])
                .slice(0, 2);

            for (const [artist] of sortedArtists) {
                const results = await searchSongs(`${artist} best songs`);
                for (const track of results.slice(0, 2)) {
                    if (!seenIds.has(track.id)) {
                        seenIds.add(track.id);
                        recommendations.push({
                            track,
                            reason: `Based on your listening history`,
                            score: 0.7
                        });
                    }
                }
            }
        }

        // Strategy 5: If no mood, use current track's vibe
        if (!mood && currentTrack && recommendations.length < 8) {
            // Extract potential genre from title/artist
            const vibeQuery = `songs like ${currentTrack.title}`;
            const vibeResults = await searchSongs(vibeQuery);

            for (const track of vibeResults.slice(0, 4)) {
                if (!seenIds.has(track.id)) {
                    seenIds.add(track.id);
                    recommendations.push({
                        track,
                        reason: `You might also like`,
                        score: 0.65
                    });
                }
            }
        }

    } catch (error) {
        console.error('Algorithmic recommendation error:', error);
    }

    // Sort by score and return top 8
    return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
}

/**
 * Generate a smart queue based on current track
 * Loads 25 songs with mood/artist/genre diversity to keep users hooked
 */
export async function generateSmartQueueAlgo(
    currentTrack: Track,
    queueLength: number = 25
): Promise<RecommendationResult[]> {
    const queue: RecommendationResult[] = [];
    const seenIds = new Set<string>([currentTrack.id]);

    try {
        // Diverse search strategies for maximum engagement
        const queries = [
            // Similar to current track
            `${currentTrack.title} ${currentTrack.artist}`,
            `songs like ${currentTrack.title}`,

            // More from the artist
            `${currentTrack.artist} best songs`,
            `${currentTrack.artist} top hits`,

            // Related artists mix
            `${currentTrack.artist} similar artists`,
            `artists like ${currentTrack.artist}`,

            // Mood-based (extracted from title/artist context)
            `${currentTrack.title} radio mix`,
            `${currentTrack.artist} mix playlist`,

            // Genre variations
            `${currentTrack.artist} genre best songs`,
            `top hits similar to ${currentTrack.title}`,

            // Discovery queries
            `${currentTrack.artist} fans also like`,
            `songs with similar vibe to ${currentTrack.title}`,
        ];

        // Shuffle queries to get variety each time
        const shuffledQueries = queries.sort(() => Math.random() - 0.5);

        for (const query of shuffledQueries) {
            if (queue.length >= queueLength) break;

            try {
                const results = await searchSongs(query);

                for (const track of results) {
                    if (queue.length >= queueLength) break;

                    if (!seenIds.has(track.id)) {
                        seenIds.add(track.id);

                        // Determine reason based on query type
                        let reason = 'Added to your queue';
                        if (query.includes('similar') || query.includes('like')) {
                            reason = `Similar vibe to "${currentTrack.title}"`;
                        } else if (query.includes(currentTrack.artist)) {
                            reason = `More from ${currentTrack.artist}`;
                        } else if (query.includes('mix') || query.includes('radio')) {
                            reason = 'Based on your station';
                        } else if (query.includes('fans')) {
                            reason = 'Fans also love this';
                        }

                        queue.push({
                            track,
                            reason,
                            score: 1 - (queue.length * 0.02) // Gradual decrease
                        });
                    }
                }
            } catch (error) {
                // Continue with next query on error
                console.log(`Query failed: ${query}`);
            }
        }
    } catch (error) {
        console.error('Smart queue error:', error);
    }

    // Shuffle final queue for better variety while keeping top items first
    const topItems = queue.slice(0, 5);
    const restItems = queue.slice(5).sort(() => Math.random() - 0.5);

    return [...topItems, ...restItems];
}


/**
 * Get genre-based recommendations for home page
 */
export async function getGenreRecommendations(genre: string): Promise<Track[]> {
    try {
        const results = await searchSongs(`${genre} hits 2024`);
        return results.slice(0, 10);
    } catch (error) {
        console.error('Genre recommendation error:', error);
        return [];
    }
}
