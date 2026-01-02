/**
 * History API - Fetch and manage user's listening history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const days = parseInt(searchParams.get('days') || '7');
        const limit = parseInt(searchParams.get('limit') || '100');

        // Fetch user's listening history (last N days)
        const { data: history, error } = await supabase
            .from('daily_listening_history')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
            .order('played_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('[History] Fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch history' },
                { status: 500 }
            );
        }

        // Group by date
        const groupedByDate = history.reduce((acc: any, entry: any) => {
            const date = entry.date;
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push({
                id: entry.id,
                track: {
                    id: entry.track_id,
                    title: entry.track_title,
                    artist: entry.track_artist,
                    thumbnail: entry.track_thumbnail,
                    duration: entry.track_duration,
                },
                playedAt: entry.played_at,
                completionRate: entry.completion_rate,
                skipped: entry.skipped,
            });
            return acc;
        }, {});

        return NextResponse.json({
            history: groupedByDate,
            totalPlays: history.length,
            days,
        });

    } catch (error) {
        console.error('[History] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { track, completionRate = 0, skipped = false } = body;

        if (!track || !track.id || !track.title || !track.artist) {
            return NextResponse.json(
                { error: 'Invalid track data' },
                { status: 400 }
            );
        }

        // Check if track was already played today (to prevent duplicates)
        const today = new Date().toISOString().split('T')[0];

        const { data: existing, error: checkError } = await supabase
            .from('daily_listening_history')
            .select('id, played_at, completion_rate')
            .eq('user_id', user.id)
            .eq('track_id', track.id)
            .eq('date', today)
            .single();

        if (existing) {
            // Update timestamp of existing entry instead of creating new duplicate
            const { error: updateError } = await supabase
                .from('daily_listening_history')
                .update({
                    played_at: new Date().toISOString(),
                    completion_rate: Math.max(existing.completion_rate || 0, completionRate), // Keep max progress
                    skipped: skipped // Update skipped status
                })
                .eq('id', existing.id);

            if (updateError) {
                console.error('[History] Update error:', updateError);
                return NextResponse.json({ error: 'Failed to update history' }, { status: 500 });
            }
            console.log('[History] Updated existing entry for today:', track.title);
        } else {
            // Insert new entry if not played today
            const { error } = await supabase
                .from('daily_listening_history')
                .insert({
                    user_id: user.id,
                    track_id: track.id,
                    track_title: track.title,
                    track_artist: track.artist,
                    track_thumbnail: track.thumbnail || '',
                    track_duration: track.duration || 0,
                    completion_rate: completionRate,
                    skipped,
                    date: today
                });

            if (error) {
                console.error('[History] Save error:', error);
                return NextResponse.json({ error: 'Failed to save history' }, { status: 500 });
            }
            console.log('[History] Saved new play:', track.title);
        }



        // ---------------------------------------------------------------------
        // LAZY CLEANUP STRATEGY (No Cron Required)
        // ---------------------------------------------------------------------
        // 10% chance to clean up old history whenever a song is saved.
        // This ensures the database stays clean even without external cron jobs.
        if (Math.random() < 0.1) {
            console.log('[History] Triggering background cleanup...');

            // Fire and forget (don't await)
            (async () => {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                const cutoff = thirtyDaysAgo.toISOString().split('T')[0];

                const { error: cleanupError } = await supabase
                    .from('daily_listening_history')
                    .delete()
                    .lt('date', cutoff);

                if (cleanupError) console.error('[History] Cleanup failed:', cleanupError);
                else console.log('[History] Background cleanup complete');
            })();
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('[History] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
