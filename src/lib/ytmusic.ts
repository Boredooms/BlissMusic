import YTMusic from 'ytmusic-api';
import type { Track, Artist, Album, SearchResults } from '@/types';

// Singleton instance
let ytmusic: YTMusic | null = null;

async function getYTMusic(): Promise<YTMusic> {
    if (!ytmusic) {
        ytmusic = new YTMusic();
        await ytmusic.initialize();
    }
    return ytmusic;
}

// Helper to parse duration string (e.g., "3:45", "1:20:30", "PT3M14S") to seconds
function parseDuration(duration: string | number | undefined | null): number {
    if (typeof duration === 'number') return duration;
    if (!duration) return 0;

    // ISO 8601 format (PT4M13S)
    if (duration.startsWith?.('PT')) {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (match) {
            const hours = parseInt(match[1] || '0');
            const minutes = parseInt(match[2] || '0');
            const seconds = parseInt(match[3] || '0');
            return hours * 3600 + minutes * 60 + seconds;
        }
    }

    try {
        const parts = duration.split(':').map(Number);
        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
        return 0;
    } catch (e) {
        return 0;
    }
}

// Transform YTMusic song to our Track interface
function transformSong(song: any): Track {
    // Prefer explicit duration seconds if available
    let duration = 0;
    if (typeof song.duration_seconds === 'number') {
        duration = song.duration_seconds;
    } else if (typeof song.lengthSeconds === 'number') {
        duration = song.lengthSeconds;
    } else if (song.duration) {
        duration = parseDuration(song.duration);
    }

    return {
        id: song.videoId || song.browseId || Math.random().toString(),
        title: song.name || song.title || 'Unknown',
        artist: song.artist?.name || song.artists?.[0]?.name || 'Unknown Artist',
        album: song.album?.name || '',
        thumbnail: song.thumbnails?.[song.thumbnails.length - 1]?.url ||
            song.thumbnail || '/placeholder.png',
        duration,
        videoId: song.videoId || '',
    };
}

// Transform to Artist interface
function transformArtist(artist: any): Artist {
    return {
        id: artist.artistId || artist.browseId || Math.random().toString(),
        name: artist.name || 'Unknown Artist',
        thumbnail: artist.thumbnails?.[artist.thumbnails.length - 1]?.url ||
            artist.thumbnail || '/placeholder.png',
        subscribers: artist.subscribers || '',
    };
}

// Transform to Album interface  
function transformAlbum(album: any): Album {
    return {
        id: album.albumId || album.browseId || Math.random().toString(),
        title: album.name || album.title || 'Unknown Album',
        artist: album.artist?.name || album.artists?.[0]?.name || 'Unknown Artist',
        thumbnail: album.thumbnails?.[album.thumbnails.length - 1]?.url ||
            album.thumbnail || '/placeholder.png',
        year: album.year,
        trackCount: album.trackCount,
    };
}

// Search for music
export async function searchMusic(query: string): Promise<SearchResults> {
    try {
        const yt = await getYTMusic();
        const results = await yt.search(query);

        const tracks: Track[] = [];
        const artists: Artist[] = [];
        const albums: Album[] = [];

        results.forEach((item: any) => {
            if (item.type === 'SONG' || item.type === 'VIDEO') {
                tracks.push(transformSong(item));
            } else if (item.type === 'ARTIST') {
                artists.push(transformArtist(item));
            } else if (item.type === 'ALBUM') {
                albums.push(transformAlbum(item));
            }
        });

        return { tracks, artists, albums, playlists: [] };
    } catch (error) {
        console.error('Search error:', error);
        return { tracks: [], artists: [], albums: [], playlists: [] };
    }
}

// Search specifically for songs
export async function searchSongs(query: string): Promise<Track[]> {
    try {
        const yt = await getYTMusic();
        const results = await yt.searchSongs(query);
        return results.map(transformSong);
    } catch (error) {
        console.error('Search songs error:', error);
        return [];
    }
}

// Get trending/home content (mimics YouTube Music charts)
export async function getTrending(): Promise<Track[]> {
    try {
        const yt = await getYTMusic();

        // Use current year and month for fresh trending content
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().toLocaleString('default', { month: 'long' });

        // Multiple diverse trending queries to get variety (like YT Music)
        const trendingQueries = [
            `trending music india ${currentYear}`, // India-specific trending
            `bollywood hits ${currentYear}`,        // Bollywood
            `hindi songs ${currentMonth} ${currentYear}`, // Hindi hits
            `tamil hits ${currentYear}`,            // Tamil
            `punjabi songs ${currentYear}`,         // Punjabi
            `telugu hits ${currentYear}`,           // Telugu
        ];

        // Fetch from all queries and merge
        const allTracks: Track[] = [];
        const seenIds = new Set<string>();

        for (const query of trendingQueries) {
            try {
                const results = await yt.searchSongs(query);
                const tracks = results.slice(0, 5).map(transformSong); // Take top 5 from each

                tracks.forEach(track => {
                    if (!seenIds.has(track.id)) {
                        seenIds.add(track.id);
                        allTracks.push(track);
                    }
                });
            } catch (queryError) {
                console.warn(`Query "${query}" failed:`, queryError);
                continue;
            }
        }

        // Shuffle for variety and return top 20
        const shuffled = allTracks.sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 20);
    } catch (error) {
        console.error('Trending error:', error);
        return [];
    }
}

// Get artist details
export async function getArtist(artistId: string) {
    try {
        const yt = await getYTMusic();
        const artist = await yt.getArtist(artistId);
        return {
            ...transformArtist(artist),
            songs: artist.topSongs?.map(transformSong) || [],
            albums: artist.topAlbums?.map(transformAlbum) || [],
        };
    } catch (error) {
        console.error('Get artist error:', error);
        return null;
    }
}

// Get album details
export async function getAlbum(albumId: string) {
    try {
        const yt = await getYTMusic();
        const album = await yt.getAlbum(albumId);
        return {
            ...transformAlbum(album),
            tracks: album.songs?.map(transformSong) || [],
        };
    } catch (error) {
        console.error('Get album error:', error);
        return null;
    }
}

// Get song suggestions (placeholder - will use Gemini for recommendations)
export async function getSuggestions(videoId: string): Promise<Track[]> {
    // ytmusic-api doesn't have getSuggestions, return empty for now
    // Real recommendations will come from Gemini AI
    return [];
}
