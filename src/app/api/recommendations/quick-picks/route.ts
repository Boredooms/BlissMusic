import { NextRequest, NextResponse } from 'next/server';
import { searchYouTubeMusicNoQuota } from '@/lib/youtube/ytmusic-no-quota';
import { getTrendingVideosV3 } from '@/lib/youtube/youtube-v3';
import { createClient } from '@/lib/supabase/server';
import type { Track } from '@/types';
import { smartGenerateContent } from '@/lib/gemini';

// Hybrid Gemini + YouTube v3 Engine
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const timezone = searchParams.get('timezone') || 'Asia/Kolkata';

        // 1. Detect Context
        const regionCode = getRegionFromTimezone(timezone);
        const regionName = getRegionName(regionCode);
        const { timeOfDay, mood } = getTimeBasedMood();
        console.log(`[QuickPicks] 🌍 Context: ${regionName} | ${timeOfDay} (${mood})`);

        // 2. Fetch Data Sources (Parallel)
        // - User History (Supabase)
        // - Regional Trending (YouTube v3 API - High Quality, Low Cost)
        const [historyTracks, trendingTracksV3] = await Promise.all([
            fetchUserHistory(userId),
            getTrendingVideosV3(regionCode, 8)
        ]);

        const historyArtists = historyTracks.map(t => t.artist).slice(0, 3).join(', ');

        // 3. Generate Specific Vibe Queries via Gemini (Smart Fallback)
        let aiQueries: string[] = [];
        try {
            const prompt = `
                You are a local music expert in ${regionName}.
                Suggest 8 specific song titles that fit this vibe:
                - Time: ${timeOfDay} (${mood})
                - User likes: ${historyArtists || 'Popular Hits'}
                - Focus: Hidden gems and mood-perfect tracks (NOT top 10 hits).
                
                For India/IN, strictly include Bollywood/Punjabi.
                
                Return JSON ONLY:
                {
                    "songs": ["Artist - Song Title", "Artist - Song Title", ...]
                }
            `;

            // Uses Auto-Fallback (v3 -> v2 -> Flash)
            const text = await smartGenerateContent(prompt);
            const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const data = JSON.parse(clean);
            aiQueries = data.songs || [];

        } catch (e) {
            console.error('[QuickPicks] Gemini failed', e);
            aiQueries = getFallbackQueries(regionCode, mood);
        }

        // 4. Fetch Gemini Tracks
        const aiTracks: any[] = [];
        const seenIds = new Set<string>();

        // Add Trending V3 tracks to seen set
        trendingTracksV3.forEach(t => seenIds.add(t.id));

        // Fetch AI suggestions
        const batches = chunkArray(aiQueries, 4);
        for (const batch of batches) {
            const results = await Promise.all(
                batch.map(q => searchYouTubeMusicNoQuota(q, 1))
            );
            results.flat().forEach(t => {
                if (t && !seenIds.has(t.id)) {
                    seenIds.add(t.id);
                    aiTracks.push({ ...t, reason: `${mood} Vibes ✨`, category: 'ai-vibe' });
                }
            });
        }

        // 5. Smart Interleave (Trending v3 + AI Vibe + History)
        const finalMix: any[] = [];
        const maxLen = 20;

        const add = (t: any, label: string) => {
            if (finalMix.length >= maxLen) return;
            finalMix.push({ ...t, reason: label });
        };

        // History First
        historyTracks.forEach(t => add(t, 'Your Rotation ↺'));

        // Then Mix Trending (v3) and AI (Gemini)
        const limit = Math.max(trendingTracksV3.length, aiTracks.length);
        for (let i = 0; i < limit; i++) {
            if (i < trendingTracksV3.length) add(trendingTracksV3[i], `Trending in ${regionName} 🔥`);
            if (i < aiTracks.length) add(aiTracks[i], `${mood} Pick ✨`);
        }

        return NextResponse.json({
            recommendations: finalMix,
            metadata: { region: regionName, timeOfDay, mood }
        });

    } catch (error) {
        console.error('[QuickPicks] Critical Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// --- Helpers ---

// Fallback if Gemini dies
function getFallbackQueries(region: string, mood: string): string[] {
    const base = region === 'IN' ?
        ['Arijit Singh Latest', 'King Maan Meri Jaan', 'AP Dhillon', 'Diljit Dosanjh', 'Anirudh Ravichander'] :
        ['The Weeknd', 'Taylor Swift', 'Drake', 'SZA', 'Bad Bunny'];

    return base.map(a => `${a} ${mood} song`);
}

function chunkArray(arr: any[], size: number) {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );
}

async function fetchUserHistory(userId: string | null): Promise<Track[]> {
    if (!userId) return [];
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('listening_history')
            .select('track_json')
            .eq('user_id', userId)
            .order('played_at', { ascending: false })
            .limit(10); // Check last 10

        if (!data) return [];

        const unique = new Map();
        data.forEach((row: any) => {
            const t = row.track_json;
            if (t && t.id) unique.set(t.id, t);
        });

        return Array.from(unique.values()).slice(0, 5); // Return top 5 recent
    } catch (e) {
        return [];
    }
}

// --- Utils ---

function getRegionFromTimezone(timezone: string): string {
    if (timezone.includes('Calcutta') || timezone.includes('Kolkata') || timezone.includes('Asia')) return 'IN';
    if (timezone.includes('London') || timezone.includes('Europe')) return 'GB';
    if (timezone.includes('York') || timezone.includes('Angeles') || timezone.includes('America')) return 'US';
    return 'IN'; // Default to India as requested
}

function getRegionName(code: string): string {
    const names: any = { 'IN': 'India 🇮🇳', 'US': 'USA 🇺🇸', 'GB': 'UK 🇬🇧' };
    return names[code] || 'Global 🌍';
}

function getTimeBasedMood() {
    const hour = new Date().getHours();
    console.log(`[QuickPicks] 🕐 Current hour: ${hour}`);

    if (hour >= 5 && hour < 12) return { timeOfDay: 'morning', mood: 'Energetic' };
    if (hour >= 12 && hour < 17) return { timeOfDay: 'afternoon', mood: 'Relaxed' };
    if (hour >= 17 && hour < 22) return { timeOfDay: 'evening', mood: 'Party' };
    return { timeOfDay: 'late_night', mood: 'Chill' }; // FIXED: Changed 'night' to 'late_night'
}
