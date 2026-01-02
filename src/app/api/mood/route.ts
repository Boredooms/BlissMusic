/**
 * Mood-Based Music API - Fetches songs based on selected mood
 * Uses quota-free ytmusic-api with current year/month
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeMusicNoQuota } from '@/lib/youtube/ytmusic-no-quota';
import type { Track } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mood = searchParams.get('mood');
        const limit = parseInt(searchParams.get('limit') || '20');

        if (!mood) {
            return NextResponse.json(
                { error: 'Mood parameter required' },
                { status: 400 }
            );
        }

        console.log(`[MoodAPI] Fetching music for mood: ${mood}`);

        // Get current year and month for fresh results
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });

        // Mood-specific search queries
        const moodQueries: Record<string, string[]> = {
            'Energize': [
                `energetic songs ${currentYear}`,
                `upbeat music ${currentMonth} ${currentYear}`,
                `high energy workout ${currentYear}`
            ],
            'Relax': [
                `relaxing music ${currentYear}`,
                `calm songs ${currentYear}`,
                `chill vibes ${currentMonth} ${currentYear}`
            ],
            'Workout': [
                `workout music ${currentYear}`,
                `fitness motivation songs ${currentYear}`,
                `gym playlist ${currentYear}`
            ],
            'Focus': [
                `focus music ${currentYear}`,
                `concentration playlist ${currentYear}`,
                `study music ${currentYear}`
            ],
            'Party': [
                `party songs ${currentYear}`,
                `dance hits ${currentMonth} ${currentYear}`,
                `club music ${currentYear}`
            ],
            'Romance': [
                `romantic songs ${currentYear}`,
                `love songs ${currentYear}`,
                `romantic music ${currentMonth} ${currentYear}`
            ],
            'Sad': [
                `sad songs ${currentYear}`,
                `emotional music ${currentYear}`,
                `heartbreak songs ${currentYear}`
            ],
            'Sleep': [
                `sleep music ${currentYear}`,
                `peaceful sleep sounds ${currentYear}`,
                `bedtime relaxation ${currentYear}`
            ],
            'Commute': [
                `commute playlist ${currentYear}`,
                `driving music ${currentYear}`,
                `travel songs ${currentYear}`
            ],
            'Feel Good': [
                `feel good songs ${currentYear}`,
                `happy music ${currentYear}`,
                `uplifting songs ${currentMonth} ${currentYear}`
            ],
        };

        const queries = moodQueries[mood] || [`${mood.toLowerCase()} songs ${currentYear}`];

        // Fetch from all queries
        const allTracks: Track[] = [];
        const seenIds = new Set<string>();

        for (const query of queries) {
            const tracks = await searchYouTubeMusicNoQuota(query, 10);

            tracks.forEach(track => {
                if (!seenIds.has(track.id)) {
                    seenIds.add(track.id);
                    allTracks.push(track);
                }
            });
        }

        // Shuffle and limit
        const shuffled = allTracks.sort(() => Math.random() - 0.5);
        const final = shuffled.slice(0, limit);

        console.log(`[MoodAPI] ✅ Returned ${final.length} tracks for ${mood}`);

        return NextResponse.json({
            mood,
            tracks: final,
            currentYear,
            currentMonth,
        });

    } catch (error) {
        console.error('[MoodAPI] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch mood music' },
            { status: 500 }
        );
    }
}
