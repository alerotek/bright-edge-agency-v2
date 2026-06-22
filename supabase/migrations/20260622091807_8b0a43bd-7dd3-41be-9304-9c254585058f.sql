
-- ============================================================
-- BRIGHT EDGE AGENCY — Full schema, RLS, triggers
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('super_admin','admin','editor','agent','user');
CREATE TYPE public.property_listing_type AS ENUM ('sale','rent');
CREATE TYPE public.property_publish_status AS ENUM ('draft','published','archived');
CREATE TYPE public.lead_status AS ENUM ('new','contacted','qualified','viewing_scheduled','offer_made','won','lost','closed');
CREATE TYPE public.lead_source AS ENUM ('website_form','property_inquiry','contact_page','whatsapp','newsletter','referral','other');
CREATE TYPE public.blog_post_status AS ENUM ('draft','published','scheduled');
CREATE TYPE public.review_status AS ENUM ('draft','published');

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
CREATE TABLE public.profiles (
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
CREATE POLICY "Profiles readable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
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
CREATE TABLE public.user_roles (
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

CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());
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
CREATE TABLE public.locations (
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
CREATE POLICY "Locations public read" ON public.locations FOR SELECT USING (true);
CREATE POLICY "Locations editors manage" ON public.locations FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
CREATE TRIGGER trg_locations_updated BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- PROPERTY CATEGORIES / TYPES / STATUSES / AMENITIES
-- ============================================================
CREATE TABLE public.property_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text
);
GRANT SELECT ON public.property_categories TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.property_categories TO authenticated;
GRANT ALL ON public.property_categories TO service_role;
ALTER TABLE public.property_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PC public read" ON public.property_categories FOR SELECT USING (true);
CREATE POLICY "PC editors manage" ON public.property_categories FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE public.property_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE
);
GRANT SELECT ON public.property_types TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.property_types TO authenticated;
GRANT ALL ON public.property_types TO service_role;
ALTER TABLE public.property_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PT public read" ON public.property_types FOR SELECT USING (true);
CREATE POLICY "PT editors manage" ON public.property_types FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE public.property_statuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  color text
);
GRANT SELECT ON public.property_statuses TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.property_statuses TO authenticated;
GRANT ALL ON public.property_statuses TO service_role;
ALTER TABLE public.property_statuses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PS public read" ON public.property_statuses FOR SELECT USING (true);
CREATE POLICY "PS editors manage" ON public.property_statuses FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE public.amenities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text
);
GRANT SELECT ON public.amenities TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.amenities TO authenticated;
GRANT ALL ON public.amenities TO service_role;
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Am public read" ON public.amenities FOR SELECT USING (true);
CREATE POLICY "Am editors manage" ON public.amenities FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- AGENTS
-- ============================================================
CREATE TABLE public.agents (
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
CREATE POLICY "Agents public read active" ON public.agents FOR SELECT USING (active = true);
CREATE POLICY "Agents staff full read" ON public.agents FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
CREATE POLICY "Agents editors manage" ON public.agents FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
CREATE TRIGGER trg_agents_updated BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- PROPERTIES
-- ============================================================
CREATE TABLE public.properties (
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
  agent_id uuid REFERENCES public.agents(id) ON DELETE SET NULL,
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
CREATE INDEX idx_properties_publish_status ON public.properties(publish_status);
CREATE INDEX idx_properties_featured ON public.properties(featured) WHERE featured = true;
CREATE INDEX idx_properties_location ON public.properties(location_id);
CREATE INDEX idx_properties_type ON public.properties(property_type_id);
CREATE INDEX idx_properties_listing_type ON public.properties(listing_type);
GRANT SELECT ON public.properties TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.properties TO authenticated;
GRANT ALL ON public.properties TO service_role;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Properties public read published" ON public.properties
  FOR SELECT USING (publish_status = 'published');
CREATE POLICY "Properties staff read all" ON public.properties
  FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
CREATE POLICY "Properties editors manage" ON public.properties FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
CREATE TRIGGER trg_properties_updated BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- PROPERTY IMAGES / DOCS / VIDEOS
-- ============================================================
CREATE TABLE public.property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  image_order int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_property_images_property ON public.property_images(property_id, image_order);
GRANT SELECT ON public.property_images TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.property_images TO authenticated;
GRANT ALL ON public.property_images TO service_role;
ALTER TABLE public.property_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PI public read for published" ON public.property_images FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.publish_status='published'));
CREATE POLICY "PI staff read" ON public.property_images FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
CREATE POLICY "PI editors manage" ON public.property_images FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE public.property_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.property_documents TO authenticated;
GRANT ALL ON public.property_documents TO service_role;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Docs staff" ON public.property_documents FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE public.property_videos (
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
CREATE POLICY "PV public read for published" ON public.property_videos FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.publish_status='published'));
CREATE POLICY "PV editors manage" ON public.property_videos FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE public.property_amenities (
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  amenity_id uuid NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
  PRIMARY KEY (property_id, amenity_id)
);
GRANT SELECT ON public.property_amenities TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.property_amenities TO authenticated;
GRANT ALL ON public.property_amenities TO service_role;
ALTER TABLE public.property_amenities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PA public read" ON public.property_amenities FOR SELECT USING (true);
CREATE POLICY "PA editors manage" ON public.property_amenities FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- Publish guard: properties cannot be 'published' with <3 images
-- ============================================================
CREATE OR REPLACE FUNCTION public.enforce_property_min_images()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE img_count int;
BEGIN
  IF NEW.publish_status = 'published' THEN
    SELECT count(*) INTO img_count FROM public.property_images WHERE property_id = NEW.id;
    IF img_count < 3 THEN
      RAISE EXCEPTION 'Property must have at least 3 images before publishing (currently %).', img_count
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.published_at IS NULL THEN NEW.published_at := now(); END IF;
  END IF;
  RETURN NEW;
END;$$;
CREATE TRIGGER trg_property_publish_guard
  BEFORE INSERT OR UPDATE OF publish_status ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.enforce_property_min_images();

-- ============================================================
-- INQUIRIES (CRM)
-- ============================================================
CREATE TABLE public.inquiries (
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
CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_inquiries_created ON public.inquiries(created_at DESC);
GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT SELECT,UPDATE,DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Inquiries anyone can create" ON public.inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Inquiries staff read" ON public.inquiries FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
CREATE POLICY "Inquiries staff update" ON public.inquiries FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
CREATE POLICY "Inquiries admins delete" ON public.inquiries FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
CREATE TRIGGER trg_inquiries_updated BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.lead_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES public.inquiries(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type text NOT NULL, -- 'status_change','note','call','email','viewing'
  from_status lead_status,
  to_status lead_status,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lead_activities_inquiry ON public.lead_activities(inquiry_id, created_at DESC);
GRANT SELECT, INSERT ON public.lead_activities TO authenticated;
GRANT ALL ON public.lead_activities TO service_role;
ALTER TABLE public.lead_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "LA staff read" ON public.lead_activities FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
CREATE POLICY "LA staff insert" ON public.lead_activities FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

CREATE TABLE public.contact_requests (
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
CREATE POLICY "CR anyone create" ON public.contact_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "CR staff read" ON public.contact_requests FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));
CREATE POLICY "CR staff update" ON public.contact_requests FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

-- ============================================================
-- BLOG
-- ============================================================
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text
);
GRANT SELECT ON public.blog_categories TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BC public read" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "BC editors manage" ON public.blog_categories FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE public.blog_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE
);
GRANT SELECT ON public.blog_tags TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.blog_tags TO authenticated;
GRANT ALL ON public.blog_tags TO service_role;
ALTER TABLE public.blog_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BT public read" ON public.blog_tags FOR SELECT USING (true);
CREATE POLICY "BT editors manage" ON public.blog_tags FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE public.blog_posts (
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
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BP public read published" ON public.blog_posts FOR SELECT
  USING (status = 'published' AND (published_at IS NULL OR published_at <= now()));
CREATE POLICY "BP staff read all" ON public.blog_posts FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
CREATE POLICY "BP editors manage" ON public.blog_posts FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
CREATE TRIGGER trg_blog_posts_updated BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.blog_post_tags (
  post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
GRANT SELECT ON public.blog_post_tags TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.blog_post_tags TO authenticated;
GRANT ALL ON public.blog_post_tags TO service_role;
ALTER TABLE public.blog_post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "BPT public read" ON public.blog_post_tags FOR SELECT USING (true);
CREATE POLICY "BPT editors manage" ON public.blog_post_tags FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE public.comments (
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
CREATE POLICY "Comments public read approved" ON public.comments FOR SELECT USING (approved = true);
CREATE POLICY "Comments anyone create" ON public.comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Comments staff manage" ON public.comments FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

-- ============================================================
-- PROPERTY REVIEWS (dedicated content type)
-- ============================================================
CREATE TABLE public.property_reviews (
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
CREATE INDEX idx_reviews_status ON public.property_reviews(status);
GRANT SELECT ON public.property_reviews TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.property_reviews TO authenticated;
GRANT ALL ON public.property_reviews TO service_role;
ALTER TABLE public.property_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PR public read published" ON public.property_reviews FOR SELECT
  USING (status = 'published');
CREATE POLICY "PR staff read all" ON public.property_reviews FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
CREATE POLICY "PR editors manage" ON public.property_reviews FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
CREATE TRIGGER trg_reviews_updated BEFORE UPDATE ON public.property_reviews
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============================================================
-- TESTIMONIALS, NEWSLETTER, SAVED, FEATURED, ACTIVITY, SETTINGS
-- ============================================================
CREATE TABLE public.testimonials (
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
CREATE POLICY "T public read published" ON public.testimonials FOR SELECT USING (published = true);
CREATE POLICY "T editors manage" ON public.testimonials FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE public.newsletter_subscribers (
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
CREATE POLICY "NS anyone subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "NS staff read" ON public.newsletter_subscribers FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));
CREATE POLICY "NS admins manage" ON public.newsletter_subscribers FOR UPDATE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
CREATE POLICY "NS admins delete" ON public.newsletter_subscribers FOR DELETE TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));

CREATE TABLE public.saved_properties (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, property_id)
);
GRANT SELECT,INSERT,DELETE ON public.saved_properties TO authenticated;
GRANT ALL ON public.saved_properties TO service_role;
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Saved own" ON public.saved_properties FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.featured_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.featured_properties TO anon, authenticated;
GRANT INSERT,UPDATE,DELETE ON public.featured_properties TO authenticated;
GRANT ALL ON public.featured_properties TO service_role;
ALTER TABLE public.featured_properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FP public read" ON public.featured_properties FOR SELECT USING (true);
CREATE POLICY "FP editors manage" ON public.featured_properties FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor']::app_role[]));

CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_activity_logs_created ON public.activity_logs(created_at DESC);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "AL staff read" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
CREATE POLICY "AL staff insert" ON public.activity_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin','editor','agent']::app_role[]));

CREATE TABLE public.settings (
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
CREATE POLICY "S public read" ON public.settings FOR SELECT USING (true);
CREATE POLICY "S admins manage" ON public.settings FOR ALL TO authenticated
  USING (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]))
  WITH CHECK (public.has_any_role(auth.uid(), ARRAY['super_admin','admin']::app_role[]));
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
