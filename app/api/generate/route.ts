import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { validateGenerateRequest } from '@/lib/validation';
import { generateQuestionsFromDocument } from '@/lib/questions';
import { saveTestSession } from '@/lib/sessions';
import { createErrorResponse, ApiError } from '@/lib/errors';
import { ApiSuccessResponse, LLMGenerateResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    // 1. Proteksi Autentikasi: Wajib pengguna login
    const { user, supabase } = await requireAuth(req);

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      throw new ApiError(
        'Format request tidak valid. Harap gunakan multipart/form-data untuk mengirimkan berkas dan pengaturan.',
        400,
        'UNSUPPORTED_FILE_TYPE'
      );
    }

    // 2. Validasi input HTTP (file presence, size, format, parameter settings)
    const { file, settings } = validateGenerateRequest(formData);

    // 3. Eksekusi service logic bisnis pembuatan soal via Claude
    const result: LLMGenerateResult = await generateQuestionsFromDocument(file, settings);

    // 4. Simpan sesi latihan ke database Supabase (tabel test_sessions)
    const sessionRecord = await saveTestSession({
      supabase,
      userId: user.id,
      sourceFilename: file.name,
      settings,
      questions: result.questions,
    });

    result.sessionId = sessionRecord.id;

    // 5. Kembalikan standardized API response dengan dual-compatibility
    const responsePayload: ApiSuccessResponse<LLMGenerateResult> = {
      success: true,
      data: result,
      sessionId: sessionRecord.id,
      materialTitle: result.materialTitle,
      questions: result.questions,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: unknown) {
    return createErrorResponse(err);
  }
}
