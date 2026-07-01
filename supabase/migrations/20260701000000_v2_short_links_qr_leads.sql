-- ============================================================
-- BRIGHT EDGE AGENCY — V2.1 Extension
-- Adds: short_links, property_qr_codes, lead_sources,
--       agent_documents, agent_social_accounts, agent_areas,
--       properties.fingerprint + rental fee fields + commission,
--       public_property_view, public_agent_view, helpful indexes.
-- All statements are idempotent (IF NOT EXISTS / DO blocks).
-- ============================================================

-- ============================================================
-- ENUMS (idempotent)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_platform') THEN
    CREATE TYPE public.social_platform AS ENUM (
      'facebook','instagram','twitter','linkedin','youtube','tiktok','website','other'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_document_kind') THEN
    CREATE TYPE public.agent_document_kind AS ENUM (
      'national_id_front','national_id_back','selfie','profile_photo','business_license','other'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'short_link_target_type') THEN
    CREATE TYPE public.short_link_target_type AS ENUM (
      'property','agent','listing','review','blog','landing','other'
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rental_fee_timing') THEN
    CREATE TYPE public.rental_fee_timing AS ENUM (
      'before_viewing','after_viewing','on_agreement','on_move_in','on_first_month'
    );
  END IF;
END
$$;

-- ============================================================
-- PROPERTIES: V2 fee transparency + commission + dedup + video
-- ============================================================
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS house_hunting_fee_kes numeric(12,2),
  ADD COLUMN IF NOT EXISTS viewing_fee_kes numeric(12,2),
  ADD COLUMN IF NOT EXISTS fees_refundable boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fee_payment_timing rental_fee_timing,
  ADD COLUMN IF NOT EXISTS commission_kes numeric(12,2),
  ADD COLUMN IF NOT EXISTS commission_notes text,
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS video_provider text,
  ADD COLUMN IF NOT EXISTS fingerprint_hash text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS county text,
  ADD COLUMN IF NOT EXISTS town text,
  ADD COLUMN IF NOT EXISTS neighbourhood text,
  ADD COLUMN IF NOT EXISTS landmark text;

-- Helpful indexes (only create when the column exists)
CREATE INDEX IF NOT EXISTS idx_properties_fingerprint ON public.properties(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_properties_video_url ON public.properties(video_url);
CREATE INDEX IF NOT EXISTS idx_properties_published_created
  ON public.properties(publish_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_published_validation
  ON public.properties(publish_status, validation_status);

-- ============================================================
-- AGENTS: V2 onboarding extras
-- ============================================================
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verification_level text NOT NULL DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS public_badge boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS areas_of_operation jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_accounts jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS published_listing_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reviewed_listing_count int NOT NULL DEFAULT 0;

-- Trigger to keep published_listing_count in sync
CREATE OR REPLACE FUNCTION public.touch_agent_listing_count()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.publish_status = 'published' AND NEW.agent_id IS NOT NULL THEN
      UPDATE public.agents
        SET published_listing_count = published_listing_count + 1
        WHERE id = NEW.agent_id;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- status transitions
    IF COALESCE(OLD.publish_status,'') <> NEW.publish_status THEN
      IF OLD.publish_status = 'published' AND NEW.publish_status <> 'published' AND NEW.agent_id IS NOT NULL THEN
        UPDATE public.agents
          SET published_listing_count = GREATEST(0, published_listing_count - 1)
          WHERE id = NEW.agent_id;
      ELSIF NEW.publish_status = 'published' AND OLD.publish_status <> 'published' AND NEW.agent_id IS NOT NULL THEN
        UPDATE public.agents
          SET published_listing_count = published_listing_count + 1
          WHERE id = NEW.agent_id;
      END IF;
    END IF;
    -- agent re-assignment
    IF NEW.agent_id IS DISTINCT FROM OLD.agent_id THEN
      IF OLD.agent_id IS NOT NULL AND OLD.publish_status = 'published' THEN
        UPDATE public.agents
          SET published_listing_count = GREATEST(0, published_listing_count - 1)
          WHERE id = OLD.agent_id;
      END IF;
      IF NEW.agent_id IS NOT NULL AND NEW.publish_status = 'published' THEN
        UPDATE public.agents
          SET published_listing_count = published_listing_count + 1
          WHERE id = NEW.agent_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.publish_status = 'published' AND OLD.agent_id IS NOT NULL THEN
      UPDATE public.agents
        SET published_listing_count = GREATEST(0, published_listing_count - 1)
        WHERE id = OLD.agent_id;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;$$;

DROP TRIGGER IF EXISTS trg_properties_listing_count ON public.properties;
CREATE TRIGGER trg_properties_listing_count
  AFTER INSERT OR UPDATE OR DELETE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.touch_agent_listing_count();

-- ============================================================
-- AGENT_DOCUMENTS — ID, selfie, profile photo
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  kind agent_document_kind NOT NULL,
  storage_path text NOT NULL,
  public_url text,
  mime_type text,
  byte_size bigint,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  review_status text NOT NULL DEFAULT 'pending',  -- pending|approved|rejected
  review_notes text
);
CREATE INDEX IF NOT EXISTS idx_agent_documents_agent ON public.agent_documents(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_documents_kind ON public.agent_documents(kind);
CREATE INDEX IF NOT EXISTS idx_agent_documents_review ON public.agent_documents(review_status);
GRANT SELECT, INSERT, UPDATE ON public.agent_documents TO authenticated;
GRANT ALL ON public.agent_documents TO service_role;
ALTER TABLE public.agent_documents ENABLE ROW LEVEL SECURITY;

-- Agent can read & add their own docs
DROP POLICY IF EXISTS "AD agent read own" ON public.agent_documents;
CREATE POLICY "AD agent read own" ON public.agent_documents
  FOR SELECT TO authenticated
  USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
    OR public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[])
  );

DROP POLICY IF EXISTS "AD agent insert own" ON public.agent_documents;
CREATE POLICY "AD agent insert own" ON public.agent_documents
  FOR INSERT TO authenticated
  WITH CHECK (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "AD agent update own" ON public.agent_documents;
CREATE POLICY "AD agent update own" ON public.agent_documents
  FOR UPDATE TO authenticated
  USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  )
  WITH CHECK (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "AD staff manage" ON public.agent_documents;
CREATE POLICY "AD staff manage" ON public.agent_documents
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- AGENT_SOCIAL_ACCOUNTS — normalised
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  platform social_platform NOT NULL,
  handle text NOT NULL,
  url text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, platform, handle)
);
CREATE INDEX IF NOT EXISTS idx_agent_social_agent ON public.agent_social_accounts(agent_id);
GRANT SELECT ON public.agent_social_accounts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.agent_social_accounts TO authenticated;
GRANT ALL ON public.agent_social_accounts TO service_role;
ALTER TABLE public.agent_social_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ASA public read" ON public.agent_social_accounts;
CREATE POLICY "ASA public read" ON public.agent_social_accounts FOR SELECT USING (true);

DROP POLICY IF EXISTS "ASA agent manage own" ON public.agent_social_accounts;
CREATE POLICY "ASA agent manage own" ON public.agent_social_accounts
  FOR ALL TO authenticated
  USING (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()))
  WITH CHECK (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "ASA staff manage" ON public.agent_social_accounts;
CREATE POLICY "ASA staff manage" ON public.agent_social_accounts
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- AGENT_AREAS — text-only hierarchy (no GPS)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  country text,
  county text,
  town text,
  neighbourhood text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_areas_agent ON public.agent_areas(agent_id);
GRANT SELECT ON public.agent_areas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.agent_areas TO authenticated;
GRANT ALL ON public.agent_areas TO service_role;
ALTER TABLE public.agent_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AA public read" ON public.agent_areas;
CREATE POLICY "AA public read" ON public.agent_areas FOR SELECT USING (true);

DROP POLICY IF EXISTS "AA agent manage own" ON public.agent_areas;
CREATE POLICY "AA agent manage own" ON public.agent_areas
  FOR ALL TO authenticated
  USING (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()))
  WITH CHECK (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "AA staff manage" ON public.agent_areas;
CREATE POLICY "AA staff manage" ON public.agent_areas
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- SHORT_LINKS — /p/{code} → canonical URL
-- ============================================================
CREATE TABLE IF NOT EXISTS public.short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  target_type short_link_target_type NOT NULL,
  target_id uuid,
  target_path text NOT NULL,                    -- e.g. /properties/abc
  long_url text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  click_count bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_short_links_target ON public.short_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_short_links_created ON public.short_links(created_at DESC);
GRANT SELECT ON public.short_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.short_links TO authenticated;
GRANT ALL ON public.short_links TO service_role;
ALTER TABLE public.short_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SL public read" ON public.short_links;
CREATE POLICY "SL public read" ON public.short_links FOR SELECT USING (
  expires_at IS NULL OR expires_at > now()
);

DROP POLICY IF EXISTS "SL staff manage" ON public.short_links;
CREATE POLICY "SL staff manage" ON public.short_links
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

-- ============================================================
-- PROPERTY_QR_CODES — generated PNGs per property
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  short_link_id uuid REFERENCES public.short_links(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  format text NOT NULL DEFAULT 'png',
  byte_size bigint,
  generated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_property_qr_property ON public.property_qr_codes(property_id);
GRANT SELECT ON public.property_qr_codes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.property_qr_codes TO authenticated;
GRANT ALL ON public.property_qr_codes TO service_role;
ALTER TABLE public.property_qr_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PQR public read" ON public.property_qr_codes;
CREATE POLICY "PQR public read" ON public.property_qr_codes FOR SELECT USING (true);

DROP POLICY IF EXISTS "PQR staff manage" ON public.property_qr_codes;
CREATE POLICY "PQR staff manage" ON public.property_qr_codes
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

-- ============================================================
-- LEAD_SOURCES — extended lead attribution
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source_channel') THEN
    CREATE TYPE public.lead_source_channel AS ENUM (
      'website','whatsapp','facebook','instagram','twitter','linkedin',
      'tiktok','qr','short_link','email','phone','referral','other'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid REFERENCES public.inquiries(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  short_link_id uuid REFERENCES public.short_links(id) ON DELETE SET NULL,
  channel lead_source_channel NOT NULL,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  user_agent text,
  ip_hash text,                            -- one-way hash, no raw IP storage
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_sources_inquiry ON public.lead_sources(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_lead_sources_property ON public.lead_sources(property_id);
CREATE INDEX IF NOT EXISTS idx_lead_sources_agent ON public.lead_sources(agent_id);
CREATE INDEX IF NOT EXISTS idx_lead_sources_channel ON public.lead_sources(channel);
CREATE INDEX IF NOT EXISTS idx_lead_sources_created ON public.lead_sources(created_at DESC);
GRANT INSERT ON public.lead_sources TO anon, authenticated;
GRANT SELECT ON public.lead_sources TO authenticated;
GRANT ALL ON public.lead_sources TO service_role;
ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

-- Anyone can record an attribution hit (anon for short link scans)
DROP POLICY IF EXISTS "LS anyone insert" ON public.lead_sources;
CREATE POLICY "LS anyone insert" ON public.lead_sources FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "LS staff read" ON public.lead_sources;
CREATE POLICY "LS staff read" ON public.lead_sources FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

DROP POLICY IF EXISTS "LS agent read own" ON public.lead_sources;
CREATE POLICY "LS agent read own" ON public.lead_sources FOR SELECT TO authenticated
  USING (
    agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid())
  );

-- ============================================================
-- VIEWS — public_property_view, public_agent_view
-- These are the ONLY paths the client uses for unauthenticated reads.
-- The base tables still carry the full data, but views drop:
--   - commission fields (sales privacy)
--   - PII fields the public should never see
-- ============================================================

CREATE OR REPLACE VIEW public.public_property_view AS
SELECT
  p.id, p.slug, p.title, p.excerpt, p.meta_description,
  p.price, p.currency, p.price_period,
  p.listing_type, p.publish_status, p.validation_status, p.featured,
  p.bedrooms, p.bathrooms, p.area_sqft, p.year_built, p.parking,
  p.address, p.country, p.county, p.town, p.neighbourhood, p.landmark,
  p.video_url, p.video_provider,
  p.house_hunting_fee_kes, p.viewing_fee_kes, p.fees_refundable, p.fee_payment_timing,
  p.promoted_until, p.listing_expires_at, p.created_at, p.published_at, p.updated_at,
  p.agent_id, p.location_id, p.property_type_id, p.status_id, p.category_id,
  p.virtual_tour_url, p.floor_plan_url
FROM public.properties p
WHERE p.publish_status = 'published';

CREATE OR REPLACE VIEW public.public_agent_view AS
SELECT
  a.id, a.slug, a.full_name, a.photo, a.bio, a.role, a.team_name, a.specializations,
  a.email, a.phone, a.whatsapp, a.license_number, a.verification_status,
  a.verification_level, a.public_badge, a.active, a.display_order,
  a.facebook_url, a.instagram_url, a.twitter_url, a.linkedin_url, a.youtube_url
FROM public.agents a
WHERE a.active = true
  AND a.verification_status = 'verified';

-- ============================================================
-- RLS: drop commission fields from anonymous reads of properties
-- The base table still has the columns; we revoke column-level GRANT
-- for the anon role to prevent API clients from selecting them.
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='properties'
               AND column_name='commission_kes') THEN
    EXECUTE 'REVOKE SELECT (commission_kes, commission_notes) ON public.properties FROM anon';
  END IF;
END
$$;

-- ============================================================
-- Update RLS: anonymous can only read published properties,
-- and the SELECT must use the public view or explicitly
-- avoid commission columns.
-- ============================================================
DROP POLICY IF EXISTS "Properties public read" ON public.properties;
CREATE POLICY "Properties public read" ON public.properties
  FOR SELECT TO anon
  USING (publish_status = 'published');

-- Already in place for authenticated; keep current behaviour.
-- (No DROP on existing authenticated policy; we don't override staff reads.)

-- ============================================================
-- Indexes on hot paths
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_properties_listing_type_status
  ON public.properties(listing_type, publish_status);
CREATE INDEX IF NOT EXISTS idx_properties_town ON public.properties(town);
CREATE INDEX IF NOT EXISTS idx_properties_county ON public.properties(county);
CREATE INDEX IF NOT EXISTS idx_inquiries_status_created
  ON public.inquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_property
  ON public.inquiries(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_agent
  ON public.inquiries(agent_id, created_at DESC);
