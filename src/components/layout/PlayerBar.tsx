"use client";

import { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  MoreHorizontal,
} from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';

export default function PlayerBar() {
  const { currentSong, isPlaying, toggle, next, previous, currentTime, duration } = usePlayer();
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-900 border-t border-zinc-800 z-50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Song Info */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {currentSong && (
            <>
              <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0 bg-zinc-800">
                <img
                  src={currentSong.albumArt || '/api/placeholder/56/56'}
                  alt={currentSong.album}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{currentSong.name}</p>
                <p className="text-xs text-zinc-400 truncate">{currentSong.artist}</p>
              </div>
            </>
          )}
        </div>

        {/* Center: Controls */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <div className="flex items-center gap-4">
            <button className="text-zinc-400 hover:text-white transition-colors">
              <Shuffle size={18} />
            </button>
            <button
              onClick={previous}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={toggle}
              className="w-10 h-10 rounded-full bg-yellow-500 hover:bg-yellow-600 flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause size={20} className="text-zinc-900" />
              ) : (
                <Play size={20} className="text-zinc-900 ml-0.5" />
              )}
            </button>
            <button
              onClick={next}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <SkipForward size={20} />
            </button>
            <button className="text-zinc-400 hover:text-white transition-colors">
              <Repeat size={18} />
            </button>
          </div>
          <div className="flex items-center gap-2 w-full max-w-md">
            <span className="text-xs text-zinc-400">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <span className="text-xs text-zinc-400">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Additional Controls */}
        <div className="flex items-center gap-4 flex-1 justify-end">
          <button className="text-zinc-400 hover:text-white transition-colors">
            <Volume2 size={18} />
          </button>
          <button className="text-zinc-400 hover:text-white transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

