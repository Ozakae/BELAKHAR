'use client';

import React, { useState } from 'react';
import { Question, QuestionResultDetail } from '@/lib/types';
import { CheckCircle2, XCircle, ChevronDown, ChevronUp, HelpCircle, Lock } from 'lucide-react';

interface QuestionCardProps {
  question: Question;
  index: number;
  selectedAnswer?: string;
  onSelectAnswer?: (answer: string) => void;
  isExamSubmitted?: boolean;
  allowInstantReview?: boolean; // true pada Mode Latihan, false pada Ujian Harian & Assesmen
  resultDetail?: QuestionResultDetail;
}

export default function QuestionCard({
  question,
  index,
  selectedAnswer,
  onSelectAnswer,
  isExamSubmitted = false,
  allowInstantReview = true,
  resultDetail,
}: QuestionCardProps) {
  // State lokal fallback jika komponen digunakan tanpa controlled prop
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const currentAnswer = selectedAnswer !== undefined ? selectedAnswer : internalSelected;

  const handleSelect = (option: string) => {
    if (isExamSubmitted) return; // Kunci pilihan jika sudah dikumpulkan
    if (onSelectAnswer) {
      onSelectAnswer(option);
    } else {
      setInternalSelected(option);
    }
  };

  // Normalisasi perbandingan jawaban pilihan ganda
  const isSelected = (opt: string) => currentAnswer === opt;
  const isCorrectOption = (opt: string) => {
    if (!question.correctAnswer) return false;
    const cleanCorrect = question.correctAnswer.trim().toLowerCase();
    const cleanOpt = opt.trim().toLowerCase();
    const letterPrefix = cleanOpt.slice(0, 2); // misal "a."
    return cleanOpt === cleanCorrect || cleanCorrect.startsWith(letterPrefix);
  };

  // Penentuan apakah kunci & pembahasan boleh dilihat
  const canViewExplanation = isExamSubmitted || allowInstantReview;
  const isExplanationOpen = isExamSubmitted ? true : showExplanation;

  // Status hasil jika ujian sudah dikumpulkan
  const hasAnswered = !!currentAnswer && currentAnswer.trim().length > 0;
  const isUserCorrect = resultDetail?.isCorrect ?? (hasAnswered ? isCorrectOption(currentAnswer) : false);

  return (
    <article className="card-tactile p-5 space-y-4 transition-all">
      {/* Header Soal & Indikator Hasil */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="badge-tactile bg-surface-subtle text-primary border-border-main text-xs font-mono font-bold px-2.5 py-0.5 rounded shadow-[2px_2px_0px_var(--shadow-color)]">
            Soal {index + 1}
          </span>
          <span className="text-xs text-muted font-medium capitalize">
            {question.type === 'multiple_choice' ? 'Pilihan Ganda' : 'Esai'}
          </span>
        </div>

        {/* Status Benar/Salah setelah dikumpulkan */}
        {isExamSubmitted && question.type === 'multiple_choice' && (
          <div>
            {isUserCorrect ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono px-2.5 py-1 rounded bg-accent-highlight/20 text-primary border border-accent-highlight shadow-[1.5px_1.5px_0px_var(--shadow-color)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-highlight" />
                <span>BENAR (+{(100 / Math.max(1, 1)).toFixed(0) ? 'Skor' : ''})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold font-mono px-2.5 py-1 rounded bg-error-bg text-error border border-error shadow-[1.5px_1.5px_0px_var(--shadow-color)]">
                <XCircle className="w-3.5 h-3.5 text-error" />
                <span>SALAH</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Pertanyaan */}
      <h3 className="text-base font-bold text-primary leading-relaxed">
        {question.question}
      </h3>

      {/* Opsi Pilihan Ganda */}
      {question.type === 'multiple_choice' && question.options && (
        <div className="space-y-2.5 pt-1">
          {question.options.map((option, optIdx) => {
            const chosen = isSelected(option);
            const isRight = isCorrectOption(option);

            let optionStyle =
              'border-2 border-border-main bg-surface text-primary shadow-[3px_3px_0px_var(--shadow-color)] hover:shadow-[4px_4px_0px_var(--shadow-color)] hover:-translate-x-0.5 hover:-translate-y-0.5';

            if (isExamSubmitted) {
              // Mode Peninjauan Hasil Akhir
              if (isRight) {
                optionStyle =
                  'border-2 border-accent-highlight bg-accent-highlight/20 text-primary font-bold shadow-[2px_2px_0px_var(--shadow-color)] ring-1 ring-accent-highlight';
              } else if (chosen && !isRight) {
                optionStyle =
                  'border-2 border-error bg-error-bg text-error font-semibold shadow-[2px_2px_0px_var(--shadow-color)]';
              } else {
                optionStyle = 'border-2 border-border-main/30 bg-surface-subtle/40 text-muted shadow-none opacity-50';
              }
            } else if (canViewExplanation && showExplanation) {
              // Mode Latihan saat pembahasan dibuka manual
              if (isRight) {
                optionStyle =
                  'border-2 border-accent-highlight bg-accent-highlight/15 text-primary font-bold shadow-[2px_2px_0px_var(--shadow-color)]';
              } else if (chosen && !isRight) {
                optionStyle =
                  'border-2 border-error bg-error-bg text-error font-semibold shadow-[2px_2px_0px_var(--shadow-color)]';
              } else {
                optionStyle = 'border-2 border-border-main/30 bg-surface-subtle/50 text-muted shadow-none opacity-60';
              }
            } else if (chosen) {
              // Sedang dikerjakan & opsi terpilih
              optionStyle =
                'border-2 border-accent bg-accent/15 text-primary font-bold shadow-[0px_0px_0px_var(--accent-primary)] translate-x-0.5 translate-y-0.5 ring-2 ring-accent';
            }

            return (
              <button
                key={optIdx}
                type="button"
                disabled={isExamSubmitted}
                onClick={() => handleSelect(option)}
                className={`w-full rounded-lg p-3.5 text-left text-sm transition-all duration-120 flex items-start justify-between gap-3 ${
                  isExamSubmitted ? 'cursor-default' : 'cursor-pointer'
                } ${optionStyle}`}
              >
                <span className="font-medium">{option}</span>
                {isExamSubmitted && isRight && (
                  <CheckCircle2 className="w-4 h-4 text-accent-highlight shrink-0 mt-0.5" />
                )}
                {isExamSubmitted && chosen && !isRight && (
                  <XCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                )}
                {!isExamSubmitted && canViewExplanation && showExplanation && isRight && (
                  <CheckCircle2 className="w-4 h-4 text-accent-highlight shrink-0 mt-0.5" />
                )}
                {!isExamSubmitted && canViewExplanation && showExplanation && chosen && !isRight && (
                  <XCircle className="w-4 h-4 text-error shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Input Jawaban Esai Sederhana jika tipe soal adalah esai */}
      {question.type === 'essay' && (
        <div className="space-y-2 pt-1">
          <label className="text-xs font-bold text-muted block">
            Draf Jawaban Analisis Anda:
          </label>
          <textarea
            rows={3}
            disabled={isExamSubmitted}
            value={currentAnswer || ''}
            onChange={(e) => handleSelect(e.target.value)}
            placeholder={
              isExamSubmitted
                ? 'Tidak ada draf jawaban yang diisi.'
                : 'Ketikkan draf jawaban Anda di sini sebelum melihat kunci & pembahasan...'
            }
            className="w-full text-xs sm:text-sm p-3 rounded-lg border-2 border-border-main bg-surface text-primary shadow-[2px_2px_0px_var(--shadow-color)] focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-75"
          />
        </div>
      )}

      {/* Aksi & Pembahasan */}
      <div className="pt-2 border-t-2 border-border-main/15 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          {canViewExplanation ? (
            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-xs font-bold text-accent hover:underline flex items-center gap-1.5 py-1 px-2 rounded border border-transparent hover:border-border-main hover:bg-surface-subtle hover:shadow-[2px_2px_0px_var(--shadow-color)] transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>
                {isExplanationOpen
                  ? 'Sembunyikan Kunci & Pembahasan'
                  : 'Tampilkan Kunci & Pembahasan'}
              </span>
              {isExplanationOpen ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted font-medium py-1 px-2 bg-surface-subtle border border-border-main/40 rounded">
              <Lock className="w-3.5 h-3.5 text-muted shrink-0" />
              <span>Kunci & pembahasan terkunci hingga ujian dikumpulkan.</span>
            </div>
          )}

          {question.type === 'multiple_choice' && hasAnswered && !isExamSubmitted && (
            <span className="text-xs text-muted font-mono font-medium bg-surface-subtle px-2 py-0.5 border border-border-main/50 rounded">
              Jawaban terpilih
            </span>
          )}
        </div>

        {/* Kotak Kunci Jawaban & Pembahasan */}
        {isExplanationOpen && canViewExplanation && (
          <div className="border-2 border-border-main bg-surface-subtle p-4 rounded-md shadow-[3px_3px_0px_var(--shadow-color)] space-y-2 text-sm">
            <div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-accent-highlight text-[#232A26] rounded border border-border-main shadow-[1px_1px_0px_var(--border-color)] inline-block mb-1">
                Kunci Jawaban Resmi
              </span>
              <p className="font-bold text-primary">
                {question.correctAnswer}
              </p>
            </div>
            {question.explanation && (
              <div className="pt-1">
                <span className="text-xs font-bold text-muted block mb-0.5">
                  Pembahasan Berdasarkan Materi Pembelajaran:
                </span>
                <p className="text-primary leading-relaxed text-xs sm:text-sm">
                  {question.explanation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
