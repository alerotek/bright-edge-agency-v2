/**
 * Marketplace Platform — Server Functions
 * Listing limits, KYC, owner profiles, analytics tracking
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client.server";

/* ─── LISTING LIMITS ─── */

export const checkListingLimit = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z.object({ userId: z.string(), ownerType: z.enum(["bright_edge", "independent_agent", "home_owner", "developer", "property_management"]) }).parse(data)
  )
  .handler(async ({ data }) => {
    const { data: result } = await supabase.rpc("check_listing_limit", {
      p_user_id: data.userId,
      p_owner_type: data.ownerType,
    });
    return result;
  });

export const incrementListingUsage = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({ userId: z.string(), ownerType: z.enum(["bright_edge", "independent_agent", "home_owner", "developer", "property_management"]) }).parse(data)
  )
  .handler(async ({ data }) => {
    const { error } = await supabase.rpc("increment_listing_usage", {
      p_user_id: data.userId,
      p_owner_type: data.ownerType,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  });

/* ─── KYC DOCUMENTS ─── */

export const uploadKycDocument = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({
      userId: z.string().uuid(),
      documentType: z.enum(["national_id", "passport", "business_registration", "proof_of_ownership", "license", "utility_bill", "profile_photo"]),
      documentUrl: z.string().url(),
      storagePath: z.string().optional(),
      documentNumber: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { error } = await supabase.from("kyc_documents").insert({
      user_id: data.userId,
      document_type: data.documentType,
      document_url: data.documentUrl,
      storage_path: data.storagePath,
      document_number: data.documentNumber,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  });

export const getKycDocuments = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ userId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: docs, error } = await supabase
      .from("kyc_documents")
      .select("*")
      .eq("user_id", data.userId)
      .order("created_at", { ascending: false });
    if (error) return { documents: [] };
    return { documents: docs ?? [] };
  });

/* ─── HOME OWNER PROFILES ─── */

export const getHomeOwnerBySlug = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ slug: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const { data: owner, error } = await supabase
      .from("home_owners")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error || !owner) return null;
    return owner;
  });

export const getHomeOwnerListings = createServerFn({ method: "GET" })
  .validator((data: unknown) => z.object({ ownerId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { data: listings } = await supabase
      .from("properties")
      .select("id, title, slug, price, currency, listing_type, property_category, address, bedrooms, bathrooms, area_sqft, created_at")
      .eq("listing_owner_id", data.ownerId)
      .in("property_status", ["published", "featured", "sold", "rented"])
      .order("created_at", { ascending: false });
    return listings ?? [];
  });

/* ─── REPUTATION & REVIEWS ─── */

export const getReputationScore = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z.object({ entityType: z.enum(["agent", "home_owner", "property"]), entityId: z.string().uuid() }).parse(data)
  )
  .handler(async ({ data }) => {
    const { data: score } = await supabase
      .from("reputation_scores")
      .select("*")
      .eq("entity_type", data.entityType)
      .eq("entity_id", data.entityId)
      .maybeSingle();
    return score;
  });

export const getMarketplaceReviews = createServerFn({ method: "GET" })
  .validator((data: unknown) =>
    z.object({ entityType: z.enum(["agent", "home_owner", "property"]), entityId: z.string().uuid() }).parse(data)
  )
  .handler(async ({ data }) => {
    const { data: reviews } = await supabase
      .from("marketplace_reviews")
      .select("*, reviewer:auth.users(full_name)")
      .eq("entity_type", data.entityType)
      .eq("entity_id", data.entityId)
      .order("created_at", { ascending: false })
      .limit(20);
    return reviews ?? [];
  });

export const submitReview = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({
      reviewerId: z.string().uuid(),
      entityType: z.enum(["agent", "home_owner", "property"]),
      entityId: z.string().uuid(),
      rating: z.number().min(1).max(5),
      title: z.string().max(200).optional(),
      reviewText: z.string().max(2000).optional(),
      pros: z.string().max(500).optional(),
      cons: z.string().max(500).optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { error } = await supabase.from("marketplace_reviews").insert({
      reviewer_id: data.reviewerId,
      entity_type: data.entityType,
      entity_id: data.entityId,
      rating: data.rating,
      title: data.title,
      review_text: data.reviewText,
      pros: data.pros,
      cons: data.cons,
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  });

/* ─── ANALYTICS TRACKING ─── */

export const trackListingView = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ propertyId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const today = new Date().toISOString().split("T")[0];
    await supabase.rpc("exec_sql", {
      sql: `INSERT INTO listing_analytics (property_id, date, views) VALUES ('${data.propertyId}', '${today}', 1)
            ON CONFLICT (property_id, date) DO UPDATE SET views = listing_analytics.views + 1`,
    });
  });

export const trackListingContact = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ propertyId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const today = new Date().toISOString().split("T")[0];
    await supabase.rpc("exec_sql", {
      sql: `INSERT INTO listing_analytics (property_id, date, contacts) VALUES ('${data.propertyId}', '${today}', 1)
            ON CONFLICT (property_id, date) DO UPDATE SET contacts = listing_analytics.contacts + 1`,
    });
  });

export const trackSearch = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({
      query: z.string(),
      resultsCount: z.number(),
      filters: z.any().optional(),
      source: z.string().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    await supabase.from("search_analytics").insert({
      search_query: data.query,
      results_count: data.resultsCount,
      filters: data.filters ?? {},
      source: data.source,
    });
  });

/* ─── MARKETPLACE QUERIES ─── */

export const getMarketplaceStats = createServerFn({ method: "GET" }).handler(async () => {
  const [totalProperties, totalAgents, totalOwners, totalReviews] = await Promise.all([
    supabase.from("properties").select("id", { count: "exact", head: true }),
    supabase.from("agents").select("id", { count: "exact", head: true }),
    supabase.from("home_owners").select("id", { count: "exact", head: true }),
    supabase.from("marketplace_reviews").select("id", { count: "exact", head: true }),
  ]);

  return {
    totalProperties: totalProperties.count ?? 0,
    totalAgents: totalAgents.count ?? 0,
    totalOwners: totalOwners.count ?? 0,
    totalReviews: totalReviews.count ?? 0,
  };
});