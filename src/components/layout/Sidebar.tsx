'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Music,
  Disc,
  Users,
  Radio,
  Clock,
  Heart,
  Folder,
} from 'lucide-react';

const navigationItems = [
  { name: 'Browse', href: '/', icon: Home },
  { name: 'Songs', href: '/songs', icon: Music },
  { name: 'Albums', href: '/albums', icon: Disc },
  { name: 'Artists', href: '/artists', icon: Users },
 
];

const myMusicItems = [
  { name: 'Recently Played', href: '/recently-played', icon: Clock },
  { name: 'Favorite Songs', href: '/favorites', icon: Heart },
  { name: 'Local File', href: '/local', icon: Folder },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-zinc-900 text-zinc-300 h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Library
        </h2>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-zinc-800 text-white'
                    : 'hover:bg-zinc-800/50 text-zinc-300'
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-8 pt-8 border-t border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            My music
          </h2>
          <nav className="space-y-1">
            {myMusicItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-zinc-800 text-white'
                      : 'hover:bg-zinc-800/50 text-zinc-300'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </aside>
  );
}

