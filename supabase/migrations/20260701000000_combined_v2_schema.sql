-- ============================================================
-- BRIGHT EDGE AGENCY — Combined V2 Schema
-- All migrations combined into single file for proper execution
-- ============================================================

-- ============================================================
-- BASE SCHEMA (from 20260622091807_8b0a43bd-7dd3-41be-9304-9c254585058f.sql)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('super_admin','admin','editor','agent','user');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_listing_type') THEN
    CREATE TYPE public.property_listing_type AS ENUM ('sale','rent');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_publish_status') THEN
    CREATE TYPE public.property_publish_status AS ENUM ('draft','published','archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_status') THEN
    CREATE TYPE public.lead_status AS ENUM ('new','contacted','qualified','viewing_scheduled','offer_made','won','lost','closed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lead_source') THEN
    CREATE TYPE public.lead_source AS ENUM ('website_form','property_inquiry','contact_page','whatsapp','newsletter','referral','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blog_post_status') THEN
    CREATE TYPE public.blog_post_status AS ENUM ('draft','published','scheduled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'review_status') THEN
    CREATE TYPE public.review_status AS ENUM ('draft','published');
  END IF;
END
$$;

-- ============================================================
-- UTILITY: updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;$$;

-- ============================================================
-- UTILITY: slugify (immutable, lowercase, alnum + dashes)
-- ============================================================
CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(input,'')), '[^a-z0-9]+', '-', 'g'));
$$;

-- ============================================================
-- PROFILES (one row per auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Profiles readable by authenticated" ON public.profiles;
CREATE POLICY "Profiles readable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP TRIGGER IF EXISTS trg_profiles_updated ON public.profiles;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  -- default role: user
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;$$;

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

DROP POLICY IF EXISTS "Users see own roles" ON public.user_roles;
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Now attach the new-user trigger (depends on user_roles)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  region text,
  country text DEFAULT 'Kenya',
  description text,
  hero_image text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.locations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Locations public read" ON public.locations;
CREATE POLICY "Locations public read" ON public.locations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Locations editors manage" ON public.locations;
CREATE POLICY "Locations editors manage" ON public.locations FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
DROP TRIGGER IF EXISTS trg_locations_updated ON public.locations;
CREATE TRIGGER trg_locations_updated BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- PROPERTY CATEGORIES / TYPES / STATUSES / AMENITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text
);
GRANT SELECT ON public.property_categories TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.property_categories TO authenticated;
GRANT ALL ON public.property_categories TO service_role;
ALTER TABLE public.property_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PC public read" ON public.property_categories;
CREATE POLICY "PC public read" ON public.property_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "PC editors manage" ON public.property_categories;
CREATE POLICY "PC editors manage" ON public.property_categories FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE IF NOT EXISTS public.property_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE
);
GRANT SELECT ON public.property_types TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.property_types TO authenticated;
GRANT ALL ON public.property_types TO service_role;
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PT public read" ON public.property_types;
CREATE POLICY "PT public read" ON public.property_types FOR SELECT USING (true);
DROP POLICY IF EXISTS "PT editors manage" ON public.property_types;
CREATE POLICY "PT editors manage" ON public.property_types FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE IF NOT EXISTS public.property_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  color text
);
GRANT SELECT ON public.property_statuses TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.property_statuses TO authenticated;
GRANT ALL ON public.property_statuses TO service_role;
ALTER TABLE public.property_statuses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PS public read" ON public.property_statuses;
CREATE POLICY "PS public read" ON public.property_statuses FOR SELECT USING (true);
DROP POLICY IF EXISTS "PS editors manage" ON public.property_statuses;
CREATE POLICY "PS editors manage" ON public.property_statuses FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE IF NOT EXISTS public.amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text
);
GRANT SELECT ON public.amenities TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.amenities TO authenticated;
GRANT ALL ON public.amenities TO service_role;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Am public read" ON public.amenities;
CREATE POLICY "Am public read" ON public.amenities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Am editors manage" ON public.amenities;
CREATE POLICY "Am editors manage" ON public.amenities FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- AGENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  position text,
  bio text,
  photo text,
  phone text,
  email text,
  whatsapp text,
  socials jsonb DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.agents TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.agents TO authenticated;
GRANT ALL ON public.agents TO service_role;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Agents public read active" ON public.agents;
CREATE POLICY "Agents public read active" ON public.agents FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "Agents staff full read" ON public.agents;
CREATE POLICY "Agents staff full read" ON public.agents FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
DROP POLICY IF EXISTS "Agents editors manage" ON public.agents;
CREATE POLICY "Agents editors manage" ON public.agents FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
DROP TRIGGER IF EXISTS trg_agents_updated ON public.agents;
CREATE TRIGGER trg_agents_updated BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- PROPERTIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  meta_title text,
  meta_description text,
  excerpt text,
  description text,
  category_id uuid REFERENCES public.property_categories(id) ON DELETE SET NULL,
  property_type_id uuid REFERENCES public.property_types(id) ON DELETE SET NULL,
  status_id uuid REFERENCES public.property_statuses(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE RESTRICT,
  listing_type property_listing_type NOT NULL DEFAULT 'sale',
  price numeric(14,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'KES',
  price_period text, -- e.g. 'month' for rentals
  bedrooms int DEFAULT 0,
  bathrooms int DEFAULT 0,
  area_sqft numeric(10,2),
  parking int DEFAULT 0,
  year_built int,
  address text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  publish_status property_publish_status NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  views_count int NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_properties_publish_status ON public.properties(publish_status);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(location_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(property_type_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties(listing_type);
GRANT SELECT ON public.properties TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Properties public read published" ON public.properties;
CREATE POLICY "Properties public read published" ON public.properties
  FOR SELECT USING (publish_status = 'published');
DROP POLICY IF EXISTS "Properties staff read all" ON public.properties;
CREATE POLICY "Properties staff read all" ON public.properties
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
DROP POLICY IF EXISTS "Properties editors manage" ON public.properties;
CREATE POLICY "Properties editors manage" ON public.properties FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
DROP TRIGGER IF EXISTS trg_properties_updated ON public.properties;
CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Property ownership security constraints
-- Ensure agent_id is NOT NULL for new properties (existing NULL values allowed for migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'properties_agent_id_not_null'
  ) THEN
    ALTER TABLE public.properties ADD CONSTRAINT properties_agent_id_not_null 
      CHECK (agent_id IS NOT NULL);
  END IF;
END $$;

-- Trigger to ensure agent is verified before property assignment (replaces CHECK constraint with subquery)
DROP FUNCTION IF EXISTS public.ensure_agent_verified() CASCADE;
CREATE FUNCTION public.ensure_agent_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agent_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.agents 
      WHERE id = NEW.agent_id AND verification_status = 'verified'
    ) THEN
      RAISE EXCEPTION 'Property can only be assigned to verified agents';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_property_agent_verified ON public.properties;
CREATE TRIGGER trg_property_agent_verified
  BEFORE INSERT OR UPDATE OF agent_id ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.ensure_agent_verified();

-- Trigger to prevent orphan properties on agent deletion
DROP FUNCTION IF EXISTS public.prevent_orphan_properties() CASCADE;
CREATE FUNCTION public.prevent_orphan_properties()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.properties 
    WHERE agent_id = OLD.id
  ) THEN
    RAISE EXCEPTION 'Cannot delete agent with associated properties. Reassign properties first.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agent_prevent_orphan ON public.agents;
CREATE TRIGGER trg_agent_prevent_orphan BEFORE DELETE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.prevent_orphan_properties();

-- ============================================================
-- PROPERTY IMAGES / DOCS / VIDEOS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  image_order int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_property_images_property ON public.property_images(property_id, image_order);
GRANT SELECT ON public.property_images TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.property_images TO authenticated;
GRANT ALL ON public.property_images TO service_role;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PI public read for published" ON public.property_images;
CREATE POLICY "PI public read for published" ON public.property_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.publish_status='published'));
DROP POLICY IF EXISTS "PI staff read" ON public.property_images;
CREATE POLICY "PI staff read" ON public.property_images FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
DROP POLICY IF EXISTS "PI editors manage" ON public.property_images;
CREATE POLICY "PI editors manage" ON public.property_images FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE IF NOT EXISTS public.property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.property_documents TO authenticated;
GRANT ALL ON public.property_documents TO service_role;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Docs staff" ON public.property_documents;
CREATE POLICY "Docs staff" ON public.property_documents FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

CREATE TABLE IF NOT EXISTS public.property_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  video_url text NOT NULL,
  title text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.property_videos TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.property_videos TO authenticated;
GRANT ALL ON public.property_videos TO service_role;
ALTER TABLE public.property_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PV public read for published" ON public.property_videos;
CREATE POLICY "PV public read for published" ON public.property_videos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.publish_status='published'));
DROP POLICY IF EXISTS "PV editors manage" ON public.property_videos;
CREATE POLICY "PV editors manage" ON public.property_videos FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE IF NOT EXISTS public.property_amenities (
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  amenity_id uuid NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, amenity_id)
);
GRANT SELECT ON public.property_amenities TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.property_amenities TO authenticated;
GRANT ALL ON public.property_amenities TO service_role;
ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PA public read" ON public.property_amenities;
CREATE POLICY "PA public read" ON public.property_amenities FOR SELECT USING (true);
DROP POLICY IF EXISTS "PA editors manage" ON public.property_amenities;
CREATE POLICY "PA editors manage" ON public.property_amenities FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- Publish guard: properties cannot be 'published' with <5 images
-- (defined once here; re-stated as CREATE OR REPLACE in V2 Phase 2
--  only to update the minimum — the trigger itself is recreated there)
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
DROP TRIGGER IF EXISTS trg_property_publish_guard ON public.properties;
CREATE TRIGGER trg_property_publish_guard
  BEFORE INSERT OR UPDATE OF publish_status ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.enforce_property_min_images();

-- ============================================================
-- INQUIRIES (CRM)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  status lead_status NOT NULL DEFAULT 'new',
  source lead_source NOT NULL DEFAULT 'website_form',
  preferred_contact text,
  notes text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON public.inquiries(created_at DESC);
GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT SELECT,UPDATE,DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Inquiries anyone can create" ON public.inquiries;
CREATE POLICY "Inquiries anyone can create" ON public.inquiries FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Inquiries staff read" ON public.inquiries;
CREATE POLICY "Inquiries staff read" ON public.inquiries FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
DROP POLICY IF EXISTS "Inquiries staff update" ON public.inquiries;
CREATE POLICY "Inquiries staff update" ON public.inquiries FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
DROP POLICY IF EXISTS "Inquiries admins delete" ON public.inquiries;
CREATE POLICY "Inquiries admins delete" ON public.inquiries FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
DROP TRIGGER IF EXISTS trg_inquiries_updated ON public.inquiries;
CREATE TRIGGER trg_inquiries_updated BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type text NOT NULL, -- 'status_change','note','call','email','viewing'
  from_status lead_status,
  to_status lead_status,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_activities_inquiry ON public.lead_activities(inquiry_id, created_at DESC);
GRANT SELECT, INSERT ON public.lead_activities TO authenticated;
GRANT ALL ON public.lead_activities TO service_role;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "LA staff read" ON public.lead_activities;
CREATE POLICY "LA staff read" ON public.lead_activities FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
DROP POLICY IF EXISTS "LA staff insert" ON public.lead_activities;
CREATE POLICY "LA staff insert" ON public.lead_activities FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

CREATE TABLE IF NOT EXISTS public.contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  subject text,
  message text NOT NULL,
  status lead_status NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_requests TO anon, authenticated;
GRANT SELECT,UPDATE,DELETE ON public.contact_requests TO authenticated;
GRANT ALL ON public.contact_requests TO service_role;
ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "CR anyone create" ON public.contact_requests;
CREATE POLICY "CR anyone create" ON public.contact_requests FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "CR staff read" ON public.contact_requests;
CREATE POLICY "CR staff read" ON public.contact_requests FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
DROP POLICY IF EXISTS "CR staff update" ON public.contact_requests;
CREATE POLICY "CR staff update" ON public.contact_requests FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

-- ============================================================
-- BLOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text
);
GRANT SELECT ON public.blog_categories TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "BC public read" ON public.blog_categories;
CREATE POLICY "BC public read" ON public.blog_categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "BC editors manage" ON public.blog_categories;
CREATE POLICY "BC editors manage" ON public.blog_categories FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE IF NOT EXISTS public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE
);
GRANT SELECT ON public.blog_tags TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.blog_tags TO authenticated;
GRANT ALL ON public.blog_tags TO service_role;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "BT public read" ON public.blog_tags;
CREATE POLICY "BT public read" ON public.blog_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "BT editors manage" ON public.blog_tags;
CREATE POLICY "BT editors manage" ON public.blog_tags FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  featured_image text,
  meta_title text,
  meta_description text,
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status blog_post_status NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  reading_minutes int,
  views_count int NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "BP public read published" ON public.blog_posts;
CREATE POLICY "BP public read published" ON public.blog_posts FOR SELECT
  USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));
DROP POLICY IF EXISTS "BP staff read all" ON public.blog_posts;
CREATE POLICY "BP staff read all" ON public.blog_posts FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
DROP POLICY IF EXISTS "BP editors manage" ON public.blog_posts;
CREATE POLICY "BP editors manage" ON public.blog_posts FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
DROP TRIGGER IF EXISTS trg_blog_posts_updated ON public.blog_posts;
CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
GRANT SELECT ON public.blog_post_tags TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.blog_post_tags TO authenticated;
GRANT ALL ON public.blog_post_tags TO service_role;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "BPT public read" ON public.blog_post_tags;
CREATE POLICY "BPT public read" ON public.blog_post_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "BPT editors manage" ON public.blog_post_tags;
CREATE POLICY "BPT editors manage" ON public.blog_post_tags FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  review_id uuid,
  author_name text NOT NULL,
  author_email text,
  body text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.comments TO anon, authenticated;
GRANT SELECT,UPDATE,DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Comments public read approved" ON public.comments;
CREATE POLICY "Comments public read approved" ON public.comments FOR SELECT USING (approved = true);
DROP POLICY IF EXISTS "Comments anyone create" ON public.comments;
CREATE POLICY "Comments anyone create" ON public.comments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Comments staff manage" ON public.comments;
CREATE POLICY "Comments staff manage" ON public.comments FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- PROPERTY REVIEWS (dedicated content type)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text,
  content text,
  featured_image text,
  meta_title text,
  meta_description text,
  rating numeric(2,1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status review_status NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.property_reviews(status);
GRANT SELECT ON public.property_reviews TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.property_reviews TO authenticated;
GRANT ALL ON public.property_reviews TO service_role;
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "PR public read published" ON public.property_reviews;
CREATE POLICY "PR public read published" ON public.property_reviews FOR SELECT
  USING (status = 'published');
DROP POLICY IF EXISTS "PR staff read all" ON public.property_reviews;
CREATE POLICY "PR staff read all" ON public.property_reviews FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
DROP POLICY IF EXISTS "PR editors manage" ON public.property_reviews;
CREATE POLICY "PR editors manage" ON public.property_reviews FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
DROP TRIGGER IF EXISTS trg_reviews_updated ON public.property_reviews;
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.property_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- TESTIMONIALS, NEWSLETTER, SAVED, FEATURED, ACTIVITY, SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  author_title text,
  author_photo text,
  quote text NOT NULL,
  rating int CHECK (rating BETWEEN 1 AND 5),
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "T public read published" ON public.testimonials;
CREATE POLICY "T public read published" ON public.testimonials FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "T editors manage" ON public.testimonials;
CREATE POLICY "T editors manage" ON public.testimonials FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  full_name text,
  subscribed boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT SELECT,UPDATE,DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "NS anyone subscribe" ON public.newsletter_subscribers;
CREATE POLICY "NS anyone subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "NS staff read" ON public.newsletter_subscribers;
CREATE POLICY "NS staff read" ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
DROP POLICY IF EXISTS "NS admins manage" ON public.newsletter_subscribers;
CREATE POLICY "NS admins manage" ON public.newsletter_subscribers FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
DROP POLICY IF EXISTS "NS admins delete" ON public.newsletter_subscribers;
CREATE POLICY "NS admins delete" ON public.newsletter_subscribers FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));

CREATE TABLE IF NOT EXISTS public.saved_properties (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);
GRANT SELECT,INSERT,DELETE ON public.saved_properties TO authenticated;
GRANT ALL ON public.saved_properties TO service_role;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Saved own" ON public.saved_properties;
CREATE POLICY "Saved own" ON public.saved_properties FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.featured_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.featured_properties TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.featured_properties TO authenticated;
GRANT ALL ON public.featured_properties TO service_role;
ALTER TABLE public.featured_properties ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "FP public read" ON public.featured_properties;
CREATE POLICY "FP public read" ON public.featured_properties FOR SELECT USING (true);
DROP POLICY IF EXISTS "FP editors manage" ON public.featured_properties;
CREATE POLICY "FP editors manage" ON public.featured_properties FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "AL staff read" ON public.activity_logs;
CREATE POLICY "AL staff read" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
DROP POLICY IF EXISTS "AL staff insert" ON public.activity_logs;
CREATE POLICY "AL staff insert" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

CREATE TABLE IF NOT EXISTS public.settings (
  id int PRIMARY KEY DEFAULT 1,
  company_name text NOT NULL DEFAULT 'Bright Edge Agency',
  tagline text DEFAULT 'Connecting You To Exceptional Spaces',
  logo_url text,
  primary_phone text,
  primary_email text,
  company_whatsapp text,
  office_address text,
  business_hours text,
  social_links jsonb DEFAULT '{}'::jsonb,
  hero_headline text,
  hero_subheadline text,
  seo_default_title text,
  seo_default_description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.settings TO anon, authenticated;
GRANT INSERT,UPDATE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "S public read" ON public.settings;
CREATE POLICY "S public read" ON public.settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "S admins manage" ON public.settings;
CREATE POLICY "S admins manage" ON public.settings FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
DROP TRIGGER IF EXISTS trg_settings_updated ON public.settings;
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- GALLERY IMAGES ADDITION (from 20260623052341_93be8132-6d95-4d59-a896-e3e6e801c3b6.sql)
-- ============================================================
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.property_reviews ADD COLUMN IF NOT EXISTS gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Backfill blog_posts with 3 gallery images each (featured + 3 supporting)
UPDATE public.blog_posts SET gallery_images = jsonb_build_array(
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80',
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80',
  'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&q=80'
) WHERE gallery_images = '[]'::jsonb;

-- Backfill property_reviews
UPDATE public.property_reviews SET gallery_images = jsonb_build_array(
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80'
) WHERE gallery_images = '[]'::jsonb;

-- ============================================================
-- AGENT PHOTO UPDATES (from 20260623053132_b273eed7-5aab-4a3c-84f9-456fc8e59c55.sql)
-- ============================================================
UPDATE agents SET photo='https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=600&q=80' WHERE full_name='Amina Mwangi';
UPDATE agents SET photo='https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=600&q=80' WHERE full_name='Brian Otieno';
UPDATE agents SET photo='https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80' WHERE full_name='Cynthia Kimani';
UPDATE agents SET photo='https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=600&q=80' WHERE full_name='David Njoroge';
UPDATE agents SET photo='https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?w=600&q=80' WHERE full_name='Esther Wambui';
UPDATE agents SET photo='https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&q=80' WHERE full_name='Felix Mutiso';

-- ============================================================
-- V2 FOUNDATION (from 20260629000000_v2_foundation.sql)
-- ============================================================

-- NEW ENUMS (idempotent via DO block)
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

-- ALTER EXISTING TABLES

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

-- NEW TABLE: AGENT_VERIFICATIONS
-- status uses text (not the enum) so the V2 Phase 2 block can extend
-- the allowed values without requiring an ALTER TYPE mid-migration.
-- Policies, trigger, and the SLA index are all finalised in the
-- V2 Phase 2 section below; only the table + basic grants are created here.
CREATE TABLE IF NOT EXISTS public.agent_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',  -- pending|under_review|approved|rejected
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  notes text,
  documents jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_verifications_agent ON public.agent_verifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_verifications_status ON public.agent_verifications(status);
GRANT SELECT, INSERT, UPDATE ON public.agent_verifications TO authenticated;
GRANT ALL ON public.agent_verifications TO service_role;
ALTER TABLE public.agent_verifications ENABLE ROW LEVEL SECURITY;
-- Policies and trigger are defined in the V2 Phase 2 block below.

-- NEW TABLE: MARKETING_ASSETS
CREATE TABLE IF NOT EXISTS public.marketing_assets (
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
CREATE INDEX IF NOT EXISTS idx_marketing_assets_property ON public.marketing_assets(property_id);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_agent ON public.marketing_assets(agent_id);
GRANT SELECT ON public.marketing_assets TO anon, authenticated;
GRANT INSERT, UPDATE ON public.marketing_assets TO authenticated;
GRANT ALL ON public.marketing_assets TO service_role;
ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "MA public read" ON public.marketing_assets;
CREATE POLICY "MA public read" ON public.marketing_assets FOR SELECT USING (true);
DROP POLICY IF EXISTS "MA editors manage" ON public.marketing_assets;
CREATE POLICY "MA editors manage" ON public.marketing_assets FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
DROP TRIGGER IF EXISTS trg_marketing_assets_updated ON public.marketing_assets;
CREATE TRIGGER trg_marketing_assets_updated BEFORE UPDATE ON public.marketing_assets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- NEW TABLE: SOCIAL_VIDEOS
CREATE TABLE IF NOT EXISTS public.social_videos (
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
CREATE INDEX IF NOT EXISTS idx_social_videos_property ON public.social_videos(property_id);
CREATE INDEX IF NOT EXISTS idx_social_videos_agent ON public.social_videos(agent_id);
GRANT SELECT ON public.social_videos TO anon, authenticated;
GRANT INSERT, UPDATE ON public.social_videos TO authenticated;
GRANT ALL ON public.social_videos TO service_role;
ALTER TABLE public.social_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SV public read published" ON public.social_videos;
CREATE POLICY "SV public read published" ON public.social_videos FOR SELECT
  USING (published = true);
DROP POLICY IF EXISTS "SV staff read all" ON public.social_videos;
CREATE POLICY "SV staff read all" ON public.social_videos FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
DROP POLICY IF EXISTS "SV editors manage" ON public.social_videos;
CREATE POLICY "SV editors manage" ON public.social_videos FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
DROP TRIGGER IF EXISTS trg_social_videos_updated ON public.social_videos;
CREATE TRIGGER trg_social_videos_updated BEFORE UPDATE ON public.social_videos
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- NEW TABLE: REFERRAL_PARTNERS
CREATE TABLE IF NOT EXISTS public.referral_partners (
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
CREATE INDEX IF NOT EXISTS idx_referral_partners_agency ON public.referral_partners(agency_id);
GRANT SELECT ON public.referral_partners TO anon, authenticated;
GRANT INSERT, UPDATE ON public.referral_partners TO authenticated;
GRANT ALL ON public.referral_partners TO service_role;
ALTER TABLE public.referral_partners ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "RP public read active" ON public.referral_partners;
CREATE POLICY "RP public read active" ON public.referral_partners FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "RP editors manage" ON public.referral_partners;
CREATE POLICY "RP editors manage" ON public.referral_partners FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
DROP TRIGGER IF EXISTS trg_referral_partners_updated ON public.referral_partners;
CREATE TRIGGER trg_referral_partners_updated BEFORE UPDATE ON public.referral_partners
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- NEW TABLE: SUBSCRIPTIONS (SaaS)
CREATE TABLE IF NOT EXISTS public.subscriptions (
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
CREATE INDEX IF NOT EXISTS idx_subscriptions_agency ON public.subscriptions(agency_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Sub staff read" ON public.subscriptions;
CREATE POLICY "Sub staff read" ON public.subscriptions FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
DROP POLICY IF EXISTS "Sub admins manage" ON public.subscriptions;
CREATE POLICY "Sub admins manage" ON public.subscriptions FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
DROP TRIGGER IF EXISTS trg_subscriptions_updated ON public.subscriptions;
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- V2 SHORT LINKS & QR LEADS (from 20260701000000_v2_short_links_qr_leads.sql)
-- ============================================================

-- ENUMS (idempotent)
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

-- PROPERTIES: V2 fee transparency + commission + dedup + video
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

-- AGENTS: V2 onboarding extras
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
DROP FUNCTION IF EXISTS public.touch_agent_listing_count() CASCADE;
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
    IF (OLD.publish_status IS NULL AND NEW.publish_status IS NOT NULL) OR
       (OLD.publish_status IS NOT NULL AND NEW.publish_status IS NULL) OR
       (OLD.publish_status IS NOT NULL AND NEW.publish_status IS NOT NULL AND OLD.publish_status <> NEW.publish_status) THEN
      IF OLD.publish_status = 'published' AND (NEW.publish_status IS NULL OR NEW.publish_status <> 'published') AND NEW.agent_id IS NOT NULL THEN
        UPDATE public.agents
          SET published_listing_count = GREATEST(0, published_listing_count - 1)
          WHERE id = NEW.agent_id;
      ELSIF NEW.publish_status = 'published' AND (OLD.publish_status IS NULL OR OLD.publish_status <> 'published') AND NEW.agent_id IS NOT NULL THEN
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

-- AGENT_DOCUMENTS — ID, selfie, profile photo
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

-- AGENT_SOCIAL_ACCOUNTS — normalised
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

-- AGENT_AREAS — text-only hierarchy (no GPS)
CREATE TABLE IF NOT EXISTS public.agent_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,
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

-- SHORT_LINKS — /p/{code} → canonical URL
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

-- PROPERTY_QR_CODES — generated PNGs per property
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

-- LEAD_SOURCES — extended lead attribution
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

-- RLS: drop commission fields from anonymous reads of properties
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='properties'
               AND column_name='commission_kes') THEN
    EXECUTE 'REVOKE SELECT (commission_kes, commission_notes) ON public.properties FROM anon';
  END IF;
END
$$;

-- Update RLS: anonymous can only read published properties
DROP POLICY IF EXISTS "Properties public read" ON public.properties;
CREATE POLICY "Properties public read" ON public.properties
  FOR SELECT TO anon
  USING (publish_status = 'published');

-- Indexes on hot paths
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

-- ============================================================
-- V2 PHASE 2 EXTRAS (from 20260715000000_v2_phase2_extras.sql)
-- ============================================================

-- ENUM extension: add 'negotiation' to lead_status
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

-- Agents: languages + years_experience
ALTER TABLE public.agents
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS years_experience int;

-- Agent role: add 'property_owner' to app_role enum
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

-- Per-IP click dedup on short_links
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
  created_at timestamptz NOT NULL DEFAULT now(),
  created_date date GENERATED ALWAYS AS ((created_at AT TIME ZONE 'UTC')::date) STORED
);
-- Uniqueness per (link, ip_hash, day) prevents double counting.
CREATE UNIQUE INDEX IF NOT EXISTS uq_short_link_clicks_per_day
  ON public.short_link_clicks(short_link_id, ip_hash, created_date);
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
  ON CONFLICT (short_link_id, ip_hash, created_date) DO NOTHING
  RETURNING true INTO v_inserted;

  IF v_inserted THEN
    UPDATE public.short_links
      SET click_count = click_count + 1
      WHERE id = p_short_link_id;
  END IF;

  RETURN COALESCE(v_inserted, false);
END;$$;
GRANT EXECUTE ON FUNCTION public.record_short_link_click(uuid, text, text, text, text, text, text, text) TO anon, authenticated;

-- Project / Development separate entities
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

DROP POLICY IF EXISTS "PJ staff manage" ON public.projects;
CREATE POLICY "PJ staff manage" ON public.projects FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

DROP TRIGGER IF EXISTS trg_projects_updated ON public.projects;
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Link properties to projects (a unit belongs to a project)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_properties_project ON public.properties(project_id);

-- Image hash dedup (per-agent)
ALTER TABLE public.property_images
  ADD COLUMN IF NOT EXISTS image_hash text,
  ADD COLUMN IF NOT EXISTS image_width int,
  ADD COLUMN IF NOT EXISTS image_height int,
  ADD COLUMN IF NOT EXISTS image_bytes bigint;
CREATE INDEX IF NOT EXISTS idx_property_images_hash ON public.property_images(image_hash);

-- Agent verification state machine: V2 additions
-- Table already created in the V2 foundation block above.
-- Add SLA index, finalise all policies, and attach the updated_at trigger.
CREATE INDEX IF NOT EXISTS idx_agent_verifications_sla ON public.agent_verifications(submitted_at)
  WHERE status = 'under_review';

DROP POLICY IF EXISTS "AV staff read" ON public.agent_verifications;
CREATE POLICY "AV staff read" ON public.agent_verifications FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

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

-- updated_at trigger (was missing from the original V2 Phase 2 block)
DROP TRIGGER IF EXISTS trg_agent_verifications_updated ON public.agent_verifications;
CREATE TRIGGER trg_agent_verifications_updated BEFORE UPDATE ON public.agent_verifications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

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
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

DROP POLICY IF EXISTS "AVS self read" ON public.agent_verification_steps;
CREATE POLICY "AVS self read" ON public.agent_verification_steps FOR SELECT TO authenticated
  USING (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "AVS self insert" ON public.agent_verification_steps;
CREATE POLICY "AVS self insert" ON public.agent_verification_steps FOR INSERT TO authenticated
  WITH CHECK (agent_id IN (SELECT id FROM public.agents WHERE user_id = auth.uid()));

-- Property validation: publish guard already defined and up-to-date (min 5 images)
-- above — trigger is recreated here to ensure it survives the V2 Phase 2 block.
DROP TRIGGER IF EXISTS trg_property_publish_guard ON public.properties;
CREATE TRIGGER trg_property_publish_guard
  BEFORE INSERT OR UPDATE OF publish_status ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.enforce_property_min_images();

-- ============================================================
-- V2 SPEC COMPLETION (from 20260716000000_v2_spec_completion.sql)
-- ============================================================

-- ENUMS (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'furnished_status') THEN
    CREATE TYPE public.furnished_status AS ENUM ('unfurnished', 'semi-furnished', 'fully-furnished');
  END IF;
END
$$;

-- PROPERTIES: Missing Spec Fields
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS available_from date,
  ADD COLUMN IF NOT EXISTS furnished_status furnished_status NOT NULL DEFAULT 'unfurnished',
  ADD COLUMN IF NOT EXISTS lease_period text,
  ADD COLUMN IF NOT EXISTS deposit_amount_kes numeric(12,2),
  ADD COLUMN IF NOT EXISTS utilities_info text,
  ADD COLUMN IF NOT EXISTS marketing_score int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS marketing_checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_captions text,
  ADD COLUMN IF NOT EXISTS suggested_hashtags text[] NOT NULL DEFAULT '{}'::text[];

-- Update public view to include new fields (excluding internal marketing ones)
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
  p.virtual_tour_url, p.floor_plan_url,
  -- V2 Spec additions
  p.available_from, p.furnished_status, p.lease_period, p.deposit_amount_kes, p.utilities_info
FROM public.properties p
WHERE p.publish_status = 'published';

-- Create public_agent_view after all ALTER TABLE operations
CREATE OR REPLACE VIEW public.public_agent_view AS
SELECT
  a.id, a.slug, a.full_name, a.photo, a.bio, a.team_name, a.specializations,
  a.email, a.phone, a.whatsapp, a.license_number, a.verification_status,
  a.verification_level, a.public_badge, a.active, a.display_order,
  a.socials
FROM public.agents a
WHERE a.active = true
  AND a.verification_status = 'verified';

-- Create owner_inquiries_view after all ALTER TABLE operations
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
-- PART 3: Recruitment & Lead Management (Agent Onboarding V2)
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