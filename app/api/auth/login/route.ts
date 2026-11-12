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

    if (!email || !password) {
      throw new ApiError('Email dan password wajib diisi.', 400, 'UNAUTHORIZED');
    }

    const supabase = await createServerSupabaseClient(req);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new ApiError(`Login gagal: ${error.message}`, 401, 'UNAUTHORIZED');
    }

    const responsePayload: ApiSuccessResponse<{
      user: unknown;
      session: unknown;
      accessToken?: string;
    }> = {
      success: true,
      data: {
        user: data.user,
        session: data.session,
        accessToken: data.session?.access_token,
      },
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: unknown) {
    return createErrorResponse(err);
  }
}
