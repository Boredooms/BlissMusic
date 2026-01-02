/**
 * Cleanup Old History Cron Job
 * Runs daily to delete listening history older than 7 days
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        // Verify cron secret (Vercel Cron Jobs)
        const authHeader = process.env.CRON_SECRET;

        if (!authHeader) {
            return NextResponse.json(
                { error: 'Unauthorized - No cron secret' },
                { status: 401 }
            );
        }

        const supabase = await createClient();

        // Delete history older than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('daily_listening_history')
            .delete()
            .lt('date', cutoffDate)
            .select('count');

        if (error) {
            console.error('[Cleanup] Error:', error);
            return NextResponse.json(
                { error: 'Cleanup failed', details: error },
                { status: 500 }
            );
        }

        const deletedCount = data?.length || 0;
        console.log(`[Cleanup] ✅ Deleted ${deletedCount} old history entries`);

        return NextResponse.json({
            success: true,
            deletedCount,
            cutoffDate,
            message: `Deleted history older than ${cutoffDate}`,
        });

    } catch (error) {
        console.error('[Cleanup] Fatal error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
