"use client";

import React, { useState, useMemo } from 'react';
import { Music, Play } from 'lucide-react';

type AnySong = {
  // accept both shapes
  previewUrl?: string | null;
  preview_url?: string | null;
  spotifyUrl?: string | null;
  external_urls?: any;
  name?: string;
  album?: string;
};

export default function AudioPreview({ song }: { song: AnySong }) {
  const [loadError, setLoadError] = useState(false);

  const preview = useMemo(() => {
    const p = (song as any).previewUrl ?? (song as any).preview_url ?? null;
    if (!p) return null;
    // guard against literal 'null' or empty strings
    if (typeof p !== 'string' || p.trim() === '' || p === 'null') return null;
    try {
      // ensure it's a valid absolute URL
      const u = new URL(p);
      return u.toString();
    } catch (e) {
      return null;
    }
  }, [song]);

  const spotifyHref =
    (song as any).spotifyUrl ?? (song as any).external_urls?.spotify ?? null;

  // If preview is missing or we previously had a load error, show the fallback card
  if (!preview || loadError) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 mb-6 text-center">
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Music className="w-6 h-6 text-white/50" />
        </div>
        <p className="text-white/80 text-sm mb-2">No preview available</p>
        <p className="text-white/50 text-xs mb-4">Spotify does not provide a playable clip for this track.</p>
        {spotifyHref ? (
          <a
            href={spotifyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2 bg-purple-600 rounded-full text-sm hover:bg-purple-700 transition"
          >
            <Play className="w-4 h-4 fill-white" />
            Play on Spotify
          </a>
        ) : null}
      </div>
    );
  }

  // Render audio with multiple source types and CORS enabled. If the browser can't play it,
  // the onError handler will flip to the fallback UI.
  return (
    <div className="mb-6">
      <audio
        controls
        className="w-full"
        preload="none"
        crossOrigin="anonymous"
        onError={() => setLoadError(true)}
      >
        {/* Try common audio types to improve the chance the browser recognizes the stream */}
        <source src={preview} type="audio/mpeg" />
        <source src={preview} type="audio/mp4" />
        <source src={preview} type="audio/ogg" />
        <source src={preview} type="audio/x-m4a" />
        Your browser does not support audio.
      </audio>
    </div>
  );
}
