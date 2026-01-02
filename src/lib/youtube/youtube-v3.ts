import { Track } from "@/types";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Fetch Top Trending Music Videos for a Region
 * COST: 1 Unit per call (Checking 'mostPopular' chart)
 */
export async function getTrendingVideosV3(
    regionCode: string = 'IN',
    maxResults: number = 10
): Promise<Track[]> {
    if (!YOUTUBE_API_KEY) {
        console.warn('[YouTubeV3] No API Key found, skipping v3 fetch');
        return [];
    }

    try {
        const url = new URL(`${BASE_URL}/videos`);
        url.searchParams.append('part', 'snippet,contentDetails,statistics');
        url.searchParams.append('chart', 'mostPopular');
        url.searchParams.append('regionCode', regionCode);
        url.searchParams.append('videoCategoryId', '10'); // Music Category
        url.searchParams.append('maxResults', maxResults.toString());
        url.searchParams.append('key', YOUTUBE_API_KEY);

        console.log(`[YouTubeV3] Fetching popular Music for ${regionCode}...`);

        const res = await fetch(url.toString());
        if (!res.ok) {
            const errorElem = await res.json();
            console.error('[YouTubeV3] Fetch failed:', errorElem);
            return [];
        }

        const data = await res.json();
        if (!data.items) return [];

        return data.items.map((item: any) => ({
            id: item.id,
            videoId: item.id,
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
            duration: parseIsoDuration(item.contentDetails.duration),
            album: 'Trending on YouTube',
            category: 'trending-v3'
        }));

    } catch (error) {
        console.error('[YouTubeV3] Critical Error:', error);
        return [];
    }
}

// Helper: ISO 8601 Duration (PT3M20S) -> Seconds
function parseIsoDuration(duration: string): number {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return 0;

    const hours = (parseInt(match[1]) || 0);
    const minutes = (parseInt(match[2]) || 0);
    const seconds = (parseInt(match[3]) || 0);

    return (hours * 3600) + (minutes * 60) + seconds;
}
