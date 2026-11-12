'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    // Cek apakah <html> memiliki class 'dark'
    const hasDarkClass = document.documentElement.classList.contains('dark');
    setIsDark(hasDarkClass);
  }, []);

  const toggleTheme = () => {
    const nextState = !isDark;
    setIsDark(nextState);

    if (nextState) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('belakhar_theme', 'dark');
      } catch (e) {
        console.warn('Gagal menyimpan tema di localStorage:', e);
      }
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('belakhar_theme', 'light');
      } catch (e) {
        console.warn('Gagal menyimpan tema di localStorage:', e);
      }
    }
  };

  if (!mounted) {
    // Placeholder dengan ukuran identik untuk mencegah layout shift sebelum hydration
    return (
      <div
        className="w-9 h-9 rounded-lg border-2 border-border-main bg-surface shadow-[2px_2px_0px_var(--shadow-color)] opacity-70"
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="w-9 h-9 rounded-lg border-2 border-border-main bg-surface text-primary shadow-[2px_2px_0px_var(--shadow-color)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_var(--shadow-color)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center cursor-pointer"
      title={isDark ? 'Beralih ke Mode Terang (Notebook Light)' : 'Beralih ke Mode Gelap (Chalkboard Dark)'}
      aria-label={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-accent transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-primary transition-transform duration-200 rotate-0 hover:-rotate-12" />
      )}
    </button>
  );
}
