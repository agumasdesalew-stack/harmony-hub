'use client';

import { useState, useEffect } from 'react';
import { User, LogOut, LogIn } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User as UserType } from '@/types';

export default function AuthButton() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    checkUser();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          avatar: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser({
          id: currentUser.id,
          email: currentUser.email || '',
          name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0],
          avatar: currentUser.user_metadata?.avatar_url,
        });
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setShowMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-zinc-700 animate-pulse" />
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-8 h-8 rounded-full bg-zinc-300 dark:bg-zinc-700 flex items-center justify-center hover:bg-zinc-400 dark:hover:bg-zinc-600 transition-colors"
      >
        {user?.avatar ? (
          <img
            src={user.avatar}
            alt={user.name || 'User'}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <User size={16} className="text-zinc-900 dark:text-white" />
        )}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-zinc-800 rounded-lg shadow-xl border border-zinc-700 z-50">
            {user ? (
              <>
                <div className="p-4 border-b border-zinc-700">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleSignIn}
                className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
              >
                <LogIn size={16} />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

