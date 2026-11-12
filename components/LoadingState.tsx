'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  fileName?: string;
  questionCount: number;
}

export default function LoadingState({
  fileName,
  questionCount,
}: LoadingStateProps) {
  return (
    <div className="card-tactile p-10 flex flex-col items-center justify-center text-center space-y-4">
      <div className="w-12 h-12 rounded-lg bg-accent/15 border-2 border-border-main flex items-center justify-center shadow-[2px_2px_0px_var(--shadow-color)]">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-primary">
          Sedang Menyusun Soal Ujian
        </h3>
        <p className="text-xs text-muted max-w-sm leading-relaxed">
          Menganalisis isi berkas{' '}
          <span className="font-semibold text-primary">{fileName || 'dokumen'}</span>{' '}
          dan merumuskan {questionCount} butir evaluasi terstruktur...
        </p>
      </div>
      <div className="text-[11px] font-mono text-muted bg-surface-subtle px-3 py-1.5 border-2 border-border-main rounded shadow-[2px_2px_0px_var(--shadow-color)]">
        Proses ini biasanya memerlukan waktu 5 hingga 15 detik
      </div>
    </div>
  );
}
