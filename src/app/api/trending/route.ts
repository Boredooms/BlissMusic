import { NextResponse } from 'next/server';
import { getTrendingSongsNoQuota } from '@/lib/youtube/ytmusic-no-quota';

// Simple in-memory cache: { "REGION:YYYY-MM-DD": Track[] }
const trendingCache = new Map<string, any[]>();

// Map common timezone prefixes to country codes (Same as Albums API)
function getRegionFromTimezone(): string {
    try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const regionMap: Record<string, string> = {
            'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Delhi': 'IN', 'Asia/Mumbai': 'IN',
            'America/New_York': 'US', 'America/Los_Angeles': 'US', 'America/Chicago': 'US',
            'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE',
            'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'America/Sao_Paulo': 'BR'
        };

        if (regionMap[timezone]) return regionMap[timezone];

        const prefix = timezone.split('/')[0];
        const prefixMap: Record<string, string> = { 'America': 'US', 'Europe': 'GB', 'Asia': 'IN' };

        return prefixMap[prefix] || 'DEFAULT';
    } catch {
        return 'DEFAULT';
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Priority: Query Param -> Timezone Detection -> Default 'IN'
        // This ensures "all region specific" logic works automatically
        let region = searchParams.get('region') || getRegionFromTimezone();

        if (!region || region === 'DEFAULT') region = 'IN';

        // 2. Cache Key (Region + Date)
        const today = new Date().toISOString().split('T')[0];
        const cacheKey = `${region}:${today}`;

        if (trendingCache.has(cacheKey)) {
            console.log(`[API] Serving cached trending SONGS for ${cacheKey}`);
            return NextResponse.json({ tracks: trendingCache.get(cacheKey) });
        }

        // 3. Fetch Fresh Data (No Quota)
        console.log(`[API] Fetching fresh trending SONGS for ${region}...`);
        const tracks = await getTrendingSongsNoQuota(region);

        // 4. Update Cache
        // Clear old keys to save memory (simple cleanup)
        for (const k of trendingCache.keys()) {
            if (!k.includes(today)) {
                trendingCache.delete(k);
            }
        }
        trendingCache.set(cacheKey, tracks);

        return NextResponse.json({ tracks });

    } catch (error) {
        console.error('Trending API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch trending songs' },
            { status: 500 }
        );
    }
}
