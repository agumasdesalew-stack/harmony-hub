'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Heart, Share2, ExternalLink } from 'lucide-react';
import { Song } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import NowPlayingSidebar from '@/components/layout/NowPlayingSidebar';
import PlayerBar from '@/components/layout/PlayerBar';
import SongCard from '@/components/SongCard';

export default function SongDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [song, setSong] = useState<Song | null>(null);
  const [similarTracks, setSimilarTracks] = useState<Song[]>([]);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSong, setCurrentSong] = useState<Song | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [queue, setQueue] = useState<Song[]>([]);

  useEffect(() => {
    // Fetch song details
    const fetchSong = async () => {
      try {
        // In a real app, you'd fetch from your API
        // For now, using mock data
        const mockSong: Song = {
          id: params.id as string,
          name: 'Blinding Lights',
          artist: 'The Weeknd',
          album: 'After Hours',
          albumArt: '/api/placeholder/400/400',
          previewUrl: null,
          duration: 200,
          spotifyUrl: 'https://open.spotify.com/track/1',
        };
        setSong(mockSong);

        // Fetch similar tracks
        const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(mockSong.artist)}`);
        const data = await response.json();
        if (data.tracks?.items) {
          const tracks: Song[] = data.tracks.items
            .slice(0, 6)
            .map((track: any) => ({
              id: track.id,
              name: track.name,
              artist: track.artists[0]?.name || 'Unknown Artist',
              album: track.album.name,
              albumArt: track.album.images[0]?.url || '/api/placeholder/300/300',
              previewUrl: track.preview_url,
              duration: Math.floor(track.duration_ms / 1000),
              spotifyUrl: track.external_urls.spotify,
            }));
          setSimilarTracks(tracks);
        }

        // Fetch lyrics (would use Musixmatch API in production)
        setLyrics('Lyrics would be fetched from Musixmatch API...');
      } catch (error) {
        console.error('Error fetching song:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchSong();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 mr-80 mb-20 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-zinc-800 rounded w-1/4 mb-4" />
            <div className="h-96 bg-zinc-800 rounded mb-8" />
            <div className="h-64 bg-zinc-800 rounded" />
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

  if (!song) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-900">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2 text-white">Song not found</h2>
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
            <div className="w-80 h-80 rounded-2xl overflow-hidden bg-zinc-800 flex-shrink-0">
              <img
                src={song.albumArt}
                alt={song.album}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2 text-zinc-900 dark:text-white">
                {song.name}
              </h1>
              <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-6">
                {song.artist} • {song.album}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCurrentSong(song)}
                  className="px-6 py-3 rounded-full bg-yellow-500 hover:bg-yellow-600 text-zinc-900 font-semibold transition-colors"
                >
                  Play
                </button>
                <button className="p-3 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                  <Heart size={20} className="text-zinc-900 dark:text-white" />
                </button>
                <button className="p-3 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                  <Share2 size={20} className="text-zinc-900 dark:text-white" />
                </button>
                <button className="p-3 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors">
                  <Plus size={20} className="text-zinc-900 dark:text-white" />
                </button>
                {song.spotifyUrl && (
                  <a
                    href={song.spotifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                  >
                    <ExternalLink size={20} className="text-zinc-900 dark:text-white" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Lyrics Section */}
          {lyrics && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">Lyrics</h2>
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-6">
                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                  {lyrics}
                </p>
              </div>
            </div>
          )}

          {/* Similar Tracks */}
          {similarTracks.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">
                Similar Tracks
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {similarTracks.map((track) => (
                  <SongCard
                    key={track.id}
                    song={track}
                    onPlay={setCurrentSong}
                  />
                ))}
              </div>
            </div>
          )}
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

