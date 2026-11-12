import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createServerClient, createBrowserClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { ApiError } from './errors';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function isValidHttpUrl(stringUrl: string): boolean {
  if (!stringUrl) return false;
  try {
    const url = new URL(stringUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Klien Supabase untuk browser (Client Components)
 */
export function getBrowserSupabaseClient(): SupabaseClient {
  if (!isValidHttpUrl(supabaseUrl) || !supabaseAnonKey) {
    throw new ApiError(
      'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) belum dikonfigurasi dengan URL HTTP/HTTPS yang valid.',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Klien Supabase server-side untuk Next.js Route Handlers dan Server Actions.
 * Mendukung autentikasi via Bearer token (Authorization header) maupun session cookies.
 */
export async function createServerSupabaseClient(req?: NextRequest): Promise<SupabaseClient> {
  if (!isValidHttpUrl(supabaseUrl) || !supabaseAnonKey) {
    throw new ApiError(
      'Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) belum dikonfigurasi dengan URL HTTP/HTTPS yang valid pada .env.local.',
      500,
      'INTERNAL_SERVER_ERROR'
    );
  }

  // 1. Cek Authorization Header (Bearer token)
  const authHeader = req?.headers.get('Authorization') || req?.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      return createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
  }

  // 2. Fallback ke Cookie Store
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Abaikan jika dipanggil dalam konteks di mana cookie tidak dapat dimutasi langsung
        }
      },
    },
  });
}

/**
 * Klien Supabase dengan Service Role Key (akses administratif / bypass RLS jika diperlukan)
 */
export function getServiceRoleClient(): SupabaseClient | null {
  if (!isValidHttpUrl(supabaseUrl) || !supabaseServiceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Backward compatibility export
export const supabase = (isValidHttpUrl(supabaseUrl) && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export function getSupabaseClient() {
  return supabase;
}
