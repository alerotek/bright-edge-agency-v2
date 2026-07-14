-- ============================================================
-- BRIGHT EDGE MARKETPLACE — COMPLETE SCHEMA
-- ============================================================
-- Single migration combining V2 schema + OTP + Missing Tables + Marketplace
-- Safe to run multiple times (all statements use IF NOT EXISTS / OR REPLACE)
-- Preserves ALL existing data
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2. ALL ENUMS (idempotent — safe to rerun)
-- ============================================================
DO $$ BEGIN
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
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_verification_status') THEN
    CREATE TYPE public.agent_verification_status AS ENUM ('pending','under_review','verified','rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'video_provider') THEN
    CREATE TYPE public.video_provider AS ENUM ('youtube','tiktok','vimeo','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_validation_status') THEN
    CREATE TYPE public.listing_validation_status AS ENUM ('draft','pending_verification','active','needs_review','archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'social_platform') THEN
    CREATE TYPE public.social_platform AS ENUM ('facebook','instagram','twitter','linkedin','youtube','tiktok','website','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'agent_document_kind') THEN
    CREATE TYPE public.agent_document_kind AS ENUM ('national_id_front','national_id_back','selfie','profile_photo','business_license','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'short_link_target_type') THEN
    CREATE TYPE public.short_link_target_type AS ENUM ('property','agent','listing','review','blog','landing','other');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rental_fee_timing') THEN
    CREATE TYPE public.rental_fee_timing AS ENUM ('before_viewing','after_viewing','on_agreement','on_move_in','on_first_month');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_owner_type') THEN
    CREATE TYPE public.listing_owner_type AS ENUM ('bright_edge','independent_agent','home_owner','developer','property_management');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'representation_type') THEN
    CREATE TYPE public.representation_type AS ENUM ('bright_edge_exclusive','owner_direct','third_party_agency','independent_agent');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'kyc_document_type') THEN
    CREATE TYPE public.kyc_document_type AS ENUM ('national_id','passport','business_registration','proof_of_ownership','license','utility_bill','profile_photo');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'listing_limit_period') THEN
    CREATE TYPE public.listing_limit_period AS ENUM ('monthly','yearly');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE public.subscription_status AS ENUM ('active','cancelled','expired','trialing');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_provider') THEN
    CREATE TYPE public.payment_provider AS ENUM ('none','stripe','mpesa','paypal');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
    CREATE TYPE public.transaction_status AS ENUM ('pending','completed','failed','refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_status') THEN
    CREATE TYPE public.property_status AS ENUM ('draft','pending_review','published','featured','sold','rented','archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status') THEN
    CREATE TYPE public.verification_status AS ENUM ('pending','verified','rejected');
  END IF;
END $$;

-- ============================================================
-- 3. UTILITY FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;$$;

CREATE OR REPLACE FUNCTION public.slugify(input text)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(both '-' from regexp_replace(lower(coalesce(input,'')), '[^a-z0-9]+', '-', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = ANY(_roles));
$$;

-- ============================================================
-- 4. PROFILES (one row per auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

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
  INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 5. USER ROLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

DO $$ BEGIN
  ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP POLICY IF EXISTS "Users see own roles" ON public.user_roles;
CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- ============================================================
-- 6. LOCATIONS
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

DO $$ BEGIN
  ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

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
-- 7. LOOKUP TABLES (categories, types, statuses, amenities, blog)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text
);
DO $$ BEGIN ALTER TABLE public.property_categories ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
DO $$ BEGIN ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
DO $$ BEGIN ALTER TABLE public.property_statuses ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
DO $$ BEGIN ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "Am public read" ON public.amenities;
CREATE POLICY "Am public read" ON public.amenities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Am editors manage" ON public.amenities;
CREATE POLICY "Am editors manage" ON public.amenities FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text
);
DO $$ BEGIN ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
DO $$ BEGIN ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "BT public read" ON public.blog_tags;
CREATE POLICY "BT public read" ON public.blog_tags FOR SELECT USING (true);
DROP POLICY IF EXISTS "BT editors manage" ON public.blog_tags;
CREATE POLICY "BT editors manage" ON public.blog_tags FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- 8. AGENTS (extended for marketplace)
-- ============================================================
-- Base table (if not exists from V1 migration)
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

-- V2 fields (may already exist from V2 migration)
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS verification_status agent_verification_status NOT NULL DEFAULT 'pending';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS license_number text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS license_expiry date;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS kyc_document_url text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS background_check_status text NOT NULL DEFAULT 'not_started';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS commission_rate numeric(5,2) NOT NULL DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS team_name text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS specializations text[];
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS phone_verified_at timestamptz;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS verification_level text NOT NULL DEFAULT 'basic';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS public_badge boolean NOT NULL DEFAULT false;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS areas_of_operation jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS social_accounts jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS published_listing_count int NOT NULL DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS reviewed_listing_count int NOT NULL DEFAULT 0;

-- Marketplace fields (may not exist yet)
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS agent_type listing_owner_type NOT NULL DEFAULT 'independent_agent';
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS agency_name text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS agency_registration text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS business_registration text;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS deals_closed int DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS response_rate numeric(5,2) DEFAULT 100.00;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS average_response_time_minutes int DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS overall_rating numeric(3,2) DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS total_reviews int DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS years_experience int DEFAULT 0;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_agents_verification_status ON public.agents(verification_status);
CREATE INDEX IF NOT EXISTS idx_agents_onboarding_completed ON public.agents(onboarding_completed);

DO $$ BEGIN
  ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP POLICY IF EXISTS "Agents public read active" ON public.agents;
CREATE POLICY "Agents public read active" ON public.agents FOR SELECT USING (true);
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
-- 9. PROPERTIES (core + V2 + marketplace)
-- ============================================================
-- Base table (if not exists from V1 migration)
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
  price_period text,
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

-- V2 fields (may already exist from V2 migration)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS validation_status listing_validation_status NOT NULL DEFAULT 'pending_verification';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS listing_expires_at timestamptz;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS auto_renew boolean NOT NULL DEFAULT true;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS syndicated boolean NOT NULL DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS promoted_until timestamptz;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS virtual_tour_url text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS floor_plan_url text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS house_hunting_fee_kes numeric(12,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS viewing_fee_kes numeric(12,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS fees_refundable boolean NOT NULL DEFAULT false;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS fee_payment_timing rental_fee_timing;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS commission_kes numeric(12,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS commission_notes text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS video_provider text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS fingerprint_hash text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS county text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS town text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS neighbourhood text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS landmark text;

-- Marketplace fields (may not exist yet)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS listing_owner_type listing_owner_type NOT NULL DEFAULT 'bright_edge';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS listing_owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS representation_type representation_type NOT NULL DEFAULT 'bright_edge_exclusive';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS represented_entity_name text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS represented_entity_id uuid;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS listed_by_name text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS listing_phone text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS listing_whatsapp text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS agency_commission_kes numeric(12,2) DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS booking_fee_kes numeric(12,2) DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS security_deposit_kes numeric(12,2) DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS service_charge_kes numeric(12,2) DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS fees_negotiable boolean DEFAULT true;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_category text NOT NULL DEFAULT 'sales';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rental_category text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS short_stay_category text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS land_size numeric(12,2);
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS land_size_unit text DEFAULT 'acres';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS energy_rating text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS parking_spaces int DEFAULT 0;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS property_status property_status NOT NULL DEFAULT 'published';
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS marketing_score int DEFAULT 0;

-- Add CHECK constraints (PostgreSQL doesnt support IF NOT EXISTS, use DO block)
DO $$ BEGIN
  ALTER TABLE public.properties ADD CONSTRAINT properties_category_check
    CHECK (property_category IN ('sales','rentals','short_stay'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.properties ADD CONSTRAINT properties_rental_check
    CHECK (rental_category IS NULL OR rental_category IN ('furnished','unfurnished'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE public.properties ADD CONSTRAINT properties_short_stay_check
    CHECK (short_stay_category IS NULL OR short_stay_category IN ('airbnb','holiday_home','serviced_apartment'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_properties_publish_status ON public.properties(publish_status);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(location_id);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(property_type_id);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_validation_status ON public.properties(validation_status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_expires_at ON public.properties(listing_expires_at);
CREATE INDEX IF NOT EXISTS idx_properties_fingerprint ON public.properties(fingerprint_hash);
CREATE INDEX IF NOT EXISTS idx_properties_video_url ON public.properties(video_url);
CREATE INDEX IF NOT EXISTS idx_properties_published_created ON public.properties(publish_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_published_validation ON public.properties(publish_status, validation_status);
CREATE INDEX IF NOT EXISTS idx_properties_owner_type ON public.properties(listing_owner_type);
CREATE INDEX IF NOT EXISTS idx_properties_representation ON public.properties(representation_type);
CREATE INDEX IF NOT EXISTS idx_properties_category ON public.properties(property_category);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(property_status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_owner ON public.properties(listing_owner_id);

DO $$ BEGIN
  ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

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

-- Publish guard: ensures min 5 images before publishing
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
-- 10. PROPERTY IMAGES / DOCS / VIDEOS / AMENITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  image_order int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  image_hash text,
  image_width int,
  image_height int,
  image_bytes int,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_property_images_property ON public.property_images(property_id, image_order);
DO $$ BEGIN ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
DO $$ BEGIN ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
DO $$ BEGIN ALTER TABLE public.property_videos ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
DO $$ BEGIN ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "PA public read" ON public.property_amenities;
CREATE POLICY "PA public read" ON public.property_amenities FOR SELECT USING (true);
DROP POLICY IF EXISTS "PA editors manage" ON public.property_amenities;
CREATE POLICY "PA editors manage" ON public.property_amenities FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- 11. INQUIRIES (CRM) + LEAD ACTIVITIES + CONTACT REQUESTS
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
  referred_by_agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  inquiry_type text,
  preferred_viewing_date text,
  preferred_viewing_time text,
  budget_kes numeric(12,2),
  whatsapp_notified_at timestamptz,
  lead_source_channel text CHECK (lead_source_channel IN ('website','whatsapp','facebook','instagram','google','referral','direct','api','other')),
  referrer_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON public.inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_referred_agent ON public.inquiries(referred_by_agent_id);

DO $$ BEGIN
  ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

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
  activity_type text NOT NULL,
  from_status lead_status,
  to_status lead_status,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lead_activities_inquiry ON public.lead_activities(inquiry_id, created_at DESC);
DO $$ BEGIN ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
DO $$ BEGIN ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
-- 12. BLOG POSTS + COMMENTS
-- ============================================================
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
  gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
DO $$ BEGIN ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
DO $$ BEGIN ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
DO $$ BEGIN ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "Comments public read approved" ON public.comments;
CREATE POLICY "Comments public read approved" ON public.comments FOR SELECT USING (approved = true);
DROP POLICY IF EXISTS "Comments anyone create" ON public.comments;
CREATE POLICY "Comments anyone create" ON public.comments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Comments staff manage" ON public.comments;
CREATE POLICY "Comments staff manage" ON public.comments FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- 13. PROPERTY REVIEWS + MARKETPLACE REVIEWS
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
  gallery_images jsonb NOT NULL DEFAULT '[]'::jsonb,
  published_at timestamptz,
  pros text,
  cons text,
  summary text,
  author_email text,
  viewing_experience numeric(3,2),
  communication_rating numeric(3,2),
  professionalism_rating numeric(3,2),
  listing_accuracy_rating numeric(3,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.property_reviews(status);
DO $$ BEGIN ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "PR public read published" ON public.property_reviews;
CREATE POLICY "PR public read published" ON public.property_reviews FOR SELECT USING (status = 'published');
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

CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('agent','home_owner','property')),
  entity_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  review_text text,
  pros text,
  cons text,
  is_verified boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_entity ON public.marketplace_reviews(entity_type, entity_id);
DO $$ BEGIN ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "MR public read" ON public.marketplace_reviews;
CREATE POLICY "MR public read" ON public.marketplace_reviews FOR SELECT USING (true);
DROP POLICY IF EXISTS "MR users create" ON public.marketplace_reviews;
CREATE POLICY "MR users create" ON public.marketplace_reviews FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- ============================================================
-- 14. TESTIMONIALS, NEWSLETTER, SAVED, FEATURED, ACTIVITY, SETTINGS
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
DO $$ BEGIN ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
DO $$ BEGIN ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "NS anyone subscribe" ON public.newsletter_subscribers;
CREATE POLICY "NS anyone subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "NS staff read" ON public.newsletter_subscribers;
CREATE POLICY "NS staff read" ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE IF NOT EXISTS public.saved_properties (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);
DO $$ BEGIN ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "Saved own" ON public.saved_properties;
CREATE POLICY "Saved own" ON public.saved_properties FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.featured_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN ALTER TABLE public.featured_properties ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
DO $$ BEGIN ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
  max_agents_per_agency int NOT NULL DEFAULT 10,
  max_listings_per_agent int NOT NULL DEFAULT 50,
  commission_enabled boolean NOT NULL DEFAULT false,
  stripe_connect_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_singleton CHECK (id = 1)
);
DO $$ BEGIN ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
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
-- 15. NEW V2 TABLES (agent_verifications, marketing, social, referral)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
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
DO $$ BEGIN ALTER TABLE public.agent_verifications ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;

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
DO $$ BEGIN ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "MA public read" ON public.marketing_assets;
CREATE POLICY "MA public read" ON public.marketing_assets FOR SELECT USING (true);
DROP POLICY IF EXISTS "MA editors manage" ON public.marketing_assets;
CREATE POLICY "MA editors manage" ON public.marketing_assets FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
DROP TRIGGER IF EXISTS trg_marketing_assets_updated ON public.marketing_assets;
CREATE TRIGGER trg_marketing_assets_updated BEFORE UPDATE ON public.marketing_assets
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

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
DO $$ BEGIN ALTER TABLE public.social_videos ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "SV public read published" ON public.social_videos;
CREATE POLICY "SV public read published" ON public.social_videos FOR SELECT USING (published = true);
DROP POLICY IF EXISTS "SV editors manage" ON public.social_videos;
CREATE POLICY "SV editors manage" ON public.social_videos FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
DROP TRIGGER IF EXISTS trg_social_videos_updated ON public.social_videos;
CREATE TRIGGER trg_social_videos_updated BEFORE UPDATE ON public.social_videos
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

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
DO $$ BEGIN ALTER TABLE public.referral_partners ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "RP editors manage" ON public.referral_partners;
CREATE POLICY "RP editors manage" ON public.referral_partners FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- 16. OTP CODES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code_hash text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('onboarding','password_reset','email_verification')),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_purpose ON public.otp_codes(email, purpose);
CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON public.otp_codes(expires_at);

-- ============================================================
-- 17. MARKETPLACE TABLES
-- ============================================================

-- Home Owners
CREATE TABLE IF NOT EXISTS public.home_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  email text,
  phone text,
  photo text,
  bio text,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  national_id_number text,
  phone_verified_at timestamptz,
  email_verified_at timestamptz,
  overall_rating numeric(3,2) DEFAULT 0,
  total_reviews int DEFAULT 0,
  response_rate numeric(5,2) DEFAULT 100.00,
  properties_listed int DEFAULT 0,
  deals_closed int DEFAULT 0,
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_home_owners_user ON public.home_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_home_owners_verification ON public.home_owners(verification_status);
DO $$ BEGIN ALTER TABLE public.home_owners ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "HO public read" ON public.home_owners;
CREATE POLICY "HO public read" ON public.home_owners FOR SELECT
  USING (verification_status = 'verified' OR auth.uid() = user_id);
DROP POLICY IF EXISTS "HO users insert" ON public.home_owners;
CREATE POLICY "HO users insert" ON public.home_owners FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "HO users update" ON public.home_owners;
CREATE POLICY "HO users update" ON public.home_owners FOR UPDATE USING (auth.uid() = user_id);

-- KYC Documents
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type kyc_document_type NOT NULL,
  document_url text NOT NULL,
  storage_path text,
  document_number text,
  verified_at timestamptz,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_user ON public.kyc_documents(user_id);
DO $$ BEGIN ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "KYC users read own" ON public.kyc_documents;
CREATE POLICY "KYC users read own" ON public.kyc_documents FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin')));
DROP POLICY IF EXISTS "KYC users insert" ON public.kyc_documents;
CREATE POLICY "KYC users insert" ON public.kyc_documents FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Listing Limits
CREATE TABLE IF NOT EXISTS public.listing_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type listing_owner_type NOT NULL,
  max_listings int NOT NULL DEFAULT 5,
  period listing_limit_period NOT NULL DEFAULT 'monthly',
  overage_allowed boolean DEFAULT false,
  overage_fee_kes numeric(12,2) DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN ALTER TABLE public.listing_limits ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "LL public read" ON public.listing_limits;
CREATE POLICY "LL public read" ON public.listing_limits FOR SELECT USING (true);

INSERT INTO public.listing_limits (owner_type, max_listings, period) VALUES
  ('bright_edge', 999999, 'monthly'),
  ('independent_agent', 5, 'monthly'),
  ('home_owner', 2, 'monthly'),
  ('developer', 20, 'monthly'),
  ('property_management', 50, 'monthly')
ON CONFLICT DO NOTHING;

-- Listing Usage
CREATE TABLE IF NOT EXISTS public.listing_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_type listing_owner_type NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  listings_used int NOT NULL DEFAULT 0,
  listings_limit int NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, owner_type, period_start)
);
DO $$ BEGIN ALTER TABLE public.listing_usage ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "LU users read own" ON public.listing_usage;
CREATE POLICY "LU users read own" ON public.listing_usage FOR SELECT USING (auth.uid() = user_id);

-- Subscription Plans
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price_kes numeric(12,2) NOT NULL DEFAULT 0,
  billing_period listing_limit_period NOT NULL DEFAULT 'monthly',
  listings_per_period int NOT NULL DEFAULT 5,
  features jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "SP public read active" ON public.subscription_plans;
CREATE POLICY "SP public read active" ON public.subscription_plans FOR SELECT
  USING (is_active = true OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin')));

INSERT INTO public.subscription_plans (name, slug, description, price_kes, listings_per_period, features, sort_order) VALUES
  ('Free Agent', 'free-agent', 'For independent agents starting out', 0, 5, '["5 listings/month","Basic agent profile","Email support"]'::jsonb, 1),
  ('Pro Agent', 'pro-agent', 'For professional agents', 1500, 25, '["25 listings/month","Verified badge","Priority support","Analytics"]'::jsonb, 2),
  ('Agency', 'agency', 'For agencies and teams', 5000, 100, '["100 listings/month","Agency profile","Team management","Advanced analytics","API access"]'::jsonb, 3),
  ('Enterprise', 'enterprise', 'For large agencies', 15000, 500, '["500 listings/month","Whitelabel","Dedicated support","Multi-branch"]'::jsonb, 4),
  ('Home Owner Basic', 'home-owner-basic', 'List your own property', 0, 2, '["2 listings/month","Owner profile","Direct inquiries"]'::jsonb, 5)
ON CONFLICT (slug) DO NOTHING;

-- Subscriptions
-- V2 migration already creates a subscriptions table (different schema).
-- Create marketplace subscriptions as a separate table to avoid conflicts.
CREATE TABLE IF NOT EXISTS public.marketplace_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.subscription_plans(id),
  status subscription_status NOT NULL DEFAULT 'trialing',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL DEFAULT now() + interval '30 days',
  trial_end_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_marketplace_subscriptions_user ON public.marketplace_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_subscriptions_plan ON public.marketplace_subscriptions(plan_id);
DO $$ BEGIN ALTER TABLE public.marketplace_subscriptions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "MS users read own" ON public.marketplace_subscriptions;
CREATE POLICY "MS users read own" ON public.marketplace_subscriptions FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "MS users manage" ON public.marketplace_subscriptions;
CREATE POLICY "MS users manage" ON public.marketplace_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  amount_kes numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'KES',
  provider payment_provider NOT NULL DEFAULT 'none',
  provider_transaction_id text,
  status transaction_status NOT NULL DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "Pay users read own" ON public.payments;
CREATE POLICY "Pay users read own" ON public.payments FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('charge','refund','payout','fee')),
  amount_kes numeric(12,2) NOT NULL,
  provider payment_provider NOT NULL DEFAULT 'none',
  provider_reference text,
  status transaction_status NOT NULL DEFAULT 'pending',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "PTx users read own" ON public.payment_transactions;
CREATE POLICY "PTx users read own" ON public.payment_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.payments WHERE id = payment_id AND user_id = auth.uid()));

-- Reputation Scores
CREATE TABLE IF NOT EXISTS public.reputation_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('agent','home_owner','property')),
  entity_id uuid NOT NULL,
  overall_score numeric(3,2) DEFAULT 0,
  viewing_experience numeric(3,2) DEFAULT 0,
  communication numeric(3,2) DEFAULT 0,
  professionalism numeric(3,2) DEFAULT 0,
  listing_accuracy numeric(3,2) DEFAULT 0,
  total_reviews int DEFAULT 0,
  response_rate numeric(5,2) DEFAULT 100.00,
  deals_closed int DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id)
);
CREATE INDEX IF NOT EXISTS idx_reputation_entity ON public.reputation_scores(entity_type, entity_id);
DO $$ BEGIN ALTER TABLE public.reputation_scores ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "Rep public read" ON public.reputation_scores;
CREATE POLICY "Rep public read" ON public.reputation_scores FOR SELECT USING (true);

-- Analytics
CREATE TABLE IF NOT EXISTS public.listing_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  views int DEFAULT 0,
  unique_views int DEFAULT 0,
  contacts int DEFAULT 0,
  shares int DEFAULT 0,
  saves int DEFAULT 0,
  conversions int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (property_id, date)
);
CREATE INDEX IF NOT EXISTS idx_listing_analytics_property ON public.listing_analytics(property_id, date);
DO $$ BEGIN ALTER TABLE public.listing_analytics ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "LA public read" ON public.listing_analytics;
CREATE POLICY "LA public read" ON public.listing_analytics FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.search_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query text NOT NULL,
  results_count int DEFAULT 0,
  filters jsonb DEFAULT '{}'::jsonb,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ BEGIN ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "SA public read" ON public.search_analytics;
CREATE POLICY "SA public read" ON public.search_analytics FOR SELECT USING (true);

-- Media Library
CREATE TABLE IF NOT EXISTS public.media_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_type text NOT NULL CHECK (file_type IN ('image','video','document','brand_asset')),
  file_url text NOT NULL,
  thumbnail_url text,
  storage_path text,
  file_name text,
  file_size int,
  mime_type text,
  alt_text text,
  width int,
  height int,
  assigned_to_type text CHECK (assigned_to_type IN ('property','blog','review','agent','owner','general')),
  assigned_to_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_assignments ON public.media_library(assigned_to_type, assigned_to_id);
DO $$ BEGIN ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY; EXCEPTION WHEN OTHERS THEN NULL; END $$;
DROP POLICY IF EXISTS "ML users read own" ON public.media_library;
CREATE POLICY "ML users read own" ON public.media_library FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('super_admin','admin')));
DROP POLICY IF EXISTS "ML users insert" ON public.media_library;
CREATE POLICY "ML users insert" ON public.media_library FOR INSERT WITH CHECK (auth.uid() = user_id);

-- V2 Missing Tables
CREATE TABLE IF NOT EXISTS public.agent_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  national_id_number text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','needs_review')),
  admin_notes text,
  years_experience int,
  specializations text[],
  languages text[],
  areas_of_operation text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('national_id_front','national_id_back','selfie','profile_photo','professional_certificate','other')),
  storage_path text NOT NULL,
  public_url text NOT NULL,
  mime_type text NOT NULL DEFAULT 'image/jpeg',
  byte_size int DEFAULT 0,
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.agent_social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('linkedin','instagram','facebook','twitter','tiktok','youtube','whatsapp')),
  handle text NOT NULL DEFAULT '',
  url text NOT NULL,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, platform)
);

CREATE TABLE IF NOT EXISTS public.agent_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  country text NOT NULL DEFAULT 'Kenya',
  county text,
  town text,
  neighbourhood text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.short_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  target_type text NOT NULL CHECK (target_type IN ('property','agent','review','blog','custom')),
  target_id uuid,
  target_path text,
  long_url text NOT NULL,
  click_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.property_qr_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  short_link_id uuid REFERENCES public.short_links(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  format text NOT NULL DEFAULT 'png',
  byte_size int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  channel text NOT NULL CHECK (channel IN ('website','short_link','qr_code','social','email','referral','whatsapp','other')),
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  developer text,
  country text NOT NULL DEFAULT 'Kenya',
  county text,
  town text,
  neighbourhood text,
  description text,
  hero_image text,
  launch_date date,
  completion_date date,
  status text NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','under_construction','completed','launched')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'project_id') THEN
    ALTER TABLE public.properties ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 18. FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update agent published listing count
CREATE OR REPLACE FUNCTION public.touch_agent_listing_count()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.publish_status = 'published' AND NEW.agent_id IS NOT NULL THEN
      UPDATE public.agents SET published_listing_count = published_listing_count + 1 WHERE id = NEW.agent_id;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.publish_status IS DISTINCT FROM OLD.publish_status THEN
      IF OLD.publish_status = 'published' AND NEW.publish_status IS NOT NULL AND NEW.publish_status <> 'published' AND NEW.agent_id IS NOT NULL THEN
        UPDATE public.agents SET published_listing_count = GREATEST(0, published_listing_count - 1) WHERE id = NEW.agent_id;
      ELSIF NEW.publish_status = 'published' AND (OLD.publish_status IS NULL OR OLD.publish_status <> 'published') AND NEW.agent_id IS NOT NULL THEN
        UPDATE public.agents SET published_listing_count = published_listing_count + 1 WHERE id = NEW.agent_id;
      END IF;
    END IF;
    IF NEW.agent_id IS DISTINCT FROM OLD.agent_id THEN
      IF OLD.agent_id IS NOT NULL THEN
        UPDATE public.agents SET published_listing_count = GREATEST(0, published_listing_count - 1) WHERE id = OLD.agent_id;
      END IF;
      IF NEW.agent_id IS NOT NULL AND NEW.publish_status = 'published' THEN
        UPDATE public.agents SET published_listing_count = published_listing_count + 1 WHERE id = NEW.agent_id;
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.publish_status = 'published' AND OLD.agent_id IS NOT NULL THEN
      UPDATE public.agents SET published_listing_count = GREATEST(0, published_listing_count - 1) WHERE id = OLD.agent_id;
    END IF;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;$$;
DROP TRIGGER IF EXISTS trg_agent_listing_count ON public.properties;
CREATE TRIGGER trg_agent_listing_count AFTER INSERT OR UPDATE OR DELETE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.touch_agent_listing_count();

-- Check listing limit
CREATE OR REPLACE FUNCTION public.check_listing_limit(p_user_id uuid, p_owner_type listing_owner_type)
RETURNS TABLE(can_publish boolean, listings_used int, listings_limit int, message text)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_period_start date; v_limit int; v_used int;
BEGIN
  v_period_start := date_trunc('month', CURRENT_DATE)::date;
  SELECT max_listings INTO v_limit FROM public.listing_limits WHERE owner_type = p_owner_type;
  IF NOT FOUND THEN v_limit := 5; END IF;
  SELECT listings_used INTO v_used FROM public.listing_usage
    WHERE user_id = p_user_id AND owner_type = p_owner_type AND period_start = v_period_start;
  IF NOT FOUND THEN v_used := 0; END IF;
  RETURN QUERY SELECT (v_used < v_limit), v_used, v_limit,
    CASE WHEN v_used >= v_limit THEN 'You have reached your free listing limit.' ELSE 'OK' END;
END;$$;

-- Increment listing usage
CREATE OR REPLACE FUNCTION public.increment_listing_usage(p_user_id uuid, p_owner_type listing_owner_type)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_start date; v_end date; v_limit int;
BEGIN
  v_start := date_trunc('month', CURRENT_DATE)::date;
  v_end := (date_trunc('month', CURRENT_DATE) + interval '1 month - 1 day')::date;
  SELECT max_listings INTO v_limit FROM public.listing_limits WHERE owner_type = p_owner_type;
  IF NOT FOUND THEN v_limit := 5; END IF;
  INSERT INTO public.listing_usage (user_id, owner_type, period_start, period_end, listings_used, listings_limit)
  VALUES (p_user_id, p_owner_type, v_start, v_end, 1, v_limit)
  ON CONFLICT (user_id, owner_type, period_start)
  DO UPDATE SET listings_used = public.listing_usage.listings_used + 1, updated_at = now();
END;$$;

-- Update reputation on review
CREATE OR REPLACE FUNCTION public.update_reputation_score()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_user_id uuid;
BEGIN
  CASE NEW.entity_type
    WHEN 'property' THEN SELECT created_by INTO v_user_id FROM public.properties WHERE id = NEW.entity_id;
    WHEN 'agent' THEN SELECT user_id INTO v_user_id FROM public.agents WHERE id = NEW.entity_id;
    ELSE v_user_id := NULL;
  END CASE;
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.reputation_scores (user_id, entity_type, entity_id, overall_score, total_reviews)
    VALUES (v_user_id, NEW.entity_type, NEW.entity_id,
      (SELECT ROUND(AVG(rating), 2) FROM public.marketplace_reviews WHERE entity_type = NEW.entity_type AND entity_id = NEW.entity_id),
      (SELECT COUNT(*) FROM public.marketplace_reviews WHERE entity_type = NEW.entity_type AND entity_id = NEW.entity_id))
    ON CONFLICT (entity_type, entity_id) DO UPDATE SET
      overall_score = (SELECT ROUND(AVG(rating), 2) FROM public.marketplace_reviews WHERE entity_type = NEW.entity_type AND entity_id = NEW.entity_id),
      total_reviews = (SELECT COUNT(*) FROM public.marketplace_reviews WHERE entity_type = NEW.entity_type AND entity_id = NEW.entity_id),
      updated_at = now();
  END IF;
  RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS trg_update_reputation ON public.marketplace_reviews;
CREATE TRIGGER trg_update_reputation AFTER INSERT OR UPDATE ON public.marketplace_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_reputation_score();

-- Cleanup expired OTP codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_otp_codes()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  DELETE FROM public.otp_codes WHERE expires_at < now() - interval '24 hours';
END;$$;

-- ============================================================
-- 19. UPDATE EXISTING DATA
-- ============================================================
UPDATE public.properties SET
  listing_owner_type = 'bright_edge'::listing_owner_type,
  representation_type = 'bright_edge_exclusive'::representation_type,
  property_category = 'sales',
  property_status = CASE
    WHEN publish_status = 'published' THEN 'published'::property_status
    WHEN publish_status = 'draft' THEN 'draft'::property_status
    WHEN publish_status = 'archived' THEN 'archived'::property_status
    ELSE 'published'::property_status
  END
WHERE listing_owner_type IS NULL;

UPDATE public.agents SET
  agent_type = 'independent_agent'::listing_owner_type,
  verification_status = 'verified'::agent_verification_status
WHERE agent_type IS NULL AND verification_status = 'pending';