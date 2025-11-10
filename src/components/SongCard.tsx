'use client';

import { useState } from 'react';
import { Play, Pause } from 'lucide-react';
import { Song } from '@/types';

interface SongCardProps {
  song: Song;
  onPlay?: (song: Song) => void;
  onAddToPlaylist?: (song: Song) => void;
}

export default function SongCard({ song, onPlay, onAddToPlaylist }: SongCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handlePlayPreview = () => {
    if (!song.previewUrl) return;

    if (audio && !audio.paused) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const newAudio = new Audio(song.previewUrl);
      newAudio.play();
      newAudio.addEventListener('ended', () => setIsPlaying(false));
      setAudio(newAudio);
      setIsPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      className="group relative bg-zinc-900/50 backdrop-blur-sm rounded-lg overflow-hidden transition-all hover:scale-105 hover:shadow-xl cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => window.location.href = `/song/${song.id}`}
    >
        <div className="aspect-square relative overflow-hidden bg-zinc-800">
          <img
            src={song.albumArt || '/api/placeholder/300/300'}
            alt={song.album}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
          />
          {isHovered && song.previewUrl && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handlePlayPreview();
                }}
                className="w-14 h-14 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-all hover:scale-110"
              >
                {isPlaying ? (
                  <Pause size={24} className="text-zinc-900" />
                ) : (
                  <Play size={24} className="text-zinc-900 ml-1" />
                )}
              </button>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-white truncate mb-1">{song.name}</h3>
          <p className="text-sm text-zinc-400 truncate">{song.artist}</p>
        </div>
      </div>
    </div>
  );
}

