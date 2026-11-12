'use client';

import React, { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import TestSettingsForm from '@/components/TestSettingsForm';
import LoadingState from '@/components/LoadingState';
import QuestionList from '@/components/QuestionList';
import AuthForm from '@/components/AuthForm';
import { TestSettings, Question, GenerateTestResponse } from '@/lib/types';
import { AlertCircle, FileText, CheckSquare, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTestSession } from '@/context/TestSessionContext';

export default function HomePage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { setIsExamInProgress } = useTestSession();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<TestSettings>({
    questionCount: 5,
    questionType: 'multiple_choice',
    difficulty: 'medium',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedQuestions, setGeneratedQuestions] = useState<Question[] | null>(null);
  const [materialTitle, setMaterialTitle] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Silakan pilih berkas PDF atau teks terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('questionCount', String(settings.questionCount));
      formData.append('questionType', settings.questionType);
      formData.append('difficulty', settings.difficulty);

      const res = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data: GenerateTestResponse = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 401) {
          throw new Error('Silakan masuk ke akun Anda terlebih dahulu untuk menyusun soal evaluasi.');
        }
        const errDetail =
          typeof data.error === 'object' && data.error !== null
            ? data.error.message
            : data.error;
        throw new Error(errDetail || 'Terjadi kesalahan saat memproses materi.');
      }

      const activeSessionId = data.sessionId || data.data?.sessionId;
      setSessionId(activeSessionId);
      setGeneratedQuestions(data.questions || []);
      setMaterialTitle(data.materialTitle || selectedFile.name);
      setIsExamInProgress(true);

      // Simpan di sessionStorage agar rute /results juga dapat diakses
      try {
        sessionStorage.setItem(
          'belakhar_latest_test',
          JSON.stringify({
            sessionId: activeSessionId,
            questions: data.questions || [],
            materialTitle: data.materialTitle || selectedFile.name,
          })
        );
      } catch (storageErr) {
        console.warn('Gagal menyimpan sesi di sessionStorage:', storageErr);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setGeneratedQuestions(null);
    setMaterialTitle('');
    setSessionId(undefined);
    setErrorMessage(null);
    setIsExamInProgress(false);
  };

  // State loading autentikasi awal
  if (isAuthLoading) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-3">
        <div className="w-10 h-10 mx-auto rounded-lg bg-surface-subtle border-2 border-border-main flex items-center justify-center shadow-[2px_2px_0px_var(--shadow-color)] animate-pulse">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <p className="text-xs text-muted font-mono">Memuat sesi belajar...</p>
      </div>
    );
  }

  // =========================================================================
  // KONDISI 1: Pengguna BELUM LOGIN -> Landing Page Hybrid Minimalis Tactile 3D
  // =========================================================================
  if (!user) {
    return (
      <div className="max-w-6xl mx-auto py-4 sm:py-8 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Kolom Kiri: Hero & Nilai Guna Aplikasi */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2">
                <span className="badge-tactile bg-surface-subtle text-primary border-border-main text-xs font-mono font-bold px-3 py-1 rounded shadow-[2px_2px_0px_var(--shadow-color)]">
                  SYNAU
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-primary tracking-tight leading-[1.15]">
                Uji Pemahaman Materi Kuliah dari Dokumen Anda Sendiri.
              </h1>

              <p className="text-sm sm:text-base text-muted leading-relaxed max-w-xl">
                Unggah diktat ajar, salindia kuliah (slide), atau catatan pribadi Anda.
                BELAKHAR merumuskan butir evaluasi terarah lengkap dengan kunci dan pembahasan mendalam berbasis isi dokumen.
              </p>
            </div>

            {/* 3 Bento Tiles Minimalis Tactile */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="card-tactile p-4 space-y-2">
                <div className="w-8 h-8 rounded border-2 border-border-main bg-surface-subtle flex items-center justify-center shadow-[1.5px_1.5px_0px_var(--shadow-color)]">
                  <FileText className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-xs font-bold text-primary">Bahan Ajar Asli</h3>
                <p className="text-[11px] text-muted leading-relaxed">
                  Mendukung PDF kuliah, Word (.docx), dan catatan teks (.txt, .md).
                </p>
              </div>

              <div className="card-tactile p-4 space-y-2">
                <div className="w-8 h-8 rounded border-2 border-border-main bg-surface-subtle flex items-center justify-center shadow-[1.5px_1.5px_0px_var(--shadow-color)]">
                  <CheckSquare className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-xs font-bold text-primary">Format Terukur</h3>
                <p className="text-[11px] text-muted leading-relaxed">
                  Pilihan ganda dan esai analitis dengan 3 tingkatan kesulitan.
                </p>
              </div>

              <div className="card-tactile p-4 space-y-2">
                <div className="w-8 h-8 rounded border-2 border-border-main bg-surface-subtle flex items-center justify-center shadow-[1.5px_1.5px_0px_var(--shadow-color)]">
                  <ShieldCheck className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-xs font-bold text-primary">Riwayat Akun</h3>
                <p className="text-[11px] text-muted leading-relaxed">
                  Sesi dan hasil latihan tersimpan rapi dan aman di akun pribadi Anda.
                </p>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Formulir Masuk & Daftar Akun Langsung */}
          <div className="lg:col-span-5 w-full">
            <AuthForm initialMode="login" redirectTo="/" />
          </div>

        </div>
      </div>
    );
  }

  // =========================================================================
  // KONDISI 2: Pengguna SUDAH LOGIN -> Ruang Uji Pemahaman Soal (Workspace)
  // =========================================================================

  // Jika hasil soal sudah selesai digenerate
  if (generatedQuestions && generatedQuestions.length > 0) {
    return (
      <QuestionList
        questions={generatedQuestions}
        materialTitle={materialTitle}
        sessionId={sessionId}
        onReset={handleReset}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header Halaman Utama */}
      <div className="space-y-2 border-b-2 border-border-main/15 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-primary">
          Susun Tes Mandiri dari Materi Anda
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          Unggah dokumen bahan ajar (PDF atau teks), tentukan format evaluasi yang
          Anda perlukan, dan uji pemahaman materi secara mandiri.
        </p>
      </div>

      {isLoading ? (
        <LoadingState
          fileName={selectedFile?.name}
          questionCount={settings.questionCount}
        />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Bagian 1: Berkas */}
          <section className="card-tactile p-5 sm:p-6">
            <FileUpload
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
              disabled={isLoading}
            />
          </section>

          {/* Bagian 2: Pengaturan Tes */}
          <section className="card-tactile p-5 sm:p-6">
            <TestSettingsForm
              settings={settings}
              onChange={setSettings}
              disabled={isLoading}
            />
          </section>

          {/* Pesan Error */}
          {errorMessage && (
            <div className="flex items-start gap-3 p-4 text-xs sm:text-sm text-primary bg-error-bg border-2 border-error rounded-lg shadow-[3px_3px_0px_var(--shadow-color)]">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-error" />
              <div className="space-y-1">
                <span className="font-bold block text-error">Gagal Membuat Soal</span>
                <p className="leading-relaxed opacity-90">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Tombol Aksi */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!selectedFile || isLoading}
              className="w-full btn-tactile-primary py-3.5 px-4 rounded-lg text-sm font-bold tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Susun Soal Evaluasi
            </button>
            <p className="text-xs text-center text-muted mt-3 font-mono">
              Terautentikasi sebagai <strong className="text-primary">{user.email}</strong> (sesi tersimpan otomatis ke akun Anda).
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
