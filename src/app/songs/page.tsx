'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import NowPlayingSidebar from '@/components/layout/NowPlayingSidebar';
import PlayerBar from '@/components/layout/PlayerBar';
import { Song } from '@/types';
import { supabase } from '@/lib/supabase';
import { usePlayer } from '@/contexts/PlayerContext';

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const player = usePlayer();

  useEffect(() => {
    let mounted = true;
    const onUploaded = (e: any) => {
      try {
        const s: any = e?.detail;
        if (!s) return;
        const publicUrl = s.file_path ? supabase.storage.from('songs').getPublicUrl(s.file_path).data?.publicUrl ?? null : null;
        const albumArt = s.cover_image_path ? supabase.storage.from('songs').getPublicUrl(s.cover_image_path).data?.publicUrl ?? '/api/placeholder/300/300' : '/api/placeholder/300/300';
        const normalized = {
          id: s.id,
          name: s.title,
          artist: s.artist ?? '',
          album: s.album ?? '',
          albumArt,
          previewUrl: publicUrl,
          duration: s.duration_seconds ?? 0,
          fileName: s.file_name,
          filePath: s.file_path,
        } as Song;

        setSongs((prev) => [normalized, ...(prev || [])]);
      } catch (err) {
        console.error('Failed to handle song:uploaded event', err);
      }
    };
    const load = async () => {
      setLoading(true);
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        const userId = user?.id;
        if (!userId) {
          setSongs([]);
          return;
        }

        const { data, error } = await supabase
          .from('songs')
          .select('*')
          .eq('user_id', userId)
          .order('uploaded_at', { ascending: false });

        if (error) throw error;

        const normalized = (data || []).map((s: any) => {
          const publicUrl = s.file_path ? supabase.storage.from('songs').getPublicUrl(s.file_path).data?.publicUrl ?? null : null;
          const albumArt = s.cover_image_path ? supabase.storage.from('songs').getPublicUrl(s.cover_image_path).data?.publicUrl ?? '/api/placeholder/300/300' : '/api/placeholder/300/300';
          return {
            id: s.id,
            name: s.title,
            artist: s.artist ?? '',
            album: s.album ?? '',
            albumArt,
            previewUrl: publicUrl,
            duration: s.duration_seconds ?? 0,
            fileName: s.file_name,
            filePath: s.file_path,
          } as Song;
        });

        if (mounted) setSongs(normalized);
      } catch (err) {
        console.error('Failed to load songs', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    window.addEventListener('song:uploaded', onUploaded as EventListener);
    return () => {
      mounted = false;
      window.removeEventListener('song:uploaded', onUploaded as EventListener);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 mr-80 mb-20 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 p-8">
        <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">Songs</h1>
        {loading ? (
          <p className="text-zinc-500">Loading your songs...</p>
        ) : songs.length === 0 ? (
          <div className="text-zinc-500">No songs yet. Use the Upload button in the sidebar to add music.</div>
        ) : (
          <div className="space-y-3">
            {songs.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded overflow-hidden bg-zinc-200">
                    <img src={s.albumArt} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-white">{s.name}</div>
                    <div className="text-xs text-zinc-500">{s.artist}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => player.play(s, songs)}
                    className="px-3 py-1 bg-yellow-500 rounded-full text-zinc-900"
                  >
                    Play
                  </button>
                  <a href={s.previewUrl ?? '#'} target="_blank" rel="noreferrer" className="text-xs text-zinc-500">Open</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <NowPlayingSidebar />
      <PlayerBar />
    </div>
  );
}
