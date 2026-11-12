'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionList from '@/components/QuestionList';
import { Question } from '@/lib/types';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function ResultsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [materialTitle, setMaterialTitle] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('belakhar_latest_test');
      if (stored) {
        const parsed = JSON.parse(stored);
        setQuestions(parsed.questions || []);
        setMaterialTitle(parsed.materialTitle || '');
        setSessionId(parsed.sessionId || undefined);
      }
    } catch (e) {
      console.error('Failed to load test session from storage:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const handleReset = () => {
    sessionStorage.removeItem('belakhar_latest_test');
    router.push('/');
  };

  if (!isLoaded) {
    return (
      <div className="text-center py-16 text-xs text-muted font-mono">
        Memuat sesi evaluasi...
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto card-tactile p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-lg bg-surface-subtle border-2 border-border-main flex items-center justify-center shadow-[2px_2px_0px_var(--shadow-color)]">
          <AlertCircle className="w-6 h-6 text-muted" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-primary">
            Belum Ada Sesi Ujian Aktif
          </h2>
          <p className="text-xs text-muted leading-relaxed">
            Silakan unggah dokumen materi dan susun soal terlebih dahulu di halaman utama.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex btn-tactile-primary py-2.5 px-4 rounded-md text-xs font-bold transition-all"
        >
          Kembali ke Pengaturan
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <QuestionList
        questions={questions}
        materialTitle={materialTitle}
        sessionId={sessionId}
        onReset={handleReset}
      />
    </div>
  );
}
