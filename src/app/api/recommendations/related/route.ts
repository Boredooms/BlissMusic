/**
 * Related Recommendations API
 * Personalized recommendations based on listening history
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeMusicNoQuota, getRecommendations } from '@/lib/youtube/ytmusic-no-quota';
import { fetchGeminiRecommendations } from '@/lib/recommendations/gemini-engine';
import { filterSmartRecommendations } from '@/lib/recommendations/smart-filter';
import type { Track } from '@/types';

/**
 * GET: Fetch native "Up Next" / Related songs for a specific video ID.
 * Usage: /api/recommendations/related?videoId=...
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('videoId');
    const title = searchParams.get('title');
    const artist = searchParams.get('artist');

    if (!videoId || !title || !artist) {
        return NextResponse.json({ error: 'videoId, title, and artist are required' }, { status: 400 });
    }

    try {
        const tracks = await getRecommendations(videoId, { title, artist });
        return NextResponse.json(tracks);
    } catch (error) {
        console.error('Failed to fetch related tracks:', error);
        return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { currentTrack, listeningHistory = [], queue = [] } = body;

        if (!currentTrack) {
            return NextResponse.json(
                { error: 'Current track is required' },
                { status: 400 }
            );
        }

        console.log('[RelatedAPI] 🎯 Generating personalized recommendations...');
        console.log(`[RelatedAPI] Current: ${currentTrack.title} by ${currentTrack.artist}`);
        console.log(`[RelatedAPI] History: ${listeningHistory.length} tracks`);

        // Analyze listening history for patterns
        const favoriteArtists = new Map<string, number>();
        listeningHistory.forEach((entry: any) => {
            if (!entry.skipped && entry.completionRate > 0.5) {
                const artist = entry.track.artist;
                favoriteArtists.set(artist, (favoriteArtists.get(artist) || 0) + 1);
            }
        });

        // Calculate diversity based on history
        const skipRate = listeningHistory.length > 0
            ? listeningHistory.filter((e: any) => e.skipped).length / listeningHistory.length
            : 0.1;

        const diversityLevel = skipRate > 0.3 ? 'high' : 'medium';

        console.log(`[RelatedAPI] 📊 Skip rate: ${(skipRate * 100).toFixed(1)}%`);
        console.log(`[RelatedAPI] 📊 Diversity: ${diversityLevel}`);
        console.log(`[RelatedAPI] ⭐ Top artists: ${Array.from(favoriteArtists.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([artist]) => artist)
            .join(', ')}`);

        // Get intelligent queries from Gemini with history
        const searchQueries = await fetchGeminiRecommendations({
            currentTrack,
            listeningHistory: listeningHistory.map((e: any) => e.track),
            diversityLevel,
        });

        console.log(`[RelatedAPI] 🔍 Generated ${searchQueries.length} personalized queries`);

        // Fetch tracks
        const allTracks: Track[] = [];
        const seenIds = new Set<string>([currentTrack.id]);

        for (const query of searchQueries) {
            try {
                const results = await searchYouTubeMusicNoQuota(query, 5);

                for (const track of results) {
                    if (!seenIds.has(track.id)) {
                        seenIds.add(track.id);
                        allTracks.push(track);
                    }
                }
            } catch (error) {
                console.error(`[RelatedAPI] Error searching "${query}":`, error);
            }
        }

        console.log(`[RelatedAPI] 📥 Fetched ${allTracks.length} tracks`);

        // Apply smart filtering
        const filtered = filterSmartRecommendations(allTracks, queue);

        console.log(`[RelatedAPI] ✅ After filtering: ${filtered.length} tracks`);

        // Shuffle and return
        const shuffled = filtered.sort(() => Math.random() - 0.5);
        const final = shuffled.slice(0, 15);

        return NextResponse.json({
            tracks: final,
            personalized: listeningHistory.length > 0,
            favoriteArtists: Array.from(favoriteArtists.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([artist, count]) => ({ artist, playCount: count })),
        });

    } catch (error) {
        console.error('[RelatedAPI] Error:', error);
        return NextResponse.json(
            { error: 'Failed to generate recommendations' },
            { status: 500 }
        );
    }
}
