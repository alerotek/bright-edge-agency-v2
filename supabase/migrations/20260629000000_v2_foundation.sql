-- ============================================================
-- BRIGHT EDGE AGENCY — V2 Foundation
-- Agent onboarding, listing automation, marketing hub, SaaS
-- ============================================================

-- ============================================================
-- NEW ENUMS (idempotent via DO block)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_verification_status') THEN
    CREATE TYPE public.agent_verification_status AS ENUM ('pending','under_review','verified','rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_provider') THEN
    CREATE TYPE public.video_provider AS ENUM ('youtube','tiktok','vimeo','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_validation_status') THEN
    CREATE TYPE public.listing_validation_status AS ENUM ('draft','pending_verification','active','needs_review','archived');
  END IF;
END
$$;

-- ============================================================
-- ALTER EXISTING TABLES
-- ============================================================

-- Agents: V2 onboarding & verification fields
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS verification_status agent_verification_status NOT NULL DEFAULT 'pending';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS license_number text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS license_expiry date;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS kyc_document_url text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS background_check_status text NOT NULL DEFAULT 'not_started';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS team_name text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS specializations text[];

CREATE INDEX IF NOT EXISTS idx_agents_verification_status ON public.agents(verification_status);
CREATE INDEX IF NOT EXISTS idx_agents_onboarding_completed ON public.agents(onboarding_completed);

-- Properties: V2 listing automation & marketing fields
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS validation_status listing_validation_status NOT NULL DEFAULT 'pending_verification';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS listing_expires_at timestamptz;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT true;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS syndicated boolean NOT NULL DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS promoted_until timestamptz;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS virtual_tour_url text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS floor_plan_url text;

CREATE INDEX IF NOT EXISTS idx_properties_validation_status ON public.properties(validation_status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_expires_at ON public.properties(listing_expires_at);

-- Inquiries: attribution & tracking
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS referred_by_agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS utm_source text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS utm_medium text;
ALTER TABLE public.inquiries ADD COLUMN IF NOT EXISTS utm_campaign text;

CREATE INDEX IF NOT EXISTS idx_inquiries_referred_agent ON public.inquiries(referred_by_agent_id);

-- Settings: SaaS / agency config
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS max_agents_per_agency int NOT NULL DEFAULT 10;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS max_listings_per_agent int NOT NULL DEFAULT 50;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS commission_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS stripe_connect_enabled boolean NOT NULL DEFAULT false;

-- ============================================================
-- NEW TABLE: AGENT_VERIFICATIONS
-- ============================================================
CREATE TABLE public.agent_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  status agent_verification_status NOT NULL DEFAULT 'pending',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text,
  documents jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_agent_verifications_agent ON public.agent_verifications(agent_id);
CREATE INDEX idx_agent_verifications_status ON public.agent_verifications(status);
GRANT SELECT, INSERT, UPDATE ON public.agent_verifications TO authenticated;
GRANT ALL ON public.agent_verifications TO service_role;
ALTER TABLE public.agent_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AV staff read" ON public.agent_verifications FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
CREATE POLICY "AV agents insert own" ON public.agent_verifications FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.agents a WHERE a.id = agent_id AND a.user_id = auth.uid()));
CREATE POLICY "AV admins manage" ON public.agent_verifications FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
CREATE TRIGGER trg_agent_verifications_updated BEFORE UPDATE ON public.agent_verifications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- NEW TABLE: MARKETING_ASSETS
-- ============================================================
CREATE TABLE public.marketing_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  asset_type text NOT NULL DEFAULT 'social',
  title text,
  description text,
  file_url text NOT NULL,
  thumbnail_url text,
  provider video_provider,
  provider_id text,
  views_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_marketing_assets_property ON public.marketing_assets(property_id);
CREATE INDEX idx_marketing_assets_agent ON public.marketing_assets(agent_id);
GRANT SELECT ON public.marketing_assets TO anon, authenticated;
GRANT INSERT, UPDATE ON public.marketing_assets TO authenticated;
GRANT ALL ON public.marketing_assets TO service_role;
ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "MA public read" ON public.marketing_assets FOR SELECT USING (true);
CREATE POLICY "MA editors manage" ON public.marketing_assets FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
CREATE TRIGGER trg_marketing_assets_updated BEFORE UPDATE ON public.marketing_assets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- NEW TABLE: SOCIAL_VIDEOS
-- ============================================================
CREATE TABLE public.social_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  provider video_provider NOT NULL,
  provider_video_id text,
  title text,
  description text,
  thumbnail_url text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_social_videos_property ON public.social_videos(property_id);
CREATE INDEX idx_social_videos_agent ON public.social_videos(agent_id);
GRANT SELECT ON public.social_videos TO anon, authenticated;
GRANT INSERT, UPDATE ON public.social_videos TO authenticated;
GRANT ALL ON public.social_videos TO service_role;
ALTER TABLE public.social_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SV public read published" ON public.social_videos FOR SELECT
  USING (published = true);
CREATE POLICY "SV staff read all" ON public.social_videos FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
CREATE POLICY "SV editors manage" ON public.social_videos FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
CREATE TRIGGER trg_social_videos_updated BEFORE UPDATE ON public.social_videos
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- NEW TABLE: REFERRAL_PARTNERS
-- ============================================================
CREATE TABLE public.referral_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  agency_id uuid,
  commission_rate numeric(5,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_referral_partners_agency ON public.referral_partners(agency_id);
GRANT SELECT ON public.referral_partners TO anon, authenticated;
GRANT INSERT, UPDATE ON public.referral_partners TO authenticated;
GRANT ALL ON public.referral_partners TO service_role;
ALTER TABLE public.referral_partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RP public read active" ON public.referral_partners FOR SELECT USING (active = true);
CREATE POLICY "RP editors manage" ON public.referral_partners FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
CREATE TRIGGER trg_referral_partners_updated BEFORE UPDATE ON public.referral_partners
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- NEW TABLE: SUBSCRIPTIONS (SaaS)
-- ============================================================
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_agency ON public.subscriptions(agency_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sub staff read" ON public.subscriptions FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
CREATE POLICY "Sub admins manage" ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();