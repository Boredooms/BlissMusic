import { NextRequest, NextResponse } from 'next/server';

/**
 * Lyrics API - Fetches time-synced lyrics
 * Uses lrclib.net API (free, no auth required)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const title = searchParams.get('title');
        const artist = searchParams.get('artist');

        if (!title || !artist) {
            return NextResponse.json({ error: 'Missing title or artist' }, { status: 400 });
        }

        console.log(`[Lyrics API] Fetching for: "${title}" by ${artist}`);

        // Use lrclib.net - free lyrics API with time-synced data
        const lrclibUrl = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;

        const response = await fetch(lrclibUrl, {
            headers: {
                'User-Agent': 'BlissMusic/1.0'
            }
        });

        if (!response.ok) {
            console.warn('[Lyrics API] lrclib.net failed');
            return NextResponse.json({ lines: [], synced: false });
        }

        const results = await response.json();

        if (!results || results.length === 0) {
            console.warn('[Lyrics API] No lyrics found');
            return NextResponse.json({ lines: [], synced: false });
        }

        // Get the first (best) match
        const lyricsData = results[0];

        // Parse synced lyrics if available
        if (lyricsData.syncedLyrics) {
            const lines = parseLRC(lyricsData.syncedLyrics);
            console.log(`[Lyrics API] ✅ Found ${lines.length} synced lines`);
            return NextResponse.json({ lines, synced: true });
        }

        // Fallback to plain lyrics (no timestamps)
        if (lyricsData.plainLyrics) {
            const lines = lyricsData.plainLyrics
                .split('\n')
                .filter((line: string) => line.trim())
                .map((text: string, index: number) => ({ time: index * 3, text })); // Fake timestamps every 3s

            console.log(`[Lyrics API] ⚠️ Found ${lines.length} plain (unsynced) lines`);
            return NextResponse.json({ lines, synced: false });
        }

        return NextResponse.json({ lines: [], synced: false });

    } catch (error) {
        console.error('[Lyrics API] Error:', error);
        return NextResponse.json({ lines: [], synced: false }, { status: 500 });
    }
}

/**
 * Parse LRC format lyrics
 * Format: [mm:ss.xx]Lyric text
 */
function parseLRC(lrcContent: string): { time: number; text: string }[] {
    const lines: { time: number; text: string }[] = [];
    const lrcLines = lrcContent.split('\n');

    for (const line of lrcLines) {
        // Match [mm:ss.xx] format
        const match = line.match(/\[(\d+):(\d+)\.(\d+)\](.*)/);
        if (match) {
            const minutes = parseInt(match[1]);
            const seconds = parseInt(match[2]);
            const centiseconds = parseInt(match[3]);
            const text = match[4].trim();

            if (text) { // Skip empty lines
                const time = minutes * 60 + seconds + centiseconds / 100;
                lines.push({ time, text });
            }
        }
    }

    return lines;
}
