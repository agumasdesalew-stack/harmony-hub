'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Upload } from 'lucide-react';

export default function UploadMusic() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const onChoose = () => fileInputRef.current?.click();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);

    try {
      // Quick check: ensure the `songs` bucket exists. Calling list() will error if the bucket is missing.
      try {
        // Attempt to list a small chunk from the bucket to validate it exists.
        // If the bucket doesn't exist, Supabase will return an error we can show to the user.
        // Note: .list may return { data, error } depending on supabase-js version.
        // We handle both shapes below.
        const maybeList: any = await supabase.storage.from('songs').list('', { limit: 1 });
        if (maybeList && maybeList.error) {
          throw maybeList.error;
        }
      } catch (bucketErr: any) {
        console.error('Storage bucket check failed', bucketErr);
        const hint =
          (bucketErr && (bucketErr.message || bucketErr.error || bucketErr.statusText)) ||
          'Storage bucket `songs` not found.';
        alert(
          `Storage bucket check failed: ${hint}.\nCreate a bucket named 'songs' in your Supabase project (Storage → Create bucket) or make sure your env keys point to the correct project.`
        );
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      const userId = user?.id ?? 'anonymous';

      // compute duration by loading metadata off a blob URL
      const objectUrl = URL.createObjectURL(file);
      const audio = document.createElement('audio');
      let durationSeconds: number | null = null;
      await new Promise<void>((resolve) => {
        audio.addEventListener('loadedmetadata', () => {
          durationSeconds = Math.floor(audio.duration || 0);
          resolve();
        });
        audio.src = objectUrl;
      });
      URL.revokeObjectURL(objectUrl);

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const path = `${userId}/${timestamp}_${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('songs')
        .upload(path, file, { cacheControl: '3600', upsert: false });

      if (uploadError) throw uploadError;

      // get public url
      const { data: urlData } = supabase.storage.from('songs').getPublicUrl(path);
      // @ts-ignore
      const publicUrl = urlData?.publicUrl ?? null;

      // insert DB row and request the inserted row back
      const { data: insertedRows, error: insertError } = await supabase
        .from('songs')
        .insert({
          user_id: userId,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
          mime_type: file.type || 'audio/mpeg',
          title: file.name,
          artist: '',
          album: '',
          duration_seconds: durationSeconds,
          cover_image_path: null,
        })
        .select('*');

      if (insertError) throw insertError;

      // If insert returned the row, dispatch a global event so the Songs page can update live.
      const newRow = Array.isArray(insertedRows) ? insertedRows[0] : insertedRows;
      try {
        if (newRow) {
          window.dispatchEvent(new CustomEvent('song:uploaded', { detail: newRow }));
        }
      } catch (e) {
        // ignore if window not available or CustomEvent blocked
      }

      // navigate to songs page to see uploaded file
      router.push('/songs');
    } catch (err: any) {
      console.error('Upload failed', err);
      // Try to show a helpful message to the user. Supabase errors often have `message` or `error` fields.
      const message =
        (err && (err.message || err.error || err.statusText)) ||
        (typeof err === 'string' ? err : null) ||
        'Upload failed. Check the browser console for details.';
      alert(message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={onChoose}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-800/50 text-zinc-300"
        disabled={isUploading}
        title="Upload local music"
      >
        <Upload size={16} />
        <span className="text-sm">Upload</span>
      </button>
    </div>
  );
}
