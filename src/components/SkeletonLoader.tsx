'use client';

export function SongCardSkeleton() {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-sm rounded-lg overflow-hidden animate-pulse">
      <div className="aspect-square bg-zinc-800" />
      <div className="p-4">
        <div className="h-4 bg-zinc-800 rounded mb-2" />
        <div className="h-3 bg-zinc-800 rounded w-2/3" />
      </div>
    </div>
  );
}

export function PlaylistSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-900 animate-pulse p-8">
      <div className="h-6 bg-zinc-700 rounded w-32 mb-2" />
      <div className="h-10 bg-zinc-700 rounded w-64 mb-3" />
      <div className="h-4 bg-zinc-700 rounded w-96 mb-4" />
      <div className="flex gap-6">
        <div className="h-4 bg-zinc-700 rounded w-24" />
        <div className="h-4 bg-zinc-700 rounded w-24" />
        <div className="h-4 bg-zinc-700 rounded w-24" />
      </div>
    </div>
  );
}

export function SearchBarSkeleton() {
  return (
    <div className="w-full max-w-2xl animate-pulse">
      <div className="h-12 bg-zinc-800 rounded-full" />
    </div>
  );
}

