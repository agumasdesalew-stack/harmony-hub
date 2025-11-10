import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PlaylistProvider } from "@/contexts/PlaylistContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Harmony Hub - Discover, Curate, and Share Your Perfect Playlists",
  description: "A sleek, modern web application for music lovers to discover, curate, and share playlists with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-900 text-white`}
      >
        <PlaylistProvider>
          {children}
        </PlaylistProvider>
      </body>
    </html>
  );
}
