import { NextRequest, NextResponse } from 'next/server';

interface LyricLine {
    time: number;
    text: string;
}

interface LyricsResponse {
    synced: boolean;
    lines: LyricLine[];
    plainText?: string;
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const searchParams = request.nextUrl.searchParams;
    const title = searchParams.get('title') || '';
    const artist = searchParams.get('artist') || '';

    if (!title || !artist) {
        return NextResponse.json(
            { error: 'Title and artist are required' },
            { status: 400 }
        );
    }

    try {
        // Try LRCLIB first (synced lyrics)
        const lrclibUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;

        const response = await fetch(lrclibUrl, {
            headers: {
                'User-Agent': 'Harmony Music App/1.0',
            },
        });

        if (response.ok) {
            const data = await response.json();

            if (data.syncedLyrics) {
                // Parse LRC format
                const lines = parseLRC(data.syncedLyrics);
                return NextResponse.json({
                    synced: true,
                    lines,
                    plainText: data.plainLyrics,
                } as LyricsResponse);
            } else if (data.plainLyrics) {
                // Return plain lyrics
                return NextResponse.json({
                    synced: false,
                    lines: data.plainLyrics.split('\n').map((text: string, i: number) => ({
                        time: i * 5, // Fake timing
                        text,
                    })),
                    plainText: data.plainLyrics,
                } as LyricsResponse);
            }
        }

        // Fallback: Try searching
        const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${title} ${artist}`)}`;
        const searchResponse = await fetch(searchUrl, {
            headers: { 'User-Agent': 'Harmony Music App/1.0' },
        });

        if (searchResponse.ok) {
            const results = await searchResponse.json();
            if (results.length > 0 && results[0].syncedLyrics) {
                const lines = parseLRC(results[0].syncedLyrics);
                return NextResponse.json({
                    synced: true,
                    lines,
                    plainText: results[0].plainLyrics,
                } as LyricsResponse);
            }
        }

        return NextResponse.json({
            synced: false,
            lines: [],
            plainText: 'Lyrics not found',
        } as LyricsResponse);
    } catch (error) {
        console.error('Lyrics API error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch lyrics' },
            { status: 500 }
        );
    }
}

// Parse LRC format to structured data
function parseLRC(lrc: string): LyricLine[] {
    const lines: LyricLine[] = [];
    const regex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/g;

    let match;
    while ((match = regex.exec(lrc)) !== null) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
        const time = minutes * 60 + seconds + milliseconds / 1000;
        const text = match[4].trim();

        if (text) {
            lines.push({ time, text });
        }
    }

    return lines.sort((a, b) => a.time - b.time);
}
