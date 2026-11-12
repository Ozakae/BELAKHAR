import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createErrorResponse, ApiError } from '@/lib/errors';
import { ApiSuccessResponse } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    let body: { email?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      throw new ApiError('Body request harus berupa JSON yang valid.', 400, 'UNPARSEABLE_CONTENT');
    }

    const { email, password } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new ApiError('Alamat email tidak valid.', 400, 'UNAUTHORIZED');
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      throw new ApiError('Password minimal harus terdiri dari 6 karakter.', 400, 'UNAUTHORIZED');
    }

    const supabase = await createServerSupabaseClient(req);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw new ApiError(`Registrasi gagal: ${error.message}`, 400, 'UNAUTHORIZED');
    }

    const responsePayload: ApiSuccessResponse<{ user: unknown; session: unknown }> = {
      success: true,
      data: {
        user: data.user,
        session: data.session,
      },
    };

    return NextResponse.json(responsePayload, { status: 201 });
  } catch (err: unknown) {
    return createErrorResponse(err);
  }
}
