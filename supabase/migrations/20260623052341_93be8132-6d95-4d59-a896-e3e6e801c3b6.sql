
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
