'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Album } from '@/types';

interface AlbumCardProps {
    album: Album;
}

export function AlbumCard({ album }: AlbumCardProps) {
    return (
        <Link href={{
            pathname: `/playlist/${album.id}`,
            query: {
                title: album.title,
                artist: album.artist,
                thumbnail: album.thumbnail
            }
        }}>
            <div className="group relative p-4 rounded-lg transition-colors hover:bg-white/5">
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
                    <Image
                        src={album.thumbnail || '/placeholder.png'}
                        alt={album.title}
                        fill
                        className="object-cover"
                    />
                    <Button
                        size="icon"
                        className="absolute bottom-2 right-2 w-12 h-12 rounded-full bg-white text-black shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:scale-105"
                    >
                        <Play className="w-6 h-6 ml-1" />
                    </Button>
                </div>
                <h4 className="font-medium truncate">{album.title}</h4>
                <p className="text-xs text-muted-foreground truncate mt-1">
                    {album.year ? `${album.year} • ` : ''}
                    {album.artist}
                </p>
            </div>
        </Link>
    );
}
