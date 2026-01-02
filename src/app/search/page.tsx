'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TrackCard, ArtistCard, AlbumCard } from '@/components/cards';
import { SearchLanding } from '@/components/search';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQueueStore } from '@/stores/queueStore';
import type { Track, Artist, Album } from '@/types';

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const [tracks, setTracks] = useState<Track[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const { setQueue } = useQueueStore();

    useEffect(() => {
        if (!query) return;

        async function search() {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                setTracks(data.tracks || []);
                setArtists(data.artists || []);
                setAlbums(data.albums || []);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setIsLoading(false);
            }
        }

        search();
    }, [query]);

    const handlePlayTrack = (track: Track, index: number) => {
        setQueue(tracks, index);
    };

    if (!query) {
        return <SearchLanding />;
    }

    type TopResult =
        | { type: 'artist'; data: Artist }
        | { type: 'track'; data: Track };

    // Find the best match for Top Result
    const getTopResult = (): TopResult | null => {
        if (!query) return null;
        const lowerQuery = query.toLowerCase();

        // 1. Exact Artist Match
        const exactArtist = artists.find(a => a.name.toLowerCase() === lowerQuery);
        if (exactArtist) return { type: 'artist', data: exactArtist };

        // 2. Exact Track Match
        const exactTrack = tracks.find(t => t.title.toLowerCase() === lowerQuery);
        if (exactTrack) return { type: 'track', data: exactTrack };

        // 3. Close Artist Match (starts with)
        const startArtist = artists.find(a => a.name.toLowerCase().startsWith(lowerQuery));
        if (startArtist) return { type: 'artist', data: startArtist };

        // 4. Close Track Match (starts with)
        const startTrack = tracks.find(t => t.title.toLowerCase().startsWith(lowerQuery));
        if (startTrack) return { type: 'track', data: startTrack };

        // 5. Contains Artist Match
        const incArtist = artists.find(a => a.name.toLowerCase().includes(lowerQuery));
        if (incArtist) return { type: 'artist', data: incArtist };

        // Fallbacks
        if (artists.length > 0) return { type: 'artist', data: artists[0] };
        if (tracks.length > 0) return { type: 'track', data: tracks[0] };

        return null;
    };

    const topResult = getTopResult();

    return (
        <div className="p-6 page-transition">
            <h1 className="text-3xl font-bold mb-2">Search results</h1>
            <p className="text-muted-foreground mb-6">
                Showing results for &quot;{query}&quot;
            </p>

            {isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="space-y-3">
                            <div className="aspect-square rounded-lg skeleton" />
                            <div className="h-4 rounded skeleton w-3/4" />
                            <div className="h-3 rounded skeleton w-1/2" />
                        </div>
                    ))}
                </div>
            ) : (
                <Tabs defaultValue="all" className="w-full">
                    <TabsList className="bg-white/5 mb-6">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="tracks">Songs ({tracks.length})</TabsTrigger>
                        <TabsTrigger value="artists">Artists ({artists.length})</TabsTrigger>
                        <TabsTrigger value="albums">Albums ({albums.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-8">
                        {/* Top Result */}
                        {topResult && (
                            <section>
                                <h2 className="text-xl font-bold mb-4">Top Result</h2>
                                <div className="max-w-md">
                                    {topResult.type === 'artist' ? (
                                        <Link href={`/artist/${topResult.data.id}`}>
                                            <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-lg">
                                                        <img
                                                            src={topResult.data.thumbnail || '/placeholder.png'}
                                                            alt={topResult.data.name}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-2xl font-bold mb-1">{topResult.data.name}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium uppercase tracking-wider">Artist</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    ) : (
                                        <div className="bg-white/5 p-4 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => handlePlayTrack(topResult.data as Track, 0)}>
                                            <div className="flex items-center gap-4">
                                                <div className="relative w-24 h-24 rounded-lg overflow-hidden shadow-lg">
                                                    <img
                                                        src={topResult.data.thumbnail || '/placeholder.png'}
                                                        alt={topResult.data.title}
                                                        className="object-cover w-full h-full"
                                                    />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-bold mb-1 line-clamp-1">{topResult.data.title}</h3>
                                                    <p className="text-lg text-neutral-400 mb-2">{topResult.data.artist}</p>
                                                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-medium uppercase tracking-wider">Song</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Songs Overview */}
                        {tracks.length > 0 && (
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold">Songs</h2>
                                    {tracks.length > 4 && (
                                        <button className="text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                                            Show all
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {tracks.slice(0, 4).map((track, index) => (
                                        <TrackCard
                                            key={track.id}
                                            track={track}
                                            isCompact
                                            showDuration={false}
                                            onPlay={() => handlePlayTrack(track, index)}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Artists Overview */}
                        {artists.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold mb-4">Artists</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {artists.slice(0, 5).map((artist) => (
                                        <ArtistCard key={artist.id} artist={artist} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Albums Overview */}
                        {albums.length > 0 && (
                            <section>
                                <h2 className="text-xl font-bold mb-4">Albums</h2>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {albums.slice(0, 5).map((album) => (
                                        <AlbumCard key={album.id} album={album} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </TabsContent>

                    <TabsContent value="tracks">
                        {tracks.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {tracks.map((track, index) => (
                                    <TrackCard
                                        key={track.id}
                                        track={track}
                                        onPlay={() => handlePlayTrack(track, index)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No songs found</p>
                        )}
                    </TabsContent>

                    <TabsContent value="artists">
                        {artists.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {artists.map((artist) => (
                                    <ArtistCard key={artist.id} artist={artist} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No artists found</p>
                        )}
                    </TabsContent>

                    <TabsContent value="albums">
                        {albums.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {albums.map((album) => (
                                    <AlbumCard key={album.id} album={album} />
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No albums found</p>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

function SearchLoading() {
    return (
        <div className="p-6">
            <div className="h-8 w-48 rounded skeleton mb-6" />
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="space-y-3">
                        <div className="aspect-square rounded-lg skeleton" />
                        <div className="h-4 rounded skeleton w-3/4" />
                        <div className="h-3 rounded skeleton w-1/2" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchLoading />}>
            <SearchContent />
        </Suspense>
    );
}
