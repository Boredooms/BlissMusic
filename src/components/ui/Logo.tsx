import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    width?: number;
    height?: number;
    showText?: boolean;
}

export function Logo({ className, width = 160, height = 40, showText = false }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <Image
                src="/logo.png"
                alt="Just Chillin Music"
                width={width}
                height={height}
                className="object-contain rounded-2xl"
                priority
            />
            {showText && (
                <span className="font-semibold text-lg tracking-tight sr-only">
                    Just Chillin Music
                </span>
            )}
        </div>
    );
}
