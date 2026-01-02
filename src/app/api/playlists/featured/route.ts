/**
 * Featured Playlists API - Fetches curated playlists
 * Uses quota-free ytmusic-api
 */

import { NextResponse } from 'next/server';
import type { Track } from '@/types';

export interface Playlist {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    trackCount: number;
    tracks?: Track[];
}

export async function GET() {
    try {
        console.log('[FeaturedPlaylists] Generating curated playlists...');

        const currentYear = new Date().getFullYear();

        // ONLY 3 HIGH-QUALITY playlists with REAL trending content
        const playlists: Playlist[] = [
            {
                id: 'RDCLAK5uy_lyVnWI5JnuwKJiuE-n1x-Un0mj9WlEyZw',
                title: 'Trending India',
                description: `Top trending songs in India ${currentYear}`,
                thumbnail: '/api/placeholder/300/300',
                trackCount: 50,
            },
            {
                id: 'RDCLAK5uy_n9Fbdw7e6ap-98_A-8JYBmPv64v-Uaq1g',
                title: 'Bollywood Hits',
                description: `Latest Bollywood chart-toppers ${currentYear}`,
                thumbnail: '/api/placeholder/300/300',
                trackCount: 50,
            },
            {
                id: 'RDCLAK5uy_mmWwHb0NRnHQFFWtx4jZRULqD2VdR5pqI',
                title: 'South Cinema',
                description: `Telugu & Tamil superhits ${currentYear}`,
                thumbnail: '/api/placeholder/300/300',
                trackCount: 50,
            },
        ];

        return NextResponse.json({ playlists });

    } catch (error) {
        console.error('[FeaturedPlaylists] Error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch playlists' },
            { status: 500 }
        );
    }
}
