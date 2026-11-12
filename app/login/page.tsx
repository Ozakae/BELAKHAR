'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/context/AuthContext';

function LoginContent() {
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const redirectTo = searchParams.get('redirect') || '/';

  // Jika sudah terautentikasi, langsung arahkan ke beranda
  useEffect(() => {
    if (user) {
      router.replace(redirectTo);
    }
  }, [user, redirectTo, router]);

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-primary transition-colors cursor-pointer"
        >
          <span>Kembali ke Beranda</span>
        </Link>
      </div>

      <AuthForm initialMode={initialMode} redirectTo={redirectTo} />
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="py-6 sm:py-12">
      <Suspense
        fallback={
          <div className="text-center py-16 text-xs text-muted font-mono">
            Memuat formulir autentikasi...
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}
