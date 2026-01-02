import { NextResponse } from 'next/server';
import { getArtist } from '@/lib/ytmusic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
    }

    try {
        const artist = await getArtist(id);

        if (!artist) {
            return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
        }

        return NextResponse.json(artist);
    } catch (error) {
        console.error('Error fetching artist:', error);
        return NextResponse.json(
            { error: 'Failed to fetch artist details' },
            { status: 500 }
        );
    }
}
