import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const settingsQuery = queryOptions({
  queryKey: ["settings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  staleTime: 5 * 60 * 1000,
});

const propertyListSelect = `
  id, title, slug, excerpt, meta_description, price, currency, price_period,
  bedrooms, bathrooms, area_sqft, featured, listing_type, address, created_at, published_at,
  location:locations(id,name,slug),
  property_type:property_types(id,name,slug),
  status:property_statuses(id,name,slug,color),
  category:property_categories(id,name,slug),
  agent:agents(id,full_name,slug,photo,phone,whatsapp,email),
  images:property_images(id,image_url,alt_text,image_order,is_featured)
`;

export type PropertyListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  meta_description: string | null;
  price: number;
  currency: string;
  price_period: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  featured: boolean;
  listing_type: "sale" | "rent";
  address: string | null;
  created_at: string;
  published_at: string | null;
  location: { id: string; name: string; slug: string } | null;
  property_type: { id: string; name: string; slug: string } | null;
  status: { id: string; name: string; slug: string; color: string | null } | null;
  category: { id: string; name: string; slug: string } | null;
  agent: {
    id: string; full_name: string; slug: string; photo: string | null;
    phone: string | null; whatsapp: string | null; email: string | null;
  } | null;
  images: Array<{ id: string; image_url: string; alt_text: string | null; image_order: number; is_featured: boolean }>;
};

export const featuredPropertiesQuery = queryOptions({
  queryKey: ["properties", "featured"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("properties")
      .select(propertyListSelect)
      .eq("publish_status", "published")
      .eq("featured", true)
      .order("published_at", { ascending: false })
      .limit(6);
    if (error) throw error;
    return (data ?? []) as unknown as PropertyListItem[];
  },
  staleTime: 60_000,
});

export const allPropertiesQuery = queryOptions({
  queryKey: ["properties", "all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("properties")
      .select(propertyListSelect)
      .eq("publish_status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as PropertyListItem[];
  },
  staleTime: 60_000,
});

export const propertyBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["property", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          ${propertyListSelect},
          description, meta_title, year_built, parking,
          property_amenities(amenity:amenities(id,name,slug,icon))
        `)
        .eq("slug", slug)
        .eq("publish_status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const allReviewsQuery = queryOptions({
  queryKey: ["reviews"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("property_reviews")
      .select(`
        id, title, slug, excerpt, featured_image, rating, featured, published_at,
        property:properties(id,title,slug,location:locations(name,slug))
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 60_000,
});

export const reviewBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["review", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_reviews")
        .select(`
          *,
          property:properties(id,title,slug,location:locations(name,slug),images:property_images(image_url,image_order))
        `)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const allBlogPostsQuery = queryOptions({
  queryKey: ["blog", "all"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select(`
        id, title, slug, excerpt, featured_image, gallery_images, reading_minutes, featured, published_at,
        category:blog_categories(id,name,slug)
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 60_000,
});

export const blogPostBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["blog", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select(`*, category:blog_categories(id,name,slug)`)
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const allAgentsQuery = queryOptions({
  queryKey: ["agents"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("active", true)
      .order("display_order");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 5 * 60 * 1000,
});

export const agentBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["agent", slug],
    queryFn: async () => {
      const { data: agent, error } = await supabase
        .from("agents")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();
      if (error) throw error;
      if (!agent) return null;
      const { data: properties } = await supabase
        .from("properties")
        .select(propertyListSelect)
        .eq("agent_id", agent.id)
        .eq("publish_status", "published")
        .order("published_at", { ascending: false });
      return { agent, properties: (properties ?? []) as unknown as PropertyListItem[] };
    },
  });

export const testimonialsQuery = queryOptions({
  queryKey: ["testimonials"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("published", true)
      .order("display_order");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 5 * 60 * 1000,
});

export const locationsQuery = queryOptions({
  queryKey: ["locations"],
  queryFn: async () => {
    const { data, error } = await supabase.from("locations").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 5 * 60 * 1000,
});
