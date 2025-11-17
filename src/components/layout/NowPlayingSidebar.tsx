'use client';

import { Music } from 'lucide-react';
import { Song } from '@/types';
import { usePlayer } from '@/contexts/PlayerContext';

interface NowPlayingSidebarProps {
  currentSong?: Song;
  queue?: Song[];
}

export default function NowPlayingSidebar({ currentSong, queue }: NowPlayingSidebarProps) {
  const player = usePlayer();
  const activeSong = currentSong ?? player.currentSong;
  const activeQueue = queue ?? player.queue;

  return (
    <aside className="w-80 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 h-screen fixed right-0 top-0 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Music size={20} className="text-zinc-600 dark:text-zinc-400" />
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Now Playing</h2>
        </div>

        {activeSong && (
          <div className="mb-8">
            <div className="aspect-square w-full rounded-lg overflow-hidden mb-4 bg-zinc-200 dark:bg-zinc-800">
              <img
                src={activeSong.albumArt || '/api/placeholder/400/400'}
                alt={activeSong.album}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3 uppercase tracking-wider">
            Queue
          </h3>
          <div className="space-y-2">
            {activeQueue.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-500">No songs in queue</p>
            ) : (
              activeQueue.map((song, index) => (
                <div
                  key={song.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {song.name}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      {song.artist}
                    </p>
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {Math.floor(song.duration / 60)}:
                    {(song.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

