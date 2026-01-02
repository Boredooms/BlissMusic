'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Artist } from '@/types';

interface ArtistCardProps {
    artist: Artist;
}

export function ArtistCard({ artist }: ArtistCardProps) {
    return (
        <Link href={`/artist/${artist.id}`}>
            <div className="group p-4 rounded-lg transition-colors hover:bg-white/5">
                <div className="relative aspect-square rounded-full overflow-hidden mb-4">
                    <Image
                        src={artist.thumbnail || '/placeholder.png'}
                        alt={artist.name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                    />
                </div>
                <h4 className="font-medium text-center truncate">{artist.name}</h4>
                <p className="text-xs text-muted-foreground text-center mt-1">Artist</p>
            </div>
        </Link>
    );
}
