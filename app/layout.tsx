import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle';
import HeaderAuthStatus from '@/components/HeaderAuthStatus';
import HeaderModeSelector from '@/components/HeaderModeSelector';
import { AuthProvider } from '@/context/AuthContext';
import { TestSessionProvider } from '@/context/TestSessionContext';

export const metadata: Metadata = {
  title: 'BELAKHAR Evaluasi Materi Mandiri',
  description: 'Aplikasi latihan dan uji pemahaman mandiri berbasis materi dokumen pribadi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var stored = localStorage.getItem('belakhar_theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (stored === 'dark' || (!stored && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-primary antialiased selection:bg-accent/20 selection:text-primary">
        <AuthProvider>
          <TestSessionProvider>
            <header className="border-b-2 border-border-main bg-surface transition-colors duration-150">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-2.5 hover:opacity-85 transition-opacity group cursor-pointer"
                  title="Kembali ke Beranda BELAKHAR"
                >
                  <span className="font-bold tracking-tight text-primary text-lg">
                    BELAKHAR
                  </span>
                  <span className="text-muted/40 font-bold">/</span>
                  <span className="text-xs text-primary font-bold hidden sm:inline tracking-wider">
                    SYNAU
                  </span>
                </Link>
                <div className="flex items-center gap-2.5">
                  <HeaderModeSelector />
                  <HeaderAuthStatus />
                  <ThemeToggle />
                </div>
              </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
              {children}
            </main>

            <footer className="border-t-2 border-border-main bg-surface py-4 mt-auto transition-colors duration-150">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 text-xs text-primary font-medium flex flex-col sm:flex-row items-center justify-between gap-2">
                <span>© 2026 BELAKHAR. Seluruh hak cipta dilindungi.</span>
                <span className="font-mono text-primary font-bold">Dikembangkan oleh Ozakae Corael</span>
              </div>
            </footer>
          </TestSessionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
