'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface AmbientBackgroundProps {
    imageUrl: string;
    children: React.ReactNode;
}

export function AmbientBackground({ imageUrl, children }: AmbientBackgroundProps) {
    return (
        <div className="relative w-full h-full overflow-hidden bg-black">

            {/* Ambient Layer 1: Heavily blurred background image */}
            <motion.div
                key={imageUrl}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 z-0"
            >
                {/* 
                   We use a high-quality Next.js image, scaled up and blurred.
                   This creates the most natural "Average Color" gradient effect without expensive canvas processing.
                */}
                <Image
                    src={imageUrl || '/placeholder.png'}
                    alt="Ambient Background"
                    fill
                    className="object-cover blur-[100px] opacity-60 scale-150 saturate-150"
                    priority
                />

                {/* Radial gradient overlay to darken edges and focus center */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80" />
                <div className="absolute inset-0 bg-black/20" /> {/* General dimming */}
            </motion.div>

            {/* Content Layer */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </div>
    );
}
