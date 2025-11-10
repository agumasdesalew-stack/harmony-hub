'use client';

import { Heart, Clock } from 'lucide-react';
import { Playlist } from '@/types';

interface CuratedPlaylistCardProps {
  playlist: Playlist;
}

export default function CuratedPlaylistCard({ playlist }: CuratedPlaylistCardProps) {
  const totalDuration = playlist.songs.reduce((acc, song) => acc + song.duration, 0);
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;
  const likeCount =
    playlist.likes !== undefined
      ? playlist.likes
      : 100000 + Math.min(playlist.songs.length * 1200, 50000);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-600 to-amber-700 p-8 text-white">
      <div className="relative z-10">
        <div className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-90">
          CURATED PLAYLIST
        </div>
        <h2 className="text-4xl font-bold mb-3">{playlist.title}</h2>
        <p className="text-white/90 mb-4 max-w-md">{playlist.description}</p>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Heart size={16} />
            <span>{likeCount.toLocaleString()} Likes</span>
          </div>
          <div>{playlist.songs.length} Songs</div>
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>
              {minutes} min {seconds} sec
            </span>
          </div>
        </div>
      </div>
      {playlist.songs[0]?.albumArt && (
        <div className="absolute right-8 top-8 bottom-8 w-48 opacity-20">
          <img
            src={playlist.songs[0].albumArt}
            alt=""
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

