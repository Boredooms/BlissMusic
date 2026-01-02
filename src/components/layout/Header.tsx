'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Search, ChevronLeft, ChevronRight, User, Settings, LogOut, Library, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/stores/authStore';
import { LoginModal } from '@/components/auth/LoginModal';
import { MobileNav } from './MobileNav';
import { cn } from '@/lib/utils';

export function Header() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [suggestions, setSuggestions] = useState<{ tracks: any[]; artists: any[] }>({ tracks: [], artists: [] });
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showSignIn, setShowSignIn] = useState(false);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);

    const { userId, email, displayName, avatarUrl, signOut } = useAuthStore();

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch suggestions
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (debouncedQuery.length < 2) {
                setSuggestions({ tracks: [], artists: [] });
                return;
            }

            setIsLoadingSuggestions(true);
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`);
                const data = await response.json();
                if (data.tracks || data.artists) {
                    setSuggestions({
                        tracks: data.tracks || [],
                        artists: data.artists || []
                    });
                }
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            } finally {
                setIsLoadingSuggestions(false);
            }
        };

        fetchSuggestions();
    }, [debouncedQuery]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuggestions(false);
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleSuggestionClick = (type: 'track' | 'artist', id: string) => {
        setShowSuggestions(false);
        if (type === 'track') {
            // Play track logic could go here, for now navigate to playlist/track context or search
            // Since we don't have a direct "play track" global function easily accessible without imports, 
            // and usually search click navigates or plays.
            // Let's navigate to the search page for now to be safe, or we could import useQueueStore.
            // Requirement said "getting real song shows it with proper title and artist" - suggesting Play.
            // Let's navigate to search results for that specific item or just search.
            // User asked "predictive search like youtube music... standard is click -> play or click -> navigate"
            // Let's standard search for now.
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    return (
        <>
            <header className="sticky top-0 z-40 w-full h-16 px-4 md:px-6 flex items-center bg-black/50 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
                <div className="w-full max-w-[1920px] mx-auto grid grid-cols-[auto_1fr_auto] gap-4 items-center">

                    {/* LEFT: Navigation Controls */}
                    <div className="flex items-center gap-3">
                        <MobileNav />
                        <div className="hidden md:flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 rounded-full bg-black/40 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-30 border border-transparent hover:border-white/10"
                                onClick={() => router.back()}
                                title="Go Back"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 rounded-full bg-black/40 hover:bg-white/10 text-white/70 hover:text-white transition-all disabled:opacity-30 border border-transparent hover:border-white/10"
                                onClick={() => router.forward()}
                                title="Go Forward"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>

                    {/* CENTER: Spotlight Search Bar */}
                    <div className="flex justify-center max-w-2xl mx-auto w-full px-4" ref={searchContainerRef}>
                        <form onSubmit={handleSearch} className="w-full relative group">
                            <div className={cn(
                                "relative flex items-center transition-all duration-300 rounded-full overflow-hidden z-50",
                                isSearchFocused || showSuggestions
                                    ? "bg-neutral-800 ring-2 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                    : "bg-neutral-900/60 hover:bg-neutral-800 border border-white/5 hover:border-white/10"
                            )}>
                                <div className="absolute left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className={cn(
                                        "w-5 h-5 transition-colors duration-300",
                                        isSearchFocused ? "text-white" : "text-neutral-500"
                                    )} />
                                </div>
                                <Input
                                    type="text"
                                    placeholder="What do you want to play?"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => {
                                        setIsSearchFocused(true);
                                        setShowSuggestions(true);
                                    }}
                                    onBlur={() => setIsSearchFocused(false)}
                                    className="w-full h-12 pl-12 pr-4 bg-transparent border-0 placeholder:text-neutral-500 text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0 text-white truncate"
                                />
                                {isLoadingSuggestions && (
                                    <div className="absolute right-3 flex items-center pointer-events-none">
                                        <Loader2 className="w-4 h-4 animate-spin text-neutral-400" />
                                    </div>
                                )}
                            </div>

                            {/* Search Suggestions Dropdown */}
                            {showSuggestions && searchQuery.length >= 2 && (suggestions.tracks.length > 0 || suggestions.artists.length > 0) && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-2">
                                    <div className="max-h-[60vh] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-neutral-700/50 [&::-webkit-scrollbar-thumb]:hover:bg-neutral-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
                                        {suggestions.tracks.length > 0 && (
                                            <div className="mb-2">
                                                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3 py-2">Songs</h3>
                                                {suggestions.tracks.map((track) => (
                                                    <div
                                                        key={track.id}
                                                        onClick={() => {
                                                            setSearchQuery(track.title);
                                                            handleSearch({ preventDefault: () => { } } as React.FormEvent);
                                                        }}
                                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer group transition-colors"
                                                    >
                                                        <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0 bg-neutral-800">
                                                            <Image
                                                                src={track.thumbnail || '/placeholder.png'}
                                                                alt={track.title}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-medium text-white truncate">{track.title}</h4>
                                                            <p className="text-xs text-neutral-400 truncate">{track.artist}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {suggestions.artists.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider px-3 py-2">Artists</h3>
                                                {suggestions.artists.map((artist) => (
                                                    <div
                                                        key={artist.id}
                                                        onClick={() => {
                                                            setSearchQuery(artist.name);
                                                            handleSearch({ preventDefault: () => { } } as React.FormEvent);
                                                        }}
                                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 cursor-pointer group transition-colors"
                                                    >
                                                        <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-neutral-800">
                                                            <Image
                                                                src={artist.thumbnail || '/placeholder.png'}
                                                                alt={artist.name}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-medium text-white truncate">{artist.name}</h4>
                                                            <p className="text-xs text-neutral-400 truncate">Artist</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* RIGHT: User Profile & Actions */}
                    <div className="flex items-center justify-end gap-3 min-w-[80px]">
                        {userId ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className={cn(
                                            "flex items-center gap-2 pl-1 pr-3 py-1 h-10 hover:bg-white/10 rounded-full transition-all group border border-transparent hover:border-white/5",
                                            "data-[state=open]:bg-white/10 data-[state=open]:border-white/5"
                                        )}
                                    >
                                        <Avatar className="w-8 h-8 border border-white/10 shadow-sm transition-transform group-hover:scale-105">
                                            {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName || 'User'} />}
                                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold">
                                                {displayName?.charAt(0).toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="hidden lg:block text-sm font-medium text-white/90 max-w-[100px] truncate">
                                            {displayName || 'User'}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="end"
                                    className="w-64 bg-[#121212]/95 backdrop-blur-2xl border-white/10 text-white shadow-2xl rounded-xl p-2 mt-2"
                                >
                                    <div className="px-3 py-3 mb-1">
                                        <p className="text-sm font-semibold text-white">{displayName}</p>
                                        <p className="text-xs text-neutral-400 truncate mt-0.5">{email}</p>
                                    </div>
                                    <DropdownMenuSeparator className="bg-white/10 mx-1" />

                                    <DropdownMenuItem onClick={() => router.push('/library')} className="gap-3 p-3 rounded-lg focus:bg-white/10 focus:text-white cursor-pointer group">
                                        <Library className="w-4 h-4 text-neutral-400 group-focus:text-white transition-colors" />
                                        <span className="font-medium">Your Library</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem onClick={() => router.push('/settings')} className="gap-3 p-3 rounded-lg focus:bg-white/10 focus:text-white cursor-pointer group">
                                        <Settings className="w-4 h-4 text-neutral-400 group-focus:text-white transition-colors" />
                                        <span className="font-medium">Settings</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator className="bg-white/10 mx-1 my-1" />

                                    <DropdownMenuItem onClick={signOut} className="gap-3 p-3 rounded-lg focus:bg-red-500/10 focus:text-red-400 text-red-400 cursor-pointer group">
                                        <LogOut className="w-4 h-4" />
                                        <span className="font-medium">Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button
                                onClick={() => setShowSignIn(true)}
                                className="bg-white text-black hover:bg-neutral-200 font-bold rounded-full px-8 h-10 transition-transform hover:scale-105"
                            >
                                Log in
                            </Button>
                        )}
                    </div>

                </div>
            </header>

            <LoginModal isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
        </>
    );
}
