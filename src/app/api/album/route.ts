import { NextResponse } from 'next/server';
import { getAlbum } from '@/lib/ytmusic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'Album ID is required' }, { status: 400 });
    }

    try {
        const album = await getAlbum(id);

        if (!album) {
            return NextResponse.json({ error: 'Album not found' }, { status: 404 });
        }

        return NextResponse.json(album);
    } catch (error) {
        console.error('Error fetching album:', error);
        return NextResponse.json(
            { error: 'Failed to fetch album details' },
            { status: 500 }
        );
    }
}
