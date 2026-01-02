'use client';

import { useState } from 'react';
import { TrendingSection, MoodChips, QuickPicks, MadeForYou, MoodMusic, FeaturedPlaylists } from '@/components/home';
import { useSmartQueue } from '@/hooks/useSmartQueue';
import { useAuthStore } from '@/stores/authStore';
import { Logo } from '@/components/ui/Logo';
import { LoginModal } from '@/components/auth/LoginModal';

export default function HomePage() {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const { userId, signInWithGoogle, displayName } = useAuthStore();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(true);

  // Enable smart queue auto-fill only if logged in
  useSmartQueue({ enabled: !!userId, autoFillThreshold: 2 });

  // Get greeting based on time and location
  const getGreeting = () => {
    const hour = new Date().getHours();

    // Get first name from displayName
    const firstName = displayName ? displayName.split(' ')[0] : null;

    if (hour >= 5 && hour < 12) {
      return firstName ? `Good morning, ${firstName}` : 'Good morning';
    } else if (hour >= 12 && hour < 17) {
      return firstName ? `Good afternoon, ${firstName}` : 'Good afternoon';
    } else if (hour >= 17 && hour < 21) {
      return firstName ? `Good evening, ${firstName}` : 'Good evening';
    } else {
      // Late night cool greetings - prioritize showing name when available
      if (firstName) {
        const personalGreetings = [
          `Up late, ${firstName}?`,
          `Still awake, ${firstName}?`,
          `Burning the midnight oil, ${firstName}?`,
          `Night owl mode, ${firstName}?`
        ];
        return personalGreetings[Math.floor(Math.random() * personalGreetings.length)];
      } else {
        const nightGreetings = [
          "After Hours",
          "Midnight Moods",
          "Neon Nights",
          "Dreaming Awake",
          "Night Owl?",
          "Into The Night"
        ];
        return nightGreetings[Math.floor(Math.random() * nightGreetings.length)];
      }
    }
  };

  // Get contextual subtext based on time
  const getSubtext = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) {
      // Morning subtexts
      const morningMessages = [
        "Start your day with the perfect soundtrack.",
        "What's fueling your morning energy?",
        "Coffee's brewing. What's playing?",
        "Rise and shine with your favorite beats.",
        "Let's make this morning legendary."
      ];
      return morningMessages[Math.floor(Math.random() * morningMessages.length)];
    } else if (hour >= 12 && hour < 17) {
      // Afternoon subtexts
      const afternoonMessages = [
        "Keep the momentum going.",
        "What's powering your afternoon?",
        "Midday vibes. What's the mood?",
        "Let's keep this energy alive.",
        "Your afternoon soundtrack awaits."
      ];
      return afternoonMessages[Math.floor(Math.random() * afternoonMessages.length)];
    } else if (hour >= 17 && hour < 21) {
      // Evening subtexts
      const eveningMessages = [
        "Time to unwind. What's on?",
        "Let's wind down together.",
        "Your evening escape starts here.",
        "Sunset vibes. What's playing?",
        "The day's done. Let the music take over."
      ];
      return eveningMessages[Math.floor(Math.random() * eveningMessages.length)];
    } else {
      // Late night subtexts
      const nightMessages = [
        "The world sleeps. The music plays.",
        "Late night. Deep thoughts. Good music.",
        "When the city sleeps, we listen.",
        "Your midnight companion is here.",
        "The night is yours. What's the vibe?",
        "In the quiet hours, music speaks loudest."
      ];
      return nightMessages[Math.floor(Math.random() * nightMessages.length)];
    }
  };

  if (!userId) {
    return (
      <div className="p-6 page-transition space-y-8">
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />

        {/* Public Content Only */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Logo width={40} height={40} />
                <h1 className="text-3xl font-bold">BlissMusic</h1>
              </div>
              <p className="text-muted-foreground">Discover what's trending right now.</p>
            </div>
            {!isLoginModalOpen && (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                Sign in to BlissMusic
              </button>
            )}
          </div>

          <TrendingSection />
          <FeaturedPlaylists />

          {/* Locked Section Preview */}
          <div className="opacity-50 pointer-events-none grayscale select-none relative overflow-hidden rounded-xl border border-white/5 p-6">
            <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center">
              <span className="bg-black/80 px-4 py-2 rounded-full border border-white/10 text-sm font-medium">
                Sign in to see more
              </span>
            </div>
            <h2 className="text-xl font-semibold mb-4">Quick Picks</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-square bg-white/5 rounded-md" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 page-transition">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{getGreeting()}</h1>
        <p className="text-muted-foreground">{getSubtext()}</p>
      </div>

      {/* Quick Picks */}
      <QuickPicks />

      {/* Mood Chips */}
      <div className="my-8">
        <h2 className="text-xl font-semibold mb-4">Browse by Mood</h2>
        <MoodChips selectedMood={selectedMood} onMoodSelect={setSelectedMood} />
      </div>

      {/* Mood-Based Music (shows when mood is selected) */}
      <MoodMusic mood={selectedMood} />

      {/* AI Made For You */}
      <MadeForYou mood={selectedMood || undefined} />

      {/* Trending Section */}
      <TrendingSection />

      {/* Featured Playlists */}
      <FeaturedPlaylists />
    </div>
  );
}
