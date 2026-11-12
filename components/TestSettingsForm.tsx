'use client';

import React, { useEffect } from 'react';
import { TestSettings, QuestionType, Difficulty } from '@/lib/types';
import { useTestSession } from '@/context/TestSessionContext';

interface TestSettingsFormProps {
  settings: TestSettings;
  onChange: (updated: TestSettings) => void;
  disabled?: boolean;
}

export default function TestSettingsForm({
  settings,
  onChange,
  disabled = false,
}: TestSettingsFormProps) {
  const { difficulty: sessionDifficulty, setDifficulty } = useTestSession();

  // Sinkronisasi dua arah: jika difficulty di header dropdown berubah, perbarui settings
  useEffect(() => {
    if (settings.difficulty !== sessionDifficulty) {
      onChange({ ...settings, difficulty: sessionDifficulty });
    }
  }, [sessionDifficulty, settings, onChange]);

  const handleCountChange = (value: number) => {
    const clamped = Math.min(Math.max(value, 1), 20);
    onChange({ ...settings, questionCount: clamped });
  };

  const handleTypeChange = (questionType: QuestionType) => {
    onChange({ ...settings, questionType });
  };

  const handleDifficultyChange = (newDifficulty: Difficulty) => {
    setDifficulty(newDifficulty);
    onChange({ ...settings, difficulty: newDifficulty });
  };

  return (
    <div className="space-y-6">
      {/* Jumlah Soal */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="questionCount" className="text-sm font-semibold text-primary">
            Jumlah Soal
          </label>
          <span className="text-sm font-mono font-bold text-primary bg-surface-subtle px-2.5 py-0.5 border-2 border-border-main rounded shadow-[2px_2px_0px_var(--shadow-color)]">
            {settings.questionCount} Butir
          </span>
        </div>
        <div className="flex items-center gap-4">
          <input
            id="questionCount"
            type="range"
            min={1}
            max={20}
            step={1}
            value={settings.questionCount}
            onChange={(e) => handleCountChange(parseInt(e.target.value, 10))}
            disabled={disabled}
            className="w-full accent-accent cursor-pointer disabled:cursor-not-allowed"
          />
          <input
            type="number"
            min={1}
            max={20}
            value={settings.questionCount}
            onChange={(e) => handleCountChange(parseInt(e.target.value, 10) || 1)}
            disabled={disabled}
            className="w-16 border-2 border-border-main bg-surface text-primary rounded px-2 py-1 text-sm font-mono font-bold text-center shadow-[2px_2px_0px_var(--shadow-color)] focus:outline-none focus:shadow-none focus:translate-x-0.5 focus:translate-y-0.5 disabled:bg-surface-subtle disabled:text-muted transition-all"
          />
        </div>
        <p className="text-xs text-muted">
          Pilih antara 1 hingga 20 butir soal untuk sesi ini.
        </p>
      </div>

      {/* Tipe Soal */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-primary block">
          Tipe Soal
        </label>
        <div className="grid grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => handleTypeChange('multiple_choice')}
            disabled={disabled}
            className={`rounded-lg p-3.5 text-left transition-all duration-120 cursor-pointer ${
              settings.questionType === 'multiple_choice'
                ? 'border-2 border-accent bg-accent/15 text-primary font-bold shadow-[0px_0px_0px_var(--accent-primary)] translate-x-0.5 translate-y-0.5 ring-1 ring-accent'
                : 'border-2 border-border-main bg-surface text-primary shadow-[3px_3px_0px_var(--shadow-color)] hover:shadow-[4px_4px_0px_var(--shadow-color)] hover:-translate-x-0.5 hover:-translate-y-0.5'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="text-sm font-bold">Pilihan Ganda</div>
            <div className="text-xs text-muted mt-0.5 font-normal">
              4 opsi jawaban dengan 1 kunci benar
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTypeChange('essay')}
            disabled={disabled}
            className={`rounded-lg p-3.5 text-left transition-all duration-120 cursor-pointer ${
              settings.questionType === 'essay'
                ? 'border-2 border-accent bg-accent/15 text-primary font-bold shadow-[0px_0px_0px_var(--accent-primary)] translate-x-0.5 translate-y-0.5 ring-1 ring-accent'
                : 'border-2 border-border-main bg-surface text-primary shadow-[3px_3px_0px_var(--shadow-color)] hover:shadow-[4px_4px_0px_var(--shadow-color)] hover:-translate-x-0.5 hover:-translate-y-0.5'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <div className="text-sm font-bold">Esai & Uraian</div>
            <div className="text-xs text-muted mt-0.5 font-normal">
              Pertanyaan pemahaman & analisis mandiri
            </div>
          </button>
        </div>
      </div>

      {/* Tingkat Kesulitan / Mode Ujian */}
      <div className="space-y-2">
        <label className="text-sm font-semibold text-primary block">
          Tingkat Kesulitan & Mode Ujian
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(
            [
              { key: 'easy', label: 'Mode Latihan', badge: 'Mudah', desc: 'Pemahaman konsep dasar & definisi materi' },
              { key: 'medium', label: 'Ujian Harian', badge: 'Normal', desc: 'Penerapan konsep & evaluasi mingguan' },
              { key: 'hard', label: 'Assesmen', badge: 'Ujian Resmi', desc: 'Analisis kritis mendalam setara UTS/UAS' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => handleDifficultyChange(item.key)}
              disabled={disabled}
              className={`rounded-lg p-3 text-left transition-all duration-120 cursor-pointer ${
                settings.difficulty === item.key
                  ? 'border-2 border-accent bg-accent/15 text-primary font-bold shadow-[0px_0px_0px_var(--accent-primary)] translate-x-0.5 translate-y-0.5 ring-1 ring-accent'
                  : 'border-2 border-border-main bg-surface text-primary shadow-[3px_3px_0px_var(--shadow-color)] hover:shadow-[4px_4px_0px_var(--shadow-color)] hover:-translate-x-0.5 hover:-translate-y-0.5'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between gap-1 mb-0.5">
                <span className="text-sm font-bold">{item.label}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded border border-border-main bg-surface-subtle text-muted">
                  {item.badge}
                </span>
              </div>
              <div className="text-xs text-muted font-normal leading-snug">
                {item.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
