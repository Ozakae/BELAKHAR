'use client';

import React, { useState } from 'react';
import { Question, SubmitAttemptResponseData } from '@/lib/types';
import QuestionCard from './QuestionCard';
import { useTestSession } from '@/context/TestSessionContext';
import {
  RotateCcw,
  Send,
  Award,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface QuestionListProps {
  questions: Question[];
  materialTitle?: string;
  sessionId?: string;
  onReset: () => void;
}

export default function QuestionList({
  questions,
  materialTitle,
  sessionId,
  onReset,
}: QuestionListProps) {
  const { selectedMode, setIsExamInProgress } = useTestSession();

  // State pengerjaan
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionResult, setSubmissionResult] = useState<SubmitAttemptResponseData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Penentuan hak akses kunci instan (Mode Latihan = boleh, Harian & Assesmen = terkunci)
  const allowInstantReview = selectedMode === 'practice';
  const isSubmitted = submissionResult !== null;

  // Handler memilih jawaban untuk suatu nomor soal
  const handleAnswerSelect = (questionIdOrIndex: string, answer: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionIdOrIndex]: answer,
    }));
  };

  // Hitung jumlah soal yang telah dijawab
  const answeredCount = questions.filter((q, idx) => {
    const key = String(q.id || idx + 1);
    const ans = userAnswers[key];
    return ans && ans.trim().length > 0;
  }).length;

  const totalQuestions = questions.length;
  const unansweredCount = totalQuestions - answeredCount;

  // Handler pengumpulan jawaban ke backend
  const handleSubmitExam = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    setShowConfirmModal(false);

    try {
      // Jika tidak ada sessionId di database (misal sesi tamu/offline), lakukan fallback evaluasi lokal
      if (!sessionId) {
        let correct = 0;
        const localResults = questions.map((q, idx) => {
          const key = String(q.id || idx + 1);
          const userAns = userAnswers[key] || '';
          const isRight =
            q.type === 'multiple_choice' &&
            userAns.trim().toLowerCase() === q.correctAnswer?.trim().toLowerCase();
          if (isRight) correct++;
          return {
            questionId: q.id || idx + 1,
            type: q.type,
            question: q.question,
            isCorrect: q.type === 'multiple_choice' ? isRight : null,
            userAnswer: userAns,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
          };
        });

        const calculatedScore =
          totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

        setSubmissionResult({
          attemptId: 'local-attempt',
          sessionId: 'local-session',
          score: calculatedScore,
          totalQuestions,
          correctCount: correct,
          results: localResults,
          completedAt: new Date().toISOString(),
        });
        setIsExamInProgress(false);
        return;
      }

      // Normal path: Kirim ke API backend /api/attempts
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          answers: userAnswers,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const message =
          typeof data.error === 'object' && data.error !== null
            ? data.error.message
            : data.error;
        throw new Error(message || 'Gagal mengumpulkan dan menilai jawaban ujian.');
      }

      setSubmissionResult(data.data);
      // Ujian telah selesai, buka kembali penguncian mode di header
      setIsExamInProgress(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Predikat kelulusan berdasarkan nilai angka
  const getScoreVerdict = (score: number) => {
    if (score >= 85) {
      return {
        label: 'Sangat Memuaskan (Cum Laude)',
        badgeClass: 'bg-accent-highlight text-[#232A26] border-border-main',
        desc: 'Pemahaman Anda terhadap materi ini sangat kuat dan mendalam.',
      };
    }
    if (score >= 70) {
      return {
        label: 'Kompeten (Lulus)',
        badgeClass: 'bg-accent/20 text-primary border-accent',
        desc: 'Pemahaman materi sudah baik, tinjau pembahasan pada butir yang keliru.',
      };
    }
    return {
      label: 'Perlu Pendalaman Materi',
      badgeClass: 'bg-error-bg text-error border-error',
      desc: 'Pelajari kembali catatan materi perkuliahan untuk memperkuat konsep.',
    };
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ===================================================================== */}
      {/* KARTU RAPOR HASIL AKHIR (Hanya tampil setelah ujian berhasil dikumpulkan) */}
      {/* ===================================================================== */}
      {isSubmitted && submissionResult && (
        <section className="card-tactile p-6 sm:p-8 space-y-6 bg-surface border-2 border-border-main shadow-[6px_6px_0px_var(--shadow-color)] animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-border-main/15 pb-5">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-muted uppercase tracking-wider">
                <Award className="w-4 h-4 text-accent" />
                <span>Rapor Evaluasi Resmi</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-primary tracking-tight">
                {materialTitle || 'Dokumen Materi Pembelajaran'}
              </h2>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={onReset}
                className="btn-tactile-primary px-4 py-2.5 rounded-md text-xs font-bold gap-2 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Mulai Tes Baru</span>
              </button>
            </div>
          </div>

          {/* Baris Skor & Statistik Kunci */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Skor Nilai Utama */}
            <div className="md:col-span-5 border-2 border-border-main bg-surface-subtle p-5 rounded-lg flex flex-col items-center justify-center text-center space-y-2 shadow-[3px_3px_0px_var(--shadow-color)]">
              <span className="text-xs font-mono font-bold text-muted uppercase">
                Skor Akhir Ujian
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl sm:text-6xl font-black text-primary font-mono tracking-tight">
                  {submissionResult.score}
                </span>
                <span className="text-base font-bold text-muted font-mono">/ 100</span>
              </div>
              <div className="pt-1">
                <span
                  className={`text-xs font-bold px-3 py-1 rounded border shadow-[1.5px_1.5px_0px_var(--shadow-color)] ${
                    getScoreVerdict(submissionResult.score).badgeClass
                  }`}
                >
                  {getScoreVerdict(submissionResult.score).label}
                </span>
              </div>
              <p className="text-[11px] text-muted leading-relaxed pt-1">
                {getScoreVerdict(submissionResult.score).desc}
              </p>
            </div>

            {/* Kotak Rincian Statistik Butir Soal */}
            <div className="md:col-span-7 grid grid-cols-2 gap-3.5">
              <div className="border-2 border-border-main bg-surface p-4 rounded-lg flex flex-col justify-between shadow-[2px_2px_0px_var(--shadow-color)]">
                <div className="flex items-center justify-between text-muted">
                  <span className="text-xs font-bold">Jawaban Benar</span>
                  <CheckCircle2 className="w-4 h-4 text-accent-highlight" />
                </div>
                <div className="pt-3">
                  <span className="text-2xl font-black font-mono text-primary">
                    {submissionResult.correctCount}
                  </span>
                  <span className="text-xs text-muted font-medium ml-1">
                    dari {submissionResult.totalQuestions} butir
                  </span>
                </div>
              </div>

              <div className="border-2 border-border-main bg-surface p-4 rounded-lg flex flex-col justify-between shadow-[2px_2px_0px_var(--shadow-color)]">
                <div className="flex items-center justify-between text-muted">
                  <span className="text-xs font-bold">Jawaban Keliru</span>
                  <XCircle className="w-4 h-4 text-error" />
                </div>
                <div className="pt-3">
                  <span className="text-2xl font-black font-mono text-primary">
                    {submissionResult.totalQuestions - submissionResult.correctCount}
                  </span>
                  <span className="text-xs text-muted font-medium ml-1">butir</span>
                </div>
              </div>

              <div className="col-span-2 border-2 border-border-main bg-surface p-3.5 rounded-lg flex items-center justify-between shadow-[2px_2px_0px_var(--shadow-color)]">
                <span className="text-xs font-bold text-muted">Akurasi Penguasaan</span>
                <span className="text-base font-black font-mono text-primary">
                  {totalQuestions > 0
                    ? Math.round((submissionResult.correctCount / submissionResult.totalQuestions) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted pt-1 border-t border-border-main/20">
            <Sparkles className="w-4 h-4 text-accent shrink-0" />
            <span>
              Seluruh butir soal di bawah telah dilengkapi dengan penanda evaluasi serta kunci pembahasan materi secara lengkap.
            </span>
          </div>
        </section>
      )}

      {/* ===================================================================== */}
      {/* HEADER INFORMASI SESI AKTIF (Saat sedang mengerjakan) */}
      {/* ===================================================================== */}
      {!isSubmitted && (
        <div className="card-tactile p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted font-semibold tracking-wide">
                Lembar Pengerjaan Soal Mandiri
              </span>
              <span className="badge-tactile bg-surface-subtle text-primary border-border-main text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-[1.5px_1.5px_0px_var(--shadow-color)]">
                {selectedMode === 'practice'
                  ? 'Mode Latihan'
                  : selectedMode === 'daily_quiz'
                  ? 'Ujian Harian'
                  : 'Assesmen Resmi'}
              </span>
            </div>
            <h2 className="text-lg font-bold text-primary">
              {materialTitle || 'Dokumen Materi Pembelajaran'}
            </h2>
            <div className="text-xs text-muted flex items-center gap-2 pt-0.5">
              <Clock className="w-3.5 h-3.5 text-muted" />
              <span>
                {allowInstantReview
                  ? 'Kunci & pembahasan dapat dibuka kapan saja pada setiap butir.'
                  : 'Kunci jawaban terkunci hingga Anda mengumpulkan ujian.'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="btn-tactile-secondary px-4 py-2 rounded-md text-xs gap-2 shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Batal & Buat Baru</span>
          </button>
        </div>
      )}

      {/* Pesan Error Pengumpulan */}
      {submitError && (
        <div className="flex items-start gap-3 p-4 text-xs sm:text-sm text-primary bg-error-bg border-2 border-error rounded-lg shadow-[3px_3px_0px_var(--shadow-color)]">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-error" />
          <div className="space-y-1">
            <span className="font-bold block text-error">Gagal Mengumpulkan Ujian</span>
            <p className="leading-relaxed opacity-90">{submitError}</p>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* DAFTAR BUTIR SOAL */}
      {/* ===================================================================== */}
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const key = String(q.id || idx + 1);
          const answer = userAnswers[key] || '';
          const resultDetail = submissionResult?.results?.find(
            (r) => String(r.questionId) === key || r.question === q.question
          );

          return (
            <QuestionCard
              key={q.id || idx}
              question={q}
              index={idx}
              selectedAnswer={answer}
              onSelectAnswer={(selected) => handleAnswerSelect(key, selected)}
              isExamSubmitted={isSubmitted}
              allowInstantReview={allowInstantReview}
              resultDetail={resultDetail}
            />
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* BILAH AKSI BAWAH / STICKY ACTION BAR */}
      {/* ===================================================================== */}
      {!isSubmitted ? (
        <div className="sticky bottom-4 z-20">
          <div className="card-tactile p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface/95 backdrop-blur-md border-2 border-border-main shadow-[4px_4px_0px_var(--shadow-color)]">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="text-xs font-mono font-bold text-primary">
                Progres: {answeredCount} dari {totalQuestions} Soal Terjawab
              </div>
              <div className="text-[11px] text-muted">
                {unansweredCount > 0
                  ? `Tersisa ${unansweredCount} soal yang belum Anda isi.`
                  : 'Seluruh butir soal telah terisi lengkap. Siap dikumpulkan!'}
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  if (unansweredCount > 0) {
                    setShowConfirmModal(true);
                  } else {
                    handleSubmitExam();
                  }
                }}
                disabled={isSubmitting}
                className="w-full sm:w-auto btn-tactile-primary px-6 py-3 rounded-lg text-xs font-bold gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isSubmitting ? 'Mengumpulkan...' : 'Kumpulkan & Selesaikan Ujian'}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="pt-6 flex justify-center">
          <button
            type="button"
            onClick={onReset}
            className="btn-tactile-secondary px-6 py-3 rounded-md text-xs font-bold gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Selesai dan Buat Tes Baru</span>
          </button>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL KONFIRMASI KELENGKAPAN JAWABAN */}
      {/* ===================================================================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="card-tactile p-6 max-w-sm w-full space-y-4 bg-surface border-2 border-border-main shadow-[6px_6px_0px_var(--shadow-color)] animate-in zoom-in-95 duration-150">
            <div className="w-10 h-10 rounded-lg bg-surface-subtle border-2 border-border-main flex items-center justify-center shadow-[2px_2px_0px_var(--shadow-color)]">
              <HelpCircle className="w-5 h-5 text-accent" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-primary">
                Kumpulkan Ujian Sekarang?
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                Masih ada <strong className="text-error">{unansweredCount} butir soal</strong> yang belum Anda jawab. Soal yang tidak dijawab akan dihitung salah.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="btn-tactile-secondary px-4 py-2 rounded text-xs cursor-pointer"
              >
                Kembali Mengerjakan
              </button>
              <button
                type="button"
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="btn-tactile-primary px-4 py-2 rounded text-xs font-bold cursor-pointer"
              >
                Tetap Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
