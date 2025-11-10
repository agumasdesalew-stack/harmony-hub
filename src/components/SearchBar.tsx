'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { Song } from '@/types';

interface SearchBarProps {
  onSearch: (query: string) => void;
  onSelectSong?: (song: Song) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, onSelectSong, placeholder = 'Search for songs, artists, or moods...' }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length > 2) {
      const debounceTimer = setTimeout(async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
          const data = await response.json();
          if (data.tracks?.items) {
            const songs: Song[] = data.tracks.items.map((track: any) => ({
              id: track.id,
              name: track.name,
              artist: track.artists[0]?.name || 'Unknown Artist',
              album: track.album.name,
              albumArt: track.album.images[0]?.url || '/api/placeholder/300/300',
              previewUrl: track.preview_url,
              duration: Math.floor(track.duration_ms / 1000),
              spotifyUrl: track.external_urls.spotify,
            }));
            setSuggestions(songs.slice(0, 5));
          }
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsLoading(false);
        }
      }, 300);

      return () => clearTimeout(debounceTimer);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query);
      setIsFocused(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={`relative flex items-center gap-3 px-4 py-3 rounded-full bg-white/10 dark:bg-zinc-800/50 backdrop-blur-md border transition-all ${
            isFocused
              ? 'border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.3)]'
              : 'border-zinc-700/50'
          }`}
        >
          <Search
            size={20}
            className={`flex-shrink-0 transition-colors ${
              isFocused ? 'text-yellow-500' : 'text-zinc-400'
            }`}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-white placeholder-zinc-400 text-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
              }}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </form>

      {/* Autocomplete Suggestions */}
      {isFocused && (suggestions.length > 0 || isLoading) && (
        <div className="absolute top-full mt-2 w-full bg-zinc-900/95 backdrop-blur-md rounded-lg border border-zinc-800 shadow-xl z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-zinc-400 text-sm">Searching...</div>
          ) : (
            <div className="py-2">
              {suggestions.map((song) => (
                <button
                  key={song.id}
                  onClick={() => {
                    if (onSelectSong) {
                      onSelectSong(song);
                    }
                    setQuery('');
                    setSuggestions([]);
                    setIsFocused(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-zinc-800">
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
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

