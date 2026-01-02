'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { Heart, ListMusic, Target, BarChart2, Music, X, Sparkles } from 'lucide-react';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const { signInWithGoogle } = useAuthStore();

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            {/* Added showCloseButton={false} to suppress the default close icon */}
            <DialogContent showCloseButton={false} className="border-none bg-transparent p-0 shadow-2xl w-[90vw] max-w-[350px] overflow-hidden focus:outline-none outline-none">
                <DialogTitle className="sr-only">Sign in to BlissMusic</DialogTitle>

                {/* Custom CSS for animations */}
                <style jsx global>{`
                    @keyframes heartbeat {
                        0% { transform: scale(1); opacity: 0.3; }
                        15% { transform: scale(1.1); opacity: 0.4; }
                        30% { transform: scale(1); opacity: 0.3; }
                        45% { transform: scale(1.15); opacity: 0.45; }
                        60% { transform: scale(1); opacity: 0.3; }
                        100% { transform: scale(1); opacity: 0.3; }
                    }
                    @keyframes colorShift {
                        0% { background-color: rgba(147, 51, 234, 0.3); }   /* Purple */
                        33% { background-color: rgba(236, 72, 153, 0.3); }  /* Pink */
                        66% { background-color: rgba(59, 130, 246, 0.3); }  /* Blue */
                        100% { background-color: rgba(147, 51, 234, 0.3); } /* Back to Purple */
                    }
                    @keyframes rainbowGlow {
                        0% { background: linear-gradient(135deg, rgba(147, 51, 234, 0.6), rgba(236, 72, 153, 0.6)); opacity: 0.7; }
                        5% { background: linear-gradient(135deg, rgba(170, 60, 240, 0.62), rgba(220, 90, 170, 0.62)); opacity: 0.72; }
                        10% { background: linear-gradient(135deg, rgba(195, 70, 245, 0.64), rgba(200, 100, 190, 0.64)); opacity: 0.74; }
                        15% { background: linear-gradient(135deg, rgba(215, 90, 230, 0.65), rgba(150, 120, 210, 0.65)); opacity: 0.75; }
                        20% { background: linear-gradient(135deg, rgba(180, 100, 220, 0.63), rgba(120, 140, 220, 0.63)); opacity: 0.73; }
                        25% { background: linear-gradient(135deg, rgba(130, 110, 210, 0.6), rgba(90, 160, 230, 0.6)); opacity: 0.7; }
                        30% { background: linear-gradient(135deg, rgba(90, 130, 220, 0.62), rgba(60, 180, 235, 0.62)); opacity: 0.72; }
                        35% { background: linear-gradient(135deg, rgba(70, 150, 230, 0.65), rgba(50, 195, 230, 0.65)); opacity: 0.75; }
                        40% { background: linear-gradient(135deg, rgba(50, 170, 230, 0.63), rgba(40, 205, 220, 0.63)); opacity: 0.73; }
                        45% { background: linear-gradient(135deg, rgba(40, 190, 225, 0.6), rgba(30, 200, 200, 0.6)); opacity: 0.7; }
                        50% { background: linear-gradient(135deg, rgba(35, 200, 210, 0.62), rgba(25, 195, 150, 0.62)); opacity: 0.72; }
                        55% { background: linear-gradient(135deg, rgba(30, 200, 170, 0.65), rgba(40, 190, 130, 0.65)); opacity: 0.75; }
                        60% { background: linear-gradient(135deg, rgba(50, 195, 140, 0.63), rgba(100, 185, 80, 0.63)); opacity: 0.73; }
                        65% { background: linear-gradient(135deg, rgba(120, 185, 90, 0.6), rgba(180, 170, 40, 0.6)); opacity: 0.7; }
                        70% { background: linear-gradient(135deg, rgba(200, 170, 50, 0.62), rgba(230, 140, 30, 0.62)); opacity: 0.72; }
                        75% { background: linear-gradient(135deg, rgba(240, 150, 40, 0.65), rgba(245, 100, 50, 0.65)); opacity: 0.75; }
                        80% { background: linear-gradient(135deg, rgba(245, 120, 50, 0.63), rgba(240, 80, 80, 0.63)); opacity: 0.73; }
                        85% { background: linear-gradient(135deg, rgba(240, 90, 90, 0.6), rgba(235, 75, 120, 0.6)); opacity: 0.7; }
                        90% { background: linear-gradient(135deg, rgba(235, 80, 140, 0.62), rgba(220, 70, 170, 0.62)); opacity: 0.72; }
                        95% { background: linear-gradient(135deg, rgba(200, 65, 200, 0.65), rgba(170, 60, 220, 0.65)); opacity: 0.75; }
                        100% { background: linear-gradient(135deg, rgba(147, 51, 234, 0.6), rgba(236, 72, 153, 0.6)); opacity: 0.7; }
                    }
                    @keyframes beat {
                        0%, 100% { opacity: 0.3; transform: scale(1); }
                        50% { opacity: 0.5; transform: scale(1.05); }
                    }
                    .animate-beat {
                        animation: beat 3s infinite ease-in-out;
                    }
                    .animate-rainbow {
                        animation: rainbowGlow 14s infinite ease-in-out;
                    }
                    .animate-float {
                        animation: float 6s ease-in-out infinite;
                    }
                    @keyframes float {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-10px); }
                        100% { transform: translateY(0px); }
                    }
                `}</style>

                <div className="relative flex flex-col items-center justify-center p-6 bg-[#0a0a0a] text-white rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_50px_-12px_rgba(168,85,247,0.4)]">

                    {/* Living Background Effect */}
                    {/* The Beat Orb */}
                    <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[220px] h-[220px] rounded-full blur-[60px] animate-beat pointer-events-none z-0 bg-purple-600/30" />

                    {/* Secondary Ambient Glows */}
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/10 blur-[80px] pointer-events-none z-0" />
                    <div className="absolute bottom-0 right-0 w-48 h-48 bg-pink-600/10 blur-[80px] pointer-events-none z-0" />

                    {/* Decorative Sparkles (Top Right) */}
                    <div className="absolute top-6 right-16 opacity-50 animate-pulse">
                        <Sparkles className="w-3 h-3 text-purple-300" />
                    </div>
                    <div className="absolute top-12 right-6 opacity-30 animate-pulse delay-75">
                        <Sparkles className="w-2 h-2 text-pink-300" />
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/5 transition-colors z-20 text-white/40 hover:text-white"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Premium Logo Container */}
                    <div className="relative mb-6 z-10">
                        {/* Animated gradient background orbs */}
                        <div className="absolute -inset-8 -z-20">
                            <div className="absolute inset-0 rounded-full blur-[80px] animate-rainbow" />
                            <div className="absolute inset-0 rounded-full blur-[80px] animate-rainbow" style={{ animationDelay: '7s' }} />
                        </div>

                        {/* Premium Glass Container */}
                        <div className="relative p-6 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl shadow-purple-500/20 animate-float">
                            {/* Inner glow */}
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 -z-10" />

                            {/* Logo */}
                            <div className="relative flex items-center justify-center">
                                <Logo width={100} height={100} className="drop-shadow-2xl" />
                            </div>
                        </div>
                    </div>

                    {/* Header */}
                    <div className="text-center space-y-2 mb-8 relative z-10">
                        <h2 className="text-3xl font-bold tracking-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 animate-pulse drop-shadow-lg">
                                BlissMusic
                            </span>
                        </h2>
                        <p className="text-white/50 text-sm max-w-[240px] mx-auto leading-relaxed font-light">
                            Your gateway to infinite sound. <br /> Sign in to unlock the full experience.
                        </p>
                    </div>

                    {/* Premium Feature List */}
                    <div className="w-full space-y-3 mb-8 relative z-10 px-1">
                        <FeatureRow
                            icon={<Heart className="w-4 h-4 text-rose-500" />}
                            text="Save your favorite tracks"
                            delay="0ms"
                        />
                        <FeatureRow
                            icon={<ListMusic className="w-4 h-4 text-amber-500" />}
                            text="Create custom playlists"
                            delay="100ms"
                        />
                        <FeatureRow
                            icon={<Target className="w-4 h-4 text-purple-500" />}
                            text="Personalized AI recommendations"
                            delay="200ms"
                        />
                        <FeatureRow
                            icon={<BarChart2 className="w-4 h-4 text-sky-500" />}
                            text="Track your listening history"
                            delay="300ms"
                        />
                    </div>

                    {/* Google Button - Premium Style */}
                    <Button
                        onClick={signInWithGoogle}
                        className="w-full h-12 bg-white text-black font-bold text-base rounded-full flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] z-10 relative overflow-hidden group border-0"
                    >
                        {/* Subtle shine effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />

                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        <span className="relative z-10">Continue with Google</span>
                    </Button>

                    <p className="mt-6 text-[10px] text-center text-white/30 max-w-[200px] z-10">
                        By continuing, you agree to BlissMusic's Terms of Service and Privacy Policy
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function FeatureRow({ icon, text, delay }: { icon: React.ReactNode, text: string, delay: string }) {
    return (
        <div
            className="flex items-center gap-4 group cursor-default transition-all duration-500 ease-out translate-y-0 opacity-100"
            style={{ animationDelay: delay }}
        >
            <div className="p-2.5 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors backdrop-blur-sm border border-white/5">
                {icon}
            </div>
            <span className="text-gray-300 text-sm font-medium tracking-wide group-hover:text-white transition-colors">
                {text}
            </span>
        </div>
    );
}
