"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Song } from '@/types';

interface PlayerContextValue {
  currentSong?: Song;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  play: (song: Song, sourceQueue?: Song[]) => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  setQueue: (q: Song[]) => void;
  // setNowPlaying updates current song and queue without starting playback (used for embeds)
  setNowPlaying: (song: Song | undefined, q?: Song[], play?: boolean) => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | undefined>(undefined);
  const [queue, setQueueState] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.addEventListener('timeupdate', () => {
        setCurrentTime(audioRef.current?.currentTime || 0);
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (!currentSong?.previewUrl) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    audioRef.current.src = currentSong.previewUrl;
    audioRef.current.currentTime = 0;
    audioRef.current.load();
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [currentSong]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
    else audioRef.current.pause();
  }, [isPlaying]);

  const play = (song: Song, sourceQueue: Song[] = []) => {
    const orderedQueue = sourceQueue.length ? sourceQueue : [song];
    setQueueState([song, ...orderedQueue.filter((s) => s.id !== song.id)]);
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const pause = () => setIsPlaying(false);
  const toggle = () => setIsPlaying((p) => !p);

  const next = () => {
    if (!currentSong) return;
    const idx = queue.findIndex((s) => s.id === currentSong.id);
    const nextTrack = queue[idx + 1];
    if (nextTrack) play(nextTrack, queue);
    else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const previous = () => {
    if (!currentSong) return;
    const idx = queue.findIndex((s) => s.id === currentSong.id);
    const prevTrack = queue[idx - 1];
    if (prevTrack) play(prevTrack, queue);
    else if (audioRef.current) audioRef.current.currentTime = 0;
  };

  const value: PlayerContextValue = {
    currentSong,
    queue,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    toggle,
    next,
    previous,
    setQueue: setQueueState,
    setNowPlaying: (song: Song | undefined, q: Song[] = [], play = false) => {
      setQueueState(q);
      setCurrentSong(song);
      setIsPlaying(play);
    },
  };

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}
