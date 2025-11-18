export interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string; // URL to album art or cover image

  // Playback URL for previews or local files (signed/public URL)
  previewUrl: string | null;

  // Duration in seconds
  duration: number;

  // Optional external/integration fields
  spotifyUrl?: string;

  // Local-file metadata (optional)
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  songs: Song[];
  createdAt: string;
  userId: string;
  isPublic: boolean;
  likes?: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

