'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePlayer } from '@/contexts/PlayerContext';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Heart, Share2, ExternalLink } from 'lucide-react';
import { Song } from '@/types';
import Sidebar from '@/components/layout/Sidebar';
import NowPlayingSidebar from '@/components/layout/NowPlayingSidebar';
import PlayerBar from '@/components/layout/PlayerBar';
import SongCard from '@/components/SongCard';
import SpotifyEmbed from '@/components/SpotifyEmbed';

export default function SongDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [song, setSong] = useState<Song | null>(null);
  const [similarTracks, setSimilarTracks] = useState<Song[]>([]);
  const [lyrics, setLyrics] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [embedTrackId, setEmbedTrackId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const player = usePlayer();

  // Audio playback is managed by the global PlayerContext (player).
  // This page should not create its own audio element or local playback state.

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
  // populate global player queue (no autoplay)
  player.setQueue([mainSong]);

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

  // Playback handled by PlayerContext; no local audio element here.

  // Playback handled by PlayerContext; no local audio element here.

  const handlePlayTrack = useCallback(
    (track: Song) => {
      const orderedQueue = [track, ...similarTracks.filter((t) => t.id !== track.id)];
      if (!track.previewUrl) {
        if (track.id) setEmbedTrackId(track.id);
        // set now playing in the global player but don't autoplay (embed will handle playback)
        player.setNowPlaying(track, orderedQueue, false);
        return;
      }

      // Use global player for preview playback
      player.play(track, orderedQueue);
      setErrorMessage(null);
    },
    [similarTracks, player]
  );

  const handleTogglePlay = () => {
    if (!player.currentSong?.previewUrl) {
      setErrorMessage('No preview available for this track.');
      return;
    }
    player.toggle();
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
        <NowPlayingSidebar />
        <PlayerBar />
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
                    player.currentSong?.id === song.id && player.isPlaying
                      ? handleTogglePlay()
                      : handlePlayTrack(song)
                  }
                  className="px-6 py-3 rounded-full bg-yellow-500 hover:bg-yellow-600 text-zinc-900 font-semibold transition-colors"
                >
                  {song.previewUrl
                    ? player.currentSong?.id === song.id && player.isPlaying
                      ? 'Pause'
                      : 'Play'
                    : 'Play'}
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
                    onPlay={handlePlayTrack}
                  />
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
    </div>
  );
}

