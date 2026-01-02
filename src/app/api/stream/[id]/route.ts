import { NextRequest, NextResponse } from 'next/server';

// Public Cobalt v8 instances (verified working as of Dec 2024)
const COBALT_INSTANCES = [
    'https://cobalt-api.kwiatekmiki.com',
    'https://api.cobalt.best',
    'https://cobalt.canine.tools',
];

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: videoId } = await params;

    if (!videoId) {
        return NextResponse.json(
            { error: 'Video ID is required' },
            { status: 400 }
        );
    }

    const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // Try Cobalt v8 API instances
    for (const instance of COBALT_INSTANCES) {
        try {
            const response = await fetch(instance, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: youtubeUrl,
                    downloadMode: 'audio',
                    audioFormat: 'mp3',
                    audioBitrate: '128',
                }),
                signal: AbortSignal.timeout(20000),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.log(`Cobalt ${instance} error: ${response.status} - ${errorText}`);
                continue;
            }

            const data = await response.json();
            console.log(`Cobalt ${instance} response:`, data.status);

            if ((data.status === 'tunnel' || data.status === 'redirect') && data.url) {
                return NextResponse.redirect(data.url);
            }

            if (data.status === 'picker' && data.picker?.length > 0) {
                // Select the first audio option
                const audioOption = data.picker.find((p: any) => p.type === 'audio') || data.picker[0];
                if (audioOption?.url) {
                    return NextResponse.redirect(audioOption.url);
                }
            }

            if (data.status === 'error') {
                console.log(`Cobalt error: ${data.error?.code || 'unknown'}`);
                continue;
            }

        } catch (error) {
            console.log(`Cobalt ${instance} failed:`, error instanceof Error ? error.message : 'Unknown');
            continue;
        }
    }

    // Fallback: Invidious instances with direct streaming
    const invidiousInstances = [
        'https://iv.ggtyler.dev',
        'https://yt.artemislena.eu',
        'https://invidious.lunar.icu',
    ];

    for (const instance of invidiousInstances) {
        for (const itag of ['251', '250', '249', '140']) {
            try {
                const streamUrl = `${instance}/latest_version?id=${videoId}&itag=${itag}`;

                const checkResponse = await fetch(streamUrl, {
                    method: 'HEAD',
                    redirect: 'follow',
                    signal: AbortSignal.timeout(5000),
                });

                if (checkResponse.ok || checkResponse.status === 302) {
                    console.log(`Invidious ${instance} works with itag ${itag}`);
                    return NextResponse.redirect(streamUrl);
                }
            } catch {
                continue;
            }
        }
    }

    // Last resort: ytdl-core with proxy
    try {
        const ytdl = await import('@distube/ytdl-core');
        const info = await ytdl.default.getInfo(youtubeUrl);

        const audioFormats = ytdl.default.filterFormats(info.formats, 'audioonly')
            .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));

        const bestFormat = audioFormats[0];
        if (bestFormat?.url) {
            // Proxy the audio
            const range = request.headers.get('range');
            const audioRes = await fetch(bestFormat.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    ...(range ? { Range: range } : {}),
                },
            });

            if (audioRes.ok || audioRes.status === 206) {
                const headers = new Headers();
                headers.set('Content-Type', bestFormat.mimeType?.split(';')[0] || 'audio/webm');
                headers.set('Accept-Ranges', 'bytes');
                if (audioRes.headers.get('content-length')) {
                    headers.set('Content-Length', audioRes.headers.get('content-length')!);
                }
                return new NextResponse(audioRes.body, { status: audioRes.status, headers });
            }
        }
    } catch (error) {
        console.error('ytdl-core failed:', error);
    }

    return NextResponse.json(
        { error: 'Unable to stream audio. All sources unavailable.' },
        { status: 503 }
    );
}
