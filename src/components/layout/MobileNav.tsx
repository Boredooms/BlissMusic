'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    Home,
    Search,
    Library,
    ListMusic,
    Plus,
    Settings,
    Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useUIStore } from '@/stores/uiStore';

const mainNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/library', label: 'Library', icon: Library },
];

export function MobileNav() {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const setCreatePlaylistModalOpen = useUIStore((state) => state.setCreatePlaylistModalOpen);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-white/70 hover:text-white">
                    <Menu className="w-6 h-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0 bg-sidebar border-r border-sidebar-border">
                <div className="flex flex-col h-full">
                    <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

                    {/* Logo */}
                    <div className="flex items-center gap-3 px-6 py-6 border-b border-white/5">
                        <Logo width={40} height={40} />
                        <span className="font-semibold text-lg tracking-tight">BlissMusic</span>
                    </div>

                    {/* Main Navigation */}
                    <nav className="px-3 py-4 space-y-1">
                        {mainNavItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                                    <div
                                        className={cn(
                                            'flex items-center gap-4 px-3 py-3 rounded-lg transition-colors',
                                            isActive
                                                ? 'bg-white/10 text-white font-medium'
                                                : 'text-muted-foreground hover:text-white hover:bg-white/5'
                                        )}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                    </div>
                                </Link>
                            );
                        })}
                    </nav>

                    <Separator className="mx-3 bg-white/10" />

                    {/* Create Playlist Button */}
                    <div className="px-3 mt-4">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setOpen(false);
                                setCreatePlaylistModalOpen(true);
                            }}
                            className="w-full justify-start gap-4 text-muted-foreground hover:text-white hover:bg-white/5 h-12"
                        >
                            <div className="w-6 h-6 rounded bg-white/10 flex items-center justify-center">
                                <Plus className="w-4 h-4" />
                            </div>
                            <span>Create Playlist</span>
                        </Button>
                    </div>

                    {/* Playlists */}
                    <div className="flex-1 mt-4 overflow-hidden flex flex-col">
                        <div className="px-6 mb-2">
                            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Playlists
                            </h3>
                        </div>
                        <ScrollArea className="flex-1 px-3">
                            <div className="space-y-1">
                                <Link href="/playlist/liked" onClick={() => setOpen(false)}>
                                    <div className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                                        <ListMusic className="w-4 h-4" />
                                        <span className="truncate">Liked Songs</span>
                                    </div>
                                </Link>
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Settings */}
                    <div className="p-4 border-t border-white/5">
                        <Link href="/settings" onClick={() => setOpen(false)}>
                            <div className="flex items-center gap-4 px-3 py-3 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors">
                                <Settings className="w-5 h-5" />
                                <span>Settings</span>
                            </div>
                        </Link>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
