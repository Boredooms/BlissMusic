'use client';

import { cn } from '@/lib/utils';
import { useRef, useState, useEffect } from 'react';
import {
    Zap,
    Coffee,
    Dumbbell,
    Brain,
    PartyPopper,
    Heart,
    CloudRain,
    Moon,
    Car,
    Sun,
    ChevronLeft,
    ChevronRight,
    Play
} from 'lucide-react';
import { Button } from '../ui/button';

const moodConfig: Record<string, { icon: any, gradient: string }> = {
    'Energize': {
        icon: Zap,
        gradient: 'from-orange-500 to-yellow-500'
    },
    'Relax': {
        icon: Coffee,
        gradient: 'from-blue-400 to-emerald-400'
    },
    'Workout': {
        icon: Dumbbell,
        gradient: 'from-red-600 to-orange-600'
    },
    'Focus': {
        icon: Brain,
        gradient: 'from-violet-600 to-indigo-600'
    },
    'Party': {
        icon: PartyPopper,
        gradient: 'from-pink-500 to-rose-500'
    },
    'Romance': {
        icon: Heart,
        gradient: 'from-rose-400 to-red-500'
    },
    'Sad': {
        icon: CloudRain,
        gradient: 'from-slate-500 to-gray-600'
    },
    'Sleep': {
        icon: Moon,
        gradient: 'from-indigo-900 to-slate-800'
    },
    'Commute': {
        icon: Car,
        gradient: 'from-sky-500 to-blue-600'
    },
    'Feel Good': {
        icon: Sun,
        gradient: 'from-amber-400 to-orange-400'
    },
};

const moods = Object.keys(moodConfig);

interface MoodChipsProps {
    selectedMood: string | null;
    onMoodSelect: (mood: string | null) => void;
}

export function MoodChips({ selectedMood, onMoodSelect }: MoodChipsProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10); // tolerance
        }
    };

    useEffect(() => {
        checkScroll();
        window.addEventListener('resize', checkScroll);
        return () => window.removeEventListener('resize', checkScroll);
    }, []);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = 300;
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <div className="relative w-full group/container">
            {/* Left Scroll Button */}
            {canScrollLeft && (
                <div className="absolute left-0 top-0 bottom-6 z-20 flex items-center bg-gradient-to-r from-black/80 to-transparent pr-8 pl-1 rounded-l-xl">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll('left')}
                        className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 text-white"
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </Button>
                </div>
            )}

            {/* Right Scroll Button */}
            {canScrollRight && (
                <div className="absolute right-0 top-0 bottom-6 z-20 flex items-center justify-end bg-gradient-to-l from-black/80 to-transparent pl-8 pr-1 rounded-r-xl">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll('right')}
                        className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 text-white"
                    >
                        <ChevronRight className="h-6 w-6" />
                    </Button>
                </div>
            )}

            {/* Horizontal Scroll Container */}
            <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex gap-4 overflow-x-auto pb-6 pt-2 px-1 hide-scrollbar snap-x scroll-smooth"
            >
                {moods.map((mood) => {
                    const config = moodConfig[mood];
                    const Icon = config.icon;
                    const isSelected = selectedMood === mood;

                    return (
                        <button
                            key={mood}
                            onClick={() => onMoodSelect(isSelected ? null : mood)}
                            className={cn(
                                "relative group flex-shrink-0 w-36 h-36 rounded-2xl p-4 transition-all duration-500 ease-out snap-start",
                                "flex flex-col items-start justify-end overflow-hidden",
                                "border border-white/5",
                                // Default Style: Black/Dark Box
                                // Selected Style: Full Gradient Highlighed
                                isSelected
                                    ? "ring-2 ring-white scale-105 shadow-xl shadow-black/50"
                                    : "bg-neutral-900/40 hover:scale-105 hover:bg-neutral-800/60"
                            )}
                        >
                            {/* Background Gradient - Only on Hover or Selected */}
                            <div className={cn(
                                "absolute inset-0 bg-gradient-to-br transition-all duration-500 ease-out",
                                config.gradient,
                                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )} />

                            {/* Default Dark Background (hidden on hover/select) */}
                            <div className={cn(
                                "absolute inset-0 bg-neutral-950/80 transition-opacity duration-300",
                                isSelected || "group-hover:opacity-0"
                            )} />

                            {/* Icon */}
                            <div className={cn(
                                "relative z-10 mb-auto transition-transform duration-500",
                                isSelected
                                    ? "text-white scale-110"
                                    : "text-neutral-400 group-hover:text-white group-hover:scale-125 group-hover:rotate-6" // Animated logo on hover
                            )}>
                                <Icon className="w-8 h-8" />
                            </div>

                            {/* Text */}
                            <span className={cn(
                                "relative z-10 text-lg font-bold tracking-tight transition-colors duration-300",
                                isSelected ? "text-white" : "text-neutral-400 group-hover:text-white"
                            )}>
                                {mood}
                            </span>

                            {/* Play Icon Indicator on Hover */}
                            <div className={cn(
                                "absolute right-3 bottom-3 opacity-0 transform translate-y-2 transition-all duration-300",
                                "group-hover:opacity-100 group-hover:translate-y-0"
                            )}>
                                <Play className="w-4 h-4 fill-white text-white" />
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
