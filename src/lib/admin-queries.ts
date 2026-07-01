import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const adminStatsQuery = queryOptions({
  queryKey: ["admin", "stats"],
  queryFn: async () => {
    const [properties, agents, inquiries, posts] = await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }),
      supabase.from("agents").select("id", { count: "exact", head: true }),
      supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("blog_posts").select("id", { count: "exact", head: true }),
    ]);
    return {
      properties: properties.count ?? 0,
      agents: agents.count ?? 0,
      newInquiries: inquiries.count ?? 0,
      blogPosts: posts.count ?? 0,
    };
  },
  staleTime: 30_000,
});

export const adminPropertiesQuery = queryOptions({
  queryKey: ["admin", "properties"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("properties")
      .select(`
        id, title, slug, price, currency, listing_type, publish_status, featured, created_at,
        marketing_score,
        location:locations(name),
        agent:agents(full_name),
        images:property_images(id)
      `)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 30_000,
});

export const adminAgentsQuery = queryOptions({
  queryKey: ["admin", "agents"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .order("display_order");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 60_000,
});

export const adminInquiriesQuery = queryOptions({
  queryKey: ["admin", "inquiries"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("inquiries")
      .select(`
        id, full_name, email, phone, message, status, source, created_at,
        property:properties(title, slug)
      `)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 15_000,
});

export const adminBlogPostsQuery = queryOptions({
  queryKey: ["admin", "blog"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select(`
        id, title, slug, status, featured, published_at, created_at,
        category:blog_categories(name)
      `)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 30_000,
});

export const adminReviewsQuery = queryOptions({
  queryKey: ["admin", "reviews"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("property_reviews")
      .select(`
        id, title, slug, status, featured, published_at, created_at,
        property:properties(title, slug)
      `)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 30_000,
});

export const adminLocationsQuery = queryOptions({
  queryKey: ["admin", "locations"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 60_000,
});

export const adminSettingsQuery = queryOptions({
  queryKey: ["admin", "settings"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  staleTime: 60_000,
});

export const propertyCategoriesQuery = queryOptions({
  queryKey: ["admin", "property-categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("property_categories").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
});

export const propertyTypesQuery = queryOptions({
  queryKey: ["admin", "property-types"],
  queryFn: async () => {
    const { data, error } = await supabase.from("property_types").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
});

export const propertyStatusesQuery = queryOptions({
  queryKey: ["admin", "property-statuses"],
  queryFn: async () => {
    const { data, error } = await supabase.from("property_statuses").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
});

export const amenitiesQuery = queryOptions({
  queryKey: ["admin", "amenities"],
  queryFn: async () => {
    const { data, error } = await supabase.from("amenities").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
});

export const blogCategoriesQuery = queryOptions({
  queryKey: ["admin", "blog-categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("blog_categories").select("*").order("name");
    if (error) throw error;
    return data ?? [];
  },
});

export const marketingAssetsQuery = queryOptions({
  queryKey: ["admin", "marketing", "assets"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("marketing_assets")
      .select(`
        id, asset_type, title, description, file_url, thumbnail_url,
        provider, provider_id, views_count, created_at,
        property:properties(id,title), agent:agents(id,full_name)
      `)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 30_000,
});

export const socialVideosQuery = queryOptions({
  queryKey: ["admin", "marketing", "videos"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("social_videos")
      .select(`
        id, title, description, video_url, provider, provider_video_id,
        thumbnail_url, published, created_at,
        property:properties(id,title), agent:agents(id,full_name)
      `)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 30_000,
});
