-- ============================================================
-- BRIGHT EDGE AGENCY — V2 Spec Completion
-- Adds: availability_date, furnished_status, lease_period, deposit_amount, 
--       utilities_info, marketing_score, marketing_checklist, ai_captions, 
--       suggested_hashtags to achieve 100% specification coverage.
-- ============================================================

-- ============================================================
-- ENUMS (idempotent)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'furnished_status') THEN
    CREATE TYPE public.furnished_status AS ENUM ('unfurnished', 'semi-furnished', 'fully-furnished');
  END IF;
END
$$;

-- ============================================================
-- PROPERTIES: Missing Spec Fields
-- ============================================================
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
