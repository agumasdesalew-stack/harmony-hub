"use client";

import React from 'react';
import { X } from 'lucide-react';

export default function SpotifyEmbed({
  trackId,
  onClose,
  height = 80,
}: {
  trackId: string;
  onClose?: () => void;
  height?: number;
}) {
  if (!trackId) return null;

  const src = `https://open.spotify.com/embed/track/${encodeURIComponent(trackId)}`;

  return (
    <div className="fixed left-0 right-0 bottom-24 z-40 flex items-center justify-center">
      <div className="relative w-full max-w-3xl mx-4">
        <div className="absolute -top-6 right-0">
          <button
            onClick={() => onClose && onClose()}
            className="p-2 rounded-full bg-zinc-800/70 hover:bg-zinc-800/90 text-white"
            aria-label="Close Spotify player"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-hidden rounded-xl shadow-lg">
          <iframe
            title="Spotify player"
            src={src}
            width="100%"
            height={height}
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
