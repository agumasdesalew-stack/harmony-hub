'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { Heart } from 'lucide-react';
import { saveTrackBlob, getTrackBlob, deleteTrackBlob } from '@/utils/local-files-db';
import type { Song } from '@/types';

interface LocalTrack {
  id: string;
  name: string;
  artist?: string;
  duration: number;
  size: number;
  type: string;
  addedAt: string;
  lastPlayedAt?: string;
  isFavorite?: boolean;
}

const STORAGE_KEY = 'harmony_hub_local_tracks_v1';
const SONGS_KEY = 'harmony_hub_all_songs_v1';
const RECENT_SONGS_KEY = 'harmony_hub_recently_played_v1';
const FAVORITES_KEY = 'harmony_hub_favorite_songs_v1';

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

async function getAudioDurationFromFile(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration || 0);
      URL.revokeObjectURL(audio.src);
      audio.src = '';
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(audio.src);
      reject(new Error('Failed to load audio metadata'));
    });
    audio.src = URL.createObjectURL(file);
  });
}

export default function LocalFilesPage() {
  const [tracks, setTracks] = useState<LocalTrack[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioSources, setAudioSources] = useState<Record<string, string>>({});
  const audioSourcesRef = useRef<Record<string, string>>({});
  const cleanupUrlsRef = useRef<Set<string>>(new Set());

  const syncCollections = useCallback((list: LocalTrack[]) => {
    const baseSongs: Song[] = list.map((track) => ({
      id: `local-${track.id}`,
      name: track.name,
      artist: track.artist ?? 'Local Upload',
      album: 'Local Files',
      albumArt: '/api/placeholder/300/300',
      previewUrl: null,
      duration: Math.round(track.duration),
    }));

    const recents = [...list]
      .sort((a, b) => {
        const aTime = a.lastPlayedAt ?? a.addedAt;
        const bTime = b.lastPlayedAt ?? b.addedAt;
        return new Date(bTime).getTime() - new Date(aTime).getTime();
      })
      .slice(0, 25)
      .map((track) => ({
        id: `local-${track.id}`,
        name: track.name,
        artist: track.artist ?? 'Local Upload',
        album: 'Local Files',
        albumArt: '/api/placeholder/300/300',
        previewUrl: null,
        duration: Math.round(track.duration),
      }));

    const favorites = list
      .filter((track) => track.isFavorite)
      .map((track) => ({
        id: `local-${track.id}`,
        name: track.name,
        artist: track.artist ?? 'Local Upload',
        album: 'Local Files',
        albumArt: '/api/placeholder/300/300',
        previewUrl: null,
        duration: Math.round(track.duration),
      }));

    const saveCollection = (key: string, value: Song[]) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (err) {
        console.error(`Failed to persist ${key}`, err);
      }
    };

    saveCollection(SONGS_KEY, baseSongs);
    saveCollection(RECENT_SONGS_KEY, recents);
    saveCollection(FAVORITES_KEY, favorites);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: LocalTrack[] = JSON.parse(stored).map((track: LocalTrack) => ({
          ...track,
          isFavorite: track.isFavorite ?? false,
        }));
        setTracks(parsed);
      }
    } catch (err) {
      console.error('Failed to load local tracks', err);
    }
  }, []);

  const persistTracks = (updated: LocalTrack[]) => {
    setTracks(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to persist local tracks metadata', err);
      setError('Unable to save track list. Try removing some files.');
    }
    syncCollections(updated);
  };

  useEffect(() => {
    let isMounted = true;

    const loadSources = async () => {
      for (const track of tracks) {
        if (audioSourcesRef.current[track.id]) continue;
        try {
          const blob = await getTrackBlob(track.id);
          if (!blob) continue;
          const objectUrl = URL.createObjectURL(blob);
          if (!isMounted) {
            URL.revokeObjectURL(objectUrl);
            return;
          }
          cleanupUrlsRef.current.add(objectUrl);
          audioSourcesRef.current = {
            ...audioSourcesRef.current,
            [track.id]: objectUrl,
          };
          setAudioSources((prev) => ({
            ...prev,
            [track.id]: objectUrl,
          }));
        } catch (err) {
          console.error('Failed to load track blob', err);
        }
      }
    };

    loadSources();

    return () => {
      isMounted = false;
    };
  }, [tracks]);

  useEffect(() => {
    return () => {
      cleanupUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      cleanupUrlsRef.current.clear();
    };
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setError(null);
    setIsUploading(true);

    const newTracks: LocalTrack[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('audio/')) {
        setError('Only audio files are supported.');
        continue;
      }

      try {
        const durationSeconds = await getAudioDurationFromFile(file).catch(() => 0);
        const id = crypto.randomUUID();

        await saveTrackBlob(id, file);

        const objectUrl = URL.createObjectURL(file);
        cleanupUrlsRef.current.add(objectUrl);

        newTracks.push({
          id,
          name: file.name.replace(/\.[^/.]+$/, ''),
          artist: 'Local Upload',
          duration: durationSeconds,
          size: file.size,
          type: file.type,
          addedAt: new Date().toISOString(),
          lastPlayedAt: new Date().toISOString(),
          isFavorite: false,
        });

        setAudioSources((prev) => {
          const updated = { ...prev, [id]: objectUrl };
          audioSourcesRef.current = updated;
          return updated;
        });
      } catch (err) {
        console.error('Failed to process file', err);
        setError('Failed to process one or more files. Check storage limits and try again.');
      }
    }

    if (newTracks.length > 0) {
      const updated = [...tracks, ...newTracks];
      persistTracks(updated);
    }

    event.target.value = '';
    setIsUploading(false);
  };

  const handleRemoveTrack = (id: string) => {
    const updated = tracks.filter((track) => track.id !== id);
    const url = audioSources[id];
    if (url) {
      URL.revokeObjectURL(url);
      cleanupUrlsRef.current.delete(url);
      setAudioSources((prev) => {
        const { [id]: _removed, ...rest } = prev;
        audioSourcesRef.current = rest;
        return rest;
      });
    }
    deleteTrackBlob(id).catch((err) => console.error('Failed to delete track blob', err));
    persistTracks(updated);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = tracks.map((track) =>
      track.id === id ? { ...track, isFavorite: !track.isFavorite } : track
    );
    persistTracks(updated);
  };

  const handleTrackPlayed = (id: string) => {
    const updated = tracks.map((track) =>
      track.id === id ? { ...track, lastPlayedAt: new Date().toISOString() } : track
    );
    persistTracks(updated);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 ml-64 overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
        <div className="p-8">
          <header className="flex items-center justify-between mb-8">
            <div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">My Music</div>
              <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Local Files</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                Upload audio files from your device and listen to them anywhere in Harmony Hub.
              </p>
            </div>
            <ThemeToggle />
          </header>

          <section className="mb-10">
            <label className="block">
              <div className="relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-400/60 bg-white/80 px-8 py-12 text-center text-zinc-700 shadow-sm transition hover:border-yellow-500 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300 dark:hover:border-yellow-400">
                <span className="text-lg font-semibold">
                  {isUploading ? 'Uploading...' : 'Drag & drop files here or click to browse'}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Supports MP3, WAV, AAC, FLAC, and more
                </span>
              </div>
              <input
                type="file"
                accept="audio/*"
                multiple
                className="hidden"
                onChange={handleUpload}
              />
            </label>
            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                {tracks.length ? 'Your Local Library' : 'No local files yet'}
              </h2>
              {tracks.length > 0 && (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {tracks.length} {tracks.length === 1 ? 'song' : 'songs'}
                </span>
              )}
            </div>

            {tracks.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white/70 p-8 text-center text-zinc-500 shadow-sm dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400">
                Upload audio files to start building your offline library.
              </div>
            ) : (
              <div className="space-y-4">
                {tracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-sm transition hover:border-yellow-500 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-800/60"
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-yellow-500/70 to-orange-500/80 text-white">
                      🎧
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                        {track.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {track.type} • {(track.size / (1024 * 1024)).toFixed(2)} MB •{' '}
                        {formatDuration(track.duration)}
                      </p>
                    </div>
                    <audio
                      controls
                      src={audioSources[track.id]}
                      className="h-10 w-56"
                      preload="metadata"
                      onPlay={() => handleTrackPlayed(track.id)}
                    />
                    <button
                      onClick={() => handleToggleFavorite(track.id)}
                      className="rounded-full p-2 transition hover:bg-yellow-500/10"
                      aria-label={track.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Heart
                        size={18}
                        className={
                          track.isFavorite
                            ? 'fill-yellow-500 text-yellow-500'
                            : 'text-zinc-400 dark:text-zinc-500'
                        }
                      />
                    </button>
                    <button
                      onClick={() => handleRemoveTrack(track.id)}
                      className="text-sm text-zinc-500 hover:text-red-500 dark:hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}


