import { NextRequest } from 'next/server';
import { User, SupabaseClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from './supabase';
import { ApiError } from './errors';

export interface AuthContext {
  user: User;
  supabase: SupabaseClient;
}

/**
 * Memeriksa apakah pengguna saat ini terautentikasi (via Bearer token atau Cookie).
 * Mengembalikan user jika ada, atau null jika belum login.
 */
export async function getAuthenticatedUser(
  req?: NextRequest
): Promise<{ user: User | null; supabase: SupabaseClient }> {
  const supabase = await createServerSupabaseClient(req);

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return { user: null, supabase };
    }

    return { user, supabase };
  } catch (err: unknown) {
    console.error('Error saat memeriksa session pengguna:', err);
    return { user: null, supabase };
  }
}

/**
 * Memastikan pengguna telah terautentikasi.
 * Jika belum login, melempar ApiError 401 UNAUTHORIZED.
 */
export async function requireAuth(req?: NextRequest): Promise<AuthContext> {
  const { user, supabase } = await getAuthenticatedUser(req);

  if (!user) {
    throw new ApiError(
      'Autentikasi diperlukan. Silakan login terlebih dahulu untuk mengakses layanan ini.',
      401,
      'UNAUTHORIZED'
    );
  }

  return { user, supabase };
}
