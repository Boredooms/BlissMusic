'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Play, Music, Zap, Moon, Sun, Cloud, Heart, Coffee, Dumbbell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Mock trending searches
const TRENDING_SEARCHES = [
    "Arijit Singh", "lofi beats", "Diljit Dosanjh", "Taylor Swift",
    "Top 50 Global", "New Releases", "Podcast", "Hip Hop",
    "Workout Mix", "Sleep Sounds", "Party Classics"
];

// Moods data
const MOODS = [
    { id: 'chill', label: 'Chill', color: 'from-blue-600 to-purple-600', icon: Coffee, query: 'chill hits' },
    { id: 'party', label: 'Party', color: 'from-orange-500 to-red-600', icon: Zap, query: 'party songs' },
    { id: 'focus', label: 'Focus', color: 'from-teal-500 to-emerald-600', icon: Music, query: 'focus music' },
    { id: 'workout', label: 'Workout', color: 'from-red-600 to-rose-900', icon: Dumbbell, query: 'workout motivation' },
    { id: 'romance', label: 'Romance', color: 'from-pink-500 to-rose-500', icon: Heart, query: 'romantic songs' },
    { id: 'sleep', label: 'Sleep', color: 'from-indigo-600 to-slate-800', icon: Moon, query: 'sleep music' },
];

export function SearchLanding() {
    const router = useRouter();
    const [greetingData, setGreetingData] = useState({ text: '', subtext: 'Let\'s find your vibe.' });
    const [factIndex, setFactIndex] = useState(0);

    // Music Facts for "Trivia"
    const FACTS = [
        "Did you know? The world's oldest known musical instrument is a flute made from a bird bone and mammoth ivory, over 40,000 years old!",
        "Spotify has over 80 million tracks. You'd need over 600 years to listen to them all!",
        "Your heartbeat mimics the beat of the music you listen to.",
        "Listening to music can improve your workout performance by up to 15%.",
        "The 'chills' you get from listening to music are caused by dopamine release."
    ];

    useEffect(() => {
        const date = new Date();
        const hour = date.getHours();

        // Get user's city from timezone (e.g., "Asia/Kolkata" -> "Kolkata")
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const city = timeZone ? timeZone.split('/')[1]?.replace(/_/g, ' ') : '';

        let text = '';
        let subtext = `Let's find your vibe for ${hour >= 17 || hour < 5 ? 'tonight' : 'today'}.`;

        if (hour >= 5 && hour < 12) {
            text = city ? `Good Morning, ${city}` : 'Good Morning';
        } else if (hour >= 12 && hour < 17) {
            text = city ? `Good Afternoon, ${city}` : 'Good Afternoon';
        } else if (hour >= 17 && hour < 21) {
            text = city ? `Good Evening, ${city}` : 'Good Evening';
        } else {
            // Late night cool greetings (9 PM - 5 AM)
            const nightGreetings = [
                "After Hours",
                city ? `Midnight in ${city}` : "Midnight Moods",
                "Neon Nights",
                "Dreaming Awake",
                "Night Owl?",
                city ? `${city} After Dark` : "Into The Night"
            ];
            text = nightGreetings[Math.floor(Math.random() * nightGreetings.length)];
            subtext = "The world is quiet. The music is loud.";
        }

        setGreetingData({ text, subtext });
    }, []);

    const handleMoodClick = (query: string) => {
        router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    const handleSurpriseMe = () => {
        const randomTerms = ['Jazz Classics', 'Synthwave', '90s Rock', 'Indie Pop', 'Classical Essentials', 'K-Pop Hits'];
        const randomTerm = randomTerms[Math.floor(Math.random() * randomTerms.length)];
        router.push(`/search?q=${encodeURIComponent(randomTerm)}`);
    };

    const nextFact = () => {
        setFactIndex((prev) => (prev + 1) % FACTS.length);
    };

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-in fade-in duration-500">
            {/* Greeting Section */}
            <div className="space-y-1">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-3"
                >
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tighter text-white">
                        {greetingData.text}
                    </h1>
                    <motion.span
                        animate={{ rotate: [0, 14, -8, 14, -4, 10, 0, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                        className="text-3xl md:text-5xl inline-block origin-bottom-right"
                    >
                        👋
                    </motion.span>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="text-neutral-400 text-base md:text-lg font-medium"
                >
                    {greetingData.subtext}
                </motion.p>
            </div>

            {/* Trending Ticker */}
            <div className="w-full overflow-hidden bg-white/5 border border-white/10 rounded-xl py-3 relative group">
                <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black to-transparent z-10" />

                <motion.div
                    className="flex whitespace-nowrap gap-8 text-neutral-400 font-medium text-sm md:text-base items-center"
                    animate={{ x: [0, -1000] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30,
                    }}
                >
                    {/* Duplicated list for seamless scrolling */}
                    {[...TRENDING_SEARCHES, ...TRENDING_SEARCHES, ...TRENDING_SEARCHES].map((term, i) => (
                        <span
                            key={i}
                            onClick={() => handleMoodClick(term)}
                            className="cursor-pointer hover:text-white transition-colors"
                        >
                            #{term}
                        </span>
                    ))}
                </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Moods Section (2 Columns width) */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-yellow-400" />
                            Vibe Check
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {MOODS.map((mood, index) => (
                            <motion.div
                                key={mood.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleMoodClick(mood.query)}
                                className={cn(
                                    "relative h-32 rounded-xl overflow-hidden cursor-pointer group shadow-lg",
                                    "bg-gradient-to-br", mood.color
                                )}
                            >
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                                <div className="absolute top-3 left-3">
                                    <mood.icon className="w-6 h-6 text-white/80" />
                                </div>
                                <span className="absolute bottom-3 right-4 font-bold text-xl text-white tracking-wide">
                                    {mood.label}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Interactive / Games Section (1 Column width) */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Play className="w-5 h-5 text-purple-400" />
                        Quick Play
                    </h2>

                    {/* Surprise Me Card */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="p-6 rounded-xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10 text-center space-y-4 relative overflow-hidden group"
                    >
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl group-hover:bg-purple-500/30 transition-colors" />

                        <div className="relative z-10">
                            <h3 className="text-xl font-bold text-white mb-2">Can't Decide?</h3>
                            <p className="text-sm text-neutral-300 mb-6">Let fate choose your next favorite song!</p>
                            <Button
                                onClick={handleSurpriseMe}
                                className="w-full bg-white text-black hover:bg-neutral-200 font-bold py-6 text-lg rounded-full shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                            >
                                Surprise Me <Sparkles className="w-5 h-5 ml-2 fill-current" />
                            </Button>
                        </div>
                    </motion.div>

                    {/* Trivia Card */}
                    <div
                        onClick={nextFact}
                        className="p-6 rounded-xl bg-white/5 border border-white/10 cursor-pointer min-h-[160px] flex flex-col justify-between transition-colors hover:bg-white/10"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-green-400">Did You Know?</span>
                            <span className="text-xs text-neutral-500 text-right">Tap for new fact</span>
                        </div>
                        <AnimatePresence mode='wait'>
                            <motion.p
                                key={factIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="text-sm md:text-base text-neutral-200 font-medium leading-relaxed italic"
                            >
                                "{FACTS[factIndex]}"
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SearchLanding;
