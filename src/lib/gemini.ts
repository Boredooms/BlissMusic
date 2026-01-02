import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Track } from '@/types';

// Initialize SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// --- CORE ENGINE WITH RETRY ---

const AVAILABLE_MODELS = [
    'gemini-2.5-flash',     // NEW! Working & Fast
    'gemini-3-pro-preview'  // Requested
];

const MAX_RETRIES = 3;
const INITIAL_DELAY = 2000; // 2 seconds

/**
 * Smart Generator that handles 429 Rate Limits by Retrying
 */
export async function smartGenerateContent(prompt: string): Promise<string> {

    // Try each model in preference order
    for (const modelName of AVAILABLE_MODELS) {
        let attempts = 0;

        while (attempts <= MAX_RETRIES) {
            try {
                // console.log(`[Gemini] Attempting ${modelName} (Try ${attempts + 1}/${MAX_RETRIES + 1})...`);

                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: { temperature: 0.9 } // Removed maxOutputTokens to be safe
                });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                if (text) return text;

            } catch (error: any) {
                const isQuota = error.message?.includes('429') || error.status === 429;
                const isNotFound = error.message?.includes('404') || error.status === 404;

                if (isNotFound) {
                    // console.warn(`[Gemini] ${modelName} not found, skipping.`);
                    break; // Don't retry not found, move to next model
                }

                if (isQuota) {
                    if (attempts < MAX_RETRIES) {
                        const delay = INITIAL_DELAY * Math.pow(2, attempts);
                        console.warn(`[Gemini] ⏳ Quota hit on ${modelName}. Retrying in ${delay}ms...`);
                        await new Promise(r => setTimeout(r, delay));
                        attempts++;
                        continue;
                    } else {
                        // FAIL FAST: Don't cascade to other models on quota exhaustion
                        console.warn(`[Gemini] ⚠️ ${modelName} quota exhausted. Failing fast.`);
                        throw new Error(`Gemini quota exhausted on ${modelName}`);
                    }
                } else {
                    console.error(`[Gemini] Error with ${modelName}:`, error.message);
                }
                break; // Break loop for non-retriable errors
            }
        }
    }

    throw new Error('All Gemini models exhausted');
}


// --- DOMAIN FUNCTIONS ---

interface RecommendationResult {
    query: string;
    reason: string;
}

// Generate personalized recommendations
export async function generateRecommendations(
    currentTrack: Track | null,
    recentTracks: Track[],
    mood?: string
): Promise<RecommendationResult[]> {
    const recentContext = recentTracks.slice(0, 5).map(t => `${t.title}-${t.artist}`).join(', ');
    const currentContext = currentTrack ? `Now: ${currentTrack.title} - ${currentTrack.artist}` : '';
    const moodContext = mood ? `Mood: ${mood}` : '';

    const prompt = `
        Music Recommender Agent.
        Context: ${currentContext}. History: ${recentContext}. ${moodContext}.
        Suggest 8 songs that flow perfectly.
        Return JSON Array: [{"query": "Title - Artist", "reason": "why"}]
    `;

    try {
        const text = await smartGenerateContent(prompt);
        return parseJson(text);
    } catch (e) {
        console.error('Recs failed:', e);
        return [];
    }
}

// Smart queue generator
export async function generateSmartQueue(
    currentTrack: Track,
    queueLength: number = 5
): Promise<RecommendationResult[]> {
    const prompt = `
        DJ Agent.
        Playing: "${currentTrack.title}" by ${currentTrack.artist}.
        Create ${queueLength} song queue for seamless mixing.
        Return JSON Array: [{"query": "Title - Artist", "reason": "transition"}]
    `;

    try {
        const text = await smartGenerateContent(prompt);
        return parseJson(text);
    } catch (e) {
        return [];
    }
}

// Enhance search query
export async function enhanceSearchQuery(query: string, context?: string): Promise<string> {
    const prompt = `
        Refine this music search query: "${query}".
        Context: ${context || 'General'}.
        If vague, make specific (e.g. "chill" -> "lofi chill beats").
        If specific, keep as-is.
        Return ONLY the refined text.
    `;

    try {
        return (await smartGenerateContent(prompt)).trim();
    } catch (e) {
        return query; // Fallback to original
    }
}

// --- SHARED HELPERS ---

function parseJson(text: string): any[] {
    try {
        const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const jsonMatch = clean.match(/\[[\s\S]*\]/); // Array finder
        if (jsonMatch) return JSON.parse(jsonMatch[0]);

        // Single object fallback
        const objMatch = clean.match(/\{[\s\S]*\}/);
        if (objMatch) {
            const obj = JSON.parse(objMatch[0]);
            if (obj.songs) return obj.songs; // Handle { songs: [] } format
            if (obj.albums) return obj.albums;
            return [obj];
        }
        return [];
    } catch (e) {
        return [];
    }
}
