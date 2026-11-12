import { SupabaseClient } from '@supabase/supabase-js';
import {
  TestSessionRecord,
  TestAttemptRecord,
  QuestionResultDetail,
  SubmitAttemptResponseData,
} from './types';
import { ApiError } from './errors';

export interface EvaluateAttemptParams {
  supabase: SupabaseClient;
  session: TestSessionRecord;
  userAnswers: Record<string, string>;
}

/**
 * Mengevaluasi kecocokan jawaban pengguna dengan kunci jawaban soal pilihan ganda
 */
export function checkAnswerCorrectness(
  userAnswerRaw: string | undefined,
  correctAnswerRaw: string
): boolean {
  if (!userAnswerRaw || !correctAnswerRaw) return false;

  const user = userAnswerRaw.trim().toLowerCase();
  const correct = correctAnswerRaw.trim().toLowerCase();

  // 1. Kesamaan langsung
  if (user === correct) return true;

  // 2. Kesamaan prefix huruf opsi (misal: "A." atau "A")
  const userPrefix = user.slice(0, 2).replace(/[^a-d]/g, '');
  const correctPrefix = correct.slice(0, 2).replace(/[^a-d]/g, '');

  if (userPrefix && correctPrefix && userPrefix === correctPrefix) {
    return true;
  }

  // 3. Opsi lengkap mengandung jawaban pengguna jika pengguna hanya memilih label huruf
  if (user.length === 1 && correct.startsWith(`${user}.`)) {
    return true;
  }

  return false;
}

/**
 * Mengevaluasi seluruh butir jawaban, menghitung skor, dan menyimpan hasil ke test_attempts
 */
export async function evaluateAndSaveAttempt({
  supabase,
  session,
  userAnswers,
}: EvaluateAttemptParams): Promise<SubmitAttemptResponseData> {
  const questions = session.questions || [];
  if (questions.length === 0) {
    throw new ApiError('Sesi ujian ini tidak memiliki butir soal yang valid.', 400, 'UNPARSEABLE_CONTENT');
  }

  let correctCount = 0;
  let mcCount = 0;

  const results: QuestionResultDetail[] = questions.map((q, idx) => {
    // Cari jawaban user berdasarkan ID atau index numerik
    const userAnswer =
      userAnswers[String(q.id)] ||
      userAnswers[String(idx + 1)] ||
      userAnswers[String(idx)] ||
      '';

    let isCorrect: boolean | null = null;

    if (q.type === 'multiple_choice') {
      mcCount++;
      const isRight = checkAnswerCorrectness(userAnswer, q.correctAnswer);
      if (isRight) {
        correctCount++;
        isCorrect = true;
      } else {
        isCorrect = false;
      }
    } else {
      // Untuk esai, serahkan kepada evaluasi mandiri berdasarkan kunci pembahasan
      isCorrect = null;
    }

    return {
      questionId: q.id || idx + 1,
      type: q.type,
      question: q.question,
      isCorrect,
      userAnswer: userAnswer.trim(),
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    };
  });

  // Hitung skor akhir (persentase berbasis soal pilihan ganda, atau default 100 untuk esai selesai dikerjakan)
  const score = mcCount > 0 ? Number(((correctCount / mcCount) * 100).toFixed(2)) : 100.0;

  // Simpan riwayat attempt ke database Supabase
  const { data: attemptData, error: insertError } = await supabase
    .from('test_attempts')
    .insert({
      session_id: session.id,
      user_answers: userAnswers,
      score,
    })
    .select('*')
    .single();

  if (insertError || !attemptData) {
    console.error('Gagal menyimpan test_attempt:', insertError);
    throw new ApiError(
      `Gagal menyimpan hasil uji ke database: ${insertError?.message || 'Database error'}`,
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }

  const record = attemptData as TestAttemptRecord;

  return {
    attemptId: record.id,
    sessionId: session.id,
    score,
    totalQuestions: questions.length,
    correctCount,
    results,
    completedAt: record.completed_at,
  };
}
