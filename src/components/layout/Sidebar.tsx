'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';
import {
    Home,
    Search,
    Library,
    ListMusic,
    Plus,
    Settings,
    ChevronLeft,
    Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUIStore } from '@/stores/uiStore';
import { useRouter } from 'next/navigation';
import { usePlaylistsStore } from '@/stores/playlistsStore';
import { Separator } from '@/components/ui/separator';

const mainNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/library', label: 'Library', icon: Library },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isSidebarCollapsed, toggleSidebar, setCreatePlaylistModalOpen } = useUIStore();
    const playlists = usePlaylistsStore((state) => state.playlists);
    const router = useRouter();

    const handleCreatePlaylist = () => {
        setCreatePlaylistModalOpen(true);
    };

    return (
        <aside
            className={cn(
                "hidden md:flex flex-col h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out relative group",
                isSidebarCollapsed ? "w-20" : "w-64"
            )}
        >
            {/* Collapse Toggle Button - Visible on hover or when collapsed */}
            <button
                onClick={toggleSidebar}
                className={cn(
                    "absolute -right-3 top-8 z-50 w-6 h-6 bg-sidebar border border-sidebar-border rounded-full flex items-center justify-center text-muted-foreground hover:text-white transition-opacity",
                    isSidebarCollapsed ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
            >
                <ChevronLeft className={cn("w-3 h-3 transition-transform", isSidebarCollapsed && "rotate-180")} />
            </button>


            {/* Logo */}
            <div className={cn("flex items-center gap-3 px-6 py-6", isSidebarCollapsed && "justify-center px-2")}>
                {!isSidebarCollapsed && (
                    <>
                        <Logo width={40} height={40} />
                        <span className="font-semibold text-lg tracking-tight">BlissMusic</span>
                    </>
                )}
                {isSidebarCollapsed && (
                    <Logo width={32} height={32} />
                )}
            </div>


            {/* Main Navigation */}
            <nav className={cn("px-3 space-y-1", isSidebarCollapsed && "px-2")}>
                {mainNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link key={item.href} href={item.href}>
                            <div
                                className={cn(
                                    'flex items-center gap-4 px-3 py-2.5 rounded-lg transition-colors',
                                    isActive
                                        ? 'bg-white/10 text-white font-medium'
                                        : 'text-muted-foreground hover:text-white hover:bg-white/5',
                                    isSidebarCollapsed && 'justify-center px-0 py-3'
                                )}
                                title={isSidebarCollapsed ? item.label : undefined}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!isSidebarCollapsed && <span>{item.label}</span>}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className={cn("px-3 my-4", isSidebarCollapsed && "px-2")}>
                <div className="h-[1px] bg-white/10 w-full" />
            </div>

            {/* Create Playlist Button */}
            <div className={cn("px-3", isSidebarCollapsed && "px-2")}>
                <Button
                    variant="ghost"
                    onClick={handleCreatePlaylist}
                    className={cn(
                        "w-full justify-start gap-4 text-muted-foreground hover:text-white hover:bg-white/5",
                        isSidebarCollapsed && "justify-center px-0"
                    )}
                    title={isSidebarCollapsed ? "Create Playlist" : undefined}
                >
                    <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center flex-shrink-0">
                        <Plus className="w-4 h-4" />
                    </div>
                    {!isSidebarCollapsed && <span>Create Playlist</span>}
                </Button>
            </div>

            {/* Playlists */}
            <div className="flex-1 mt-4 overflow-hidden flex flex-col">
                {!isSidebarCollapsed && (
                    <div className="px-6 mb-2 flex-shrink-0">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Playlists
                        </h3>
                    </div>
                )}
                <ScrollArea className="flex-1 px-3">
                    <div className="space-y-1">
                        <Link href="/playlist/liked">
                            <div
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors",
                                    isSidebarCollapsed && "justify-center px-0 py-3"
                                )}
                                title={isSidebarCollapsed ? "Liked Songs" : undefined}
                            >
                                <ListMusic className="w-4 h-4 flex-shrink-0" />
                                {!isSidebarCollapsed && <span className="truncate">Liked Songs</span>}
                            </div>
                        </Link>

                        {/* User Playlists */}
                        {playlists.map((playlist) => (
                            <Link key={playlist.id} href={`/playlist/${playlist.id}`}>
                                <div
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors",
                                        isSidebarCollapsed && "justify-center px-0 py-3"
                                    )}
                                    title={isSidebarCollapsed ? playlist.name : undefined}
                                >
                                    <ListMusic className="w-4 h-4 flex-shrink-0" />
                                    {!isSidebarCollapsed && <span className="truncate">{playlist.name}</span>}
                                </div>
                            </Link>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Settings */}
            <div className="p-3 border-t border-white/5 flex-shrink-0">
                <Link href="/settings">
                    <div
                        className={cn(
                            "flex items-center gap-4 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors",
                            isSidebarCollapsed && "justify-center px-0"
                        )}
                        title={isSidebarCollapsed ? "Settings" : undefined}
                    >
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        {!isSidebarCollapsed && <span>Settings</span>}
                    </div>
                </Link>
            </div>
        </aside>
    );
}
