import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');
    const origin = requestUrl.origin;

    if (code) {
        try {
            const supabase = await createClient();
            const { error } = await supabase.auth.exchangeCodeForSession(code);

            if (error) {
                console.error('Auth callback error:', error);
                return NextResponse.redirect(`${origin}/?error=auth_failed`);
            }
        } catch (err) {
            console.error('Server error during auth callback:', err);
            return NextResponse.redirect(`${origin}/?error=server_error`);
        }
    }

    // Redirect to home page after successful auth
    return NextResponse.redirect(`${origin}/`);
}
