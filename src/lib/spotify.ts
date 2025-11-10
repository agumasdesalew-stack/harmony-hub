// Spotify API utilities
export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
  };
  preview_url: string | null;
  duration_ms: number;
  external_urls: {
    spotify: string;
  };
}

export interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

export async function searchSpotify(query: string): Promise<SpotifyTrack[]> {
  // This will be implemented with a Next.js API route to handle Spotify API calls
  const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search Spotify');
  }
  const data: SpotifySearchResponse = await response.json();
  return data.tracks.items;
}

