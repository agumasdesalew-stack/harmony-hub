'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Play, Share2, Download } from 'lucide-react';
import { Playlist, Song } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import NowPlayingSidebar from '@/components/layout/NowPlayingSidebar';
import PlayerBar from '@/components/layout/PlayerBar';
import { supabase } from '@/lib/supabase';

export default function SharedPlaylistPage() {
  const params = useParams();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState<Song | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [queue, setQueue] = useState<Song[]>([]);

  useEffect(() => {
    const loadPlaylist = async () => {
      try {
        // Since there's no share_id field, we'll use the id directly
        // For public playlists, you might want to add a share_id field or use id
        const { data, error } = await supabase
          .from('playlists')
          .select('*')
          .eq('id', params.shareId)
          .eq('is_public', true)
          .single();

        if (error) throw error;
        if (data) {
          // Handle jsonb[] array format
          let songs: Song[] = [];
          if (data.songs) {
            if (Array.isArray(data.songs)) {
              songs = data.songs;
            } else {
              songs = [data.songs];
            }
          }
          
          setPlaylist({
            id: data.id,
            title: data.title,
            description: data.description,
            songs: songs,
            createdAt: data.created_at,
            userId: data.user_id,
            isPublic: data.is_public,
          });
          setQueue(songs);
        }
      } catch (error) {
        console.error('Error loading shared playlist:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.shareId) {
      loadPlaylist();
    }
  }, [params.shareId]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4" />
          <p className="text-zinc-400">Loading playlist...</p>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-white">Playlist not found</h2>
          <p className="text-zinc-400 mb-4">This playlist may be private or doesn't exist.</p>
          <a href="/" className="text-yellow-500 hover:text-yellow-600">
            Go back home
          </a>
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
          <div className="mb-6">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">
              Shared Playlist
            </p>
          </div>

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
                      setCurrentSong(playlist.songs[0]);
                      setQueue(playlist.songs);
                      setIsPlaying(true);
                    }
                  }}
                  className="px-6 py-3 rounded-full bg-yellow-500 hover:bg-yellow-600 text-zinc-900 font-semibold transition-colors flex items-center gap-2"
                >
                  <Play size={20} />
                  Play
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied to clipboard!');
                  }}
                  className="p-3 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  <Share2 size={20} className="text-zinc-900 dark:text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Songs List */}
          <div>
            <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">Songs</h2>
            {playlist.songs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <p>No songs in this playlist.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {playlist.songs.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    onClick={() => {
                      setCurrentSong(song);
                      setQueue(playlist.songs.slice(index));
                      setIsPlaying(true);
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

      <NowPlayingSidebar currentSong={currentSong} queue={queue} />

      <PlayerBar
        currentSong={currentSong}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onNext={() => {}}
        onPrevious={() => {}}
        currentTime={currentTime}
        duration={currentSong?.duration || 0}
      />
    </div>
  );
}

