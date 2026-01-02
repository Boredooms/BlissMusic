/**
 * Gemini Query Cache - Cache AI-generated queries to reduce API calls
 * Cache queries based on: artist + genre + diversity level
 */

interface CachedGeminiQuery {
    key: string;
    queries: string[];
    timestamp: number;
    cacheHits: number;
}

class GeminiQueryCache {
    private cache: Map<string, CachedGeminiQuery> = new Map();
    private readonly TTL = 6 * 60 * 60 * 1000; // 6 hours
    private readonly MAX_CACHE_SIZE = 200;

    /**
     * Generate cache key from track and diversity
     */
    private getCacheKey(artist: string, genre: string[], diversity: string): string {
        const genreStr = genre.sort().join('-');
        return `${artist}:${genreStr}:${diversity}`.toLowerCase();
    }

    /**
     * Get cached queries if available
     */
    get(artist: string, genre: string[], diversity: string): string[] | null {
        const key = this.getCacheKey(artist, genre, diversity);
        const cached = this.cache.get(key);

        if (!cached) return null;

        // Check if expired
        if (Date.now() - cached.timestamp > this.TTL) {
            this.cache.delete(key);
            return null;
        }

        // Update hit count
        cached.cacheHits++;
        console.log(`[GeminiCache] ✅ HIT for ${key} (hits: ${cached.cacheHits})`);

        return cached.queries;
    }

    /**
     * Store queries in cache
     */
    set(artist: string, genre: string[], diversity: string, queries: string[]): void {
        const key = this.getCacheKey(artist, genre, diversity);

        // Limit cache size
        if (this.cache.size >= this.MAX_CACHE_SIZE) {
            // Remove oldest entry
            const oldestKey = Array.from(this.cache.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
            this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            key,
            queries,
            timestamp: Date.now(),
            cacheHits: 0,
        });

        console.log(`[GeminiCache] 💾 Stored queries for ${key}`);
    }

    /**
     * Get cache stats
     */
    getStats() {
        const entries = Array.from(this.cache.values());
        const totalHits = entries.reduce((sum, e) => sum + e.cacheHits, 0);
        const avgHits = entries.length > 0 ? totalHits / entries.length : 0;

        return {
            size: this.cache.size,
            totalHits,
            avgHitsPerEntry: avgHits.toFixed(2),
        };
    }

    /**
     * Clear expired entries
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, cached] of this.cache.entries()) {
            if (now - cached.timestamp > this.TTL) {
                this.cache.delete(key);
            }
        }
    }
}

export const geminiQueryCache = new GeminiQueryCache();

// Cleanup every hour
setInterval(() => geminiQueryCache.cleanup(), 60 * 60 * 1000);
