-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TABLE: profiles
-- ============================================================
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email           TEXT NOT NULL UNIQUE,
  avatar_url      TEXT,
  job_role_target TEXT,
  consent_ai      BOOLEAN NOT NULL DEFAULT false,
  consent_storage BOOLEAN NOT NULL DEFAULT false,
  consent_at      TIMESTAMPTZ,
  login_count     INTEGER NOT NULL DEFAULT 0,
  mfa_prompted_at TIMESTAMPTZ,
  onboarded       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- TABLE: resumes
-- ============================================================
CREATE TABLE public.resumes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL DEFAULT 'Untitled Resume',
  template_id     TEXT NOT NULL DEFAULT 'classic',
  job_role        TEXT,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'complete', 'archived')),
  ats_score       SMALLINT CHECK (ats_score BETWEEN 0 AND 100),
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resumes_user_active ON public.resumes(user_id, created_at DESC)
  WHERE status != 'archived';

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
CREATE POLICY resumes_all_own ON public.resumes
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- TABLE: resume_sections
-- ============================================================
CREATE TABLE public.resume_sections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id   UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL CHECK (section_key IN (
    'personal_info', 'summary', 'experience',
    'education', 'skills', 'certifications',
    'projects', 'languages', 'custom'
  )),
  content     JSONB NOT NULL DEFAULT '{}',
  ai_enhanced BOOLEAN NOT NULL DEFAULT false,
  sort_order  SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_resume_section UNIQUE (resume_id, section_key)
);

CREATE INDEX idx_resume_sections_content_gin ON public.resume_sections
  USING gin(content jsonb_path_ops);

ALTER TABLE public.resume_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY resume_sections_own ON public.resume_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = resume_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.resumes r
      WHERE r.id = resume_id AND r.user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_resume_sections_updated_at
  BEFORE UPDATE ON public.resume_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- TABLE: resume_exports
-- ============================================================
CREATE TABLE public.resume_exports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id    UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id  TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_kb INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exports_user ON public.resume_exports(user_id, created_at DESC);

ALTER TABLE public.resume_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY exports_select_own ON public.resume_exports FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: ai_audit_log
-- ============================================================
CREATE TABLE public.ai_audit_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resume_id    UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,
  section      TEXT,
  model        TEXT NOT NULL DEFAULT 'gemini-1.5-pro',
  input_tokens INTEGER,
  output_tokens INTEGER,
  duration_ms  INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_audit_user ON public.ai_audit_log(user_id, created_at DESC);

ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_audit_select_own ON public.ai_audit_log FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- TABLE: rate_limits
-- ============================================================
CREATE TABLE public.rate_limits (
  user_id       UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  ai_calls_hour INTEGER NOT NULL DEFAULT 0,
  window_start  TIMESTAMPTZ NOT NULL DEFAULT date_trunc('hour', NOW()),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY rate_limits_no_access ON public.rate_limits FOR ALL USING (false) WITH CHECK (false);

CREATE TRIGGER trg_rate_limits_updated_at
  BEFORE UPDATE ON public.rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.consume_ai_rate_limit(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, window_start TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_window TIMESTAMPTZ := date_trunc('hour', NOW());
  current_count INTEGER;
BEGIN
  INSERT INTO public.rate_limits (user_id, ai_calls_hour, window_start)
  VALUES (p_user_id, 0, current_window)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT ai_calls_hour INTO current_count
  FROM public.rate_limits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF (SELECT rate_limits.window_start FROM public.rate_limits WHERE user_id = p_user_id) < current_window THEN
    UPDATE public.rate_limits
    SET ai_calls_hour = 1, window_start = current_window
    WHERE user_id = p_user_id;

    RETURN QUERY SELECT true, p_limit - 1, current_window;
    RETURN;
  END IF;

  IF current_count >= p_limit THEN
    RETURN QUERY SELECT false, 0, current_window;
    RETURN;
  END IF;

  UPDATE public.rate_limits
  SET ai_calls_hour = ai_calls_hour + 1
  WHERE user_id = p_user_id;

  RETURN QUERY SELECT true, p_limit - current_count - 1, current_window;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_rate_limit(UUID, INTEGER) FROM PUBLIC;

-- ============================================================
-- TABLE: deletion_audit
-- ============================================================
CREATE TABLE public.deletion_audit (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_email   TEXT NOT NULL,
  deleted_user UUID,
  deleted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requested_by TEXT NOT NULL DEFAULT 'user' CHECK (requested_by IN ('user', 'admin', 'scheduled'))
);

ALTER TABLE public.deletion_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY deletion_audit_no_user_access ON public.deletion_audit FOR ALL USING (false) WITH CHECK (false);

-- ============================================================
-- AUTH SIGNUP PROFILE
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ai_consent BOOLEAN;
  storage_consent BOOLEAN;
BEGIN
  ai_consent := COALESCE((NEW.raw_user_meta_data->>'consent_ai')::BOOLEAN, false);
  storage_consent := COALESCE((NEW.raw_user_meta_data->>'consent_storage')::BOOLEAN, false);

  INSERT INTO public.profiles (
    id,
    full_name,
    email,
    consent_ai,
    consent_storage,
    consent_at
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'full_name', ''), 'New User'),
    NEW.email,
    ai_consent,
    storage_consent,
    CASE WHEN ai_consent OR storage_consent THEN NOW() ELSE NULL END
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- STORAGE BUCKETS AND POLICIES
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('resumes', 'resumes', false, 10485760, ARRAY['application/pdf']),
  ('avatars', 'avatars', false, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY resumes_storage_select_own ON storage.objects
  FOR SELECT USING (
    bucket_id = 'resumes'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY resumes_storage_insert_own ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'resumes'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY avatars_storage_select_own ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );

CREATE POLICY avatars_storage_insert_own ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::TEXT = (storage.foldername(name))[1]
  );
