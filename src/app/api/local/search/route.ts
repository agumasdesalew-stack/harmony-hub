import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  if (!q) return NextResponse.json({ tracks: [] });

  try {
    // Simple ilike search on title, artist, album
    const { data: rows, error } = await supabase
      .from('songs')
      .select('*')
      .or(`title.ilike.%${q}%,artist.ilike.%${q}%,album.ilike.%${q}%`)
      .limit(50);

    if (error) {
      console.error('Supabase search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }

    const normalized = await Promise.all(
      (rows || []).map(async (song: any) => {
        let previewUrl: string | null = null;
        if (song.file_path) {
          try {
            const { data } = supabase.storage.from('songs').getPublicUrl(song.file_path);
            // @ts-ignore
            previewUrl = data?.publicUrl ?? null;
          } catch (e) {
            previewUrl = null;
          }
        }

        let albumArt = '/api/placeholder/300/300';
        if (song.cover_image_path) {
          try {
            const { data } = supabase.storage.from('songs').getPublicUrl(song.cover_image_path);
            // @ts-ignore
            albumArt = data?.publicUrl ?? albumArt;
          } catch (e) {}
        }

        return {
          id: song.id,
          name: song.title,
          artist: song.artist ?? 'Unknown Artist',
          album: song.album ?? '',
          albumArt,
          previewUrl,
          duration: song.duration_seconds ?? 0,
          fileName: song.file_name,
        };
      })
    );

    return NextResponse.json({ tracks: { items: normalized } });
  } catch (err) {
    console.error('Search route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
