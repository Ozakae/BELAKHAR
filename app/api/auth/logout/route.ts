import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { createErrorResponse } from '@/lib/errors';
import { ApiSuccessResponse } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient(req);
    await supabase.auth.signOut();

    const responsePayload: ApiSuccessResponse<{ message: string }> = {
      success: true,
      data: {
        message: 'Berhasil keluar dari sesi (logout).',
      },
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: unknown) {
    return createErrorResponse(err);
  }
}
