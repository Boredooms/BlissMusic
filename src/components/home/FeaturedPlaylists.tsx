'use client';

import { useEffect, useState } from 'react';
import { AlbumCard } from '@/components/cards/AlbumCard';
import type { Album } from '@/types';

export function FeaturedPlaylists() {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchTrendingAlbums() {
            try {
                const res = await fetch('/api/albums/trending');
                const data = await res.json();
                setAlbums(data.albums || []);
            } catch (error) {
                console.error('Failed to fetch trending albums:', error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchTrendingAlbums();
    }, []);

    if (isLoading) {
        return (
            <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">Trending Albums</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="aspect-square rounded-lg skeleton" />
                            <div className="h-4 rounded skeleton w-3/4" />
                            <div className="h-3 rounded skeleton w-1/2" />
                        </div>
                    ))}
                </div>
            </section>
        );
    }

    if (albums.length === 0) {
        return null;
    }

    return (
        <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Trending Albums</h2>

            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {albums.map((album) => (
                    <AlbumCard key={album.id} album={album} />
                ))}
            </div>
        </section>
    );
}
