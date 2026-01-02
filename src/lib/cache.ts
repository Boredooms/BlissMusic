import Dexie, { type EntityTable } from 'dexie';
import type { Track } from '@/types';

// Cached track with audio blob
interface CachedTrack {
    id: string;
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: number;
    audioBlob?: Blob;
    cachedAt: Date;
    size: number;
}

// Listening history item
interface HistoryItem {
    id: string;
    trackId: string;
    videoId: string;
    title: string;
    artist: string;
    thumbnail: string;
    duration: number;
    playedAt: Date;
    playCount: number;
    completed: boolean;
}

// Offline playlist
interface OfflinePlaylist {
    id: string;
    name: string;
    trackIds: string[];
    createdAt: Date;
}

// Define the database
class MusicCacheDB extends Dexie {
    tracks!: EntityTable<CachedTrack, 'id'>;
    history!: EntityTable<HistoryItem, 'id'>;
    playlists!: EntityTable<OfflinePlaylist, 'id'>;

    constructor() {
        super('HarmonyMusicCache');

        this.version(1).stores({
            tracks: 'id, videoId, title, artist, cachedAt',
            history: 'id, trackId, playedAt, playCount',
            playlists: 'id, name, createdAt',
        });
    }
}

// Singleton instance
const db = new MusicCacheDB();

// Cache operations
export const cacheManager = {
    // Check if track is cached
    async isTrackCached(videoId: string): Promise<boolean> {
        const track = await db.tracks.where('videoId').equals(videoId).first();
        return !!track?.audioBlob;
    },

    // Get cached track
    async getCachedTrack(videoId: string): Promise<CachedTrack | undefined> {
        return db.tracks.where('videoId').equals(videoId).first();
    },

    // Cache a track with audio
    async cacheTrack(track: Track, audioBlob: Blob): Promise<void> {
        await db.tracks.put({
            id: track.id,
            videoId: track.videoId,
            title: track.title,
            artist: track.artist,
            thumbnail: track.thumbnail,
            duration: track.duration,
            audioBlob,
            cachedAt: new Date(),
            size: audioBlob.size,
        });
    },

    // Get audio blob for cached track
    async getCachedAudio(videoId: string): Promise<Blob | null> {
        const track = await db.tracks.where('videoId').equals(videoId).first();
        return track?.audioBlob || null;
    },

    // Remove cached track
    async removeCachedTrack(videoId: string): Promise<void> {
        await db.tracks.where('videoId').equals(videoId).delete();
    },

    // Get all cached tracks
    async getAllCachedTracks(): Promise<CachedTrack[]> {
        return db.tracks.toArray();
    },

    // Get total cache size
    async getCacheSize(): Promise<number> {
        const tracks = await db.tracks.toArray();
        return tracks.reduce((sum, t) => sum + (t.size || 0), 0);
    },

    // Clear all cache
    async clearCache(): Promise<void> {
        await db.tracks.clear();
    },
};

// History operations
export const historyManager = {
    // Add to history
    async addToHistory(track: Track, completed: boolean = false): Promise<void> {
        const historyId = `${track.videoId}-${Date.now()}`;

        // Check if played recently (within last 5 minutes)
        const recent = await db.history
            .where('trackId')
            .equals(track.videoId)
            .reverse()
            .first();

        if (recent && Date.now() - recent.playedAt.getTime() < 5 * 60 * 1000) {
            // Update existing entry
            await db.history.update(recent.id, {
                playedAt: new Date(),
                playCount: recent.playCount + 1,
                completed,
            });
        } else {
            // Add new entry
            await db.history.put({
                id: historyId,
                trackId: track.videoId,
                videoId: track.videoId,
                title: track.title,
                artist: track.artist,
                thumbnail: track.thumbnail,
                duration: track.duration,
                playedAt: new Date(),
                playCount: 1,
                completed,
            });
        }
    },

    // Get recent history
    async getRecentHistory(limit: number = 20): Promise<HistoryItem[]> {
        return db.history.orderBy('playedAt').reverse().limit(limit).toArray();
    },

    // Get most played tracks
    async getMostPlayed(limit: number = 10): Promise<HistoryItem[]> {
        // Get unique tracks by videoId with highest play count
        const all = await db.history.toArray();
        const trackMap = new Map<string, HistoryItem>();

        all.forEach((item) => {
            const existing = trackMap.get(item.videoId);
            if (!existing || item.playCount > existing.playCount) {
                trackMap.set(item.videoId, item);
            }
        });

        return Array.from(trackMap.values())
            .sort((a, b) => b.playCount - a.playCount)
            .slice(0, limit);
    },

    // Clear history
    async clearHistory(): Promise<void> {
        await db.history.clear();
    },
};

// Playlist operations
export const offlinePlaylistManager = {
    // Create playlist
    async createPlaylist(name: string): Promise<string> {
        const id = `playlist-${Date.now()}`;
        await db.playlists.put({
            id,
            name,
            trackIds: [],
            createdAt: new Date(),
        });
        return id;
    },

    // Add track to playlist
    async addToPlaylist(playlistId: string, trackId: string): Promise<void> {
        const playlist = await db.playlists.get(playlistId);
        if (playlist && !playlist.trackIds.includes(trackId)) {
            await db.playlists.update(playlistId, {
                trackIds: [...playlist.trackIds, trackId],
            });
        }
    },

    // Get playlist with tracks
    async getPlaylist(playlistId: string): Promise<{ playlist: OfflinePlaylist; tracks: CachedTrack[] } | null> {
        const playlist = await db.playlists.get(playlistId);
        if (!playlist) return null;

        const tracks = await Promise.all(
            playlist.trackIds.map((id) => db.tracks.get(id))
        );

        return {
            playlist,
            tracks: tracks.filter(Boolean) as CachedTrack[],
        };
    },

    // Get all playlists
    async getAllPlaylists(): Promise<OfflinePlaylist[]> {
        return db.playlists.toArray();
    },

    // Delete playlist
    async deletePlaylist(playlistId: string): Promise<void> {
        await db.playlists.delete(playlistId);
    },
};

export { db };
