import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeMusicNoQuota, getTrendingMusicNoQuota } from '@/lib/youtube/ytmusic-no-quota';
import type { Track } from '@/types';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { currentTrack, type } = body;

        let tracks: Track[] = [];

        try {
            // If no valid currentTrack, generate generic recommendations
            if (!currentTrack || !currentTrack.title || !currentTrack.artist) {
                console.log('[Recommendations] No valid currentTrack, generating generic recommendations');
                // Get trending music (QUOTA-FREE!)
                tracks = await getTrendingMusicNoQuota(10);
            } else {
                // Generate based on currentTrack (QUOTA-FREE!)
                if (type === 'smart-queue') {
                    // Simpler query for reliability
                    const query = `${currentTrack.artist} songs`;
                    tracks = await searchYouTubeMusicNoQuota(query, 10);
                } else if (type === 'related') {
                    const query = `${currentTrack.title} ${currentTrack.artist}`;
                    const results = await searchYouTubeMusicNoQuota(query, 15);
                    tracks = results.filter(t => t.id !== currentTrack.id).slice(0, 10);
                } else {
                    // "popular songs" often triggers 400s
                    const query = `${currentTrack.artist} best songs`;
                    tracks = await searchYouTubeMusicNoQuota(query, 10);
                }
            }
        } catch (searchError) {
            console.error('YTMusic search error:', searchError);
            // Return empty array instead of failing completely
            tracks = [];
        }

        return NextResponse.json({
            tracks,
            recommendations: tracks.map(track => ({
                query: `${track.title} - ${track.artist}`,
                reason: type === 'related' ? 'Similar to current track' : 'Based on your music',
                track,
            })),
        });
    } catch (error) {
        console.error('Recommendations API error:', error);
        return NextResponse.json(
            { error: 'Failed to generate recommendations', tracks: [], recommendations: [] },
            { status: 500 }
        );
    }
}
