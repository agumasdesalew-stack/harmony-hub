'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const html = document.documentElement;
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored ? stored === 'dark' : prefersDark;
    
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    
    if (newIsDark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun size={20} className="text-zinc-900 dark:text-white" />
      ) : (
        <Moon size={20} className="text-zinc-900 dark:text-white" />
      )}
    </button>
  );
}

