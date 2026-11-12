'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

export default function HeaderAuthStatus() {
  const { user, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div
        className="w-20 h-7 rounded bg-surface-subtle border-2 border-border-main/30 opacity-60 animate-pulse"
        aria-hidden="true"
      />
    );
  }

  if (user) {
    // Format email agar rapi di header
    const displayName = user.email ? user.email.split('@')[0] : 'Mahasiswa';

    return (
      <div className="flex items-center gap-2">
        <div
          className="badge-tactile bg-surface-subtle text-primary border-border-main text-xs font-mono font-bold px-2.5 py-1 rounded shadow-[2px_2px_0px_var(--shadow-color)] flex items-center gap-1.5"
          title={`Masuk sebagai: ${user.email}`}
        >
          <UserIcon className="w-3.5 h-3.5 text-accent" />
          <span className="max-w-[120px] truncate">{displayName}</span>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="p-1.5 rounded-lg border-2 border-border-main bg-surface text-primary shadow-[2px_2px_0px_var(--shadow-color)] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_var(--shadow-color)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center cursor-pointer"
          title="Keluar dari akun (Logout)"
          aria-label="Keluar dari akun"
        >
          <LogOut className="w-3.5 h-3.5 text-muted hover:text-error" />
        </button>
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="btn-tactile-secondary px-3 py-1 rounded-md text-xs font-bold shadow-[2px_2px_0px_var(--shadow-color)] flex items-center gap-1.5"
    >
      <span>Masuk</span>
    </Link>
  );
}
