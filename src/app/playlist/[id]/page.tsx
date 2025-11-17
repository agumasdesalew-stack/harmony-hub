'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Share2, Download, ExternalLink, Play, Trash2 } from 'lucide-react';
import { Playlist, Song } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import NowPlayingSidebar from '@/components/layout/NowPlayingSidebar';
import PlayerBar from '@/components/layout/PlayerBar';
import { usePlayer } from '@/contexts/PlayerContext';
import { usePlaylists } from '@/contexts/PlaylistContext';

export default function PlaylistPage() {
  const params = useParams();
  const router = useRouter();
  const { getPlaylist, deletePlaylist, updatePlaylist } = usePlaylists();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const player = usePlayer();
  const [shareUrl, setShareUrl] = useState<string>('');

  useEffect(() => {
    const found = getPlaylist(params.id as string);
    if (found) {
      setPlaylist(found);
      // populate global queue (no autoplay)
      player.setNowPlaying(undefined, found.songs, false);
      setShareUrl(`${window.location.origin}/share/${found.id}`);
    }
  }, [params.id, getPlaylist]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: playlist?.title,
          text: `Check out this playlist: ${playlist?.title}`,
          url: shareUrl,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Playlist link copied to clipboard!');
    }
  };

  const handleExportToSpotify = () => {
    // This would integrate with Spotify API to create a playlist
    alert('Spotify export feature coming soon! Connect your Spotify account to export playlists.');
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      if (playlist) {
        await deletePlaylist(playlist.id);
        router.push('/');
      }
    }
  };

  if (!playlist) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-white">Playlist not found</h2>
          <button
            onClick={() => router.push('/')}
            className="text-zinc-400 hover:text-white"
          >
            Go back home
          </button>
        </div>
      </div>
    );
  }

  const totalDuration = playlist.songs.reduce((acc, song) => acc + song.duration, 0);
  const minutes = Math.floor(totalDuration / 60);
  const seconds = totalDuration % 60;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 ml-64 mr-80 mb-20 overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
        <div className="p-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>

          <div className="flex gap-8 mb-8">
            <div className="w-80 h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-orange-600 to-amber-700 flex-shrink-0 flex items-center justify-center">
              {playlist.songs[0]?.albumArt ? (
                <img
                  src={playlist.songs[0].albumArt}
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-white text-4xl font-bold">🎵</div>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 text-zinc-900 dark:text-white">
                {playlist.title}
              </h1>
              {playlist.description && (
                <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-4">
                  {playlist.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400 mb-6">
                <span>{playlist.songs.length} songs</span>
                <span>•</span>
                <span>
                  {minutes} min {seconds} sec
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (playlist.songs.length > 0) {
                      player.play(playlist.songs[0], playlist.songs);
                    }
                  }}
                  className="px-6 py-3 rounded-full bg-yellow-500 hover:bg-yellow-600 text-zinc-900 font-semibold transition-colors flex items-center gap-2"
                >
                  <Play size={20} />
                  Play
                </button>
                <button
                  onClick={handleShare}
                  className="p-3 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Share2 size={20} className="text-zinc-900 dark:text-white" />
                </button>
                <button
                  onClick={handleExportToSpotify}
                  className="p-3 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  <ExternalLink size={20} className="text-zinc-900 dark:text-white" />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-3 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={20} className="text-zinc-900 dark:text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Songs List */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">Songs</h2>
            {playlist.songs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <p>No songs in this playlist yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {playlist.songs.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    onClick={() => {
                      player.play(song, playlist.songs.slice(index));
                    }}
                  >
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 w-8">
                      {index + 1}
                    </span>
                    <div className="w-12 h-12 rounded overflow-hidden bg-zinc-200 dark:bg-zinc-800 flex-shrink-0">
                      <img
                        src={song.albumArt}
                        alt={song.album}
                        className="w-full h-full object-cover"
                      />
                    </div>
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
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <NowPlayingSidebar />

      <PlayerBar />
    </div>
  );
}

