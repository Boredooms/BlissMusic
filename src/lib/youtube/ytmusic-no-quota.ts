/**
 * Quota-Free YouTube Music API using ytmusic-api
 * NO API quota limits! Scrapes YouTube Music directly.
 */

import YTMusic from 'ytmusic-api';
import type { Track } from '@/types';

// Initialize YTMusic client
let ytmusicClient: any = null;

export async function getYTMusicClient() {
    if (!ytmusicClient) {
        ytmusicClient = new YTMusic();
        await ytmusicClient.initialize();
    }
    return ytmusicClient;
}

/**
 * Search YouTube Music without quota limits
 */
// ... (imports remain)
export async function searchYouTubeMusicNoQuota(
    query: string,
    maxResults = 10
): Promise<Track[]> {
    const client = await getYTMusicClient();

    // Helper to process results
    const mapResults = (results: any[]) => results
        .slice(0, maxResults)
        .map((result: any) => ({
            id: result.videoId || result.id,
            title: result.name || result.title || '',
            artist: result.artist?.name || result.artists?.[0]?.name || 'Unknown Artist',
            // Force 544x544
            thumbnail: (result.thumbnails?.[result.thumbnails?.length - 1]?.url || result.thumbnail || '').replace(/w\d+-h\d+/, 'w544-h544'),
            duration: parseDuration(result.duration || 0),
            videoId: result.videoId || result.id,
        }))
        .filter((track: Track) => track.title && track.videoId);

    try {
        console.log(`[YTMusic-NoQuota] Searching for: "${query}"`);
        const results = await client.search(query, 'song'); // Try strict first

        if (results && results.length > 0) {
            const tracks = mapResults(results);
            // console.log(`[YTMusic-NoQuota] ✅ Returned ${tracks.length} tracks (strict)`);
            return tracks;
        }

        throw new Error('No strict results');

    } catch (error: any) {
        // Quietly handle 400s or empty results by trying robust fallbacks
        const status = error?.response?.status || error?.status || 0;
        const msg = error?.message || 'Unknown';
        // console.warn(`[YTMusic-NoQuota] Strict search val failed (${status}): ${msg}. Retrying broad...`);

        try {
            // RETRY 1: Unfiltered search (Broad) - Often works best for "Artist - Title" strings
            const broadResults = await client.search(query);

            if (broadResults && broadResults.length > 0) {
                // Prioritize Songs/Videos but accept anything interactive
                const songResults = broadResults.filter((r: any) => r.type === 'song' || r.type === 'video' || r.type === 'album');
                if (songResults.length > 0) return mapResults(songResults);
            }
        } catch (retryError) {
            // console.warn(`[YTMusic-NoQuota] Broad search failed too.`);
        }

        // RETRY 2: Smart Split (Artist - Title -> Title Artist)
        // Gemini often gives "Artist - Title", but YT Music prefers "Title Artist" or just "Title"
        try {
            if (query.includes(' - ')) {
                const parts = query.split(' - ');
                const smartQuery = `${parts[1]} ${parts[0]}`; // "Title Artist"
                const smartResults = await client.search(smartQuery, 'song');
                if (smartResults?.length) return mapResults(smartResults);
            }
        } catch (e) { }

        // RETRY 3: Simplify Query (Remove special chars)
        try {
            const simplified = query.replace(' Songs', '').replace(/[^a-zA-Z0-9 ]/g, '');
            if (simplified !== query && simplified.length > 3) {
                const simpleResults = await client.search(simplified);
                if (simpleResults?.length) return mapResults(simpleResults);
            }
        } catch (e) { }

        // FALLBACK: Last resort artists
        console.warn(`[YTMusic-NoQuota] All searches failed for "${query}". Using emergency fallback.`);
        const FallbackArtists = ['Arijit Singh', 'The Weeknd', 'Taylor Swift']; // Global mix

        for (const artist of FallbackArtists) {
            try {
                const fallbackResults = await client.search(artist, 'song');
                if (fallbackResults && fallbackResults.length > 0) {
                    const tracks = mapResults(fallbackResults);
                    return tracks;
                }
            } catch (e) { continue; }
        }

        return [];
    }
}

/**
 * Get trending music (no quota!)
 */
export async function getTrendingMusicNoQuota(
    maxResults = 20
): Promise<Track[]> {
    const currentYear = new Date().getFullYear();
    return searchYouTubeMusicNoQuota(`trending music ${currentYear}`, maxResults);
}

// Helper: Parse duration string to seconds
function parseDuration(duration: any): number {
    if (typeof duration === 'number') return duration;
    if (typeof duration !== 'string') return 0;

    // Handle MM:SS or HH:MM:SS format
    const parts = duration.split(':').map(Number);
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1]; // MM:SS
    } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    }
    return 0;
}

/**
 * Shuffle array
 */
function shuffle<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Get region name for display
 */
function getRegionName(code: string): string {
    const regions: Record<string, string> = {
        'IN': 'India 🇮🇳',
        'US': 'United States 🇺🇸',
        'GB': 'United Kingdom 🇬🇧',
        'CA': 'Canada 🇨🇦',
        'KR': 'Korea 🇰🇷',
        'JP': 'Japan 🇯🇵',
    };
    return regions[code] || code;
}

/**
 * Get a YouTube Music playlist by ID
 * Falls back to curated search if direct fetch fails
 */
export async function getYTMusicPlaylist(
    playlistId: string,
    playlistTitle?: string,
    artistName?: string
): Promise<{ tracks: Track[], info?: any }> {
    try {
        const ytmusic = await getYTMusicClient();

        console.log(`[YTMusic-NoQuota] Fetching playlist: ${playlistId} (Optimize: ${artistName || 'No'})`);

        // 1. DETECT ALBUM FIRST (MPREb = Album)
        // Trying getPlaylist on an album ID often fails or returns empty.
        if (playlistId.startsWith('MPREb') || playlistId.startsWith('OLAK')) {
            try {
                console.log(`[YTMusic-NoQuota] Detected Album ID (${playlistId}). Fetching as Album...`);
                // Note: OLAK is sometimes treated as playlist, but often works as Album too.
                // Safest is to try Album first for MPREb.

                let albumData: any = null;

                if (playlistId.startsWith('OLAK')) {
                    // OLAK is weird. Try getPlaylist first, if fail then getAlbum.
                    try {
                        albumData = await ytmusic.getPlaylist(playlistId);
                        // Map playlist format to album format structure if needed
                        if (albumData) albumData.tracks = albumData.tracks;
                    } catch (e) {
                        albumData = await ytmusic.getAlbum(playlistId);
                    }
                } else {
                    // MPREb is definitely an album
                    albumData = await ytmusic.getAlbum(playlistId);
                }

                if (albumData && albumData.tracks && albumData.tracks.length > 0) {
                    const tracks: Track[] = albumData.tracks
                        .map((track: any) => ({
                            id: track.videoId || track.id,
                            title: track.name || track.title || '',
                            artist: track.artist?.name || track.artists?.[0]?.name || albumData.artist?.name || artistName || 'Unknown Artist',
                            thumbnail: (track.thumbnails?.[0]?.url || track.thumbnail || albumData.thumbnail || albumData.thumbnails?.[0]?.url || '').replace(/w\d+-h\d+/, 'w544-h544'),
                            duration: parseDuration(track.duration || 0),
                            videoId: track.videoId || track.id,
                        }))
                        .filter((track: Track) => track.title && track.videoId);

                    console.log(`[YTMusic-NoQuota] ✅ Loaded ${tracks.length} tracks from Album`);
                    return {
                        tracks,
                        info: {
                            title: albumData.title,
                            artist: albumData.artist?.name || albumData.artists?.[0]?.name || 'Unknown',
                            thumbnail: albumData.thumbnails?.[albumData.thumbnails.length - 1]?.url
                        }
                    };
                }
            } catch (albumError) {
                console.warn(`[YTMusic-NoQuota] Album fetch failed, trying generic playlist fallback...`);
            }
        }

        // 2. Try Standard Playlist
        try {
            const playlist = await ytmusic.getPlaylist(playlistId);

            if (playlist && playlist.tracks && playlist.tracks.length > 0) {
                // Convert to our Track format
                const tracks: Track[] = playlist.tracks
                    .map((track: any) => ({
                        id: track.videoId || track.id,
                        title: track.name || track.title || '',
                        artist: track.artist?.name || track.artists?.[0]?.name || 'Unknown Artist',
                        thumbnail: track.thumbnails?.[0]?.url || track.thumbnail || '',
                        duration: parseDuration(track.duration || 0),
                        videoId: track.videoId || track.id,
                    }))
                    .filter((track: Track) => track.title && track.videoId);

                console.log(`[YTMusic-NoQuota] ✅ Loaded ${tracks.length} tracks from playlist`);
                return {
                    tracks,
                    info: {
                        title: playlist.title,
                        artist: playlist.author?.name || 'Various Artists',
                        thumbnail: playlist.thumbnails?.[0]?.url
                    }
                };
            }
        } catch (playlistError: any) {
            console.warn(`[YTMusic-NoQuota] Direct playlist fetch failed (${playlistError.status}), trying fallback...`);


        }

        // FALLBACK: Use curated search queries based on playlist title
        console.log(`[YTMusic-NoQuota] Using search fallback for "${playlistTitle}"...`);

        // ACCURATE queries using SPECIFIC trending Indian artists
        const fallbackQueries: Record<string, string[]> = {
            'Trending India': [
                'Arijit Singh',
                'Sonu Nigam',
                'Shreya Ghoshal',
                'Badshah',
                'Guru Randhawa',
            ],
            'Bollywood Hits': [
                'Arijit Singh bollywood',
                'Shreya Ghoshal',
                'Atif Aslam',
                'Armaan Malik',
                'Neha Kakkar',
            ],
            'South Cinema': [
                'Anirudh Ravichander',
                'Devi Sri Prasad',
                'Sid Sriram',
                'Haricharan',
                'Shreya Ghoshal tamil',
            ],
        };

        // Create dynamic queries if we have metadata
        let queries: string[] = [];

        if (fallbackQueries[playlistTitle || '']) {
            queries = fallbackQueries[playlistTitle || ''];
        } else if (playlistTitle || artistName) {
            // Dynamic fallback for specific albums
            const searchTerms = [
                artistName ? `${artistName} ${playlistTitle} songs` : `${playlistTitle} songs`,
                playlistTitle || artistName || ''
            ].filter(Boolean);
            queries = searchTerms;
        } else {
            // Absolute last resort
            queries = ['Arijit Singh'];
        }

        const allTracks: Track[] = [];
        const seenIds = new Set<string>();

        for (const query of queries) {
            const results = await searchYouTubeMusicNoQuota(query, 10);
            results.forEach(track => {
                if (!seenIds.has(track.id)) {
                    seenIds.add(track.id);
                    allTracks.push(track);
                }
            });
        }

        // Shuffle and return 50 songs
        const shuffled = allTracks.sort(() => Math.random() - 0.5);
        console.log(`[YTMusic-NoQuota] ✅ Fallback returned ${allTracks.length} tracks`);
        return { tracks: shuffled.slice(0, 50), info: undefined };

    } catch (error: any) {
        console.error(`[YTMusic-NoQuota] Playlist error:`, error);
        return { tracks: [], info: undefined };
    }
}

/**
 * Get Trending Albums from YouTube Music (Region-Aware)
 */
export async function getTrendingAlbumsNoQuota(
    region: string = 'IN',
    maxResults = 12
): Promise<any[]> {
    try {
        const ytmusic = await getYTMusicClient();

        console.log(`[YTMusic-NoQuota] Fetching trending albums for region: ${region}...`);

        // Broader approach: generic queries + artist albums
        const regionQueries: Record<string, string[]> = {
            'IN': [
                'New Hindi Albums',
                'Trending India Albums',
                'India Top 50 Albums',
                'Bollywood Top 50 Albums',
                'Arijit Singh Latest Album',
                'AR Rahman Album',
                'Top Bollywood Albums',
                'Anirudh Ravichander Album',
                'Badshah Album',
                'Diljit Dosanjh Album',
                'Pritam Album'
            ],
            'US': [
                'Top Albums 2026',
                'Trending Albums USA',
                'US Top 50 Albums',
                'Billboard Top Albums',
                'Taylor Swift Album',
                'Drake Album',
                'The Weeknd Album',
                'SZA Album',
                'Billie Eilish Album'
            ],
            'GB': [
                'UK Top Albums',
                'Ed Sheeran Album',
                'Adele Album',
                'Coldplay Album',
                'Harry Styles Album'
            ],
            'FR': [
                'France Top Albums',
                'Maitre Gims Album',
                'Indila Album',
                'Stromae Album',
                'Jul Album'
            ],
            'DE': [
                'Germany Top Albums',
                'Rammstein Album',
                'Robin Schulz Album',
                'Apache 207 Album'
            ],
            'BR': [
                'Brazil Top Albums',
                'Anitta Album',
                'Marilia Mendonca Album',
                'Gusttavo Lima Album'
            ],
            'JP': [
                'Japan Top Albums',
                'YOASOBI Album',
                'Kenshi Yonezu Album',
                'Vaundy Album',
                'Official Hige Dandism Album'
            ],
            'KR': [
                'K-Pop Top Albums',
                'BTS Album',
                'NewJeans Album',
                'BLACKPINK Album',
                'IVE Album',
                'SEVENTEEN Album'
            ],
            'ES': [
                'Spain Top Albums',
                'Top Latin Albums',
                'Rosalia Album',
                'C. Tangana Album'
            ],
            'MX': [
                'Mexico Top Albums',
                'Peso Pluma Album',
                'Luis Miguel Album',
                'Christian Nodal Album'
            ],
            'DEFAULT': [
                'popular albums 2026',
                'trending albums'
            ]
        };

        const queries = regionQueries[region] || regionQueries['DEFAULT'];

        const allAlbums: any[] = [];
        const seenIds = new Set<string>();

        for (const query of queries) {
            try {
                // Search for ALBUMS specifically
                const results = await ytmusic.search(query, 'album');

                if (results && results.length > 0) {
                    // Take top 2 results to get variety
                    const albumsToAdd = results.slice(0, 2);

                    for (const album of albumsToAdd) {
                        const albumId = album.browseId || album.playlistId || album.id;

                        if (albumId && !seenIds.has(albumId)) {
                            seenIds.add(albumId);
                            allAlbums.push({
                                id: albumId,
                                title: album.name || album.title || 'Unknown Album',
                                artist: album.artist?.name || album.artists?.[0]?.name || 'Various Artists',
                                thumbnail: (album.thumbnails?.[album.thumbnails?.length - 1]?.url || album.thumbnail || '').replace(/w\d+-h\d+/, 'w544-h544'),
                                year: album.year || new Date().getFullYear(),
                                type: 'Album'
                            });
                        }
                    }
                }

                if (allAlbums.length >= maxResults * 1.5) break;
            } catch (queryError) {
                console.warn(`[YTMusic-NoQuota] Query "${query}" failed`);
                continue;
            }
        }

        console.log(`[YTMusic-NoQuota] ✅ Fetched ${allAlbums.length} albums for ${region}`);
        return allAlbums.slice(0, maxResults);

    } catch (error: any) {
        console.error('[YTMusic-NoQuota] Error fetching albums:', error);
        return [];
    }
}

/**
 * SMART ALGORITHMIC RECOMMENDATIONS (NO AI)
 * Multi-strategy approach for relevant, engaging recommendations
 */
export async function getRecommendations(videoId: string, currentTrack?: { title: string, artist: string }): Promise<Track[]> {
    try {
        if (!currentTrack) {
            console.warn('[YTMusic-NoQuota] No current track info provided for recommendations');
            return [];
        }

        console.log(`[YTMusic-NoQuota] 🎯 Smart Recommendations for: ${currentTrack.title} by ${currentTrack.artist}`);

        // Extract mood/genre hints from title
        const moodKeywords = extractMoodAndGenre(currentTrack.title);

        const allResults: Track[] = [];
        const seenIds = new Set<string>([videoId]);
        const seenTitles = new Set<string>(); // Also track title+artist to catch duplicates

        // Helper to check if track is duplicate
        const isDuplicate = (track: Track): boolean => {
            const titleKey = `${track.title.toLowerCase()}-${track.artist.toLowerCase()}`;
            return seenIds.has(track.videoId) || seenIds.has(track.id) || seenTitles.has(titleKey);
        };

        const addTrack = (track: Track) => {
            const titleKey = `${track.title.toLowerCase()}-${track.artist.toLowerCase()}`;
            seenIds.add(track.videoId);
            seenIds.add(track.id);
            seenTitles.add(titleKey);
            allResults.push(track);
        };

        // STRATEGY 1: Same Artist (40% weight)
        try {
            const artistTracks = await searchYouTubeMusicNoQuota(`${currentTrack.artist} songs`, 6);
            artistTracks.forEach(t => {
                if (!isDuplicate(t)) addTrack(t);
            });
        } catch (e) { console.warn('[YTMusic-NoQuota] Artist search failed'); }

        // STRATEGY 2: Mood/Genre Match (30% weight)
        if (moodKeywords.length > 0) {
            try {
                const moodQuery = `${moodKeywords[0]} songs`;
                const moodTracks = await searchYouTubeMusicNoQuota(moodQuery, 5);
                moodTracks.forEach(t => {
                    if (!isDuplicate(t)) addTrack(t);
                });
            } catch (e) { console.warn('[YTMusic-NoQuota] Mood search failed'); }
        }

        // STRATEGY 3: "Similar to" Search (30% weight)
        try {
            const similarQuery = `songs like ${currentTrack.title}`;
            const similarTracks = await searchYouTubeMusicNoQuota(similarQuery, 5);
            similarTracks.forEach(t => {
                if (!isDuplicate(t)) addTrack(t);
            });
        } catch (e) { console.warn('[YTMusic-NoQuota] Similar search failed'); }

        // Shuffle for variety, return top 15
        const shuffled = allResults.sort(() => Math.random() - 0.5);
        console.log(`[YTMusic-NoQuota] ✅ Generated ${shuffled.length} smart recommendations`);
        return shuffled.slice(0, 15);
    } catch (error) {
        console.error('[YTMusic-NoQuota] Failed to get recommendations:', error);
        return [];
    }
}

/**
 * Extract mood and genre keywords from song title (NO AI)
 * Detects common patterns in Indian/Bollywood and Western music
 */
function extractMoodAndGenre(title: string): string[] {
    const lower = title.toLowerCase();
    const keywords: string[] = [];

    // Mood detection
    const moodMap: Record<string, string[]> = {
        'romantic': ['love', 'romantic', 'ishq', 'pyaar', 'dil', 'mohabbat'],
        'sad': ['sad', 'dard', 'broken', 'alone', 'tears', 'cry'],
        'party': ['party', 'dance', 'dj', 'remix', 'club', 'mashup'],
        'devotional': ['bhajan', 'aarti', 'prayer', 'devotional', 'mantra'],
        'motivational': ['motivational', 'workout', 'gym', 'energy', 'power'],
        'chill': ['chill', 'lofi', 'relax', 'calm', 'acoustic']
    };

    for (const [mood, patterns] of Object.entries(moodMap)) {
        if (patterns.some(p => lower.includes(p))) {
            keywords.push(mood);
        }
    }

    // Genre detection
    if (lower.includes('rap') || lower.includes('hip hop')) keywords.push('hip hop');
    if (lower.includes('rock') || lower.includes('metal')) keywords.push('rock');
    if (lower.includes('classical') || lower.includes('raag')) keywords.push('classical');
    if (lower.includes('folk') || lower.includes('sufi')) keywords.push('folk');

    // Fallback to "Bollywood" if no mood/genre detected (common for Indian tracks)
    if (keywords.length === 0 && (lower.includes('from') || lower.includes('film') || lower.includes('movie'))) {
        keywords.push('bollywood');
    }

    return keywords;
}

// ---------------------------------------------------------
// TRENDING SONGS (Region-Aware, Cached, High-Res)
// ---------------------------------------------------------
export async function getTrendingSongsNoQuota(region: string = 'US', maxResults: number = 20): Promise<Track[]> {
    try {
        const ytmusic = await getYTMusicClient();
        console.log(`[YTMusic-NoQuota] Fetching trending SONGS for region: ${region}`);

        // REGION MAPPING (Rich, diverse queries per region)
        const regionQueries: Record<string, string[]> = {
            'IN': [
                'Top 50 India',
                'Trending Songs India',
                'New Hindi Songs',
                'Bollywood LoFi',
                'Punjabi Top 50',
                'Tamil Viral Hits',
                'Telugu Top 20',
                'Malayalam Hits',
                'Indian Pop Hits'
            ],
            'US': [
                'Billboard Hot 100',
                'Top 50 USA',
                'Viral 50 USA',
                'New Music Friday',
                'Rap Caviar',
                'Pop Rising',
                'Country Top 50'
            ],
            'GB': [
                'Official Charts UK',
                'Top 40 UK',
                'Viral 50 United Kingdom',
                'Hot Hits UK',
                'UK Drill Hits'
            ],
            'FR': [
                'Top 50 France',
                'French Rap Hits',
                'Viral 50 France',
                'NRJ Hits'
            ],
            'DE': [
                'Top 50 Germany',
                'Deutschrap Brandneu',
                'Viral 50 Germany',
                'Popland'
            ],
            'BR': [
                'Top 50 Brazil',
                'Sertanejo Hits',
                'Funk Hits',
                'Viral 50 Brazil'
            ],
            'JP': [
                'Japan Hot 100',
                'J-Pop Top 50',
                'Viral 50 Japan',
                'Anime Hits',
                'J-Rock'
            ],
            'KR': [
                'Melon Top 100',
                'K-Pop Hot 100',
                'Viral 50 South Korea',
                'K-R&B Hits'
            ],
            'MX': [
                'Top 50 Mexico',
                'Regional Mexicano',
                'Viral 50 Mexico',
                'Reggaeton Hits'
            ],
            'ES': [
                'Top 50 Spain',
                'Viral 50 Spain',
                'Flamenco Pop'
            ],
            'DEFAULT': [
                'Global Top 50',
                'Trending Songs 2026',
                'Viral Hits Global'
            ]
        };

        const queries = regionQueries[region] || regionQueries['DEFAULT'];
        const allTracks: Track[] = [];
        const seenIds = new Set<string>();

        // We want a mix, so we loop through queries and take a few from each
        for (const query of queries) {
            if (allTracks.length >= maxResults * 1.5) break;

            try {
                const results = await ytmusic.search(query, 'song'); // Explicitly search 'song'

                if (results && results.length > 0) {
                    // Take top 3 from each category to ensure variety
                    const tracksToAdd = results.slice(0, 3);

                    for (const t of tracksToAdd) {
                        const id = t.videoId || t.id;
                        if (id && !seenIds.has(id)) {
                            seenIds.add(id);

                            // Transform to Track
                            allTracks.push({
                                id: id,
                                videoId: id,
                                title: t.name || t.title || 'Unknown Song',
                                artist: t.artist?.name || t.artists?.[0]?.name || 'Unknown Artist',
                                // Force High Res
                                thumbnail: (t.thumbnails?.[t.thumbnails?.length - 1]?.url || t.thumbnail || '').replace(/w\d+-h\d+/, 'w544-h544'),
                                duration: t.duration || 0,
                                album: t.album?.name || t.album || ''
                            });
                        }
                    }
                }
            } catch (qError) {
                console.warn(`[YTMusic-NoQuota] Song query "${query}" failed`);
                continue;
            }
        }

        // Shuffle the results to make it feel dynamic
        const shuffled = allTracks.sort(() => Math.random() - 0.5);

        console.log(`[YTMusic-NoQuota] ✅ Fetched ${shuffled.length} trending songs for ${region}`);
        return shuffled.slice(0, maxResults);

    } catch (error: any) {
        console.error('[YTMusic-NoQuota] Error fetching trending songs:', error);
        return [];
    }
}