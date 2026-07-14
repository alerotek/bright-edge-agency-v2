-- ============================================================
-- V2 Missing Tables
-- Tables referenced in seed.sql that were never created in migrations.
-- Run after 20260701000000_combined_v2_schema.sql and 20260700000001_otp_codes.sql
-- ============================================================

-- ============================================================
-- 1. Agent applications (for onboarding flow)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  national_id_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  admin_notes TEXT,
  years_experience INTEGER,
  specializations TEXT[],
  languages TEXT[],
  areas_of_operation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. Agent documents
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('national_id_front', 'national_id_back', 'selfie', 'profile_photo', 'professional_certificate', 'other')),
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/jpeg',
  byte_size INTEGER DEFAULT 0,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. Agent social accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_social_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'whatsapp')),
  handle TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, platform)
);

-- ============================================================
-- 4. Agent areas of operation
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  country TEXT NOT NULL DEFAULT 'Kenya',
  county TEXT,
  town TEXT,
  neighbourhood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. Marketing assets
-- ============================================================
CREATE TABLE IF NOT EXISTS public.marketing_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('image', 'video', 'document', 'social_post', 'brochure', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  provider TEXT,
  provider_id TEXT,
  views_count INTEGER NOT NULL DEFAULT 0,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. Social videos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.social_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  provider TEXT,
  provider_video_id TEXT,
  thumbnail_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. Short links
-- ============================================================
CREATE TABLE IF NOT EXISTS public.short_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  target_type TEXT NOT NULL CHECK (target_type IN ('property', 'agent', 'review', 'blog', 'custom')),
  target_id UUID,
  target_path TEXT,
  long_url TEXT NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. Property QR codes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  short_link_id UUID REFERENCES public.short_links(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'png',
  byte_size INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. Lead sources (attribution tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('website', 'short_link', 'qr_code', 'social', 'email', 'referral', 'whatsapp', 'other')),
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. Projects (development projects)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  developer TEXT,
  country TEXT NOT NULL DEFAULT 'Kenya',
  county TEXT,
  town TEXT,
  neighbourhood TEXT,
  description TEXT,
  hero_image TEXT,
  launch_date DATE,
  completion_date DATE,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'under_construction', 'completed', 'launched')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add project_id to properties if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- RLS: Enable row-level security on all new tables
-- ============================================================
ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS: Agent document policies
CREATE POLICY "Users can insert their own documents"
  ON public.agent_documents FOR INSERT
  WITH CHECK (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view their own documents"
  ON public.agent_documents FOR SELECT
  USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- RLS: Agent social accounts policies
CREATE POLICY "Users can manage their own social accounts"
  ON public.agent_social_accounts FOR ALL
  USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

-- RLS: Agent areas policies
CREATE POLICY "Users can manage their own areas"
  ON public.agent_areas FOR ALL
  USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

-- RLS: Admin access to all tables
CREATE POLICY "Admin has full access to agent_applications"
  ON public.agent_applications FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')));

CREATE POLICY "Admin has full access to marketing_assets"
  ON public.marketing_assets FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')));

CREATE POLICY "Admin has full access to social_videos"
  ON public.social_videos FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')));

CREATE POLICY "Admin has full access to short_links"
  ON public.short_links FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')));

CREATE POLICY "Admin has full access to property_qr_codes"
  ON public.property_qr_codes FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')));

CREATE POLICY "Admin has full access to lead_sources"
  ON public.lead_sources FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')));

CREATE POLICY "Admin has full access to projects"
  ON public.projects FOR ALL
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin', 'admin', 'editor')));