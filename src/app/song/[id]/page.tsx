'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Heart, Share2, ExternalLink } from 'lucide-react';
import { Song } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import NowPlayingSidebar from '@/components/layout/NowPlayingSidebar';
import PlayerBar from '@/components/layout/PlayerBar';
import SongCard from '@/components/SongCard';
import AudioPreview from '@/components/AudioPreview';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    const fetchSong = async () => {
      if (!params.id) return;
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await fetch(`/api/spotify/track/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setSong(null);
            setSimilarTracks([]);
            return;
          }
          throw new Error('Failed to load song details');
        }
        const trackData = await response.json();
        const mainSong: Song = {
          id: trackData.id,
          name: trackData.name,
          artist: trackData.artists?.map((artist: any) => artist.name).join(', ') || 'Unknown Artist',
          album: trackData.album?.name ?? 'Unknown Album',
          albumArt: trackData.album?.images?.[0]?.url ?? '/api/placeholder/400/400',
          previewUrl: trackData.preview_url,
          duration: Math.floor(trackData.duration_ms / 1000),
          spotifyUrl: trackData.external_urls?.spotify,
        };
        setSong(mainSong);
        setQueue([mainSong]);

        if (trackData.artists?.length) {
          const primaryArtist = trackData.artists[0]?.name;
          const similarResponse = await fetch(
            `/api/spotify/search?q=${encodeURIComponent(primaryArtist)}`
          );
          const similarData = await similarResponse.json();
          if (similarData.tracks?.items) {
            const tracks: Song[] = similarData.tracks.items
              .filter((track: any) => track.id !== mainSong.id)
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
        } else {
          setSimilarTracks([]);
        }

        setLyrics('Lyrics would be fetched from Musixmatch API...');
      } catch (error) {
        console.error('Error fetching song:', error);
        setErrorMessage(
          error instanceof Error ? error.message : 'Unable to load song details right now.'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSong();
  }, [params.id]);

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
          setErrorMessage('Unable to play preview. Please try again later.');
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

  const handlePlayTrack = useCallback(
    (track: Song) => {
      if (!track.previewUrl || !audioRef.current) {
        setErrorMessage('Spotify does not provide a playable preview for this track.');
        return;
      }

      const canPlay =
        audioRef.current.canPlayType('audio/mpeg') ||
        audioRef.current.canPlayType('audio/aac') ||
        audioRef.current.canPlayType('audio/ogg');

      if (!canPlay) {
        setErrorMessage('Your browser cannot play this preview format.');
        return;
      }

      setCurrentSong(track);
      setQueue([track, ...similarTracks.filter((t) => t.id !== track.id)]);
      setIsPlaying(true);
      setErrorMessage(null);
    },
    [similarTracks]
  );

  const handleTogglePlay = () => {
    if (!currentSong?.previewUrl) {
      setErrorMessage('No preview available for this track.');
      return;
    }
    setIsPlaying((prev) => !prev);
  };

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
              {errorMessage && (
                <p className="mb-4 text-sm text-red-400">{errorMessage}</p>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    currentSong?.id === song.id && isPlaying
                      ? handleTogglePlay()
                      : handlePlayTrack(song)
                  }
                  className="px-6 py-3 rounded-full bg-yellow-500 hover:bg-yellow-600 text-zinc-900 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!song.previewUrl}
                >
                  {song.previewUrl
                    ? currentSong?.id === song.id && isPlaying
                      ? 'Pause'
                      : 'Play'
                    : 'Preview Unavailable'}
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
              {/* Audio preview / fallback UI */}
              <AudioPreview song={song as any} />
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
                    onPlay={handlePlayTrack}
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
        onPlayPause={handleTogglePlay}
        onNext={() => {}}
        onPrevious={() => {}}
        currentTime={currentTime}
        duration={currentSong?.duration || 0}
      />
    </div>
  );
}

