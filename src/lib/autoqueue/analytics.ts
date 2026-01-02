/**
 * Listening Analytics Engine
 * Analyzes user behavior patterns to optimize recommendations
 * Cost-efficient: Uses local analysis before calling AI
 */

import type { Track } from '@/types';

interface ListeningSession {
    tracks: Track[];
    skips: number[];
    timestamps: number[];
    totalDuration: number;
}

interface PatternAnalysis {
    skipRate: number;
    averageListenDuration: number;
    preferredGenres: string[];
    preferredArtists: string[];
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    mood: 'energetic' | 'chill' | 'mixed' | 'unknown';
    artistAffinity: Map<string, number>; // Artist -> score
}

export class ListeningAnalytics {
    private sessionData: ListeningSession = {
        tracks: [],
        skips: [],
        timestamps: [],
        totalDuration: 0,
    };

    /**
     * Record a track play
     */
    recordPlay(track: Track): void {
        this.sessionData.tracks.push(track);
        this.sessionData.timestamps.push(Date.now());
    }

    /**
     * Record a skip event
     */
    recordSkip(trackIndex: number): void {
        this.sessionData.skips.push(trackIndex);
    }

    /**
     * Get current time of day category
     */
    private getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 17) return 'afternoon';
        if (hour >= 17 && hour < 21) return 'evening';
        return 'night';
    }

    /**
     * Infer mood from listening patterns
     * Cost-efficient: No API calls, pure algorithm
     */
    private inferMood(tracks: Track[]): 'energetic' | 'chill' | 'mixed' | 'unknown' {
        if (tracks.length < 3) return 'unknown';

        // Simple heuristic based on track titles/artists
        const keywords = {
            energetic: ['dance', 'party', 'upbeat', 'workout', 'hype', 'energy'],
            chill: ['chill', 'lofi', 'relax', 'calm', 'smooth', 'acoustic', 'slow'],
        };

        let energeticScore = 0;
        let chillScore = 0;

        tracks.forEach(track => {
            const text = `${track.title} ${track.artist}`.toLowerCase();

            keywords.energetic.forEach(keyword => {
                if (text.includes(keyword)) energeticScore++;
            });

            keywords.chill.forEach(keyword => {
                if (text.includes(keyword)) chillScore++;
            });
        });

        if (energeticScore > chillScore * 1.5) return 'energetic';
        if (chillScore > energeticScore * 1.5) return 'chill';
        if (energeticScore > 0 || chillScore > 0) return 'mixed';
        return 'unknown';
    }

    /**
     * Calculate artist affinity scores
     * Higher score = user listens more to this artist
     */
    private calculateArtistAffinity(tracks: Track[], skips: number[]): Map<string, number> {
        const affinity = new Map<string, number>();
        const skipSet = new Set(skips);

        tracks.forEach((track, index) => {
            const current = affinity.get(track.artist) || 0;
            // +1 for play, -0.5 for skip
            const score = skipSet.has(index) ? -0.5 : 1;
            affinity.set(track.artist, current + score);
        });

        return affinity;
    }

    /**
     * Extract preferred genres from track titles
     * Simple but effective without external API
     */
    private extractGenres(tracks: Track[]): string[] {
        const genreKeywords = {
            pop: ['pop', 'hits'],
            rock: ['rock', 'metal', 'punk'],
            hiphop: ['hip hop', 'rap', 'trap'],
            electronic: ['edm', 'house', 'techno', 'electronic', 'dubstep'],
            indie: ['indie', 'alternative'],
            jazz: ['jazz', 'blues'],
            classical: ['classical', 'orchestra', 'symphony'],
            country: ['country', 'folk'],
            rnb: ['r&b', 'soul', 'rnb'],
            latin: ['latin', 'reggaeton', 'salsa'],
        };

        const genreScores = new Map<string, number>();

        tracks.forEach(track => {
            const text = `${track.title} ${track.artist}`.toLowerCase();

            Object.entries(genreKeywords).forEach(([genre, keywords]) => {
                keywords.forEach(keyword => {
                    if (text.includes(keyword)) {
                        genreScores.set(genre, (genreScores.get(genre) || 0) + 1);
                    }
                });
            });
        });

        // Return top 3 genres
        return Array.from(genreScores.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([genre]) => genre);
    }

    /**
     * Analyze current session
     * Returns comprehensive analysis for AI context
     */
    analyzeSession(): PatternAnalysis {
        const { tracks, skips, timestamps } = this.sessionData;

        // Calculate skip rate
        const skipRate = tracks.length > 0 ? skips.length / tracks.length : 0;

        // Calculate average listen duration
        const totalTime = timestamps.length > 1
            ? timestamps[timestamps.length - 1] - timestamps[0]
            : 0;
        const averageListenDuration = tracks.length > 0
            ? totalTime / tracks.length / 1000 // Convert to seconds
            : 0;

        return {
            skipRate,
            averageListenDuration,
            preferredGenres: this.extractGenres(tracks),
            preferredArtists: this.getTopArtists(tracks, 3),
            timeOfDay: this.getTimeOfDay(),
            mood: this.inferMood(tracks),
            artistAffinity: this.calculateArtistAffinity(tracks, skips),
        };
    }

    /**
     * Get top N artists from session
     */
    private getTopArtists(tracks: Track[], n: number = 3): string[] {
        const artistCounts = new Map<string, number>();

        tracks.forEach(track => {
            artistCounts.set(track.artist, (artistCounts.get(track.artist) || 0) + 1);
        });

        return Array.from(artistCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, n)
            .map(([artist]) => artist);
    }

    /**
     * Check if we should trigger AI recommendation
     * Cost optimization: Only call AI when needed
     */
    shouldTriggerAI(): boolean {
        const { tracks, skips } = this.sessionData;

        // Trigger conditions (optimized for cost):
        // 1. After 5-6 songs in session
        if (tracks.length >= 5 && tracks.length <= 6) return true;

        // 2. After 3+ consecutive skips (user unhappy)
        const recentSkips = skips.slice(-3);
        const consecutiveSkips = recentSkips.length >= 3 &&
            recentSkips.every((skip, i) => i === 0 || skip === recentSkips[i - 1] + 1);
        if (consecutiveSkips) return true;

        // 3. Every 15 songs to refresh
        if (tracks.length > 0 && tracks.length % 15 === 0) return true;

        return false;
    }

    /**
     * Reset session data
     */
    resetSession(): void {
        this.sessionData = {
            tracks: [],
            skips: [],
            timestamps: [],
            totalDuration: 0,
        };
    }

    /**
     * Get session summary for Gemini context
     * Optimized format to minimize token usage
     */
    getSessionContext(): string {
        const analysis = this.analyzeSession();
        const { tracks } = this.sessionData;

        const recentTracks = tracks.slice(-5).map(t => `"${t.title}" - ${t.artist}`).join(', ');
        const topArtists = analysis.preferredArtists.join(', ');
        const genres = analysis.preferredGenres.join(', ');

        return `Time: ${analysis.timeOfDay} | Mood: ${analysis.mood} | Skip: ${(analysis.skipRate * 100).toFixed(0)}% | Recent: ${recentTracks} | Likes: ${topArtists} | Genres: ${genres || 'mixed'}`;
    }
}

// Singleton instance
export const listeningAnalytics = new ListeningAnalytics();
