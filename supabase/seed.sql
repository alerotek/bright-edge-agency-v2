-- ============================================================
-- BRIGHT EDGE AGENCY - Complete seed data
-- Run in Supabase SQL Editor AFTER migrations are applied
-- ============================================================

-- Lookup tables
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

-- Settings (singleton)
INSERT INTO public.settings (id, company_name, tagline, primary_phone, primary_email, company_whatsapp, office_address, business_hours, hero_headline, hero_subheadline, seo_default_title, seo_default_description)
VALUES (1, 'Bright Edge Agency', 'Connecting You To Exceptional Spaces', '+254790595993', 'hello@brightedge.co.ke', '+254790595993', 'Westlands Commercial Centre, Nairobi, Kenya', 'Mon-Fri 8am-6pm, Sat 9am-1pm', 'Find Your Next Home', 'Curated properties across Kenya', 'Bright Edge Agency | Premium Real Estate in Kenya', 'Curated luxury and residential properties for sale and rent across Nairobi and the Kenyan coast.')
ON CONFLICT (id) DO NOTHING;

-- Agents (with V2 fields)
INSERT INTO public.agents (full_name, slug, position, bio, photo, phone, email, whatsapp, display_order, active, verification_status, license_number, commission_rate, team_name, specializations, languages, years_experience, public_badge, verification_level, phone_verified_at, email_verified_at, onboarding_completed, published_listing_count, reviewed_listing_count, areas_of_operation, social_accounts) VALUES
  ('Amina Mwangi', 'amina-mwangi', 'Senior Sales Consultant', 'Based in Westlands, Amina is a luxury residential specialist with 8 years of experience helping clients find premium apartments and penthouses across Nairobi.', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=600&q=80', '+254790595990', 'amina@brightedge.co.ke', '+254790595990', 1, true, 'verified', 'EA-2024-001', 2.5, 'Westlands Elite Team', ARRAY['luxury', 'apartments', 'penthouses'], ARRAY['English', 'Swahili'], 8, true, 'premium', now() - interval '30 days', now() - interval '30 days', true, 12, 8, '[{"country":"Kenya","county":"Nairobi","town":"Nairobi","neighbourhood":"Westlands"}]'::jsonb, '[{"platform":"linkedin","handle":"amina-mwangi","url":"https://linkedin.com/in/amina-mwangi","is_verified":true},{"platform":"instagram","handle":"amina.brightedge","url":"https://instagram.com/amina.brightedge","is_verified":false}]'::jsonb),
  ('Brian Otieno', 'brian-otieno', 'Lettings Manager', 'Brian leads executive rentals across Kilimani and Kileleshwa, matching expats and professionals with fully furnished homes and seamless tenant placement.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80', '+254790595991', 'brian@brightedge.co.ke', '+254790595991', 2, true, 'verified', 'EA-2024-002', 2.0, 'Rental Solutions Team', ARRAY['rentals', 'executive', 'furnished'], ARRAY['English', 'Swahili', 'French'], 6, true, 'premium', now() - interval '25 days', now() - interval '25 days', true, 18, 15, '[{"country":"Kenya","county":"Nairobi","town":"Nairobi","neighbourhood":"Kilimani"},{"country":"Kenya","county":"Nairobi","town":"Nairobi","neighbourhood":"Kileleshwa"}]'::jsonb, '[{"platform":"linkedin","handle":"brian-otieno","url":"https://linkedin.com/in/brian-otieno","is_verified":true}]'::jsonb),
  ('Cynthia Kimani', 'cynthia-kimani', 'Coastal Specialist', 'Cynthia is Bright Edge coastal expert, based out of Nyali and covering the Mombasa coastline, with deep knowledge of beachfront apartments and holiday homes.', 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=80', '+254790595992', 'cynthia@brightedge.co.ke', '+254790595992', 3, true, 'verified', 'EA-2024-003', 3.0, 'Coastal Properties Team', ARRAY['coastal', 'beachfront', 'holiday'], ARRAY['English', 'Swahili', 'German'], 10, true, 'premium', now() - interval '20 days', now() - interval '20 days', true, 8, 6, '[{"country":"Kenya","county":"Mombasa","town":"Mombasa","neighbourhood":"Nyali"},{"country":"Kenya","county":"Kwale","town":"Diani"}]'::jsonb, '[{"platform":"instagram","handle":"cynthia.coastal","url":"https://instagram.com/cynthia.coastal","is_verified":true}]'::jsonb),
  ('David Njoroge', 'david-njoroge', 'Investment Advisor', 'David focuses on the fast-growing Mombasa Road corridor, helping investors identify high-growth commercial and land opportunities in Nairobi.', 'https://images.unsplash.com/photo-1542909168-82c3f7d6e6db?w=600&q=80', '+254790595993', 'david@brightedge.co.ke', '+254790595993', 4, true, 'verified', 'EA-2024-004', 2.5, 'Investment Advisory Team', ARRAY['investment', 'commercial', 'land'], ARRAY['English', 'Swahili'], 7, true, 'premium', now() - interval '15 days', now() - interval '15 days', true, 5, 4, '[{"country":"Kenya","county":"Machakos","town":"Athi River"},{"country":"Kenya","county":"Nairobi","town":"Nairobi","neighbourhood":"Mombasa Road"}]'::jsonb, '[{"platform":"linkedin","handle":"david-njoroge","url":"https://linkedin.com/in/david-njoroge","is_verified":true}]'::jsonb),
  ('Esther Wambui', 'esther-wambui', 'Client Relations', 'Esther is based at our Westlands office and ensures every client journey, from first inquiry to final closing, is seamless across all listings.', 'https://images.unsplash.com/photo-1580489944151-d52b76e4fa97?w=600&q=80', '+254790595994', 'esther@brightedge.co.ke', '+254790595994', 5, true, 'verified', 'EA-2024-005', 1.5, 'Client Success Team', ARRAY['customer-service', 'relations'], ARRAY['English', 'Swahili'], 5, true, 'basic', now() - interval '10 days', now() - interval '10 days', true, 0, 0, '[{"country":"Kenya","county":"Nairobi","town":"Nairobi"}]'::jsonb, '[]'::jsonb),
  ('Felix Mutiso', 'felix-mutiso', 'Commercial Lead', 'Felix specializes in office and retail space along the Mombasa Road business corridor, helping corporates secure Grade-A commercial leases.', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&q=80', '+254790595995', 'felix@brightedge.co.ke', '+254790595995', 6, true, 'verified', 'EA-2024-006', 3.0, 'Commercial Leasing Team', ARRAY['commercial', 'office', 'retail'], ARRAY['English', 'Swahili'], 9, true, 'premium', now() - interval '35 days', now() - interval '35 days', true, 3, 2, '[{"country":"Kenya","county":"Nairobi","town":"Nairobi","neighbourhood":"Mombasa Road"}]'::jsonb, '[{"platform":"linkedin","handle":"felix-mutiso","url":"https://linkedin.com/in/felix-mutiso","is_verified":true}]'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- Wipe existing properties so this seed always overrides
DELETE FROM public.activity_logs WHERE entity_type = 'properties';
DELETE FROM public.property_images;
DELETE FROM public.property_amenities;
DELETE FROM public.property_reviews;
DELETE FROM public.inquiries WHERE property_id IS NOT NULL;
DELETE FROM public.properties;

-- Properties (8 sample listings with V2 fields)
-- Using subqueries to resolve FKs by slug/name
INSERT INTO public.properties (title, slug, excerpt, description, category_id, property_type_id, status_id, location_id, agent_id, listing_type, price, currency, bedrooms, bathrooms, area_sqft, address, publish_status, featured, published_at, validation_status, listing_expires_at, auto_renew, syndicated, promoted_until, virtual_tour_url, floor_plan_url, house_hunting_fee_kes, viewing_fee_kes, fees_refundable, fee_payment_timing, commission_kes, commission_notes, video_url, video_provider, country, county, town, neighbourhood, landmark, available_from, furnished_status, lease_period, deposit_amount_kes, utilities_info, marketing_score, marketing_checklist, ai_captions, suggested_hashtags)
SELECT
  title, slug, excerpt, description,
  (SELECT id FROM public.property_categories WHERE slug = category_slug),
  (SELECT id FROM public.property_types WHERE slug = type_slug),
  (SELECT id FROM public.property_statuses WHERE slug = status_slug),
  (SELECT id FROM public.locations WHERE slug = location_slug),
  (SELECT id FROM public.agents WHERE slug = agent_slug),
  listing_type::property_listing_type, price, currency, bedrooms, bathrooms, area_sqft, address, 'draft'::property_publish_status, featured, published_at,
  'active'::listing_validation_status, now() + interval '90 days', true, false, now() + interval '30 days',
  virtual_tour_url, floor_plan_url, house_hunting_fee, viewing_fee, fees_refundable, fee_payment,
  commission_kes, commission_notes, video_url, video_provider,
  country, county, town, neighbourhood, landmark,
  available_from, furnished_status, lease_period, deposit_kes, utilities_info,
  marketing_score, marketing_checklist::jsonb, ai_captions, suggested_hashtags::text[]
FROM (VALUES
  ('Luxury 4BR Apartment in Westlands', 'luxury-4br-apartment-westlands', 'Stunning penthouse with panoramic city views and premium finishes throughout.', 'This exceptional 4-bedroom apartment occupies the top floor of Westlands most prestigious address. Floor-to-ceiling windows flood the open-plan living space with natural light, while the master suite features a walk-in ensuite and private balcony. Building amenities include a rooftop pool, gym, 24-hour security, and dedicated parking.', 'residential', 'apartment', 'available', 'westlands', 'amina-mwangi', 'sale', 45000000, 'KES', 4, 3, 2800, 'Westlands Commercial Centre, Nairobi', true, now() - interval '2 days', 'https://matterport.com/demo/tour', 'https://example.com/floorplans/westlands-penthouse.pdf', 50000, 10000, true, 'before_viewing', 1125000, '2.5% commission on final sale price', 'https://youtube.com/watch?v=demo', 'youtube', 'Kenya', 'Nairobi', 'Nairobi', 'Westlands', 'Westlands Commercial Centre', NULL, 'semi-furnished', NULL, NULL, 'Water and electricity included in service charge', 85, '[{"task":"photos","completed":true},{"task":"virtual_tour","completed":true},{"task":"floor_plan","completed":true},{"task":"description","completed":true},{"task":"pricing","completed":true}]'::jsonb, 'Experience luxury living in Westlands with this stunning penthouse featuring panoramic city views and premium finishes throughout.', ARRAY['luxury', 'penthouse', 'westlands', 'nairobi', 'cityviews']),
  ('Modern Villa in Kilimani', 'modern-villa-kilimani', 'Spacious family home with landscaped garden and home office.', 'A beautifully appointed 5-bedroom villa set in the heart of Kilimani. The property features a large landscaped garden, separate staff quarters, a dedicated home office, and a spacious open-plan kitchen with granite countertops. Gated community with 24-hour security and backup generator.', 'residential', 'villa', 'available', 'kilimani', 'brian-otieno', 'sale', 85000000, 'KES', 5, 4, 4500, 'Kilimani Road, Nairobi', true, now() - interval '5 days', 'https://matterport.com/demo/tour2', 'https://example.com/floorplans/kilimani-villa.pdf', 75000, 15000, true, 'before_viewing', 2125000, '2.5% commission on final sale price', 'https://youtube.com/watch?v=demo2', 'youtube', 'Kenya', 'Nairobi', 'Nairobi', 'Kilimani', 'Kilimani Road', NULL, 'fully-furnished', NULL, NULL, 'Solar water heating, backup generator included', 90, '[{"task":"photos","completed":true},{"task":"virtual_tour","completed":true},{"task":"floor_plan","completed":true},{"task":"description","completed":true},{"task":"pricing","completed":true},{"task":"video","completed":true}]'::jsonb, 'Spacious family villa in Kilimani with landscaped garden, home office, and premium finishes. Perfect for families seeking luxury living.', ARRAY['villa', 'family', 'kilimani', 'garden', 'luxury']),
  ('Beachfront Apartment in Nyali', 'beachfront-apartment-nyali', 'Wake up to ocean views in this stunning coastal retreat.', 'This 3-bedroom beachfront apartment offers uninterrupted Indian Ocean views from every room. The open-plan design flows onto a wide terrace perfect for entertaining. Complex amenities include direct beach access, infinity pool, and 24-hour security. Ideal as a holiday home or rental investment.', 'residential', 'apartment', 'available', 'nyali', 'cynthia-kimani', 'sale', 32000000, 'KES', 3, 2, 1800, 'Nyali Beach Road, Mombasa', true, now() - interval '1 day', 'https://matterport.com/demo/tour3', 'https://example.com/floorplans/nyali-beach.pdf', 40000, 8000, true, 'before_viewing', 960000, '3% commission on final sale price', 'https://youtube.com/watch?v=demo3', 'youtube', 'Kenya', 'Mombasa', 'Mombasa', 'Nyali', 'Nyali Beach Mall', NULL, 'semi-furnished', NULL, NULL, 'Beach access, pool maintenance included', 88, '[{"task":"photos","completed":true},{"task":"virtual_tour","completed":true},{"task":"floor_plan","completed":true},{"task":"description","completed":true},{"task":"pricing","completed":true}]'::jsonb, 'Stunning beachfront apartment in Nyali with uninterrupted Indian Ocean views. Perfect holiday home or rental investment.', ARRAY['beachfront', 'oceanview', 'nyali', 'mombasa', 'coastal']),
  ('Executive Rental in Kileleshwa', 'executive-rental-kileleshwa', 'Fully furnished 3BR in a quiet leafy suburb.', 'A beautifully furnished 3-bedroom townhouse available for executive rental. Features include modern kitchen, spacious lounge, private garden, and staff quarters. Located in a quiet secure neighborhood with easy access to major roads. Rent includes service charge and internet.', 'residential', 'townhouse', 'available', 'kileleshwa', 'brian-otieno', 'rent', 350000, 'KES', 3, 3, 2200, 'Kileleshwa Drive, Nairobi', false, now() - interval '3 days', NULL, NULL, 0, 0, false, NULL, NULL, NULL, NULL, NULL, 'Kenya', 'Nairobi', 'Nairobi', 'Kileleshwa', 'Kileleshwa Drive', now() + interval '30 days', 'fully-furnished', '12 months', 700000, 'Rent includes service charge, internet, and gardener', 75, '[{"task":"photos","completed":true},{"task":"description","completed":true},{"task":"pricing","completed":true}]'::jsonb, 'Fully furnished executive townhouse in quiet Kileleshwa. Modern kitchen, private garden, staff quarters included.', ARRAY['rental', 'furnished', 'executive', 'kileleshwa', 'townhouse']),
  ('Commercial Office Park Mombasa Rd', 'commercial-office-park-mombasa-rd', 'Grade-A office space in a thriving business corridor.', 'Modern office park offering flexible floor plates from 500 to 5000 sqft. Features include high-speed lifts, backup power, ample parking, and 24-hour security. Ideal for corporates seeking a strategic location along the busy Mombasa Road corridor with excellent visibility.', 'commercial', 'office', 'available', 'mombasa-road', 'felix-mutiso', 'rent', 1800000, 'KES', 0, 4, 12000, 'Mombasa Road, Nairobi', false, now() - interval '7 days', NULL, NULL, 0, 0, false, NULL, NULL, NULL, NULL, NULL, 'Kenya', 'Nairobi', 'Nairobi', 'Industrial Area', 'Jomo Kenyatta International Airport', NULL, NULL, '36 months', 5400000, 'Rent includes security, cleaning, and maintenance of common areas', 80, '[{"task":"photos","completed":true},{"task":"floor_plan","completed":true},{"task":"description","completed":true},{"task":"pricing","completed":true}]'::jsonb, 'Grade-A office space on Mombasa Road. Flexible floor plates, backup power, ample parking. Ideal for corporates.', ARRAY['commercial', 'office', 'mombasa-road', 'grade-a', 'corporate']),
  ('Prime Development Land in Athi River', 'prime-development-land-athi-river', '5-acre plot with approved mixed-use plans.', 'A prime 5-acre plot located 500m from the Nairobi-Mombasa highway with approved mixed-use development plans. The land has a clean title, access road, and water connection. Ideal for residential or commercial development in this fast-growing corridor.', 'land', 'plot', 'available', 'mombasa-road', 'david-njoroge', 'sale', 75000000, 'KES', 0, 0, 217800, 'Athi River, Machakos', false, now() - interval '10 days', NULL, NULL, 0, 0, false, NULL, NULL, NULL, NULL, NULL, 'Kenya', 'Machakos', 'Athi River', NULL, 'Namanga Road', NULL, NULL, NULL, NULL, 'Water and electricity connected at boundary', 70, '[{"task":"photos","completed":true},{"task":"title_search","completed":true},{"task":"survey","completed":true},{"task":"description","completed":true}]'::jsonb, 'Prime 5-acre development plot in Athi River with approved mixed-use plans. Clean title, water connected.', ARRAY['land', 'development', 'athi-river', 'investment', 'plot']),
  ('Penthouse Suite in Westlands', 'penthouse-suite-westlands', 'Ultra-luxury penthouse with private rooftop terrace.', 'The finest penthouse in Westlands. This 4000 sqft masterpiece features a double-volume living area, private rooftop terrace with jacuzzi, chef kitchen with Miele appliances, and a master suite with his-and-hers walk-in closets. Two parking spaces and a storage room included.', 'residential', 'apartment', 'under-offer', 'westlands', 'amina-mwangi', 'sale', 120000000, 'KES', 4, 4, 4000, 'Waiyaki Way, Westlands', true, now() - interval '14 days', 'https://matterport.com/demo/tour4', 'https://example.com/floorplans/westlands-ultra.pdf', 100000, 20000, true, 'before_viewing', 3000000, '2.5% commission on final sale price', 'https://youtube.com/watch?v=demo4', 'youtube', 'Kenya', 'Nairobi', 'Nairobi', 'Westlands', 'Sarit Centre', NULL, 'fully-furnished', NULL, NULL, 'Smart home system, private lift access', 95, '[{"task":"photos","completed":true},{"task":"virtual_tour","completed":true},{"task":"floor_plan","completed":true},{"task":"description","completed":true},{"task":"pricing","completed":true},{"task":"video","completed":true},{"task":"smart_home","completed":true}]'::jsonb, 'Ultra-luxury Westlands penthouse with private rooftop terrace, jacuzzi, and chef kitchen. 4000 sqft of pure elegance.', ARRAY['penthouse', 'ultra-luxury', 'rooftop', 'westlands', 'smart-home']),
  ('Coastal Villa with Private Beach', 'coastal-villa-private-beach', 'Exclusive 6BR villa with direct beach access on the Kenyan coast.', 'An extraordinary 6-bedroom villa set on 2 acres of manicured grounds with 200m of private beach frontage. Features include an infinity pool overlooking the ocean, separate guest house, staff quarters for 4, and a tropical garden with mature coconut palms. A once-in-a-lifetime opportunity.', 'residential', 'villa', 'available', 'nyali', 'cynthia-kimani', 'sale', 250000000, 'KES', 6, 5, 8000, 'Diani Beach Road, Kwale', true, now() - interval '1 day', 'https://matterport.com/demo/tour5', 'https://example.com/floorplans/diani-villa.pdf', 150000, 30000, true, 'before_viewing', 7500000, '3% commission on final sale price', 'https://youtube.com/watch?v=demo5', 'youtube', 'Kenya', 'Kwale', 'Diani', NULL, 'Diani Beach', NULL, 'fully-furnished', NULL, NULL, 'Private beach access, infinity pool, guest house, staff quarters included', 92, '[{"task":"photos","completed":true},{"task":"virtual_tour","completed":true},{"task":"floor_plan","completed":true},{"task":"description","completed":true},{"task":"pricing","completed":true},{"task":"video","completed":true},{"task":"aerial_footage","completed":true}]'::jsonb, 'Exclusive 6-bedroom villa with 200m private beach frontage in Diani. Infinity pool, guest house, tropical garden.', ARRAY['villa', 'beachfront', 'private-beach', 'diani', 'luxury', 'oceanfront'])
) AS v(title, slug, excerpt, description, category_slug, type_slug, status_slug, location_slug, agent_slug, listing_type, price, currency, bedrooms, bathrooms, area_sqft, address, featured, published_at, validation_status, listing_expires_at, auto_renew, syndicated, promoted_until, virtual_tour_url, floor_plan_url, house_hunting_fee, viewing_fee, fees_refundable, fee_payment, commission_kes, commission_notes, video_url, video_provider, country, county, town, neighbourhood, landmark, available_from, furnished_status, lease_period, deposit_kes, utilities_info, marketing_score, marketing_checklist, ai_captions, suggested_hashtags)
ON CONFLICT (slug) DO NOTHING;

-- Property images (5 per property, satisfies min-5 trigger for V2)
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

-- Property amenities (3-5 per property)
INSERT INTO public.property_amenities (property_id, amenity_id)
SELECT p.id, a.id
FROM public.properties p
CROSS JOIN public.amenities a
WHERE
  (p.slug = 'luxury-4br-apartment-westlands' AND a.slug IN ('swimming-pool', 'gym', 'parking', 'security', 'rooftop-terrace'))
  OR (p.slug = 'modern-villa-kilimani' AND a.slug IN ('parking', 'security', 'garden', 'backup-power'))
  OR (p.slug = 'beachfront-apartment-nyali' AND a.slug IN ('swimming-pool', 'security', 'parking'))
  OR (p.slug = 'executive-rental-kileleshwa' AND a.slug IN ('parking', 'security', 'garden', 'backup-power'))
  OR (p.slug = 'commercial-office-park-mombasa-rd' AND a.slug IN ('parking', 'security', 'backup-power', 'concierge'))
  OR (p.slug = 'penthouse-suite-westlands' AND a.slug IN ('swimming-pool', 'gym', 'parking', 'security', 'rooftop-terrace'))
  OR (p.slug = 'coastal-villa-private-beach' AND a.slug IN ('swimming-pool', 'security', 'garden', 'backup-power'))
ON CONFLICT DO NOTHING;

-- Publish properties now that they have images
UPDATE public.properties
SET publish_status = 'published'::property_publish_status
WHERE slug IN (
  'luxury-4br-apartment-westlands',
  'modern-villa-kilimani',
  'beachfront-apartment-nyali',
  'executive-rental-kileleshwa',
  'commercial-office-park-mombasa-rd',
  'prime-development-land-athi-river',
  'penthouse-suite-westlands',
  'coastal-villa-private-beach'
);

-- Blog posts (4 posts)
INSERT INTO public.blog_posts (title, slug, excerpt, content, featured_image, category_id, status, featured, reading_minutes, published_at, gallery_images)
SELECT
  title, slug, excerpt, content, featured_image,
  (SELECT id FROM public.blog_categories WHERE slug = category_slug),
  status::blog_post_status, featured, reading_minutes, published_at, gallery_images::jsonb
FROM (VALUES
  ('5 Things to Know Before Buying in Nairobi', '5-things-before-buying-nairobi', 'The Nairobi property market moves fast. Here is what every buyer should research before making an offer.', 'The Nairobi real estate market has seen remarkable growth over the past decade, with emerging neighborhoods offering excellent value for both investors and homebuyers. Before making your purchase, consider these five critical factors that our team of local experts has identified through facilitating over 500 transactions across the city.\n\nFirst, research location appreciation trends thoroughly. Areas like Westlands and Kilimani have shown consistent 8-12% annual appreciation, while newer corridors along Mombasa Road are rapidly catching up as infrastructure improves.\n\nSecond, always verify the title deed at the lands registry. This simple step has saved our clients from costly disputes. We recommend working with a reputable law firm and never proceeding without a clean, verified title.\n\nThird, understand the full cost of ownership. Service charges, maintenance levies, and utility deposits can add 15-20% to your monthly costs beyond the mortgage or rent.\n\nFourth, consider the rental yield potential if you are investing. Prime areas currently deliver 6-9% gross yields, with coastal properties occasionally exceeding 10% during peak tourism season.\n\nFinally, work with an agent who knows the local market intimately. At Bright Edge, every agent specializes in specific neighborhoods, ensuring you get expert guidance tailored to your exact requirements.', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&q=80', 'buying-guide', 'published', true, 6, now() - interval '3 days', jsonb_build_array(
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80',
    'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&q=80'
  )),
  ('Why Coastal Properties Are the Smart Investment', 'coastal-properties-smart-investment', 'Kenyan coast real estate offers strong rental yields and long-term capital appreciation.', 'The Kenyan coastline, stretching from Diani in the south to Lamu in the north, has become one of East Africa most sought-after real estate markets. With tourism numbers rebounding strongly post-pandemic and major infrastructure projects underway, coastal properties are delivering rental yields of 8-12% annually.\n\nThe key driver is the growing digital nomad and remote worker trend. Professionals from Europe and North America are increasingly choosing the Kenyan coast as a base, creating strong demand for quality short-term rentals. Properties within 500m of the beach command premium rates, often fully occupied during the November-March high season.\n\nNyali and Diani stand out as the strongest performers. Nyali benefits from proximity to Mombasa city and the international airport, while Diani offers a more relaxed, resort-style environment that attracts longer-staying guests.\n\nInfrastructure improvements are accelerating growth. The expansion of the Mombasa-Nairobi highway has reduced travel time significantly, while new water and electricity connections have made previously remote areas viable for development.\n\nFor investors, the sweet spot is a 2-3 bedroom apartment with ocean views, positioned within walking distance to amenities. These units consistently achieve the highest occupancy rates and rental yields on the coast.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', 'market-insights', 'published', true, 8, now() - interval '6 days', jsonb_build_array(
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80'
  )),
  ('A Guide to Executive Rentals in Kenya', 'guide-executive-rentals-kenya', 'Everything expats and executives need to know about renting in Nairobi.', 'Relocating to Nairobi for work? The executive rental market offers a range of options from fully-furnished apartments in Westlands to spacious family homes in Kilimani and Kileleshwa. This comprehensive guide covers everything you need to know before signing your lease.\n\nAverage rental prices vary significantly by location and property type. A furnished 2-bedroom apartment in Westlands ranges from KES 150,000-300,000 per month, while a 4-bedroom family home in Kilimani or Kileleshwa typically rents for KES 250,000-500,000 monthly. These rates usually include basic furnishings and sometimes service charges.\n\nWhen evaluating properties, prioritize security, proximity to your workplace, and access to international schools if you have children. The top compounds offer 24-hour guards, CCTV, backup generators, and recreational facilities.\n\nMost executive leases run for 12-24 months, with rent payable quarterly in advance. A security deposit equivalent to one or two months rent is standard. Ensure your lease clearly outlines maintenance responsibilities, notice periods, and what happens if you need to break the lease early.\n\nAt Bright Edge, we specialize in matching executives with properties that fit their lifestyle and budget. Our lettings team handles everything from property viewings to lease negotiation and move-in coordination, ensuring a smooth transition to your new home.', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80', 'buying-guide', 'published', false, 5, now() - interval '10 days', jsonb_build_array(
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80'
  )),
  ('Living in Kilimani: Neighborhood Guide', 'living-kilimani-neighborhood-guide', 'Why Kilimani remains one of Nairobi most desirable residential neighborhoods.', 'Kilimani has evolved from a quiet residential suburb into one of Nairobi most vibrant neighborhoods, blending upscale living with excellent amenities. This guide explores what makes Kilimani special and why it remains one of the most desirable places to live in the capital.\n\nThe dining scene along Argwings Kodhek Road is a major draw. From casual brunch spots to upscale restaurants, the area offers diverse culinary options within walking distance. On weekends, the neighborhood buzzes with activity as residents enjoy the cafe culture and nightlife.\n\nFamilies are drawn to Kilimani for its proximity to top international schools. The Aga Khan Academy, Braeburn School, and several other reputable institutions are within easy commuting distance, making the area ideal for expatriate and Kenyan families alike.\n\nThe real estate mix is diverse, ranging from older, spacious bungalows on large plots to modern high-rise apartments with contemporary finishes. Recent developments have introduced smart home features, rooftop amenities, and co-working spaces that appeal to young professionals.\n\nCommunity is at the heart of Kilimani appeal. Regular neighborhood events, active resident associations, and shared green spaces create a sense of belonging that is rare in Nairobi newer developments. Whether you are buying or renting, Kilimani offers a lifestyle that balances convenience, comfort, and community.', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80', 'lifestyle', 'published', false, 7, now() - interval '15 days', jsonb_build_array(
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80',
    'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&q=80',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80'
  ))
) AS v(title, slug, excerpt, content, featured_image, category_slug, status, featured, reading_minutes, published_at, gallery_images)
ON CONFLICT (slug) DO NOTHING;

-- Blog post tags
INSERT INTO public.blog_post_tags (post_id, tag_id)
SELECT bp.id, bt.id
FROM public.blog_posts bp
CROSS JOIN public.blog_tags bt
WHERE
  (bp.slug = '5-things-before-buying-nairobi' AND bt.slug IN ('nairobi', 'first-time-buyer'))
  OR (bp.slug = 'coastal-properties-smart-investment' AND bt.slug IN ('investment', 'coast'))
  OR (bp.slug = 'guide-executive-rentals-kenya' AND bt.slug IN ('nairobi', 'first-time-buyer'))
  OR (bp.slug = 'living-kilimani-neighborhood-guide' AND bt.slug IN ('nairobi', 'luxury'))
ON CONFLICT DO NOTHING;

-- Property reviews (3 reviews)
INSERT INTO public.property_reviews (title, slug, excerpt, content, featured_image, property_id, location_id, rating, status, featured, published_at, gallery_images)
SELECT
  title, slug, excerpt, content, featured_image,
  (SELECT id FROM public.properties WHERE slug = property_slug),
  (SELECT id FROM public.locations WHERE slug = location_slug),
  rating, status::review_status, featured, published_at, gallery_images::jsonb
FROM (VALUES
  ('Why We Chose Westlands', 'why-we-chose-westlands', 'A young family shares their journey to finding the perfect apartment in Westlands.', 'After months of searching across Nairobi, we finally found our dream apartment in Westlands. The location offers everything we need: proximity to excellent schools, a short commute to work, and a vibrant social scene that makes coming home feel like a retreat.\n\nOur agent Amina made the process seamless from start to finish. She understood our requirements immediately and only showed us properties that matched our criteria. Within two weeks of engaging her, we had viewed five excellent options and found the one that felt like home.\n\nThe building amenities exceeded our expectations. The rooftop pool has become our favorite weekend spot, and the well-equipped gym means we no longer need a separate gym membership. The 24-hour security and controlled access give us peace of mind.\n\nWhat surprised us most was the sense of community in the building. Neighbors are friendly without being intrusive, and the management organizes regular social events. For a young family new to Nairobi, this made all the difference.', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', 'luxury-4br-apartment-westlands', 'westlands', 5.0, 'published', true, now() - interval '4 days', jsonb_build_array(
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80'
  )),
  ('Coastal Living at Its Finest', 'coastal-living-finest', 'How a holiday home in Nyali became our permanent residence.', 'We initially purchased our Nyali apartment as a holiday retreat, but the lifestyle was so compelling that within six months we decided to make it our permanent home. The ocean views never get old, the community is welcoming, and the rental income when we travel more than covers our mortgage.\n\nThe apartment itself is beautifully designed with an open-plan layout that maximizes the sea breeze. Large sliding doors open onto a wide terrace where we take most of our meals. Watching the dhows sail past at sunset has become our daily ritual.\n\nCynthia and the Bright Edge team made the entire process stress-free, even though we were purchasing from abroad. Video calls, detailed photos, and regular updates meant we felt fully informed at every stage.\n\nThe Nyali community is a mix of Kenyan families, expats, and international residents. There is always something happening, from beach clean-ups to social gatherings. Our children have made friends from around the world.', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80', 'beachfront-apartment-nyali', 'nyali', 4.5, 'published', true, now() - interval '8 days', jsonb_build_array(
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80'
  )),
  ('Smart Investment in Mombasa Road Corridor', 'smart-investment-mombasa-road', 'Why our commercial property purchase was the best business decision we made.', 'When we decided to invest in commercial real estate along Mombasa Road, we turned to Bright Edge for their market expertise. David identified an office park with excellent tenant demand and strong rental yields that aligned perfectly with our investment strategy.\n\nThe property was newly developed with modern specifications: high-speed lifts, fiber internet connectivity, backup power, and ample parking. These features made it immediately attractive to corporate tenants, and we secured our first lease within 60 days.\n\nTwo years later, the property is fully let and generating returns that exceeded our initial projections by 15%. The location continues to appreciate as infrastructure in the area improves.\n\nWhat sets this investment apart is the quality of the tenants. We have a mix of established corporates and growing tech companies, all on 3-5 year leases with annual escalations.', 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1200&q=80', 'commercial-office-park-mombasa-rd', 'mombasa-road', 4.0, 'published', false, now() - interval '20 days', jsonb_build_array(
    'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?w=1600&q=80',
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=80'
  ))
) AS v(title, slug, excerpt, content, featured_image, property_slug, location_slug, rating, status, featured, published_at, gallery_images)
ON CONFLICT (slug) DO NOTHING;

-- Testimonials (4 testimonials)
INSERT INTO public.testimonials (author_name, author_title, author_photo, quote, rating, featured, published, display_order) VALUES
  ('James and Sarah Kimani', 'Homeowners, Westlands', 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=200&q=80', 'Bright Edge made our first home purchase a wonderful experience. Amina understood exactly what we were looking for and found us the perfect apartment within our budget. The entire process was transparent and stress-free.', 5, true, true, 1),
  ('Michael Ochieng', 'Investor, Mombasa Road', 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=200&q=80', 'I have now purchased three investment properties through Bright Edge. Their market knowledge is unmatched, and David has a knack for finding properties with strong rental yield potential. Highly recommend for serious investors.', 5, true, true, 2),
  ('Dr. Priya Sharma', 'Expat Resident, Kilimani', 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80', 'Relocating to Nairobi from London was daunting, but the Bright Edge team made it seamless. Brian found us a beautiful furnished townhouse in Kilimani that checked every box. Their expat relocation service is world-class.', 5, true, true, 3),
  ('Robert and Lisa Mwangi', 'Coastal Property Owners', 'https://images.unsplash.com/photo-1542206395-9feb3edaa68d?w=200&q=80', 'Cynthia helped us find our dream beach house in Diani. Even though we were based in Nairobi, she handled everything remotely with video calls and detailed photos. We are now the proud owners of a stunning coastal retreat.', 4, false, true, 4)
ON CONFLICT DO NOTHING;

-- Inquiries (5 sample leads)
INSERT INTO public.inquiries (property_id, full_name, email, phone, message, status, source, created_at)
SELECT
  (SELECT id FROM public.properties WHERE slug = property_slug),
  full_name, email, phone, message, status::lead_status, source::lead_source, created_at
FROM (VALUES
  ('luxury-4br-apartment-westlands', 'Peter Kamau', 'peter.kamau@email.com', '+254722111001', 'I am interested in viewing the Westlands apartment this weekend. Is Saturday morning possible? I am a cash buyer and ready to move quickly.', 'new', 'website_form', now() - interval '1 day'),
  ('modern-villa-kilimani', 'Grace Wanjiku', 'grace.w@email.com', '+254722111002', 'Could you share more details about the Kilimani villa? Specifically the service charge, parking, and whether pets are allowed. We are a family of 5 relocating from Mombasa.', 'contacted', 'property_inquiry', now() - interval '3 days'),
  ('beachfront-apartment-nyali', 'Thomas Bergmann', 'thomas.b@email.de', '+49170123456', 'I am a German investor looking at coastal properties for holiday rental income. Is the Nyali apartment still available? What are the expected rental yields?', 'qualified', 'contact_page', now() - interval '5 days'),
  ('executive-rental-kileleshwa', 'UN Habitat Office', 'procurement@unhabitat.org', '+254207621234', 'We need a fully furnished 3-bed executive rental for a senior staff member arriving next month. The Kileleshwa property looks suitable. Please share terms and availability.', 'viewing_scheduled', 'referral', now() - interval '7 days'),
  (NULL, 'James Odhiambo', 'james.odhiambo@email.com', '+254722111005', 'I am looking to sell my 4-acre plot in Athi River. Can Bright Edge help with valuation and listing? It has approved mixed-use plans.', 'new', 'contact_page', now() - interval '2 days')
) AS v(property_slug, full_name, email, phone, message, status, source, created_at)
ON CONFLICT DO NOTHING;

-- Contact requests (3 general inquiries)
INSERT INTO public.contact_requests (full_name, email, phone, subject, message, status, created_at) VALUES
  ('Alice Muthoni', 'alice.m@email.com', '+254722111010', 'Property Valuation', 'I would like to get a valuation for my 3-bedroom apartment in Kilimani. What is the process?', 'new'::lead_status, now() - interval '2 days'),
  ('Samuel Kibe', 'sam.kibe@email.com', '+254722111011', 'Investment Advice', 'I have a budget of KES 50M and am looking for investment property advice. Can we schedule a call?', 'new'::lead_status, now() - interval '4 days'),
  ('Nairobi Tech Ltd', 'office@nairobi-tech.co.ke', '+254722111012', 'Office Space', 'We are a 50-person tech company looking for 5000+ sqft office space. Do you have availability along Mombasa Road?', 'contacted'::lead_status, now() - interval '6 days')
ON CONFLICT DO NOTHING;

-- Newsletter subscribers
INSERT INTO public.newsletter_subscribers (email, full_name, subscribed) VALUES
  ('subscriber1@email.com', 'John Doe', true),
  ('subscriber2@email.com', 'Jane Smith', true),
  ('subscriber3@email.com', 'Alex Kimani', true),
  ('investor@email.com', 'Investor Mike', true),
  ('expats@email.com', 'Expat Community', true)
ON CONFLICT (email) DO NOTHING;

-- Activity logs (sample audit trail)
INSERT INTO public.activity_logs (action, entity_type, entity_id, metadata, created_at) VALUES
  ('property_created', 'properties', (SELECT id FROM public.properties WHERE slug = 'luxury-4br-apartment-westlands'), '{"source": "seed"}'::jsonb, now() - interval '2 days'),
  ('property_published', 'properties', (SELECT id FROM public.properties WHERE slug = 'luxury-4br-apartment-westlands'), '{"source": "seed"}'::jsonb, now() - interval '2 days'),
  ('inquiry_received', 'inquiries', (SELECT id FROM public.inquiries WHERE email = 'peter.kamau@email.com'), '{"source": "website_form"}'::jsonb, now() - interval '1 day'),
  ('agent_created', 'agents', (SELECT id FROM public.agents WHERE slug = 'amina-mwangi'), '{"source": "seed"}'::jsonb, now() - interval '30 days'),
  ('settings_updated', 'settings', null, '{"fields": ["company_name", "tagline"]}'::jsonb, now() - interval '10 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- V2 ADDITIONS: Short links, QR codes, lead sources, agent documents
-- ============================================================

-- Short links (sample tracking links)
INSERT INTO public.short_links (code, target_type, target_id, target_path, long_url, click_count, created_at)
SELECT code, target_type::short_link_target_type, target_id, target_path, long_url, click_count, created_at
FROM (VALUES
  ('lux4br', 'property', (SELECT id FROM public.properties WHERE slug = 'luxury-4br-apartment-westlands'), '/properties/luxury-4br-apartment-westlands', 'https://brightedge.co.ke/properties/luxury-4br-apartment-westlands', 45, now() - interval '2 days'),
  ('modvil', 'property', (SELECT id FROM public.properties WHERE slug = 'modern-villa-kilimani'), '/properties/modern-villa-kilimani', 'https://brightedge.co.ke/properties/modern-villa-kilimani', 32, now() - interval '5 days'),
  ('beachny', 'property', (SELECT id FROM public.properties WHERE slug = 'beachfront-apartment-nyali'), '/properties/beachfront-apartment-nyali', 'https://brightedge.co.ke/properties/beachfront-apartment-nyali', 67, now() - interval '1 day'),
  ('aminam', 'agent', (SELECT id FROM public.agents WHERE slug = 'amina-mwangi'), '/agents/amina-mwangi', 'https://brightedge.co.ke/agents/amina-mwangi', 28, now() - interval '10 days')
) AS v(code, target_type, target_id, target_path, long_url, click_count, created_at)
ON CONFLICT (code) DO NOTHING;

-- Property QR codes (sample QR codes for properties)
INSERT INTO public.property_qr_codes (property_id, short_link_id, storage_path, public_url, format, byte_size)
SELECT p.id, sl.id, storage_path, public_url, format, byte_size
FROM public.properties p
JOIN public.short_links sl ON sl.target_id = p.id
CROSS JOIN LATERAL (VALUES
  ('qr_codes/' || p.slug || '.png', 'https://storage.brightedge.co.ke/qr/' || p.slug || '.png', 'png', 45000)
) AS q(storage_path, public_url, format, byte_size)
WHERE p.slug IN ('luxury-4br-apartment-westlands', 'modern-villa-kilimani', 'beachfront-apartment-nyali')
ON CONFLICT DO NOTHING;

-- Lead sources (sample attribution data)
INSERT INTO public.lead_sources (inquiry_id, property_id, channel, referrer, utm_source, utm_medium, utm_campaign, created_at)
SELECT
  (SELECT id FROM public.inquiries WHERE email = 'peter.kamau@email.com'),
  (SELECT id FROM public.properties WHERE slug = 'luxury-4br-apartment-westlands'),
  'short_link'::lead_source_channel, 'https://facebook.com', 'facebook', 'social', 'q3_2024_campaign', now() - interval '1 day'
ON CONFLICT DO NOTHING;

INSERT INTO public.lead_sources (inquiry_id, property_id, channel, referrer, utm_source, utm_medium, created_at)
SELECT
  (SELECT id FROM public.inquiries WHERE email = 'grace.w@email.com'),
  (SELECT id FROM public.properties WHERE slug = 'modern-villa-kilimani'),
  'website'::lead_source_channel, 'https://google.com', 'google', 'organic', now() - interval '3 days'
ON CONFLICT DO NOTHING;

-- Agent documents (sample verification documents)
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

-- Agent social accounts (sample social media links)
INSERT INTO public.agent_social_accounts (agent_id, platform, handle, url, is_verified)
SELECT
  (SELECT id FROM public.agents WHERE slug = 'amina-mwangi'),
  platform::social_platform, handle, url, is_verified
FROM (VALUES
  ('linkedin', 'amina-mwangi', 'https://linkedin.com/in/amina-mwangi', true),
  ('instagram', 'amina.brightedge', 'https://instagram.com/amina.brightedge', false)
) AS v(platform, handle, url, is_verified)
ON CONFLICT DO NOTHING;

-- Agent areas (sample areas of operation)
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

-- Projects (sample development projects)
INSERT INTO public.projects (name, slug, developer, country, county, town, neighbourhood, description, hero_image, launch_date, completion_date, status)
VALUES
  ('Westlands Heights', 'westlands-heights', 'Bright Edge Developers', 'Kenya', 'Nairobi', 'Nairobi', 'Westlands', 'Premium mixed-use development featuring residential apartments, retail spaces, and office suites in the heart of Westlands.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&q=80', '2024-01-15', '2026-06-30', 'under_construction'),
  ('Coastal Paradise', 'coastal-paradise', 'Ocean View Estates', 'Kenya', 'Kwale', 'Diani', 'Diani Beach', 'Luxury beachfront development with direct ocean access, private pools, and world-class amenities.', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1200&q=80', '2024-03-01', '2027-12-31', 'planning')
ON CONFLICT (slug) DO NOTHING;

-- Link some properties to projects
UPDATE public.properties SET project_id = (SELECT id FROM public.projects WHERE slug = 'westlands-heights')
WHERE slug = 'luxury-4br-apartment-westlands';

UPDATE public.properties SET project_id = (SELECT id FROM public.projects WHERE slug = 'coastal-paradise')
WHERE slug = 'beachfront-apartment-nyali';

