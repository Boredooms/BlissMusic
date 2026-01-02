# BlissMusic - Music Streaming Application

This project is deployed on Vercel.

## Environment Variables

Make sure to set these environment variables in your Vercel project settings:

### Required:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NEXTAUTH_SECRET` - NextAuth secret (generate with: `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your deployment URL (e.g., https://blissmusic.vercel.app)

### Optional:
- `GEMINI_API_KEY` - Google Gemini API key for AI features
- `YOUTUBE_API_KEY` - YouTube Data API v3 key for trending videos

## Deployment

This app is configured for automatic deployment on Vercel. Push to main branch to deploy.

## Post-Deployment Configuration

After deploying:
1. Update Google OAuth redirect URIs in Google Cloud Console to include your Vercel URL
2. Update Supabase allowed URLs to include your Vercel domain
3. Set all environment variables in Vercel project settings
