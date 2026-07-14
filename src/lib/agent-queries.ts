import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const currentAgentQuery = queryOptions({
  queryKey: ["agent", "current"],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from("agents")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
});

export const agentDashboardStatsQuery = queryOptions({
  queryKey: ["agent", "stats"],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!agent) throw new Error("Agent not found");

    const [properties, inquiries] = await Promise.all([
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("agent_id", agent.id).eq("publish_status", "published"),
      supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("agent_id", agent.id),
    ]);

    return {
      listings: properties.count ?? 0,
      inquiries: inquiries.count ?? 0,
    };
  },
  staleTime: 60_000,
});

const agentListingSelect = `
  id, title, slug, price, currency, price_period, listing_type,
  publish_status, created_at, published_at, validation_status,
  bedrooms, bathrooms, area_sqft,
  location:locations(id, name),
  images:property_images(id, image_url, is_featured)
`;

export const agentListingsQuery = queryOptions({
  queryKey: ["agent", "listings"],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data: agent } = await supabase
      .from("agents")
      .select("id, whatsapp")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!agent) return [];
    const { data, error } = await supabase
      .from("properties")
      .select(agentListingSelect)
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 30_000,
});

export const agentListingsWithAgentQuery = queryOptions({
  queryKey: ["agent", "listings", "with-agent"],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { listings: [], agent: null };
    const { data: agent } = await supabase
      .from("agents")
      .select("id, full_name, whatsapp, phone")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!agent) return { listings: [], agent: null };
    const { data, error } = await supabase
      .from("properties")
      .select(`
        ${agentListingSelect},
        excerpt,
        location:locations(id, name, slug)
      `)
      .eq("agent_id", agent.id)
      .eq("publish_status", "published")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return { listings: data ?? [], agent };
  },
  staleTime: 30_000,
});

export const agentInquiriesQuery = queryOptions({
  queryKey: ["agent", "inquiries"],
  queryFn: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data: agent } = await supabase
      .from("agents")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!agent) return [];
    const { data, error } = await supabase
      .from("inquiries")
      .select(`
        id, full_name, email, phone, message, status, source,
        inquiry_type, preferred_viewing_date, preferred_viewing_time,
        budget_kes, whatsapp_notified_at, created_at, updated_at,
        property:properties(id, title, slug)
      `)
      .eq("agent_id", agent.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 15_000,
});
