/**
 * OPTIMIZED Gemini Engine with Caching & Rate Limiting
 * Reduces API calls by 90%+
 * (Touched to force rebuild)
 */

import type { Track } from '@/types';
import { extractGenreMood } from './smart-filter';
import { geminiQueryCache } from './gemini-cache';
import { generateAlgorithmicQueries } from './algorithmic-queries';

// Rate limiting

// Rate limiting
let lastGeminiCall = 0;
const GEMINI_COOLDOWN = 1 * 60 * 1000; // 1 minute (reduced from 5 for better responsiveness)

interface RecommendationRequest {
    currentTrack: Track;
    listeningHistory?: Track[];
    preferredGenres?: string[];
    currentMood?: string;
    diversityLevel?: 'low' | 'medium' | 'high';
}

/**
 * OPTIMIZED: Get recommendations with cache + rate limit + fallback
 */
export async function fetchGeminiRecommendations(
    request: RecommendationRequest
): Promise<string[]> {
    try {
        const { currentTrack, listeningHistory = [], diversityLevel = 'medium' } = request;

        // Extract info
        const { genre: currentGenres, mood: currentMoods } = extractGenreMood(currentTrack);
        const favoriteArtists = Array.from(new Set(listeningHistory.map(t => t.artist))).slice(0, 5);

        // STEP 1: Check 6-hour cache (fastest, FREE)
        const cached = geminiQueryCache.get(currentTrack.artist, currentGenres, diversityLevel);
        if (cached) {
            console.log('[GeminiRecs] 💰 Cache HIT - saved 1 API call!');
            return cached;
        }

        // STEP 2: Check rate limit (1 min cooldown)
        const timeSince = Date.now() - lastGeminiCall;
        if (timeSince < GEMINI_COOLDOWN) {
            const wait = Math.ceil((GEMINI_COOLDOWN - timeSince) / 1000);
            console.warn(`[GeminiRecs] ⏳ Rate limited (${wait}s) - using FREE algorithmic fallback`);
            return generateAlgorithmicQueries(currentTrack, favoriteArtists, diversityLevel);
        }

        // STEP 3: Call Gemini (only if cache miss + not rate limited)
        console.log('[GeminiRecs] 🤖 API call #' + (Math.floor(Date.now() / GEMINI_COOLDOWN)));
        lastGeminiCall = Date.now();

        const queries = await callGemini(currentTrack, currentGenres, currentMoods, listeningHistory, favoriteArtists, diversityLevel);

        // STEP 4: Cache for 6 hours
        geminiQueryCache.set(currentTrack.artist, currentGenres, diversityLevel, queries);

        // Log stats
        const stats = geminiQueryCache.getStats();
        console.log(`[GeminiCache] 📊 ${stats.size} entries, ${stats.totalHits} hits saved`);

        return queries;

    } catch (error) {
        console.error('[GeminiRecs] Error:', error);
        return generateAlgorithmicQueries(request.currentTrack, [], request.diversityLevel || 'medium');
    }
}

/**
 * Actual Gemini API call
 */
async function callGemini(
    currentTrack: Track,
    currentGenres: string[],
    currentMoods: string[],
    listeningHistory: Track[],
    favoriteArtists: string[],
    diversityLevel: 'low' | 'medium' | 'high'
): Promise<string[]> {
    const prompt = `Generate 8 diverse YouTube Music search queries.

CURRENT: "${currentTrack.title}" by ${currentTrack.artist}
GENRES: ${currentGenres.join(', ') || 'unknown'}
FAVORITES: ${favoriteArtists.join(', ') || 'new user'}
DIVERSITY: ${diversityLevel}

Rules:
1. **LANGUAGE/CULTURE MATCH**: If the current song is English, ONLY suggest English songs. If Hindi, ONLY Hindi. Do NOT mix languages unless the artist is known for it.
2. Mix: ${diversityLevel === 'low' ? '70% favorites, 30% new' : diversityLevel === 'medium' ? '50/50 mix' : '30% favorites, 70% new genres'}
3. ONLY music (no interviews/trailers)
4. Include year variations
${favoriteArtists.length > 0 ? `5. Blend: ${favoriteArtists.slice(0, 2).join(', ')} + discoveries` : '5. Build initial profile'}

Return JSON array: ["query1", "query2", ...]`;

    const { smartGenerateContent } = await import('@/lib/gemini');
    try {
        const responseText = await smartGenerateContent(prompt);
        // Clean response (remove markdown if present)
        const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const queries = JSON.parse(cleaned);

        console.log(`[Gemini] Generated ${queries.length} queries`);
        return Array.isArray(queries) ? queries.slice(0, 8) : [];
    } catch (e) {
        console.error('[Gemini] Engine failed:', e);
        return [];
    }
}

/**
 * Progressive genre discovery
 */
export function calculateDiversityLevel(
    sessionCount: number,
    skipRate: number
): 'low' | 'medium' | 'high' {
    if (sessionCount < 5) return 'low';
    if (sessionCount < 15) return 'medium';
    if (skipRate > 0.3) return 'high';
    return 'medium';
}

/**
 * Time-based mood
 */
export function getTimeBasedMood(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 9) return 'energetic';
    if (hour >= 9 && hour < 12) return 'focused';
    if (hour >= 12 && hour < 14) return 'upbeat';
    if (hour >= 14 && hour < 18) return 'motivational';
    if (hour >= 18 && hour < 22) return 'chill';
    return 'calm';
}
