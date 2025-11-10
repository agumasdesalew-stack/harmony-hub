'use client';

import { useState } from 'react';
import { X, GripVertical, Play, Trash2 } from 'lucide-react';
import { Song, Playlist } from '@/types';

interface PlaylistCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (playlist: Omit<Playlist, 'id' | 'createdAt'>) => void;
  initialSongs?: Song[];
}

export default function PlaylistCreator({
  isOpen,
  onClose,
  onSave,
  initialSongs = [],
}: PlaylistCreatorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [songs, setSongs] = useState<Song[]>(initialSongs);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;

    const newSongs = [...songs];
    const draggedSong = newSongs[draggedIndex];
    newSongs.splice(draggedIndex, 1);
    newSongs.splice(index, 0, draggedSong);
    setSongs(newSongs);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleRemoveSong = (index: number) => {
    setSongs(songs.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert('Please enter a playlist name');
      return;
    }

    onSave({
      title: name,
      description,
      songs,
      userId: '',
      isPublic: false,
    });

    // Reset form
    setName('');
    setDescription('');
    setSongs([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-zinc-800">
          <h2 className="text-2xl font-bold text-white">Create Playlist</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Playlist Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Road Trip '25"
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-yellow-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-zinc-800 text-white placeholder-zinc-500 border border-zinc-700 focus:outline-none focus:border-yellow-500 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-zinc-300">
                Songs ({songs.length})
              </label>
            </div>

            {songs.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">
                <p>No songs added yet. Search and add songs to your playlist!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {songs.map((song, index) => (
                  <div
                    key={`${song.id}-${index}`}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-move"
                  >
                    <GripVertical size={20} className="text-zinc-500 flex-shrink-0" />
                    <div className="w-12 h-12 rounded overflow-hidden bg-zinc-700 flex-shrink-0">
                      <img
                        src={song.albumArt}
                        alt={song.album}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{song.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {Math.floor(song.duration / 60)}:
                      {(song.duration % 60).toString().padStart(2, '0')}
                    </span>
                    <button
                      onClick={() => handleRemoveSong(index)}
                      className="text-zinc-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg bg-yellow-500 text-zinc-900 font-semibold hover:bg-yellow-600 transition-colors"
          >
            Save Playlist
          </button>
        </div>
      </div>
    </div>
  );
}

