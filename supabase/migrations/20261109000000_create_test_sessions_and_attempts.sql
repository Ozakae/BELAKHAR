-- ========================================================
-- BELAKHAR Database Migration
-- Tables: test_sessions, test_attempts
-- Row Level Security (RLS) Policies
-- ========================================================

-- Enable pgcrypto / uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================================
-- 1. TABEL: test_sessions
-- ========================================================
CREATE TABLE IF NOT EXISTS public.test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_filename TEXT NOT NULL,
  settings JSONB NOT NULL,
  questions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing untuk query cepat
CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id ON public.test_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_created_at ON public.test_sessions(created_at DESC);

-- Aktifkan Row Level Security
ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS test_sessions
CREATE POLICY "Users can select their own test sessions"
  ON public.test_sessions FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert their own test sessions"
  ON public.test_sessions FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own test sessions"
  ON public.test_sessions FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete their own test sessions"
  ON public.test_sessions FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);


-- ========================================================
-- 2. TABEL: test_attempts
-- ========================================================
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.test_sessions(id) ON DELETE CASCADE,
  user_answers JSONB NOT NULL,
  score NUMERIC(5, 2) NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexing untuk session_id dan waktu penyelesaian
CREATE INDEX IF NOT EXISTS idx_test_attempts_session_id ON public.test_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_completed_at ON public.test_attempts(completed_at DESC);

-- Aktifkan Row Level Security
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS test_attempts (Filter melalui JOIN ke test_sessions milik user)
CREATE POLICY "Users can select attempts of their own sessions"
  ON public.test_attempts FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.test_sessions
      WHERE public.test_sessions.id = test_attempts.session_id
        AND public.test_sessions.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert attempts for their own sessions"
  ON public.test_attempts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.test_sessions
      WHERE public.test_sessions.id = test_attempts.session_id
        AND public.test_sessions.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can update attempts for their own sessions"
  ON public.test_attempts FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.test_sessions
      WHERE public.test_sessions.id = test_attempts.session_id
        AND public.test_sessions.user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.test_sessions
      WHERE public.test_sessions.id = test_attempts.session_id
        AND public.test_sessions.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can delete attempts for their own sessions"
  ON public.test_attempts FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.test_sessions
      WHERE public.test_sessions.id = test_attempts.session_id
        AND public.test_sessions.user_id = (select auth.uid())
    )
  );
