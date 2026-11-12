import { SupabaseClient } from '@supabase/supabase-js';
import { TestSettings, Question, TestSessionRecord } from './types';
import { ApiError } from './errors';

export interface SaveTestSessionParams {
  supabase: SupabaseClient;
  userId: string;
  sourceFilename: string;
  settings: TestSettings;
  questions: Question[];
}

/**
 * Menyimpan sesi latihan soal yang baru digenerate ke tabel test_sessions
 */
export async function saveTestSession({
  supabase,
  userId,
  sourceFilename,
  settings,
  questions,
}: SaveTestSessionParams): Promise<TestSessionRecord> {
  const { data, error } = await supabase
    .from('test_sessions')
    .insert({
      user_id: userId,
      source_filename: sourceFilename,
      settings,
      questions,
    })
    .select('*')
    .single();

  if (error || !data) {
    console.error('Gagal menyimpan test_session ke Supabase:', error);
    throw new ApiError(
      `Gagal menyimpan sesi soal ke database: ${error?.message || 'Database error'}`,
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }

  return data as TestSessionRecord;
}

/**
 * Mengambil data sesi ujian berdasarkan ID dengan proteksi RLS
 */
export async function getTestSession(
  supabase: SupabaseClient,
  sessionId: string
): Promise<TestSessionRecord> {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new ApiError('Parameter sessionId tidak valid.', 400, 'SESSION_NOT_FOUND');
  }

  const { data, error } = await supabase
    .from('test_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !data) {
    throw new ApiError(
      'Sesi ujian tidak ditemukan atau Anda tidak memiliki akses ke sesi ini.',
      404,
      'SESSION_NOT_FOUND'
    );
  }

  return data as TestSessionRecord;
}
