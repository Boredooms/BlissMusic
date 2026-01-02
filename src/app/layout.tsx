import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Sidebar, Header, NowPlayingBar } from "@/components/layout";
import { Player } from "@/components/player/Player";
import { AuthInitializer } from "@/components/auth/AuthInitializer";
import { CreatePlaylistDialog } from '@/components/playlists/CreatePlaylistDialog';
import { AddToPlaylistDialog } from '@/components/playlists/AddToPlaylistDialog';
import { MainWrapper } from "@/components/layout/MainWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BlissMusic | Your Personal Soundscape",
    template: "%s | BlissMusic",
  },
  description: "A premium, AI-powered music experience with HD audio and living backgrounds.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {/* Initialize Auth */}
          <AuthInitializer />

          <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <MainWrapper>
                {children}
              </MainWrapper>
            </div>
          </div>

          {/* Now Playing Bar */}
          <NowPlayingBar />

          {/* Audio Player (invisible) */}
          <Player />

          {/* Global Modals */}
          <CreatePlaylistDialog />
          <AddToPlaylistDialog />
        </Providers>
      </body>
    </html>
  );
}
