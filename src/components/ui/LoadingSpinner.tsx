import { Logo } from './Logo';

export function LoadingSpinner() {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4">
            <div className="relative">
                <Logo width={80} height={80} className="animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-pink-600/20 blur-2xl animate-pulse" />
            </div>
            <div className="flex flex-col items-center gap-2">
                <span className="font-semibold text-xl tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    BlissMusic
                </span>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        </div>
    );
}
