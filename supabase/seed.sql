-- ============================================================
-- BRIGHT EDGE MARKETPLACE - Complete seed data
-- Run in Supabase SQL Editor AFTER migrations are applied
-- ============================================================

-- ============================================================
-- SUBSCRIPTION PLANS
-- ============================================================
INSERT INTO public.subscription_plans (name, slug, description, price_kes, billing_period, listings_per_period, features, sort_order) VALUES
  ('Free Agent', 'free-agent', 'For independent agents starting out', 0, 'monthly', 5, '["5 listings/month","Basic agent profile","Email support"]'::jsonb, 1),
  ('Pro Agent', 'pro-agent', 'For professional agents', 1500, 'monthly', 25, '["25 listings/month","Verified badge","Priority support","Analytics"]'::jsonb, 2),
  ('Agency', 'agency', 'For agencies and teams', 5000, 'monthly', 100, '["100 listings/month","Agency profile","Team management","Advanced analytics","API access"]'::jsonb, 3),
  ('Enterprise', 'enterprise', 'For large agencies', 15000, 'monthly', 500, '["500 listings/month","Whitelabel","Dedicated support","Multi-branch"]'::jsonb, 4),
  ('Home Owner Basic', 'home-owner-basic', 'List your own property', 0, 'monthly', 2, '["2 listings/month","Owner profile","Direct inquiries"]'::jsonb, 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- LISTING LIMITS
-- ============================================================
INSERT INTO public.listing_limits (owner_type, max_listings, period) VALUES
  ('bright_edge', 999999, 'monthly'),
  ('independent_agent', 5, 'monthly'),
  ('home_owner', 2, 'monthly'),
  ('developer', 20, 'monthly'),
  ('property_management', 50, 'monthly')
ON CONFLICT DO NOTHING;

-- ============================================================
-- LOOKUP TABLES
-- ============================================================
INSERT INTO public.locations (name, slug, region, country, description) VALUES
  ('Westlands', 'westlands', 'Nairobi', 'Kenya', 'Prime commercial and residential hub'),
  ('Kilimani', 'kilimani', 'Nairobi', 'Kenya', 'Upscale residential neighborhood'),
  ('Mombasa Road', 'mombasa-road', 'Nairobi', 'Kenya', 'Growing corridor with new developments'),
  ('Nyali', 'nyali', 'Mombasa', 'Kenya', 'Coastal luxury living'),
  ('Kileleshwa', 'kileleshwa', 'Nairobi', 'Kenya', 'Quiet suburban estate')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.property_categories (name, slug, description) VALUES
  ('Residential', 'residential', 'Houses and apartments for living'),
  ('Commercial', 'commercial', 'Office and retail spaces'),
  ('Land', 'land', 'Plots and acreage')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.property_types (name, slug) VALUES
  ('Apartment', 'apartment'),
  ('Villa', 'villa'),
  ('Townhouse', 'townhouse'),
  ('Office', 'office'),
  ('Plot', 'plot')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.property_statuses (name, slug, color) VALUES
  ('Available', 'available', '#22c55e'),
  ('Under Offer', 'under-offer', '#f59e0b'),
  ('Sold', 'sold', '#ef4444')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.amenities (name, slug, icon) VALUES
  ('Swimming Pool', 'swimming-pool', 'waves'),
  ('Gym', 'gym', 'dumbbell'),
  ('Parking', 'parking', 'car'),
  ('Security', 'security', 'shield'),
  ('Garden', 'garden', 'trees'),
  ('Backup Power', 'backup-power', 'zap'),
  ('Rooftop Terrace', 'rooftop-terrace', 'sun'),
  ('Concierge', 'concierge', 'bell')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.blog_categories (name, slug, description) VALUES
  ('Market Insights', 'market-insights', 'Trends and analysis'),
  ('Buying Guide', 'buying-guide', 'Tips for buyers'),
  ('Lifestyle', 'lifestyle', 'Living in Kenya')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.blog_tags (name, slug) VALUES
  ('Nairobi', 'nairobi'),
  ('Investment', 'investment'),
  ('First-time Buyer', 'first-time-buyer'),
  ('Luxury', 'luxury'),
  ('Coast', 'coast')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SETTINGS
-- ============================================================
INSERT INTO public.settings (id, company_name, tagline, primary_phone, primary_email, company_whatsapp, office_address, business_hours, hero_headline, hero_subheadline, seo_default_title, seo_default_description)
VALUES (1, 'Bright Edge Agency', 'Connecting You To Exceptional Spaces', '+254790595993', 'hello@brightedge.co.ke', '+254790595993', 'Westlands Commercial Centre, Nairobi, Kenya', 'Mon-Fri 8am-6pm, Sat 9am-1pm', 'Find Your Next Home', 'Curated properties across Kenya', 'Bright Edge Agency | Premium Real Estate in Kenya', 'Curated luxury and residential properties for sale and rent across Nairobi and the Kenyan coast.')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- AGENTS
-- ============================================================
INSERT INTO public.agents (
  full_name, slug, position, bio, photo, phone, email, whatsapp, display_order, active,
  verification_status, license_number, commission_rate, team_name, specializations, languages, years_experience,
  public_badge, verification_level, phone_verified_at, email_verified_at, onboarding_completed,
  published_listing_count, reviewed_listing_count, areas_of_operation, social_accounts,
  agent_type, agency_name, agency_registration, business_registration, deals_closed,
  response_rate, average_response_time_minutes, overall_rating, total_reviews
) VALUES
  ('Amina Mwangi', 'amina-mwangi', 'Senior Sales Consultant', 'Based in Westlands, Amina is a luxury residential specialist with 8 years of experience helping clients find premium apartments and penthouses across Nairobi.', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80', '+254790595990', 'amina@brightedge.co.ke', '+254790595990', 1, true, 'verified', 'EA-2024-001', 2.5, 'Westlands Elite Team', ARRAY['luxury','apartments','penthouses'], ARRAY['English','Swahili'], 8, true, 'premium', now() - interval '30 days', now() - interval '30 days', true, 12, 8, '[{"country":"Kenya","county":"Nairobi","town":"Nairobi","neighbourhood":"Westlands"}]'::jsonb, '[{"platform":"linkedin","handle":"amina-mwangi","url":"https://linkedin.com/in/amina-mwangi","is_verified":true}]'::jsonb, 'independent_agent', 'Bright Edge Elite', 'BR-001', 'BN-2024-001', 12, 98.5, 120, 4.8, 15),
  ('Brian Otieno', 'brian-otieno', 'Lettings Manager', 'Brian leads executive rentals across Kilimani and Kileleshwa.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80', '+254790595991', 'brian@brightedge.co.ke', '+254790595991', 2, true, 'verified', 'EA-2024-002', 2.0, 'Rental Solutions Team', ARRAY['rentals','executive','furnished'], ARRAY['English','Swahili','French'], 6, true, 'premium', now() - interval '25 days', now() - interval '25 days', true, 18, 15, '[{"country":"Kenya","county":"Nairobi","town":"Nairobi","neighbourhood":"Kilimani"},{"country":"Kenya","county":"Nairobi","town":"Nairobi","neighbourhood":"Kileleshwa"}]'::jsonb, '[{"platform":"linkedin","handle":"brian-otieno","url":"https://linkedin.com/in/brian-otieno","is_verified":true}]'::jsonb, 'independent_agent', 'Bright Edge Rentals', 'BR-002', 'BN-2024-002', 18, 96.0, 90, 4.6, 20),
  ('Cynthia Kimani', 'cynthia-kimani', 'Coastal Specialist', 'Cynthia is Bright Edge coastal expert, based out of Nyali.', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80', '+254790595992', 'cynthia@brightedge.co.ke', '+254790595992', 3, true, 'verified', 'EA-2024-003', 3.0, 'Coastal Properties Team', ARRAY['coastal','beachfront','holiday'], ARRAY['English','Swahili','German'], 10, true, 'premium', now() - interval '20 days', now() - interval '20 days', true, 8, 6, '[{"country":"Kenya","county":"Mombasa","town":"Mombasa","neighbourhood":"Nyali"},{"country":"Kenya","county":"Kwale","town":"Diani"}]'::jsonb, '[{"platform":"instagram","handle":"cynthia.coastal","url":"https://instagram.com/cynthia.coastal","is_verified":true}]'::jsonb, 'independent_agent', 'Bright Edge Coast', 'BR-003', 'BN-2024-003', 8, 97.5, 150, 4.9, 10),
  ('David Njoroge', 'david-njoroge', 'Investment Advisor', 'David focuses on the fast-growing Mombasa Road corridor.', 'https://images.unsplash.com/photo-1542909168-82c3f7d6e6db?w=600&q=80', '+254790595993', 'david@brightedge.co.ke', '+254790595993', 4, true, 'verified', 'EA-2024-004', 2.5, 'Investment Advisory Team', ARRAY['investment','commercial','land'], ARRAY['English','Swahili'], 7, true, 'premium', now() - interval '15 days', now() - interval '15 days', true, 5, 4, '[{"country":"Kenya","county":"Machakos","town":"Athi River"},{"country":"Kenya","county":"Nairobi","town":"Nairobi","neighbourhood":"Mombasa Road"}]'::jsonb, '[{"platform":"linkedin","handle":"david-njoroge","url":"https://linkedin.com/in/david-njoroge","is_verified":true}]'::jsonb, 'independent_agent', 'Bright Edge Investment', 'BR-004', 'BN-2024-004', 5, 95.0, 180, 4.7, 8),
  ('Esther Wambui', 'esther-wambui', 'Client Relations', 'Esther ensures every client journey is seamless.', 'https://images.unsplash.com/photo-1580489944151-d52b76e4fa97?w=600&q=80', '+254790595994', 'esther@brightedge.co.ke', '+254790595994', 5, true, 'verified', 'EA-2024-005', 1.5, 'Client Success Team', ARRAY['customer-service','relations'], ARRAY['English','Swahili'], 5, true, 'basic', now() - interval '10 days', now() - interval '10 days', true, 0, 0, '[{"country":"Kenya","county":"Nairobi","town":"Nairobi"}]'::jsonb, '[]'::jsonb, 'independent_agent', 'Bright Edge Services', 'BR-005', 'BN-2024-005', 0, 100.0, 60, 5.0, 2),
  ('Felix Mutiso', 'felix-mutiso', 'Commercial Lead', 'Felix specializes in office and retail space along Mombasa Road.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80', '+254790595995', 'felix@brightedge.co.ke', '+254790595995', 6, true, 'verified', 'EA-2024-006', 3.0, 'Commercial Leasing Team', ARRAY['commercial','office','retail'], ARRAY['English','Swahili'], 9, true, 'premium', now() - interval '35 days', now() - interval '35 days', true, 3, 2, '[{"country":"Kenya","county":"Nairobi","town":"Nairobi","neighbourhood":"Mombasa Road"}]'::jsonb, '[{"platform":"linkedin","handle":"felix-mutiso","url":"https://linkedin.com/in/felix-mutiso","is_verified":true}]'::jsonb, 'independent_agent', 'Bright Edge Commercial', 'BR-006', 'BN-2024-006', 3, 94.0, 200, 4.5, 5)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- HOME OWNERS
-- ============================================================
INSERT INTO public.home_owners (full_name, slug, email, phone, photo, bio, verification_status, phone_verified_at, email_verified_at, overall_rating, total_reviews, response_rate, properties_listed, deals_closed) VALUES
  ('James Kimani', 'james-kimani', 'james.kimani@email.com', '+254722000001', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80', 'Property owner with multiple units in Westlands and Kilimani. Committed to long-term tenancies and well-maintained homes.', 'verified', now() - interval '60 days', now() - interval '60 days', 4.8, 3, 100.0, 2, 1),
  ('Lisa Mwangi', 'lisa-mwangi', 'lisa.mwangi@email.com', '+254722000002', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80', 'Coastal property owner with beachfront apartments in Nyali and Diani. Focuses on holiday lets and executive rentals.', 'verified', now() - interval '45 days', now() - interval '45 days', 4.9, 2, 98.0, 1, 1),
  ('Robert Kibe', 'robert-kibe', 'robert.kibe@email.com', '+254722000003', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80', 'Landowner with prime development plots along Mombasa Road. Looking for joint venture partners for mixed-use projects.', 'verified', now() - interval '30 days', now() - interval '30 days', 5.0, 1, 100.0, 1, 0)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PROPERTIES
-- ============================================================
-- Wipe existing
DELETE FROM public.activity_logs WHERE entity_type = 'properties';
DELETE FROM public.property_images;
DELETE FROM public.property_amenities;
DELETE FROM public.property_reviews;
DELETE FROM public.inquiries WHERE property_id IS NOT NULL;
DELETE FROM public.properties;

INSERT INTO public.properties (
  title, slug, excerpt, description,
  category_id, property_type_id, status_id, location_id, agent_id,
  listing_type, price, currency, bedrooms, bathrooms, area_sqft, address, featured, published_at,
  validation_status, listing_expires_at, auto_renew, syndicated, promoted_until,
  virtual_tour_url, floor_plan_url,
  house_hunting_fee_kes, viewing_fee_kes, fees_refundable, fee_payment_timing,
  commission_kes, commission_notes, video_url, video_provider,
  country, county, town, neighbourhood, landmark,
  listing_owner_type, listing_owner_id, representation_type, listed_by_name,
  listing_phone, listing_whatsapp,
  agency_commission_kes, booking_fee_kes, security_deposit_kes, service_charge_kes,
  fees_negotiable, property_category, rental_category, short_stay_category,
  land_size, land_size_unit, energy_rating, parking_spaces, property_status,
  marketing_score
)
SELECT
  'Luxury 4BR Apartment in Westlands',
  'luxury-4br-apartment-westlands',
  'Stunning penthouse with panoramic city views.',
  'This exceptional 4-bedroom apartment features floor-to-ceiling windows, a wraparound balcony, and premium finishes throughout.',
  (SELECT id FROM public.property_categories WHERE slug = 'residential'),
  (SELECT id FROM public.property_types WHERE slug = 'apartment'),
  (SELECT id FROM public.property_statuses WHERE slug = 'available'),
  (SELECT id FROM public.locations WHERE slug = 'westlands'),
  (SELECT id FROM public.agents WHERE slug = 'amina-mwangi'),
  'sale'::property_listing_type,
  45000000, 'KES', 4, 3, 2800, 'Westlands Commercial Centre, Nairobi', true, now() - interval '2 days',
  'active'::listing_validation_status, now() + interval '90 days', true, false, now() + interval '30 days',
  'https://matterport.com/demo/tour', 'https://example.com/floorplans/westlands-penthouse.pdf',
  50000, 10000, true, 'before_viewing',
  1125000, '2.5% commission', 'https://youtube.com/watch?v=demo', 'youtube',
  'Kenya', 'Nairobi', 'Nairobi', 'Westlands', 'Westlands Commercial Centre',
  'bright_edge'::listing_owner_type,
  (SELECT id FROM public.agents WHERE slug = 'amina-mwangi'),
  'bright_edge_exclusive'::representation_type,
  'Amina Mwangi', '+254790595990', '+254790595990',
  1125000, 50000, 200000, 15000, true,
  'sales', NULL, NULL, 2, 'acres', NULL, 2, 'published'::property_status, 85
UNION ALL
SELECT
  'Modern Villa in Kilimani',
  'modern-villa-kilimani',
  'Spacious family home.',
  'A beautifully appointed 5-bedroom villa set on half an acre with landscaped gardens, swimming pool, and smart home features.',
  (SELECT id FROM public.property_categories WHERE slug = 'residential'),
  (SELECT id FROM public.property_types WHERE slug = 'villa'),
  (SELECT id FROM public.property_statuses WHERE slug = 'available'),
  (SELECT id FROM public.locations WHERE slug = 'kilimani'),
  (SELECT id FROM public.agents WHERE slug = 'brian-otieno'),
  'sale'::property_listing_type,
  85000000, 'KES', 5, 4, 4500, 'Kilimani Road, Nairobi', true, now() - interval '5 days',
  'active'::listing_validation_status, now() + interval '90 days', true, false, now() + interval '30 days',
  'https://matterport.com/demo/tour2', 'https://example.com/floorplans/kilimani-villa.pdf',
  75000, 15000, true, 'before_viewing',
  2125000, '2.5% commission', 'https://youtube.com/watch?v=demo2', 'youtube',
  'Kenya', 'Nairobi', 'Nairobi', 'Kilimani', 'Kilimani Road',
  'bright_edge'::listing_owner_type,
  (SELECT id FROM public.agents WHERE slug = 'brian-otieno'),
  'bright_edge_exclusive'::representation_type,
  'Brian Otieno', '+254790595991', '+254790595991',
  2125000, 75000, 300000, 20000, true,
  'sales', NULL, NULL, 2, 'acres', NULL, 4, 'published'::property_status, 90
UNION ALL
SELECT
  'Beachfront Apartment in Nyali',
  'beachfront-apartment-nyali',
  'Wake up to ocean views.',
  'This 3-bedroom beachfront apartment offers direct beach access, a resident pool, and 24/7 security in a prime Nyali location.',
  (SELECT id FROM public.property_categories WHERE slug = 'residential'),
  (SELECT id FROM public.property_types WHERE slug = 'apartment'),
  (SELECT id FROM public.property_statuses WHERE slug = 'available'),
  (SELECT id FROM public.locations WHERE slug = 'nyali'),
  (SELECT id FROM public.agents WHERE slug = 'cynthia-kimani'),
  'sale'::property_listing_type,
  32000000, 'KES', 3, 2, 1800, 'Nyali Beach Road, Mombasa', true, now() - interval '1 day',
  'active'::listing_validation_status, now() + interval '90 days', true, false, now() + interval '30 days',
  'https://matterport.com/demo/tour3', 'https://example.com/floorplans/nyali-beach.pdf',
  40000, 8000, true, 'before_viewing',
  960000, '3% commission', 'https://youtube.com/watch?v=demo3', 'youtube',
  'Kenya', 'Mombasa', 'Mombasa', 'Nyali', 'Nyali Beach Mall',
  'bright_edge'::listing_owner_type,
  (SELECT id FROM public.agents WHERE slug = 'cynthia-kimani'),
  'bright_edge_exclusive'::representation_type,
  'Cynthia Kimani', '+254790595992', '+254790595992',
  960000, 40000, 150000, 12000, true,
  'sales', NULL, NULL, 1, 'acre', NULL, 1, 'published'::property_status, 88
UNION ALL
SELECT
  'Executive Rental in Kileleshwa',
  'executive-rental-kileleshwa',
  'Fully furnished 3BR.',
  'A beautifully furnished 3-bedroom townhouse available for executive rental in the desirable Kileleshwa neighborhood.',
  (SELECT id FROM public.property_categories WHERE slug = 'residential'),
  (SELECT id FROM public.property_types WHERE slug = 'townhouse'),
  (SELECT id FROM public.property_statuses WHERE slug = 'available'),
  (SELECT id FROM public.locations WHERE slug = 'kileleshwa'),
  (SELECT id FROM public.agents WHERE slug = 'brian-otieno'),
  'rent'::property_listing_type,
  350000, 'KES', 3, 3, 2200, 'Kileleshwa Drive, Nairobi', false, now() - interval '3 days',
  'active'::listing_validation_status, now() + interval '90 days', true, false, now() + interval '30 days',
  NULL, NULL,
  0, 0, false, NULL,
  NULL, NULL, NULL, NULL,
  'Kenya', 'Nairobi', 'Nairobi', 'Kileleshwa', 'Kileleshwa Drive',
  'bright_edge'::listing_owner_type,
  (SELECT id FROM public.agents WHERE slug = 'brian-otieno'),
  'bright_edge_exclusive'::representation_type,
  'Brian Otieno', '+254790595991', '+254790595991',
  NULL, NULL, NULL, NULL, true,
  'rentals', 'furnished', NULL, 0, NULL, 0, 'published'::property_status, 75
UNION ALL
SELECT
  'Commercial Office Park Mombasa Rd',
  'commercial-office-park-mombasa-rd',
  'Grade-A office space.',
  'Modern office park with excellent connectivity to JKIA and the CBD, ideal for corporate headquarters.',
  (SELECT id FROM public.property_categories WHERE slug = 'commercial'),
  (SELECT id FROM public.property_types WHERE slug = 'office'),
  (SELECT id FROM public.property_statuses WHERE slug = 'available'),
  (SELECT id FROM public.locations WHERE slug = 'mombasa-road'),
  (SELECT id FROM public.agents WHERE slug = 'felix-mutiso'),
  'rent'::property_listing_type,
  1800000, 'KES', 0, 4, 12000, 'Mombasa Road, Nairobi', false, now() - interval '7 days',
  'active'::listing_validation_status, now() + interval '90 days', true, false, now() + interval '30 days',
  NULL, NULL,
  0, 0, false, NULL,
  NULL, NULL, NULL, NULL,
  'Kenya', 'Nairobi', 'Nairobi', 'Industrial Area', 'JKIA',
  'bright_edge'::listing_owner_type,
  (SELECT id FROM public.agents WHERE slug = 'felix-mutiso'),
  'bright_edge_exclusive'::representation_type,
  'Felix Mutiso', '+254790595995', '+254790595995',
  NULL, NULL, NULL, NULL, true,
  'rentals', 'unfurnished', NULL, 10, NULL, 0, 'published'::property_status, 80
UNION ALL
SELECT
  'Prime Development Land in Athi River',
  'prime-development-land-athi-river',
  '5-acre plot.',
  'A prime 5-acre plot ideal for mixed-use development, located along Namanga Road with full utilities access.',
  (SELECT id FROM public.property_categories WHERE slug = 'land'),
  (SELECT id FROM public.property_types WHERE slug = 'plot'),
  (SELECT id FROM public.property_statuses WHERE slug = 'available'),
  (SELECT id FROM public.locations WHERE slug = 'mombasa-road'),
  (SELECT id FROM public.agents WHERE slug = 'david-njoroge'),
  'sale'::property_listing_type,
  75000000, 'KES', 0, 0, 217800, 'Athi River, Machakos', false, now() - interval '10 days',
  'active'::listing_validation_status, now() + interval '90 days', true, false, now() + interval '30 days',
  NULL, NULL,
  0, 0, false, NULL,
  NULL, NULL, NULL, NULL,
  'Kenya', 'Machakos', 'Athi River', NULL, 'Namanga Road',
  'bright_edge'::listing_owner_type,
  (SELECT id FROM public.agents WHERE slug = 'david-njoroge'),
  'bright_edge_exclusive'::representation_type,
  'David Njoroge', '+254790595993', '+254790595993',
  NULL, NULL, NULL, NULL, true,
  'sales', NULL, 5, 'acres', NULL, 0, 'published'::property_status, 70
UNION ALL
SELECT
  'Penthouse Suite in Westlands',
  'penthouse-suite-westlands',
  'Ultra-luxury penthouse.',
  'The finest penthouse in Westlands with 360-degree city views, private rooftop terrace, and smart home automation.',
  (SELECT id FROM public.property_categories WHERE slug = 'residential'),
  (SELECT id FROM public.property_types WHERE slug = 'apartment'),
  (SELECT id FROM public.property_statuses WHERE slug = 'under-offer'),
  (SELECT id FROM public.locations WHERE slug = 'westlands'),
  (SELECT id FROM public.agents WHERE slug = 'amina-mwangi'),
  'sale'::property_listing_type,
  120000000, 'KES', 4, 4, 4000, 'Waiyaki Way, Westlands', true, now() - interval '14 days',
  'active'::listing_validation_status, now() + interval '90 days', true, false, now() + interval '30 days',
  'https://matterport.com/demo/tour4', 'https://example.com/floorplans/westlands-ultra.pdf',
  100000, 20000, true, 'before_viewing',
  3000000, '2.5% commission', 'https://youtube.com/watch?v=demo4', 'youtube',
  'Kenya', 'Nairobi', 'Nairobi', 'Westlands', 'Sarit Centre',
  'bright_edge'::listing_owner_type,
  (SELECT id FROM public.agents WHERE slug = 'amina-mwangi'),
  'bright_edge_exclusive'::representation_type,
  'Amina Mwangi', '+254790595990', '+254790595990',
  3000000, 100000, 400000, 25000, true,
  'sales', NULL, NULL, 2, 'acres', 'A', 2, 'published'::property_status, 95
UNION ALL
SELECT
  'Coastal Villa with Private Beach',
  'coastal-villa-private-beach',
  'Exclusive 6BR villa.',
  'An extraordinary 6-bedroom villa with private beach access, infinity pool, and tropical gardens in Diani.',
  (SELECT id FROM public.property_categories WHERE slug = 'residential'),
  (SELECT id FROM public.property_types WHERE slug = 'villa'),
  (SELECT id FROM public.property_statuses WHERE slug = 'available'),
  (SELECT id FROM public.locations WHERE slug = 'nyali'),
  (SELECT id FROM public.agents WHERE slug = 'cynthia-kimani'),
  'sale'::property_listing_type,
  250000000, 'KES', 6, 5, 8000, 'Diani Beach Road, Kwale', true, now() - interval '1 day',
  'active'::listing_validation_status, now() + interval '90 days', true, false, now() + interval '30 days',
  'https://matterport.com/demo/tour5', 'https://example.com/floorplans/diani-villa.pdf',
  150000, 30000, true, 'before_viewing',
  7500000, '3% commission', 'https://youtube.com/watch?v=demo5', 'youtube',
  'Kenya', 'Kwale', 'Diani', NULL, 'Diani Beach',
  'bright_edge'::listing_owner_type,
  (SELECT id FROM public.agents WHERE slug = 'cynthia-kimani'),
  'bright_edge_exclusive'::representation_type,
  'Cynthia Kimani', '+254790595992', '+254790595992',
  7500000, 150000, 500000, 35000, true,
  'sales', NULL, NULL, 2, 'acres', NULL, 4, 'published'::property_status, 92
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- PROPERTY IMAGES
-- ============================================================
INSERT INTO public.property_images (property_id, image_url, alt_text, image_order, is_featured, image_hash, image_width, image_height, image_bytes)
SELECT p.id, img.url, img.alt, img.ord, img.featured, img.hash, img.width, img.height, img.bytes
FROM public.properties p
CROSS JOIN LATERAL (VALUES
  ('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', 'Exterior view', 1, true, 'hash1', 1200, 800, 250000),
  ('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', 'Living room', 2, false, 'hash2', 1200, 800, 280000),
  ('https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80', 'Kitchen', 3, false, 'hash3', 1200, 800, 260000),
  ('https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80', 'Master bedroom', 4, false, 'hash4', 1200, 800, 240000),
  ('https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80', 'Bathroom', 5, false, 'hash5', 1200, 800, 220000)
) AS img(url, alt, ord, featured, hash, width, height, bytes)
WHERE p.publish_status = 'draft'
ON CONFLICT DO NOTHING;

-- ============================================================
-- PROPERTY AMENITIES
-- ============================================================
INSERT INTO public.property_amenities (property_id, amenity_id)
SELECT p.id, a.id
FROM public.properties p
CROSS JOIN public.amenities a
WHERE
  (p.slug = 'luxury-4br-apartment-westlands' AND a.slug IN ('swimming-pool','gym','parking','security','rooftop-terrace'))
  OR (p.slug = 'modern-villa-kilimani' AND a.slug IN ('parking','security','garden','backup-power'))
  OR (p.slug = 'beachfront-apartment-nyali' AND a.slug IN ('swimming-pool','security','parking'))
  OR (p.slug = 'executive-rental-kileleshwa' AND a.slug IN ('parking','security','garden','backup-power'))
  OR (p.slug = 'commercial-office-park-mombasa-rd' AND a.slug IN ('parking','security','backup-power','concierge'))
  OR (p.slug = 'penthouse-suite-westlands' AND a.slug IN ('swimming-pool','gym','parking','security','rooftop-terrace'))
  OR (p.slug = 'coastal-villa-private-beach' AND a.slug IN ('swimming-pool','security','garden','backup-power'))
ON CONFLICT DO NOTHING;

-- ============================================================
-- BLOG POSTS
-- ============================================================
INSERT INTO public.blog_posts (title, slug, excerpt, content, featured_image, category_id, status, featured, reading_minutes, published_at, gallery_images)
SELECT
  title, slug, excerpt, content, featured_image,
  (SELECT id FROM public.blog_categories WHERE slug = category_slug),
  status::blog_post_status, featured, reading_minutes, published_at, gallery_images::jsonb
FROM (VALUES
  ('5 Things to Know Before Buying in Nairobi', '5-things-before-buying-nairobi', 'The Nairobi property market moves fast.', 'Full content...', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80', 'buying-guide', 'published', true, 6, now() - interval '3 days', jsonb_build_array('https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80','https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80','https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&q=80')),
  ('Why Coastal Properties Are the Smart Investment', 'coastal-properties-smart-investment', 'Kenyan coast real estate offers strong rental yields.', 'Full content...', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', 'market-insights', 'published', true, 8, now() - interval '6 days', jsonb_build_array('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80')),
  ('A Guide to Executive Rentals in Kenya', 'guide-executive-rentals-kenya', 'Everything expats need to know.', 'Full content...', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80', 'buying-guide', 'published', false, 5, now() - interval '10 days', jsonb_build_array('https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=80','https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80','https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80')),
  ('Living in Kilimani: Neighborhood Guide', 'living-kilimani-neighborhood-guide', 'Why Kilimani remains desirable.', 'Full content...', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80', 'lifestyle', 'published', false, 7, now() - interval '15 days', jsonb_build_array('https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80','https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&q=80','https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80'))
) AS v(title, slug, excerpt, content, featured_image, category_slug, status, featured, reading_minutes, published_at, gallery_images)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- BLOG TAGS
-- ============================================================
INSERT INTO public.blog_post_tags (post_id, tag_id)
SELECT bp.id, bt.id
FROM public.blog_posts bp
CROSS JOIN public.blog_tags bt
WHERE
  (bp.slug = '5-things-before-buying-nairobi' AND bt.slug IN ('nairobi','first-time-buyer'))
  OR (bp.slug = 'coastal-properties-smart-investment' AND bt.slug IN ('investment','coast'))
  OR (bp.slug = 'guide-executive-rentals-kenya' AND bt.slug IN ('nairobi','first-time-buyer'))
  OR (bp.slug = 'living-kilimani-neighborhood-guide' AND bt.slug IN ('nairobi','luxury'))
ON CONFLICT DO NOTHING;

-- ============================================================
-- PROPERTY REVIEWS
-- ============================================================
INSERT INTO public.property_reviews (title, slug, excerpt, content, featured_image, property_id, location_id, rating, status, featured, published_at, gallery_images)
SELECT
  title, slug, excerpt, content, featured_image,
  (SELECT id FROM public.properties WHERE slug = property_slug),
  (SELECT id FROM public.locations WHERE slug = location_slug),
  rating, status::review_status, featured, published_at, gallery_images::jsonb
FROM (VALUES
  ('Why We Chose Westlands', 'why-we-chose-westlands', 'A young family shares their journey.', 'After months of searching...', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', 'luxury-4br-apartment-westlands', 'westlands', 5.0, 'published', true, now() - interval '4 days', jsonb_build_array('https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80','https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80')),
  ('Coastal Living at Its Finest', 'coastal-living-finest', 'How a holiday home became permanent.', 'We initially purchased...', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', 'beachfront-apartment-nyali', 'nyali', 4.5, 'published', true, now() - interval '8 days', jsonb_build_array('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80','https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80','https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80')),
  ('Smart Investment in Mombasa Road', 'smart-investment-mombasa-road', 'Commercial property success.', 'When we decided to invest...', 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200&q=80', 'commercial-office-park-mombasa-rd', 'mombasa-road', 4.0, 'published', false, now() - interval '20 days', jsonb_build_array('https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&q=80','https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80','https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=80'))
) AS v(title, slug, excerpt, content, featured_image, property_slug, location_slug, rating, status, featured, published_at, gallery_images)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- MARKETPLACE REVIEWS
-- ============================================================
INSERT INTO public.marketplace_reviews (reviewer_id, entity_type, entity_id, rating, title, review_text, pros, cons, is_verified, is_featured)
SELECT
  (SELECT id FROM auth.users WHERE email = 'peter.kamau@email.com'),
  'agent', (SELECT id FROM public.agents WHERE slug = 'amina-mwangi'),
  5, 'Exceptional Service', 'Amina made our home purchase seamless...', 'Professional, knowledgeable, responsive', 'None - perfect experience', true, true
ON CONFLICT DO NOTHING;

INSERT INTO public.marketplace_reviews (reviewer_id, entity_type, entity_id, rating, title, review_text, pros, cons, is_verified, is_featured)
SELECT
  (SELECT id FROM auth.users WHERE email = 'grace.w@email.com'),
  'property', (SELECT id FROM public.properties WHERE slug = 'luxury-4br-apartment-westlands'),
  5, 'Dream Home', 'Exactly as listed...', 'Great location, amazing views', 'Price above market', true, true
ON CONFLICT DO NOTHING;

-- ============================================================
-- REPUTATION SCORES
-- ============================================================
INSERT INTO public.reputation_scores (user_id, entity_type, entity_id, overall_score, total_reviews, response_rate, deals_closed)
SELECT
  a.user_id, 'agent', a.id, a.overall_rating, a.total_reviews, a.response_rate, a.deals_closed
FROM public.agents a
WHERE a.slug IN ('amina-mwangi','brian-otieno','cynthia-kimani','david-njoroge','esther-wambui','felix-mutiso')
ON CONFLICT (entity_type, entity_id) DO NOTHING;

INSERT INTO public.reputation_scores (user_id, entity_type, entity_id, overall_score, total_reviews, response_rate, deals_closed)
SELECT
  ho.user_id, 'home_owner', ho.id, ho.overall_rating, ho.total_reviews, ho.response_rate, ho.deals_closed
FROM public.home_owners ho
ON CONFLICT (entity_type, entity_id) DO NOTHING;

-- ============================================================
-- TESTIMONIALS
-- ============================================================
INSERT INTO public.testimonials (author_name, author_title, author_photo, quote, rating, featured, published, display_order) VALUES
  ('James and Sarah Kimani', 'Homeowners, Westlands', 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=200&q=80', 'Bright Edge made our first home purchase a wonderful experience.', 5, true, true, 1),
  ('Michael Ochieng', 'Investor, Mombasa Road', 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=200&q=80', 'I have now purchased three investment properties through Bright Edge.', 5, true, true, 2),
  ('Dr. Priya Sharma', 'Expat Resident, Kilimani', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80', 'Relocating to Nairobi from London was daunting, but Bright Edge made it seamless.', 5, true, true, 3),
  ('Robert and Lisa Mwangi', 'Coastal Property Owners', 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=200&q=80', 'Cynthia helped us find our dream beach house in Diani.', 4, false, true, 4)
ON CONFLICT DO NOTHING;

-- ============================================================
-- INQUIRIES
-- ============================================================
INSERT INTO public.inquiries (property_id, full_name, email, phone, message, status, source, lead_source_channel, created_at)
SELECT
  (SELECT id FROM public.properties WHERE slug = property_slug),
  full_name, email, phone, message, status::lead_status, source::lead_source, 'website', created_at
FROM (VALUES
  ('luxury-4br-apartment-westlands', 'Peter Kamau', 'peter.kamau@email.com', '+254722111001', 'I am interested in viewing this weekend.', 'new', 'website_form', now() - interval '1 day'),
  ('modern-villa-kilimani', 'Grace Wanjiku', 'grace.w@email.com', '+254722111002', 'Could you share more details about the service charge?', 'contacted', 'property_inquiry', now() - interval '3 days'),
  ('beachfront-apartment-nyali', 'Thomas Bergmann', 'thomas.b@email.de', '+49170123456', 'I am a German investor looking at coastal properties.', 'qualified', 'contact_page', now() - interval '5 days'),
  ('executive-rental-kileleshwa', 'UN Habitat Office', 'procurement@unhabitat.org', '+254207621234', 'We need a fully furnished 3-bed executive rental.', 'viewing_scheduled', 'referral', now() - interval '7 days'),
  (NULL, 'James Odhiambo', 'james.odhiambo@email.com', '+254722111005', 'I am looking to sell my 4-acre plot in Athi River.', 'new', 'contact_page', now() - interval '2 days')
) AS v(property_slug, full_name, email, phone, message, status, source, created_at)
ON CONFLICT DO NOTHING;

-- ============================================================
-- CONTACT REQUESTS
-- ============================================================
INSERT INTO public.contact_requests (full_name, email, phone, subject, message, status, created_at) VALUES
  ('Alice Muthoni', 'alice.m@email.com', '+254722111010', 'Property Valuation', 'I would like to get a valuation for my 3-bedroom apartment in Kilimani.', 'new'::lead_status, now() - interval '2 days'),
  ('Samuel Kibe', 'sam.kibe@email.com', '+254722111011', 'Investment Advice', 'I have a budget of KES 50M and am looking for investment property advice.', 'new'::lead_status, now() - interval '4 days'),
  ('Nairobi Tech Ltd', 'office@nairobi-tech.co.ke', '+254722111012', 'Office Space', 'We are a 50-person tech company looking for 5000+ sqft office space.', 'contacted'::lead_status, now() - interval '6 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- NEWSLETTER SUBSCRIBERS
-- ============================================================
INSERT INTO public.newsletter_subscribers (email, full_name, subscribed) VALUES
  ('subscriber1@email.com', 'John Doe', true),
  ('subscriber2@email.com', 'Jane Smith', true),
  ('subscriber3@email.com', 'Alex Kimani', true),
  ('investor@email.com', 'Investor Mike', true),
  ('expats@email.com', 'Expat Community', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
INSERT INTO public.activity_logs (action, entity_type, entity_id, metadata, created_at) VALUES
  ('property_created', 'properties', (SELECT id FROM public.properties WHERE slug = 'luxury-4br-apartment-westlands'), '{"source": "seed"}'::jsonb, now() - interval '2 days'),
  ('property_published', 'properties', (SELECT id FROM public.properties WHERE slug = 'luxury-4br-apartment-westlands'), '{"source": "seed"}'::jsonb, now() - interval '2 days'),
  ('inquiry_received', 'inquiries', (SELECT id FROM public.inquiries WHERE email = 'peter.kamau@email.com'), '{"source": "website_form"}'::jsonb, now() - interval '1 day'),
  ('agent_created', 'agents', (SELECT id FROM public.agents WHERE slug = 'amina-mwangi'), '{"source": "seed"}'::jsonb, now() - interval '30 days'),
  ('settings_updated', 'settings', null, '{"fields": ["company_name", "tagline"]}'::jsonb, now() - interval '10 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- SHORT LINKS
-- ============================================================
INSERT INTO public.short_links (code, target_type, target_id, target_path, long_url, click_count, created_at)
SELECT code, target_type::short_link_target_type, target_id, target_path, long_url, click_count, created_at
FROM (VALUES
  ('lux4br', 'property', (SELECT id FROM public.properties WHERE slug = 'luxury-4br-apartment-westlands'), '/properties/luxury-4br-apartment-westlands', 'https://brightedge.co.ke/properties/luxury-4br-apartment-westlands', 45, now() - interval '2 days'),
  ('modvil', 'property', (SELECT id FROM public.properties WHERE slug = 'modern-villa-kilimani'), '/properties/modern-villa-kilimani', 'https://brightedge.co.ke/properties/modern-villa-kilimani', 32, now() - interval '5 days'),
  ('beachny', 'property', (SELECT id FROM public.properties WHERE slug = 'beachfront-apartment-nyali'), '/properties/beachfront-apartment-nyali', 'https://brightedge.co.ke/properties/beachfront-apartment-nyali', 67, now() - interval '1 day'),
  ('aminam', 'agent', (SELECT id FROM public.agents WHERE slug = 'amina-mwangi'), '/agents/amina-mwangi', 'https://brightedge.co.ke/agents/amina-mwangi', 28, now() - interval '10 days')
) AS v(code, target_type, target_id, target_path, long_url, click_count, created_at)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- PROPERTY QR CODES
-- ============================================================
INSERT INTO public.property_qr_codes (property_id, short_link_id, storage_path, public_url, format, byte_size)
SELECT p.id, sl.id, storage_path, public_url, format, byte_size
FROM public.properties p
JOIN public.short_links sl ON sl.target_id = p.id
CROSS JOIN LATERAL (VALUES
  ('qr_codes/' || p.slug || '.png', 'https://storage.brightedge.co.ke/qr/' || p.slug || '.png', 'png', 45000)
) AS q(storage_path, public_url, format, byte_size)
WHERE p.slug IN ('luxury-4br-apartment-westlands','modern-villa-kilimani','beachfront-apartment-nyali')
ON CONFLICT DO NOTHING;

-- ============================================================
-- LEAD SOURCES
-- ============================================================
INSERT INTO public.lead_sources (inquiry_id, property_id, channel, referrer, utm_source, utm_medium, utm_campaign, created_at)
SELECT
  (SELECT id FROM public.inquiries WHERE email = 'peter.kamau@email.com'),
  (SELECT id FROM public.properties WHERE slug = 'luxury-4br-apartment-westlands'),
  'short_link', 'https://facebook.com', 'facebook', 'social', 'q3_2024_campaign', now() - interval '1 day'
ON CONFLICT DO NOTHING;

INSERT INTO public.lead_sources (inquiry_id, property_id, channel, referrer, utm_source, utm_medium, created_at)
SELECT
  (SELECT id FROM public.inquiries WHERE email = 'grace.w@email.com'),
  (SELECT id FROM public.properties WHERE slug = 'modern-villa-kilimani'),
  'website', 'https://google.com', 'google', 'organic', now() - interval '3 days'
ON CONFLICT DO NOTHING;

-- ============================================================
-- AGENT DOCUMENTS
-- ============================================================
INSERT INTO public.agent_documents (agent_id, kind, storage_path, public_url, mime_type, byte_size, review_status)
SELECT
  (SELECT id FROM public.agents WHERE slug = 'amina-mwangi'),
  kind::agent_document_kind, storage_path, public_url, mime_type, byte_size, review_status::text
FROM (VALUES
  ('national_id_front', 'docs/amina-id-front.jpg', 'https://storage.brightedge.co.ke/docs/amina-id-front.jpg', 'image/jpeg', 150000, 'approved'),
  ('national_id_back', 'docs/amina-id-back.jpg', 'https://storage.brightedge.co.ke/docs/amina-id-back.jpg', 'image/jpeg', 145000, 'approved'),
  ('profile_photo', 'docs/amina-profile.jpg', 'https://storage.brightedge.co.ke/docs/amina-profile.jpg', 'image/jpeg', 280000, 'approved')
) AS v(kind, storage_path, public_url, mime_type, byte_size, review_status)
ON CONFLICT DO NOTHING;

-- ============================================================
-- AGENT SOCIAL ACCOUNTS
-- ============================================================
INSERT INTO public.agent_social_accounts (agent_id, platform, handle, url, is_verified)
SELECT
  (SELECT id FROM public.agents WHERE slug = 'amina-mwangi'),
  platform::social_platform, handle, url, is_verified
FROM (VALUES
  ('linkedin', 'amina-mwangi', 'https://linkedin.com/in/amina-mwangi', true),
  ('instagram', 'amina.brightedge', 'https://instagram.com/amina.brightedge', false)
) AS v(platform, handle, url, is_verified)
ON CONFLICT DO NOTHING;

-- ============================================================
-- AGENT AREAS
-- ============================================================
INSERT INTO public.agent_areas (agent_id, country, county, town, neighbourhood)
SELECT
  (SELECT id FROM public.agents WHERE slug = 'amina-mwangi'),
  country, county, town, neighbourhood
FROM (VALUES
  ('Kenya', 'Nairobi', 'Nairobi', 'Westlands'),
  ('Kenya', 'Nairobi', 'Nairobi', 'Kilimani'),
  ('Kenya', 'Nairobi', 'Nairobi', 'Lavington')
) AS v(country, county, town, neighbourhood)
ON CONFLICT DO NOTHING;

-- ============================================================
-- PROJECTS
-- ============================================================
INSERT INTO public.projects (name, slug, developer, country, county, town, neighbourhood, description, hero_image, launch_date, completion_date, status) VALUES
  ('Westlands Heights', 'westlands-heights', 'Bright Edge Developers', 'Kenya', 'Nairobi', 'Nairobi', 'Westlands', 'Premium mixed-use development.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80', '2024-01-15', '2026-06-30', 'under_construction'),
  ('Coastal Paradise', 'coastal-paradise', 'Ocean View Estates', 'Kenya', 'Kwale', 'Diani', 'Diani Beach', 'Luxury beachfront development.', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80', '2024-03-01', '2027-12-31', 'planning')
ON CONFLICT (slug) DO NOTHING;

-- Link properties to projects
UPDATE public.properties SET project_id = (SELECT id FROM public.projects WHERE slug = 'westlands-heights')
WHERE slug = 'luxury-4br-apartment-westlands';

UPDATE public.properties SET project_id = (SELECT id FROM public.projects WHERE slug = 'coastal-paradise')
WHERE slug = 'beachfront-apartment-nyali';
</parameter>
<task_progress>
- [x] Step 1: Analyze existing codebase
- [x] Step 2: Create combined single migration file
- [x] Step 3: Create marketplace server functions
- [x] Step 4: Create marketplace frontend components
- [x] Step 5: Create owner profile page route
- [x] Step 6: Fix migration conflicts with existing V2 schema
- [x] Step 7: Fix migration CHECK constraint syntax
- [x] Step 8: Fix agents/properties schema for backward compatibility
- [x] Step 9: Fix seed.sql VALUES list mismatch by using UNION ALL inserts
- [x] Step 10: Remove stray XML tag from seed.sql
- [ ] Step 11: Final verification
</task_progress>
</write_to_file>