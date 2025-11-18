import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    const { data: song, error } = await supabase.from('songs').select('*').eq('id', id).single();
    if (error) {
      if (error.code === 'PGRST116') return NextResponse.json({ error: 'Not found' }, { status: 404 });
      console.error('Supabase error fetching song:', error);
      return NextResponse.json({ error: 'Failed to fetch song' }, { status: 500 });
    }

    if (!song) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Build public URLs from storage (bucket: songs)
    let previewUrl: string | null = null;
    if (song.file_path) {
      try {
        const { data } = supabase.storage.from('songs').getPublicUrl(song.file_path);
        // @ts-ignore - runtime shape
        previewUrl = data?.publicUrl ?? null;
      } catch (e) {
        console.error('Error getting public URL for file_path:', e);
        previewUrl = null;
      }
    }

    let albumArt = '/api/placeholder/400/400';
    if (song.cover_image_path) {
      try {
        const { data } = supabase.storage.from('songs').getPublicUrl(song.cover_image_path);
        // @ts-ignore
        albumArt = data?.publicUrl ?? albumArt;
      } catch (e) {
        console.error('Error getting public URL for cover_image_path:', e);
      }
    }

    const normalized = {
      id: song.id,
      name: song.title,
      artist: song.artist ?? '',
      album: song.album ?? '',
      albumArt,
      previewUrl,
      duration: song.duration_seconds ?? 0,
      fileName: song.file_name,
      filePath: song.file_path,
      fileSize: song.file_size,
      mimeType: song.mime_type,
      uploadedAt: song.uploaded_at,
    };

    return NextResponse.json(normalized);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
