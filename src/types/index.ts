export interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string;
  previewUrl: string | null;
  duration: number; // in seconds
  spotifyUrl?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  songs: Song[];
  createdAt: string;
  userId: string;
  isPublic: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

