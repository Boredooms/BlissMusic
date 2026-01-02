// Track interface
export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  thumbnail: string;
  duration: number; // in seconds
  videoId: string;
}

// Artist interface
export interface Artist {
  id: string;
  name: string;
  thumbnail: string;
  subscribers?: string;
}

// Album interface
export interface Album {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  year?: number;
  trackCount?: number;
}

// Playlist interface
export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  trackCount: number;
  isPublic: boolean;
  createdAt: string;
}

// Search Results
export interface SearchResults {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
}

// Listening History
export interface HistoryItem {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  thumbnail: string;
  playedAt: string;
  playCount: number;
}

// Player State
export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

// Queue State
export type RepeatMode = 'off' | 'one' | 'all';

export interface QueueState {
  queue: Track[];
  originalQueue: Track[];
  currentIndex: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
}

// User Preferences
export interface UserPreferences {
  favoriteGenres: string[];
  favoriteArtists: string[];
  listeningMoods: string[];
}

// Lyrics
export interface LyricLine {
  time: number;
  text: string;
}

export interface Lyrics {
  synced: boolean;
  lines: LyricLine[];
}
