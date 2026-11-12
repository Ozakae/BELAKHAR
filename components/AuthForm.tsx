'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Loader2, AlertCircle, CheckCircle2, Lock, Mail, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface AuthFormProps {
  initialMode?: 'login' | 'signup';
  redirectTo?: string;
  onSuccess?: () => void;
}

export default function AuthForm({
  initialMode = 'login',
  redirectTo = '/',
  onSuccess,
}: AuthFormProps) {
  const router = useRouter();
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper peralihan mode yang mereset visibilitas kata sandi secara atomik dalam 1 render cycle
  const switchMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validasi Sisi Klien
    if (!email || !email.includes('@')) {
      setErrorMessage('Harap masukkan alamat email yang valid.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Kata sandi harus terdiri dari minimal 6 karakter.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Gagal masuk. Periksa email dan sandi Anda.');
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage('Berhasil masuk! Mengalihkan...');
        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => {
            router.push(redirectTo);
          }, 600);
        }
      } else {
        const res = await signup(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Gagal mendaftarkan akun.');
          setIsSubmitting(false);
          return;
        }

        setSuccessMessage(res.message || 'Akun berhasil dibuat! Silakan masuk.');
        // Beralih ke tab login
        setTimeout(() => {
          switchMode('login');
          setConfirmPassword('');
          setIsSubmitting(false);
        }, 1200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card-tactile p-6 sm:p-8 space-y-6">
      {/* Segmented Tab Switcher */}
      <div className="grid grid-cols-2 p-1.5 bg-surface-subtle border-2 border-border-main rounded-lg shadow-[2px_2px_0px_var(--shadow-color)] gap-1.5">
        <button
          type="button"
          onClick={() => switchMode('login')}
          disabled={isSubmitting}
          className={`py-2 px-3 text-xs font-bold rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'login'
              ? 'border-2 border-border-main bg-accent text-accent-contrast shadow-[2px_2px_0px_var(--shadow-color)]'
              : 'border-2 border-transparent text-primary hover:border-border-main hover:bg-surface'
          }`}
        >
          <span>LOG IN</span>
        </button>

        <button
          type="button"
          onClick={() => switchMode('signup')}
          disabled={isSubmitting}
          className={`py-2 px-3 text-xs font-bold rounded transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mode === 'signup'
              ? 'border-2 border-border-main bg-accent text-accent-contrast shadow-[2px_2px_0px_var(--shadow-color)]'
              : 'border-2 border-transparent text-primary hover:border-border-main hover:bg-surface'
          }`}
        >
          <span>SIGN UP</span>
        </button>
      </div>

      {/* Header Info */}
      <div className="space-y-1 text-center border-b-2 border-border-main/15 pb-4">
        <h2 className="text-xl font-black text-primary">
          {mode === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Mahasiswa'}
        </h2>
        <p className="text-xs text-muted leading-relaxed">
          {mode === 'login'
            ? 'Masuk untuk menyimpan riwayat tes dan hasil evaluasi mandiri Anda.'
            : 'Daftarkan akun untuk menyimpan dan mengevaluasi seluruh sesi belajar Anda.'}
        </p>
      </div>

      {/* Kotak Error Alert */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3.5 text-xs text-primary bg-error-bg border-2 border-error rounded-lg shadow-[2px_2px_0px_var(--shadow-color)]">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-error" />
          <div className="space-y-0.5">
            <span className="font-bold block text-error">Terjadi Kesalahan:</span>
            <p className="leading-relaxed opacity-95">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Kotak Sukses Alert */}
      {successMessage && (
        <div className="flex items-start gap-2.5 p-3.5 text-xs text-primary bg-accent/15 border-2 border-accent rounded-lg shadow-[2px_2px_0px_var(--shadow-color)]">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-accent" />
          <p className="leading-relaxed font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Formulir */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="auth-email" className="text-xs font-bold text-primary flex justify-between">
            <span>Alamat Email</span>
            <span className="text-[11px] font-normal text-muted">Akun Kampus / Pribadi</span>
          </label>
          <div className="relative">
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@kampus.ac.id"
              required
              disabled={isSubmitting}
              className="w-full pl-9 pr-3.5 py-2.5 text-xs text-primary bg-surface-subtle border-2 border-border-main rounded-lg shadow-[2px_2px_0px_var(--shadow-color)] focus:border-accent focus:bg-surface focus:shadow-[3px_3px_0px_var(--accent-primary)] placeholder:text-muted/60 transition-all outline-none"
            />
            <Mail className="w-4 h-4 text-muted absolute left-3 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="auth-password" className="text-xs font-bold text-primary">
              Kata Sandi
            </label>
            {mode === 'login' && (
              <span className="text-[11px] text-muted">
                Min. 6 karakter
              </span>
            )}
          </div>
          <div className="relative">
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              minLength={6}
              disabled={isSubmitting}
              className="w-full pl-9 pr-10 py-2.5 text-xs text-primary bg-surface-subtle border-2 border-border-main rounded-lg shadow-[2px_2px_0px_var(--shadow-color)] focus:border-accent focus:bg-surface focus:shadow-[3px_3px_0px_var(--accent-primary)] placeholder:text-muted/60 transition-all outline-none"
            />
            <Lock className="w-4 h-4 text-muted absolute left-3 top-3 pointer-events-none" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
              className="absolute right-3 top-2.5 text-muted hover:text-primary transition-colors cursor-pointer p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-accent"
              title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Konfirmasi Password (Hanya saat Signup) */}
        {mode === 'signup' && (
          <div className="space-y-1.5">
            <label htmlFor="auth-confirm-password" className="text-xs font-bold text-primary">
              Konfirmasi Kata Sandi
            </label>
            <div className="relative">
              <input
                id="auth-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi Anda"
                required
                minLength={6}
                disabled={isSubmitting}
                className="w-full pl-9 pr-10 py-2.5 text-xs text-primary bg-surface-subtle border-2 border-border-main rounded-lg shadow-[2px_2px_0px_var(--shadow-color)] focus:border-accent focus:bg-surface focus:shadow-[3px_3px_0px_var(--accent-primary)] placeholder:text-muted/60 transition-all outline-none"
              />
              <Lock className="w-4 h-4 text-muted absolute left-3 top-3 pointer-events-none" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isSubmitting}
                className="absolute right-3 top-2.5 text-muted hover:text-primary transition-colors cursor-pointer p-0.5 rounded focus:outline-none focus:ring-1 focus:ring-accent"
                title={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tombol Aksi */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-tactile-primary py-3 px-4 rounded-lg text-xs font-bold tracking-wide shadow-[4px_4px_0px_var(--shadow-color)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses Data...</span>
              </>
            ) : (
              <>
                <span>{mode === 'login' ? 'Masuk ke Ruang Uji' : 'Daftarkan Akun Baru'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Switcher Bawah
      <div className="text-center pt-2 border-t-2 border-border-main/15">
        <p className="text-xs text-muted">
          {mode === 'login' ? 'Belum memiliki akun? ' : 'Sudah memiliki akun? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            disabled={isSubmitting}
            className="font-bold text-accent underline underline-offset-2 cursor-pointer"
          >
            {mode === 'login' ? 'Daftar sekarang' : 'Masuk di sini'}
          </button>
        </p>
      </div> */}
    </div>
  );
}
