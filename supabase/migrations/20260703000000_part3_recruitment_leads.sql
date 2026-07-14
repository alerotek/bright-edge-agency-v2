-- ============================================================
-- BRIGHT EDGE AGENCY — Part 3: Recruitment & Lead Management
-- ============================================================

-- ============================================================
-- ENUMS: Extend existing and add new
-- ============================================================
DO $$
BEGIN
  -- Extend lead_status
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'viewing_completed';
    ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'negotiation';
    ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'offer_received';
    ALTER TYPE public.lead_status ADD VALUE IF NOT EXISTS 'archived';
  END IF;

  -- Extend lead_source
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source') THEN
    ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'website';
    ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'property_page';
    ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'qr_code';
    ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'facebook';
    ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'instagram';
    ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'tiktok';
    ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'youtube';
    ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'google_search';
    ALTER TYPE public.lead_source ADD VALUE IF NOT EXISTS 'direct_traffic';
  END IF;

  -- application_status
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'application_status') THEN
    CREATE TYPE public.application_status AS ENUM (
      'pending',
      'under_review',
      'approved',
      'rejected',
      'withdrawn'
    );
  END IF;

  -- inquiry_type
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'inquiry_type') THEN
    CREATE TYPE public.inquiry_type AS ENUM (
      'general',
      'viewing_request',
      'whatsapp_direct',
      'offer',
      'valuation'
    );
  END IF;
END
$$;

-- ============================================================
-- AGENTS: Verification & National ID
-- ============================================================
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS national_id_number text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_date timestamptz,
  ADD COLUMN IF NOT EXISTS verification_badge_id text;

-- Unique index to prevent duplicate ID registrations among verified agents
CREATE UNIQUE INDEX IF NOT EXISTS uq_agents_national_id
  ON public.agents(national_id_number)
  WHERE national_id_number IS NOT NULL;

-- ============================================================
-- AGENT_APPLICATIONS: Comprehensive Onboarding Data
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Step 1: Personal Information
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  national_id_number text NOT NULL,
  
  -- Step 2: Verification Uploads (URLs)
  national_id_front_url text,
  national_id_back_url text,
  selfie_url text,
  profile_photo_url text,
  
  -- Step 3: Professional Information
  years_experience int DEFAULT 0,
  areas_of_operation text[], -- Array of areas
  property_specializations text[], -- Array of specs
  languages_spoken text[],
  whatsapp_number text,
  social_accounts jsonb DEFAULT '{}'::jsonb, -- FB, IG, TikTok, LinkedIn, YT
  
  -- Review & Status
  status application_status NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'website',
  review_notes text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  
  -- Link to agent row once approved
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_applications_status ON public.agent_applications(status);
CREATE INDEX IF NOT EXISTS idx_agent_applications_email ON public.agent_applications(email);
CREATE INDEX IF NOT EXISTS idx_agent_applications_created ON public.agent_applications(created_at DESC);

ALTER TABLE public.agent_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AA anyone submit" ON public.agent_applications;
CREATE POLICY "AA anyone submit" ON public.agent_applications
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "AA owner read" ON public.agent_applications;
CREATE POLICY "AA owner read" ON public.agent_applications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

DROP POLICY IF EXISTS "AA staff manage" ON public.agent_applications;
CREATE POLICY "AA staff manage" ON public.agent_applications
  FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- INQUIRIES: Advanced Lead Management
-- ============================================================
ALTER TABLE public.inquiries
  ADD COLUMN IF NOT EXISTS inquiry_type inquiry_type NOT NULL DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS preferred_viewing_date date,
  ADD COLUMN IF NOT EXISTS preferred_viewing_time text,
  ADD COLUMN IF NOT EXISTS budget_kes numeric(14,2),
  ADD COLUMN IF NOT EXISTS whatsapp_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS lead_id text GENERATED ALWAYS AS ('BE-' || upper(substring(id::text, 1, 8))) STORED,
  ADD COLUMN IF NOT EXISTS lead_metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS activity_timeline jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_inquiries_lead_id ON public.inquiries(lead_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_inquiry_type ON public.inquiries(inquiry_type);

-- ============================================================
-- UTILITIES & TRIGGERS
-- ============================================================

-- Duplicate check RPC
CREATE OR REPLACE FUNCTION public.check_application_duplicates(
  _email text,
  _phone text,
  _national_id text
)
RETURNS TABLE (email_exists boolean, phone_exists boolean, id_exists boolean) 
LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.agent_applications WHERE email = _email AND status NOT IN ('rejected', 'withdrawn')),
    EXISTS(SELECT 1 FROM public.agent_applications WHERE phone = _phone AND status NOT IN ('rejected', 'withdrawn')),
    EXISTS(SELECT 1 FROM public.agent_applications WHERE national_id_number = _national_id AND status NOT IN ('rejected', 'withdrawn'));
END;
$$;

DROP TRIGGER IF EXISTS trg_agent_applications_updated ON public.agent_applications;
CREATE TRIGGER trg_agent_applications_updated BEFORE UPDATE ON public.agent_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Grants
GRANT ALL ON public.agent_applications TO service_role;
GRANT ALL ON public.inquiries TO service_role;
GRANT SELECT ON public.agent_applications TO authenticated;
GRANT INSERT ON public.agent_applications TO anon, authenticated;
