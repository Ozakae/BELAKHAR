import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createErrorResponse } from '@/lib/errors';
import { ApiSuccessResponse } from '@/lib/types';
import { User } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth(req);

    const responsePayload: ApiSuccessResponse<{ user: User }> = {
      success: true,
      data: {
        user,
      },
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (err: unknown) {
    return createErrorResponse(err);
  }
}
