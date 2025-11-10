'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Playlist, Song } from '@/types';
import { supabase } from '@/lib/supabase';

interface PlaylistContextType {
  playlists: Playlist[];
  createPlaylist: (playlist: Omit<Playlist, 'id' | 'createdAt'>) => Promise<void>;
  updatePlaylist: (id: string, updates: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addSongToPlaylist: (playlistId: string, song: Song) => Promise<void>;
  removeSongFromPlaylist: (playlistId: string, songId: string) => Promise<void>;
  getPlaylist: (id: string) => Playlist | undefined;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      // Try to load from Supabase if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('playlists')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) {
          setPlaylists(data.map(convertFromSupabase));
        }
      } else {
        // Load from localStorage for guests
        const stored = localStorage.getItem('harmony_hub_playlists');
        if (stored) {
          setPlaylists(JSON.parse(stored));
        }
      }
    } catch (error) {
      console.error('Error loading playlists:', error);
      // Fallback to localStorage
      const stored = localStorage.getItem('harmony_hub_playlists');
      if (stored) {
        setPlaylists(JSON.parse(stored));
      }
    }
  };

  const convertFromSupabase = (row: any): Playlist => {
    // Handle jsonb[] array format - convert array of jsonb objects to Song[]
    let songs: Song[] = [];
    if (row.songs) {
      if (Array.isArray(row.songs)) {
        // If it's already an array, use it directly
        songs = row.songs;
      } else {
        // If it's a single jsonb, wrap it in an array
        songs = [row.songs];
      }
    }
    
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      songs: songs,
      createdAt: row.created_at,
      userId: row.user_id,
      isPublic: row.is_public,
    };
  };

  const createPlaylist = async (playlist: Omit<Playlist, 'id' | 'createdAt'>) => {
    const newPlaylist: Playlist = {
      ...playlist,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      userId: playlist.userId || '', // Will be set from user if logged in
    };

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Convert songs array to jsonb[] format (array of jsonb objects)
        const songsArray = playlist.songs.map(song => song);
        
        // Save to Supabase
        const { error } = await supabase
          .from('playlists')
          .insert({
            id: newPlaylist.id,
            title: newPlaylist.title,
            description: newPlaylist.description,
            songs: songsArray, // Supabase will handle jsonb[] conversion
            user_id: user.id,
            is_public: newPlaylist.isPublic,
          });

        if (error) throw error;
        
        // Update the playlist with the actual user_id
        newPlaylist.userId = user.id;
      } else {
        // Save to localStorage for guests
        const updated = [...playlists, newPlaylist];
        localStorage.setItem('harmony_hub_playlists', JSON.stringify(updated));
      }

      setPlaylists((prev) => [...prev, newPlaylist]);
    } catch (error) {
      console.error('Error creating playlist:', error);
      // Fallback to localStorage
      const updated = [...playlists, newPlaylist];
      localStorage.setItem('harmony_hub_playlists', JSON.stringify(updated));
      setPlaylists(updated);
    }
  };

  const updatePlaylist = async (id: string, updates: Partial<Playlist>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const updated = playlists.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );

      if (user) {
        const updateData: any = {};
        if (updates.title !== undefined) updateData.title = updates.title;
        if (updates.description !== undefined) updateData.description = updates.description;
        if (updates.songs !== undefined) updateData.songs = updates.songs;
        if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;

        const { error } = await supabase
          .from('playlists')
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        localStorage.setItem('harmony_hub_playlists', JSON.stringify(updated));
      }

      setPlaylists(updated);
    } catch (error) {
      console.error('Error updating playlist:', error);
    }
  };

  const deletePlaylist = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('playlists')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const updated = playlists.filter((p) => p.id !== id);
        localStorage.setItem('harmony_hub_playlists', JSON.stringify(updated));
      }

      setPlaylists((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const addSongToPlaylist = async (playlistId: string, song: Song) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const updatedSongs = [...playlist.songs, song];
    await updatePlaylist(playlistId, { songs: updatedSongs });
  };

  const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const updatedSongs = playlist.songs.filter((s) => s.id !== songId);
    await updatePlaylist(playlistId, { songs: updatedSongs });
  };

  const getPlaylist = (id: string) => {
    return playlists.find((p) => p.id === id);
  };

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        getPlaylist,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylists() {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylists must be used within a PlaylistProvider');
  }
  return context;
}

