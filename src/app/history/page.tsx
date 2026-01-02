'use client';

/**
 * Listening History Page
 * Shows user's daily listening history with stats
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface HistoryEntry {
    id: string;
    track: {
        id: string;
        title: string;
        artist: string;
        thumbnail: string;
        duration: number;
    };
    playedAt: string;
    completionRate: number;
    skipped: boolean;
}

export default function HistoryPage() {
    const router = useRouter();
    const [history, setHistory] = useState<Record<string, HistoryEntry[]>>({});
    const [totalPlays, setTotalPlays] = useState(0);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        async function fetchHistory() {
            const supabase = createClient();

            // Check authentication
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/auth');
                return;
            }

            setUser(user);

            // Fetch history
            const res = await fetch('/api/history?days=7');
            const data = await res.json();

            if (res.ok) {
                setHistory(data.history);
                setTotalPlays(data.totalPlays);
            }
            setLoading(false);
        }

        fetchHistory();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="text-emerald-400">Loading history...</div>
            </div>
        );
    }

    const dates = Object.keys(history).sort().reverse();

    return (
        <div className="min-h-screen bg-black text-white p-6">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Listening History</h1>
                <p className="text-gray-400 mb-8">
                    Total plays: {totalPlays} • Last 7 days
                </p>

                {dates.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        No listening history yet. Start playing some music!
                    </div>
                ) : (
                    <div className="space-y-8">
                        {dates.map((date) => {
                            const entries = history[date];
                            const dateObj = new Date(date);
                            const isToday = dateObj.toDateString() === new Date().toDateString();
                            const dayLabel = isToday ? 'Today' : dateObj.toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'long',
                                day: 'numeric'
                            });

                            return (
                                <div key={date} className="space-y-4">
                                    <h2 className="text-xl font-semibold text-emerald-400 sticky top-0 bg-black py-2">
                                        {dayLabel}
                                        <span className="ml-3 text-sm text-gray-500">
                                            {entries.length} {entries.length === 1 ? 'song' : 'songs'}
                                        </span>
                                    </h2>

                                    <div className="space-y-2">
                                        {entries.map((entry) => (
                                            <div
                                                key={entry.id}
                                                className="flex items-center gap-4 p-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition"
                                            >
                                                {entry.track.thumbnail && (
                                                    <img
                                                        src={entry.track.thumbnail}
                                                        alt={entry.track.title}
                                                        className="w-12 h-12 rounded object-cover"
                                                    />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">
                                                        {entry.track.title}
                                                    </div>
                                                    <div className="text-sm text-gray-400 truncate">
                                                        {entry.track.artist}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {new Date(entry.playedAt).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                                {entry.skipped && (
                                                    <div className="text-xs text-red-400">Skipped</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
