-- ============================================================
-- BRIGHT EDGE AGENCY — Seed data for admin dashboard testing
-- Run this in Supabase SQL Editor after applying migrations
-- ============================================================

-- Locations
INSERT INTO public.locations (name, slug, region, country, description) VALUES
  ('Westlands', 'westlands', 'Nairobi', 'Kenya', 'Prime commercial and residential hub'),
  ('Kilimani', 'kilimani', 'Nairobi', 'Kenya', 'Upscale residential neighborhood'),
  ('Mombasa Road', 'mombasa-road', 'Nairobi', 'Kenya', 'Growing corridor with new developments'),
  ('Nyali', 'nyali', 'Mombasa', 'Kenya', 'Coastal luxury living'),
  ('Kileleshwa', 'kileleshwa', 'Nairobi', 'Kenya', 'Quiet suburban estate')
ON CONFLICT (slug) DO NOTHING;

-- Property categories
INSERT INTO public.property_categories (name, slug, description) VALUES
  ('Residential', 'residential', 'Houses and apartments for living'),
  ('Commercial', 'commercial', 'Office and retail spaces'),
  ('Land', 'land', 'Plots and acreage')
ON CONFLICT (slug) DO NOTHING;

-- Property types
INSERT INTO public.property_types (name, slug) VALUES
  ('Apartment', 'apartment'),
  ('Villa', 'villa'),
  ('Townhouse', 'townhouse'),
  ('Office', 'office'),
  ('Plot', 'plot')
ON CONFLICT (slug) DO NOTHING;

-- Property statuses
INSERT INTO public.property_statuses (name, slug, color) VALUES
  ('Available', 'available', '#22c55e'),
  ('Under Offer', 'under-offer', '#f59e0b'),
  ('Sold', 'sold', '#ef4444')
ON CONFLICT (slug) DO NOTHING;

-- Amenities
INSERT INTO public.amenities (name, slug, icon) VALUES
  ('Swimming Pool', 'swimming-pool', 'waves'),
  ('Gym', 'gym', 'dumbbell'),
  ('Parking', 'parking', 'car'),
  ('Security', 'security', 'shield'),
  ('Garden', 'garden', 'trees'),
  ('Backup Power', 'backup-power', 'zap')
ON CONFLICT (slug) DO NOTHING;

-- Agents
INSERT INTO public.agents (full_name, slug, position, bio, photo, phone, email, whatsapp, display_order, active) VALUES
  ('Amina Mwangi', 'amina-mwangi', 'Senior Sales Consultant', 'Luxury residential specialist with 8 years experience in the Nairobi market.', 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=600&q=80', '+254712345001', 'amina@brightedge.co.ke', '+254712345001', 1, true),
  ('Brian Otieno', 'brian-otieno', 'Lettings Manager', 'Expert in executive rentals and tenant placement across Kilimani and Westlands.', 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=600&q=80', '+254712345002', 'brian@brightedge.co.ke', '+254712345002', 2, true),
  ('Cynthia Kimani', 'cynthia-kimani', 'Coastal Specialist', 'Mombasa and coastal property expert handling beachfront and holiday homes.', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80', '+254712345003', 'cynthia@brightedge.co.ke', '+254712345003', 3, true),
  ('David Njoroge', 'david-njoroge', 'Investment Advisor', 'Helps clients identify high-growth investment opportunities in emerging corridors.', 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=600&q=80', '+254712345004', 'david@brightedge.co.ke', '+254712345004', 4, true),
  ('Esther Wambui', 'esther-wambui', 'Client Relations', 'Ensures every client journey from inquiry to closing is seamless.', 'https://images.unsplash.com/photo-1611432579402-7037e3e2c1e4?w=600&q=80', '+254712345005', 'esther@brightedge.co.ke', '+254712345005', 5, true),
  ('Felix Mutiso', 'felix-mutiso', 'Commercial Lead', 'Specializes in office spaces, retail units, and commercial leases.', 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=600&q=80', '+254712345006', 'felix@brightedge.co.ke', '+254712345006', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Blog categories
INSERT INTO public.blog_categories (name, slug, description) VALUES
  ('Market Insights', 'market-insights', 'Trends and analysis'),
  ('Buying Guide', 'buying-guide', 'Tips for buyers'),
  ('Lifestyle', 'lifestyle', 'Living in Kenya')
ON CONFLICT (slug) DO NOTHING;

-- Settings (singleton)
INSERT INTO public.settings (id, company_name, tagline, primary_phone, primary_email, company_whatsapp, office_address, business_hours, hero_headline, hero_subheadline, seo_default_title, seo_default_description)
VALUES (1, 'Bright Edge Agency', 'Connecting You To Exceptional Spaces', '+254712345000', 'hello@brightedge.co.ke', '+254712345000', 'Westlands Commercial Centre, Nairobi, Kenya', 'Mon–Fri 8am–6pm, Sat 9am–1pm', 'Find Your Next Home', 'Curated properties across Kenya', 'Bright Edge Agency | Premium Real Estate in Kenya', 'Curated luxury and residential properties for sale and rent across Nairobi and the Kenyan coast.')
ON CONFLICT (id) DO NOTHING;
