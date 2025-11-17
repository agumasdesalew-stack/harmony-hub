'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import NowPlayingSidebar from '@/components/layout/NowPlayingSidebar';
import PlayerBar from '@/components/layout/PlayerBar';
import SearchBar from '@/components/SearchBar';
import SongCard from '@/components/SongCard';
import SpotifyEmbed from '@/components/SpotifyEmbed';
import CuratedPlaylistCard from '@/components/CuratedPlaylistCard';
import { Song, Playlist } from '@/types';
import { Search, Settings, Bell } from 'lucide-react';
import AuthButton from '@/components/AuthButton';
import PlaylistCreator from '@/components/PlaylistCreator';
import ThemeToggle from '@/components/ThemeToggle';
import { usePlaylists } from '@/contexts/PlaylistContext';
import { usePlayer } from '@/contexts/PlayerContext';

export default function Home() {
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [queue, setQueue] = useState<Song[]>([]);
  const [embedTrackId, setEmbedTrackId] = useState<string | null>(null);
  const [showPlaylistCreator, setShowPlaylistCreator] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { playlists, createPlaylist } = usePlaylists();
  const player = usePlayer();

  // Mock curated playlist
  const curatedPlaylist: Playlist = {
    id: '1',
    title: 'BLINDING LIGHT',
    description: 'Enjoy vivid emotions with this stunning music album. Each track is a story.',
    songs: [],
    createdAt: new Date().toISOString(),
    userId: '',
    isPublic: true,
    likes: 98802,
  };

  // Mock artists
  const artists = [
    { id: '1', name: 'The Weeknd', image: '/api/placeholder/150/150' },
    { id: '2', name: 'Drake', image: '/api/placeholder/150/150' },
    { id: '3', name: 'Billie Eilish', image: '/api/placeholder/150/150' },
    { id: '4', name: 'Travis Scott', image: '/api/placeholder/150/150' },
    { id: '5', name: 'OBLADAET', image: '/api/placeholder/150/150' },
  ];

  // Mock recently played
  const recentlyPlayed: Song[] = [
    {
      id: '1',
      name: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      albumArt: '/api/placeholder/300/300',
      previewUrl: 'https://example.com/preview.mp3',
      duration: 200,
    },
    {
      id: '2',
      name: 'Save Your Tears',
      artist: 'The Weeknd',
      album: 'After Hours',
      albumArt: '/api/placeholder/300/300',
      previewUrl: null,
      duration: 215,
    },
  ];

  const initializeAudio = useCallback(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;
      const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
      const handleEnded = () => setIsPlaying(false);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
    }
  }, []);

  useEffect(() => {
    initializeAudio();
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [initializeAudio]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (!currentSong?.previewUrl) {
      audioRef.current.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      return;
    }

    audioRef.current.src = currentSong.previewUrl;
    audioRef.current.currentTime = 0;

    if (isPlaying) {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error('Audio playback failed:', err);
          setIsPlaying(false);
          setPlayerError('Unable to play preview. Please try again later.');
        });
    }
  }, [currentSong?.id]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (!currentSong?.previewUrl) return;
    if (isPlaying) {
      audioRef.current
        .play()
        .catch((err) => {
          console.error('Audio playback failed:', err);
          setIsPlaying(false);
        });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong?.previewUrl]);

  const handleSearch = async (query: string) => {
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.tracks?.items) {
        const songs: Song[] = data.tracks.items.map((track: any) => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0]?.name || 'Unknown Artist',
          album: track.album.name,
          albumArt: track.album.images[0]?.url || '/api/placeholder/300/300',
          previewUrl: track.preview_url,
          duration: Math.floor(track.duration_ms / 1000),
          spotifyUrl: track.external_urls.spotify,
        }));
        setSearchResults(songs);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const handlePlaySong = (song: Song, sourceQueue: Song[] = []) => {
    // use the player from top-level hooks (hooks must not be called inside nested functions)
    if (!song.previewUrl || !audioRef.current) {
      // If no preview is available, show an embedded Spotify player on the Harmony page
      // and set the global Now Playing so the player bar and sidebar show the track.
      if (song.id) {
        setEmbedTrackId(song.id);
      }
      player.setNowPlaying(song, [song, ...player.queue.filter((t) => t.id !== song.id)], false);
      return;
    }

    const canPlay =
      audioRef.current.canPlayType('audio/mpeg') ||
      audioRef.current.canPlayType('audio/aac') ||
      audioRef.current.canPlayType('audio/ogg');

    if (!canPlay) {
      setPlayerError('Your browser cannot play this preview format.');
      return;
    }

    const normalizedQueue = sourceQueue.length ? sourceQueue : [song];
    const orderedQueue = [
      song,
      ...normalizedQueue.filter((queuedSong) => queuedSong.id !== song.id),
    ];

    setQueue(orderedQueue);
    player.play(song, orderedQueue);
    setPlayerError(null);
  };

  const handleTogglePlay = () => {
    if (!currentSong?.previewUrl) {
      setPlayerError('No preview available for this track.');
      return;
    }
    setIsPlaying((prev) => !prev);
  };

  const handleNext = () => {
    if (!currentSong || queue.length === 0) return;
    const currentIndex = queue.findIndex((track) => track.id === currentSong.id);
    const nextTrack = queue[currentIndex + 1];
    if (nextTrack) {
      handlePlaySong(nextTrack, queue);
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handlePrevious = () => {
    if (!currentSong || queue.length === 0) return;
    const currentIndex = queue.findIndex((track) => track.id === currentSong.id);
    const previousTrack = queue[currentIndex - 1];
    if (previousTrack) {
      handlePlaySong(previousTrack, queue);
    } else {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
      }
      setCurrentTime(0);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 ml-64 mr-80 mb-20 overflow-y-auto bg-zinc-50 dark:bg-zinc-900">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                <span>Artists</span>
                <span>/</span>
                <span className="text-zinc-900 dark:text-white">Top 2023</span>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                  <Search size={20} />
                </button>
                <button className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                  <Settings size={20} />
                </button>
                <button className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                  <Bell size={20} />
                </button>
                <ThemeToggle />
                <AuthButton />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <button className="px-4 py-2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                New Releases
              </button>
              <button className="px-4 py-2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                New Feed
              </button>
              <button className="px-4 py-2 rounded-full bg-zinc-200 dark:bg-zinc-800 text-sm font-medium text-zinc-900 dark:text-white hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                Shuffle Play
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <SearchBar onSearch={handleSearch} onSelectSong={handlePlaySong} />
                </div>
                <button
                  onClick={() => setShowPlaylistCreator(true)}
                  className="px-6 py-3 rounded-full bg-yellow-500 hover:bg-yellow-600 text-zinc-900 font-semibold transition-colors whitespace-nowrap"
                >
                  Create Playlist
                </button>
              </div>
              {playerError && (
                <p className="mt-3 text-sm text-red-400">{playerError}</p>
              )}
            </div>
          </div>

          {/* Curated Playlist */}
          {!searchResults.length && (
            <div className="mb-8">
              <CuratedPlaylistCard playlist={curatedPlaylist} />
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">
                Search Results
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {searchResults.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onPlay={(selectedSong) => handlePlaySong(selectedSong, searchResults)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Popular Artists */}
          {!searchResults.length && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Popular artists
                </h2>
                <button className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                  See all
                </button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {artists.map((artist) => (
                  <div key={artist.id} className="flex-shrink-0 text-center">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 mb-2">
                      <img
                        src={artist.image}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white">
                      {artist.name}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recently Played */}
          {!searchResults.length && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                  Recently played
                </h2>
                <button className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                  See all
                </button>
              </div>
              <div className="space-y-2">
                {recentlyPlayed.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                    onClick={() => handlePlaySong(song, recentlyPlayed)}
                  >
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
                    <button className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                      +
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <NowPlayingSidebar />

      {embedTrackId && (
        <SpotifyEmbed trackId={embedTrackId} onClose={() => setEmbedTrackId(null)} />
      )}

      <PlayerBar />

      <PlaylistCreator
        isOpen={showPlaylistCreator}
        onClose={() => setShowPlaylistCreator(false)}
        onSave={createPlaylist}
      />
    </div>
  );
}
