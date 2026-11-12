'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTestSession } from '@/context/TestSessionContext';
import { AVAILABLE_MODES, TestMode } from '@/lib/types';
import { ChevronDown, Check, Lock } from 'lucide-react';

export default function HeaderModeSelector() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { selectedMode, setSelectedMode, isExamInProgress } = useTestSession();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Aturan Visibilitas:
  // 1. Sembunyikan di rute /login
  // 2. Sembunyikan di beranda '/' jika pengguna belum login
  const isLoginPage = pathname === '/login';
  const isPublicLanding = pathname === '/' && !user;

  // Tutup dropdown saat klik di luar area atau tekan Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (isLoginPage || isPublicLanding) {
    return null;
  }

  const currentModeInfo = AVAILABLE_MODES.find((m) => m.id === selectedMode) || AVAILABLE_MODES[1];

  const handleSelectMode = (modeId: TestMode) => {
    if (isExamInProgress) return;
    setSelectedMode(modeId);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Pemicu Dropdown */}
      <button
        type="button"
        onClick={() => {
          if (!isExamInProgress) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={isExamInProgress}
        className={`badge-tactile bg-surface-subtle text-primary border-border-main text-xs font-mono font-bold px-2.5 py-1 rounded shadow-[2px_2px_0px_var(--shadow-color)] flex items-center gap-1.5 transition-all select-none ${
          isExamInProgress
            ? 'opacity-75 cursor-not-allowed'
            : 'hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_var(--shadow-color)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none cursor-pointer'
        }`}
        title={
          isExamInProgress
            ? 'Tingkat kesulitan terkunci selama sesi pengerjaan berlangsung. Selesaikan atau buat tes baru untuk mengubah mode.'
            : 'Klik untuk memilih mode evaluasi materi (Latihan, Ujian Harian, Assesmen)'
        }
        aria-label="Pilih Mode Ujian"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {isExamInProgress && <Lock className="w-3 h-3 text-muted shrink-0" />}
        <span>{currentModeInfo.name}</span>
        <span className="text-[10px] text-muted font-normal">
          ({currentModeInfo.difficultyLabel})
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted transition-transform duration-150 ${
            isOpen ? 'rotate-180' : 'rotate-0'
          }`}
        />
      </button>

      {/* Panel Menu Dropdown Mengambang (Tactile Soft-3D) */}
      {isOpen && !isExamInProgress && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 card-tactile p-2 shadow-[5px_5px_0px_var(--shadow-color)] z-50 space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1 text-[11px] font-mono font-bold text-muted border-b border-border-main/20 flex justify-between items-center">
            <span>PILIH MODE EVALUASI</span>
            <span className="text-[10px]">Tingkat Kesulitan</span>
          </div>

          <div className="space-y-1 pt-0.5">
            {AVAILABLE_MODES.map((mode) => {
              const isSelected = mode.id === selectedMode;

              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => handleSelectMode(mode.id)}
                  className={`w-full text-left p-2.5 rounded-md border-2 transition-all flex items-start justify-between gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'border-border-main bg-accent/15 text-primary shadow-[2px_2px_0px_var(--shadow-color)] font-bold ring-1 ring-accent'
                      : 'border-transparent hover:border-border-main hover:bg-surface-subtle text-primary'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold leading-none">{mode.name}</span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded border border-border-main ${
                          mode.id === 'practice'
                            ? 'bg-surface-subtle text-muted'
                            : mode.id === 'daily_quiz'
                            ? 'bg-accent/20 text-accent font-semibold'
                            : 'bg-accent-highlight/30 text-primary font-bold'
                        }`}
                      >
                        {mode.difficultyLabel}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted font-normal leading-snug">
                      {mode.desc}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded border border-border-main bg-accent text-accent-contrast flex items-center justify-center shrink-0 mt-0.5 shadow-[1px_1px_0px_var(--shadow-color)]">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <div className="px-2 pt-1 border-t border-border-main/20 text-[10px] text-muted font-mono">
            Mode berlaku untuk paket soal yang akan digenerate berikutnya.
          </div>
        </div>
      )}
    </div>
  );
}
