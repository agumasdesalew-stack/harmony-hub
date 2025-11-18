'use client';

import Sidebar from '@/components/layout/Sidebar';
import NowPlayingSidebar from '@/components/layout/NowPlayingSidebar';
import PlayerBar from '@/components/layout/PlayerBar';

export default function RecentlyPlayedPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 ml-64 mr-80 mb-20 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 p-8">
        <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-white">Recently Played</h1>
        <p className="text-zinc-500">Your recently played tracks will appear here.</p>
      </main>

      <NowPlayingSidebar />
      <PlayerBar />
    </div>
  );
}
