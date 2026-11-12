import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getTestSession } from '@/lib/sessions';
import { evaluateAndSaveAttempt } from '@/lib/attempts';
import { createErrorResponse, ApiError } from '@/lib/errors';
import { ApiSuccessResponse, SubmitAttemptResponseData } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    // 1. Proteksi Autentikasi Pengguna
    const { supabase } = await requireAuth(req);

    // 2. Parse Body Request
    let body: { sessionId?: string; answers?: Record<string, string> };
    try {
      body = await req.json();
    } catch {
      throw new ApiError('Body request harus berupa JSON yang valid.', 400, 'UNPARSEABLE_CONTENT');
    }

    const { sessionId, answers } = body;

    if (!sessionId || typeof sessionId !== 'string') {
      throw new ApiError('Parameter sessionId wajib diisi.', 400, 'SESSION_NOT_FOUND');
    }

    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      throw new ApiError(
        'Parameter answers wajib berupa object pasangan nomor soal dan pilihan jawaban (contoh: { "1": "A. Fotosintesis" }).',
        400,
        'UNPARSEABLE_CONTENT'
      );
    }

    // 3. Ambil data sesi dari database test_sessions (diproteksi RLS)
    const session = await getTestSession(supabase, sessionId);

    // 4. Hitung skor, periksa kebenaran jawaban per butir, dan simpan ke test_attempts
    const result: SubmitAttemptResponseData = await evaluateAndSaveAttempt({
      supabase,
      session,
      userAnswers: answers,
    });

    const responsePayload: ApiSuccessResponse<SubmitAttemptResponseData> = {
      success: true,
      data: result,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: unknown) {
    return createErrorResponse(err);
  }
}
