// YouTube Music Search and Trending API utilities
import type { Track } from '@/types';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || '';
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface TrendingOptions {
    regionCode?: string;
    maxResults?: number;
}

/**
 * Fetch trending music videos from YouTube
 * Uses YouTube Data API v3
 */
export async function fetchTrendingMusic(options: TrendingOptions = {}): Promise<Track[]> {
    const { regionCode = 'US', maxResults = 20 } = options;

    try {
        // Fetch most popular videos in Music category (ID: 10)
        const url = new URL(`${YOUTUBE_API_BASE}/videos`);
        url.searchParams.append('part', 'snippet,contentDetails,statistics');
        url.searchParams.append('chart', 'mostPopular');
        url.searchParams.append('regionCode', regionCode);
        url.searchParams.append('videoCategoryId', '10'); // Music category
        url.searchParams.append('maxResults', maxResults.toString());
        url.searchParams.append('key', YOUTUBE_API_KEY);

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(`YouTube API error: ${response.status}`);
        }

        const data = await response.json();

        return data.items?.map((item: any) => ({
            id: item.id,
            title: parseTitle(item.snippet.title),
            artist: parseArtist(item.snippet.title, item.snippet.channelTitle),
            thumbnail: getBestThumbnail(item.snippet.thumbnails),
            duration: parseDuration(item.contentDetails.duration),
            viewCount: parseInt(item.statistics.viewCount || '0'),
            videoId: item.id, // Add videoId for Track compatibility
        })) || [];
    } catch (error) {
        console.error('Error fetching trending music:', error);
        return [];
    }
}

/**
 * Search for music on YouTube
 */
export async function searchYouTubeMusic(query: string, maxResults = 10): Promise<Track[]> {
    try {
        if (!YOUTUBE_API_KEY) {
            console.error('[YouTube] API key missing!');
            return [];
        }

        // Search for music videos
        const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
        searchUrl.searchParams.append('part', 'snippet');
        searchUrl.searchParams.append('q', query);
        searchUrl.searchParams.append('type', 'video');
        searchUrl.searchParams.append('videoCategoryId', '10'); // Music
        searchUrl.searchParams.append('maxResults', maxResults.toString());
        searchUrl.searchParams.append('key', YOUTUBE_API_KEY);

        console.log(`[YouTube] Searching for: "${query}"`);

        const searchResponse = await fetch(searchUrl.toString());
        const searchData = await searchResponse.json();

        if (!searchResponse.ok) {
            console.error('[YouTube] Search API error:', searchData.error);
            return [];
        }

        if (!searchData.items || searchData.items.length === 0) {
            console.warn(`[YouTube] No results for: "${query}"`);
            return [];
        }

        console.log(`[YouTube] Found ${searchData.items.length} results`);

        // Get video IDs
        const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');

        // Fetch video details
        const detailsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
        detailsUrl.searchParams.append('part', 'snippet,contentDetails,statistics');
        detailsUrl.searchParams.append('id', videoIds);
        detailsUrl.searchParams.append('key', YOUTUBE_API_KEY);

        const detailsResponse = await fetch(detailsUrl.toString());
        const detailsData = await detailsResponse.json();

        if (!detailsResponse.ok) {
            console.error('[YouTube] Details API error:', detailsData.error);
            return [];
        }

        const tracks = detailsData.items?.map((item: any) => ({
            id: item.id,
            title: parseTitle(item.snippet.title),
            artist: parseArtist(item.snippet.title, item.snippet.channelTitle),
            thumbnail: getBestThumbnail(item.snippet.thumbnails),
            duration: parseDuration(item.contentDetails.duration),
            videoId: item.id,
        })) || [];

        console.log(`[YouTube] ✅ Returned ${tracks.length} tracks`);
        return tracks;

    } catch (error) {
        console.error('[YouTube] Search error:', error);
        return [];
    }
}

/**
 * Parse video title to extract song name
 * Removes common patterns like [Official Video], (Official Audio), etc.
 */
function parseTitle(title: string): string {
    return title
        .replace(/\(Official.*?\)/gi, '')
        .replace(/\[Official.*?\]/gi, '')
        .replace(/\(Audio\)/gi, '')
        .replace(/\(Video\)/gi, '')
        .replace(/\(Lyrics\)/gi, '')
        .replace(/\(Lyric Video\)/gi, '')
        .replace(/Official Music Video/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Parse artist name from title or channel
 * Common patterns: "Artist - Song Title" or use channel name
 */
function parseArtist(title: string, channelTitle: string): string {
    // Try to extract artist from "Artist - Song" pattern
    const dashMatch = title.match(/^([^-]+)\s*-/);
    if (dashMatch) {
        return dashMatch[1].trim();
    }

    // Try "Song by Artist" pattern
    const byMatch = title.match(/by\s+(.+?)(?:\s*\(|$)/i);
    if (byMatch) {
        return byMatch[1].trim();
    }

    // Fallback to channel name
    return channelTitle.replace(/VEVO$/i, '').trim();
}

/**
 * Get best quality thumbnail
 */
function getBestThumbnail(thumbnails: any): string {
    return thumbnails.maxres?.url ||
        thumbnails.high?.url ||
        thumbnails.medium?.url ||
        thumbnails.default?.url ||
        '';
}

/**
 * Parse ISO 8601 duration to seconds
 * Example: PT4M13S -> 253 seconds
 */
function parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');

    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Detect user's region from request headers or IP
 * Uses CloudFlare's free IP geolocation API as fallback
 */
export async function detectUserRegion(request: Request): Promise<string> {
    // Try to get region from CDN headers first
    const cfCountry = request.headers.get('cf-ipcountry'); // Cloudflare
    const xCountry = request.headers.get('x-country-code'); // Other CDNs
    const xVercelIpCountry = request.headers.get('x-vercel-ip-country'); // Vercel

    if (cfCountry && cfCountry !== 'XX') return cfCountry;
    if (xCountry) return xCountry;
    if (xVercelIpCountry) return xVercelIpCountry;

    // Fallback: Use CloudFlare's IP geolocation API (free, no auth needed)
    try {
        const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            '1.1.1.1'; // Fallback IP for testing

        // CloudFlare's free geolocation endpoint
        const geoResponse = await fetch(`https://cloudflare.com/cdn-cgi/trace`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        if (geoResponse.ok) {
            const text = await geoResponse.text();
            const locMatch = text.match(/loc=([A-Z]{2})/);
            if (locMatch && locMatch[1] !== 'XX') {
                console.log(`[Region] Auto-detected: ${locMatch[1]}`);
                return locMatch[1];
            }
        }
    } catch (error) {
        console.warn('[Region] Geolocation API failed, using default');
    }

    // Default to IN (since you're in India based on timezone)
    return 'IN';
}

/**
 * Get time-based mood
 */
export function getTimeBasedMood(): { timeOfDay: string; mood: string; keywords: string[] } {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 10) {
        return {
            timeOfDay: 'morning',
            mood: 'energetic',
            keywords: ['upbeat', 'pop', 'motivational', 'energetic'],
        };
    } else if (hour >= 10 && hour < 14) {
        return {
            timeOfDay: 'midday',
            mood: 'focused',
            keywords: ['chill', 'lofi', 'instrumental', 'focus'],
        };
    } else if (hour >= 14 && hour < 18) {
        return {
            timeOfDay: 'afternoon',
            mood: 'relaxed',
            keywords: ['indie', 'acoustic', 'relaxed', 'chill'],
        };
    } else if (hour >= 18 && hour < 22) {
        return {
            timeOfDay: 'evening',
            mood: 'popular',
            keywords: ['trending', 'popular', 'hits'],
        };
    } else if (hour >= 22 || hour < 1) {
        return {
            timeOfDay: 'night',
            mood: 'calm',
            keywords: ['calm', 'ambient', 'slow', 'peaceful'],
        };
    } else {
        return {
            timeOfDay: 'latenight',
            mood: 'chill',
            keywords: ['lofi', 'beats', 'electronic', 'chill'],
        };
    }
}
