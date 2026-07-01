-- ============================================================
-- BRIGHT EDGE AGENCY — V2 Phase 2 Extension
-- Decisions applied:
--   1. Agent languages + years_experience (Q1=Y)
--   2. Owner role: thin role with read-only access to own property leads
--   3. Lead lifecycle: add 'negotiation' to lead_status enum
--   4. Per-IP click dedup on short_links (Q5=N → add ip_click_dedup)
--   5. Project/Development categories seeded separately (Q6=separate)
--   6. Image hash dedup on property_images (Q9=simple + image)
-- ============================================================

-- ============================================================
-- 1. ENUM extension: add 'negotiation' to lead_status
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumtypid = 'public.lead_status'::regtype
        AND enumlabel = 'negotiation'
    ) THEN
      ALTER TYPE public.lead_status ADD VALUE 'negotiation';
    END IF;
  END IF;
END
$$;

-- ============================================================
-- 2. Agents: languages + years_experience
-- ============================================================
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS years_experience int;

-- ============================================================
-- 3. Property owners (thin role)
--    - We reuse app_role enum and add a 'property_owner' value
--    - Each owner maps to a single property (or many via M2M)
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_enum
      WHERE enumtypid = 'public.app_role'::regtype
        AND enumlabel = 'property_owner'
    ) THEN
      ALTER TYPE public.app_role ADD VALUE 'property_owner';
    END IF;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.property_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_property_owners_user ON public.property_owners(user_id);

-- M2M: owners ↔ properties
CREATE TABLE IF NOT EXISTS public.property_owner_links (
  owner_id uuid NOT NULL REFERENCES public.property_owners(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  relationship text NOT NULL DEFAULT 'owner',     -- owner|co_owner|representative
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_property_owner_links_property ON public.property_owner_links(property_id);

-- On new auth.user, optionally create a property_owner row from metadata
-- (the apply flow will call this explicitly).
CREATE OR REPLACE FUNCTION public.create_property_owner(p_user_id uuid, p_full_name text, p_email text, p_phone text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.property_owners (user_id, full_name, email, phone)
  VALUES (p_user_id, p_full_name, p_email, p_phone)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    SELECT id INTO v_id FROM public.property_owners WHERE user_id = p_user_id LIMIT 1;
  END IF;

  -- Add role if missing
  INSERT INTO public.user_roles (user_id, role) VALUES (p_user_id, 'property_owner')
    ON CONFLICT DO NOTHING;

  RETURN v_id;
END;$$;

GRANT EXECUTE ON FUNCTION public.create_property_owner(uuid, text, text, text) TO authenticated;
GRANT SELECT ON public.property_owners TO authenticated;
GRANT SELECT ON public.property_owner_links TO authenticated;
GRANT ALL ON public.property_owners TO service_role;
GRANT ALL ON public.property_owner_links TO service_role;
ALTER TABLE public.property_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_owner_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PO self read" ON public.property_owners;
CREATE POLICY "PO self read" ON public.property_owners FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "PO staff read" ON public.property_owners;
CREATE POLICY "PO staff read" ON public.property_owners FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

DROP POLICY IF EXISTS "PO self manage" ON public.property_owners;
CREATE POLICY "PO self manage" ON public.property_owners FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "POL self read" ON public.property_owner_links;
CREATE POLICY "POL self read" ON public.property_owner_links FOR SELECT TO authenticated
  USING (
    owner_id IN (SELECT id FROM public.property_owners WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "POL staff read" ON public.property_owner_links;
CREATE POLICY "POL staff read" ON public.property_owner_links FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

-- Owner can read leads for their own properties
-- (uses the existing inquiries RLS + this view)
CREATE OR REPLACE VIEW public.owner_inquiries_view AS
SELECT i.*
FROM public.inquiries i
WHERE EXISTS (
  SELECT 1
  FROM public.property_owner_links pol
  JOIN public.property_owners po ON po.id = pol.owner_id
  WHERE pol.property_id = i.property_id
    AND po.user_id = auth.uid()
);
GRANT SELECT ON public.owner_inquiries_view TO authenticated;

-- ============================================================
-- 4. Per-IP click dedup on short_links
--    A small denormalised table for fast, idempotent counting.
--    The agent is responsible for sending the IP (hashed) to
--    /api/short-links/:code/click.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.short_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_link_id uuid NOT NULL REFERENCES public.short_links(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  user_agent text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  country text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Uniqueness per (link, ip_hash, day) prevents double counting.
CREATE UNIQUE INDEX IF NOT EXISTS uq_short_link_clicks_per_day
  ON public.short_link_clicks(short_link_id, ip_hash, (created_at::date));
CREATE INDEX IF NOT EXISTS idx_short_link_clicks_link_created
  ON public.short_link_clicks(short_link_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_short_link_clicks_ip
  ON public.short_link_clicks(ip_hash, created_at DESC);

GRANT INSERT ON public.short_link_clicks TO anon, authenticated;
GRANT SELECT ON public.short_link_clicks TO authenticated;
GRANT ALL ON public.short_link_clicks TO service_role;
ALTER TABLE public.short_link_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SLC anon insert" ON public.short_link_clicks;
CREATE POLICY "SLC anon insert" ON public.short_link_clicks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "SLC staff read" ON public.short_link_clicks;
CREATE POLICY "SLC staff read" ON public.short_link_clicks FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

-- Helper: record a click atomically with dedup
CREATE OR REPLACE FUNCTION public.record_short_link_click(
  p_short_link_id uuid,
  p_ip_hash text,
  p_user_agent text DEFAULT NULL,
  p_referrer text DEFAULT NULL,
  p_utm_source text DEFAULT NULL,
  p_utm_medium text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL,
  p_country text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_inserted boolean;
BEGIN
  -- ON CONFLICT DO NOTHING: only first click per (link, ip, day) counts.
  INSERT INTO public.short_link_clicks (
    short_link_id, ip_hash, user_agent, referrer,
    utm_source, utm_medium, utm_campaign, country
  ) VALUES (
    p_short_link_id, p_ip_hash, p_user_agent, p_referrer,
    p_utm_source, p_utm_medium, p_utm_campaign, p_country
  )
  ON CONFLICT (short_link_id, ip_hash, (created_at::date)) DO NOTHING
  RETURNING true INTO v_inserted;

  IF v_inserted THEN
    UPDATE public.short_links
      SET click_count = click_count + 1
      WHERE id = p_short_link_id;
  END IF;

  RETURN COALESCE(v_inserted, false);
END;$$;
GRANT EXECUTE ON FUNCTION public.record_short_link_click(uuid, text, text, text, text, text, text, text) TO anon, authenticated;

-- ============================================================
-- 5. Project / Development separate entities
--    A "project" is a development with multiple units (apartments,
--    townhouses, etc.). A property can optionally belong to a project.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  developer text,
  country text,
  county text,
  town text,
  neighbourhood text,
  description text,
  hero_image text,
  launch_date date,
  completion_date date,
  status text NOT NULL DEFAULT 'planning',  -- planning|under_construction|ready|completed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_town ON public.projects(town);

GRANT SELECT ON public.projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "PJ public read" ON public.projects;
CREATE POLICY "PJ public read" ON public.projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "PJ staff manage" ON public.projects FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Link properties to projects (a unit belongs to a project)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_properties_project ON public.properties(project_id);

-- ============================================================
-- 6. Image hash dedup (per-agent)
--    We compute a perceptual hash on upload (client-side via lib/image-hash.ts)
--    and store it on property_images. The validation engine refuses to
--    attach a hash already used by any other property of the same agent.
-- ============================================================
ALTER TABLE public.property_images
  ADD COLUMN IF NOT EXISTS image_hash text,
  ADD COLUMN IF NOT EXISTS image_width int,
  ADD COLUMN IF NOT EXISTS image_height int,
  ADD COLUMN IF NOT EXISTS image_bytes bigint;
CREATE INDEX IF NOT EXISTS idx_property_images_hash ON public.property_images(image_hash);

-- ============================================================
-- 7. Agent verification state machine tables
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',  -- pending|under_review|approved|rejected
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  notes text,
  documents jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_verifications_agent ON public.agent_verifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_verifications_status ON public.agent_verifications(status);
CREATE INDEX IF NOT EXISTS idx_agent_verifications_sla ON public.agent_verifications(submitted_at)
  WHERE status = 'under_review';

GRANT SELECT, INSERT, UPDATE ON public.agent_verifications TO authenticated;
GRANT ALL ON public.agent_verifications TO service_role;
ALTER TABLE public.agent_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AV staff read" ON public.agent_verifications;
CREATE POLICY "AV staff read" ON public.agent_verifications FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

DROP POLICY IF EXISTS "AV self read" ON public.agent_verifications;
CREATE POLICY "AV self read" ON public.agent_verifications FOR SELECT TO authenticated
  USING (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "AV self insert" ON public.agent_verifications;
CREATE POLICY "AV self insert" ON public.agent_verifications FOR INSERT TO authenticated
  WITH CHECK (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "AV staff manage" ON public.agent_verifications;
CREATE POLICY "AV staff manage" ON public.agent_verifications FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));

-- Verification step log (append-only audit trail)
CREATE TABLE IF NOT EXISTS public.agent_verification_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  verification_id uuid REFERENCES public.agent_verifications(id) ON DELETE CASCADE,
  step text NOT NULL,                       -- email_verified, phone_verified, id_uploaded, etc.
  status text NOT NULL DEFAULT 'completed', -- completed|failed|skipped
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_avs_agent ON public.agent_verification_steps(agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_avs_verification ON public.agent_verification_steps(verification_id);

GRANT SELECT, INSERT ON public.agent_verification_steps TO authenticated;
GRANT ALL ON public.agent_verification_steps TO service_role;
ALTER TABLE public.agent_verification_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "AVS staff read" ON public.agent_verification_steps;
CREATE POLICY "AVS staff read" ON public.agent_verification_steps FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

DROP POLICY IF EXISTS "AVS self read" ON public.agent_verification_steps;
CREATE POLICY "AVS self read" ON public.agent_verification_steps FOR SELECT TO authenticated
  USING (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "AVS self insert" ON public.agent_verification_steps;
CREATE POLICY "AVS self insert" ON public.agent_verification_steps FOR INSERT TO authenticated
  WITH CHECK (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()));

-- ============================================================
-- 8. Property validation: extend the publish guard
--    Phase 2 wired in: tighten the 3-image rule, add agency slug
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_property_min_images()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE img_count int;
BEGIN
  IF NEW.publish_status = 'published' THEN
    SELECT count(*) INTO img_count FROM public.property_images WHERE property_id = NEW.id;
    IF img_count < 5 THEN
      RAISE EXCEPTION 'Property must have at least 5 images before publishing (currently %)', img_count
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.published_at IS NULL THEN NEW.published_at := now(); END IF;
  END IF;
  RETURN NEW;
END;$$;
-- Re-create (idempotent)
DROP TRIGGER IF EXISTS trg_property_publish_guard ON public.properties;
CREATE TRIGGER trg_property_publish_guard
  BEFORE INSERT OR UPDATE OF publish_status ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.enforce_property_min_images();
