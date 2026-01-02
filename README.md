<div align="center">

<img src="./logo.png" width="120" alt="BlissMusic Logo">

# 🎵 BlissMusic

### *Your Personal AI-Powered Music Sanctuary*

**Experience music like never before with intelligent recommendations, seamless streaming, and a stunning interface.**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

[🚀 Live Demo](https://blissmusic.vercel.app) • [📖 Documentation](#quick-start) • [🐛 Report Bug](https://github.com/Boredooms/BlissMusic/issues) • [✨ Request Feature](https://github.com/Boredooms/BlissMusic/issues)

</div>

---

## ✨ Why BlissMusic?

**BlissMusic** isn't just another music player—it's a **next-generation music experience** that understands you, adapts to your mood, and keeps you hooked with AI-curated playlists.

### 🎯 **What Makes Us Different**

- **🤖 100% AI-Free Recommendations** - Lightning-fast algorithmic curation without quota limits
- **⚡ Instant Search** - Find any song, artist, or album in milliseconds
- **🎨 Stunning UI** - Premium glassmorphic design with smooth animations
- **🌍 Regional Intelligence** - Bollywood, K-pop, Latin, Western - perfectly curated for your region
- **🕐 Time-Aware Playlists** - Morning energy, afternoon chill, evening party, late-night vibes
- **🚫 Zero Ads, Zero Subscriptions** - Completely free, forever

---

## 🎬 Features That'll Blow Your Mind

### 🎵 **Smart Music Discovery**

#### **Made for You** - Your Personal DJ
Time-aware, mood-matched playlists that evolve throughout the day:
- ☕ **Morning** - Energetic workout anthems
- 🌅 **Afternoon** - Relaxing background music
- 🌆 **Evening** - Party hits & trending bops
- 🌙 **Late Night** - Chill, romantic, lofi vibes

#### **Quick Picks** - Regional Trending
Hybrid AI + YouTube algorithm delivering:
- 🔥 Trending hits in your region
- ✨ AI-curated mood picks
- ↺ Songs from your rotation

#### **Smart Recommendations**
Pure algorithmic genius with:
- 🎭 Mood extraction from song titles
- 🌏 Regional artist detection (Ali Zafar → Bollywood + Coke Studio)
- 🎤 Similar artist mapping
- 📊 Listening history analysis

### 🎨 **Premium User Experience**

#### **Beautiful Player Interface**
- 🖼️ Album art with 7-source cascading fallback
- 📜 Cached lyrics (30-day storage, zero API calls)
- 🎚️ Smooth progress bar with time tracking
- 💾 Queue management with shuffle/repeat

#### **Blazing Fast Performance**
- ⚡ IndexedDB caching for instant loads
- 🔄 1-hour cache for Fresh content
- 🚀 Parallel searches for speed
- 🎯 Triple deduplication (no duplicate tracks!)

#### **Intelligent History**
- 📊 Recently played with auto-deduplication
- 💖 Liked songs library
- 🎵 Personalized playlists based on your taste

### 🔐 **Seamless Authentication**
- 🔑 Google OAuth integration
- 🗄️ Supabase backend for data persistence
- 👤 Profile with listening stats

---

## 🛠️ **Tech Stack - Built with the Best**

### **Frontend**
- **Next.js 16.1** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Shadcn/ui** - Beautiful component library
- **Zustand** - Lightweight state management
- **IndexedDB (idb-keyval)** - Client-side caching

### **Backend & APIs**
- **Supabase** - PostgreSQL database + Auth
- **YouTube Music API (ytmusic-api)** - Quota-free scraping
- **YouTube Data API v3** - High-quality trending data
- **lrclib.net** - Time-synced lyrics
- **Google Gemini** (Optional) - AI enhancements

### **Deployment**
- **Vercel** - Edge network for global speed

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm/yarn/pnpm
- Google Cloud Console account
- Supabase account

### **Installation**

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/just-chillin.git
cd just-chillin

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Add your API keys (see Configuration section below)

# 4. Run development server
npm run dev

# 5. Open in browser
# Navigate to http://localhost:3000
```

### **🔧 Configuration**

Create a `.env.local` file with these variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# APIs (Optional but recommended)
GEMINI_API_KEY=your_gemini_key
YOUTUBE_API_KEY=your_youtube_key

# NextAuth
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
```

**Get Your Keys:**
- 🔑 [Supabase Setup](https://supabase.com/docs/guides/auth)
- 🔐 [Google OAuth Setup](https://console.cloud.google.com/apis/credentials)
- 🤖 [Gemini API Key](https://aistudio.google.com/app/apikey)
- 📺 [YouTube API Key](https://console.cloud.google.com/apis/credentials)

---

## � **Screenshots**

### 🏠 **Home - Discover New Music**
![Home Page](docs/screenshots/home.png)
*Trending songs, Made for You, Quick Picks, and Mood-based playlists*

### 🎵 **Now Playing - Immersive Experience**
![Now Playing](docs/screenshots/now-playing.png)
*Album art, lyrics, queue, and related tracks*

### 🔍 **Search - Find Anything**
![Search](docs/screenshots/search.png)
*Instant search across songs, artists, albums, and playlists*

### 📚 **Library - Your Collection**
![Library](docs/screenshots/library.png)
*Liked songs and personalized playlists*

---

## � **Project Structure**

```
just-chillin/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   │   ├── recommendations/
│   │   │   │   ├── made-for-you/
│   │   │   │   ├── quick-picks/
│   │   │   │   └── smart/
│   │   │   ├── lyrics/
│   │   │   └── trending/
│   │   ├── auth/              # Authentication
│   │   └── (pages)/           # App pages
│   ├── components/            # React components
│   │   ├── home/             # Homepage sections
│   │   ├── player/           # Music player UI
│   │   └── ui/               # Reusable UI components
│   ├── lib/                   # Utilities & services
│   │   ├── youtube/          # YouTube Music integration
│   │   ├── recommendations/  # Recommendation engines
│   │   └── gemini.ts         # AI integration
│   ├── stores/               # Zustand state management
│   └── types/                # TypeScript definitions
├── public/                    # Static assets
└── docs/                      # Documentation
```

---

## 🎯 **Roadmap**

### **Current Features** ✅
- [x] Smart algorithmic recommendations
- [x] Time-aware playlists
- [x] Regional music curation
- [x] Lyrics support with caching
- [x] Google authentication
- [x] Listening history
- [x] Liked songs library

### **Coming Soon** 🔜
- [ ] **Offline Mode** - Download songs for offline playback
- [ ] **Social Features** - Share playlists with friends
- [ ] **Collaborative Playlists** - Create playlists together
- [ ] **Spotify/Apple Music Import** - Bring your existing playlists
- [ ] **Desktop App** - Electron-based native experience
- [ ] **Mobile Apps** - iOS & Android with React Native
- [ ] **Lyrics Karaoke Mode** - Sing along with time-synced lyrics
- [ ] **Audio Visualizer** - Beautiful animations that react to music
- [ ] **Equalizer** - Customize your sound

---

## 🤝 **Contributing**

We love contributions! Here's how you can help:

1. 🍴 **Fork** the repository
2. 🌿 **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. 💾 **Commit** your changes: `git commit -m 'Add amazing feature'`
4. 📤 **Push** to the branch: `git push origin feature/amazing-feature`
5. 🎉 **Open** a Pull Request

### **Development Guidelines**
- Follow TypeScript best practices
- Write clean, self-documenting code
- Test your changes thoroughly
- Update documentation as needed

---

## 📜 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

Special thanks to these amazing projects:

- [**ytmusic-api**](https://github.com/nickfost/ytmusic-api) - Quota-free YouTube Music scraping
- [**Shadcn/ui**](https://ui.shadcn.com/) - Beautiful component library
- [**Lucide Icons**](https://lucide.dev/) - Crisp, beautiful icons
- [**lrclib.net**](https://lrclib.net/) - Free lyrics API
- [**Supabase**](https://supabase.com/) - Open-source Firebase alternative
- [**Vercel**](https://vercel.com/) - Deployment platform

---

## 💬 **Community & Support**

- 💡 **Feature Requests** - [Open an issue](https://github.com/yourusername/just-chillin/issues/new?template=feature_request.md)
- 🐛 **Bug Reports** - [Report a bug](https://github.com/yourusername/just-chillin/issues/new?template=bug_report.md)
- 💬 **Discussions** - [Join the conversation](https://github.com/yourusername/just-chillin/discussions)
- 📧 **Email** - your-email@example.com

---

## � **Stats**

![GitHub stars](https://img.shields.io/github/stars/yourusername/just-chillin?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/just-chillin?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/yourusername/just-chillin?style=social)
![GitHub contributors](https://img.shields.io/github/contributors/yourusername/just-chillin)
![GitHub last commit](https://img.shields.io/github/last-commit/yourusername/just-chillin)
![GitHub repo size](https://img.shields.io/github/repo-size/yourusername/just-chillin)

---

<div align="center">

## 🎉 **Start Vibing Today!**

**[Try Just Chillin Now →](https://your-app.vercel.app)**

Made with 💜 by [Your Name](https://github.com/yourusername)

*If you like this project, don't forget to ⭐ star it!*

</div>

---

## 🔗 **Quick Links**

- 🌐 [Live Demo](https://your-app.vercel.app)
- 📖 [Documentation](docs/)
- 🚀 [Deployment Guide](docs/deployment-guide.md)
- 🎨 [Design System](docs/design-system.md)
- 🔧 [API Reference](docs/api-reference.md)
- 📝 [Changelog](CHANGELOG.md)

---

<div align="center">

**Happy Listening! 🎵**

</div>
