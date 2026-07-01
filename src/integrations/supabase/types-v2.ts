/**
 * BRIGHT EDGE V2 — Supplementary Type Layer
 * --------------------------------------------------------------
 * `types.ts` is the canonical, auto-generated Supabase type.
 * This module adds hand-curated V2 types and helpers for the new
 * tables introduced in migrations:
 *   - 20260629000000_v2_foundation.sql
 *   - 20260701000000_v2_short_links_qr_leads.sql
 *
 * When you regenerate `types.ts` (e.g. via `supabase gen types`),
 * the new tables will appear automatically and the types here
 * can be removed.
 */

import type { Database } from "./types";

// ============================================================
// V2 Enums
// ============================================================
export type AgentVerificationStatus =
  | "pending"
  | "under_review"
  | "verified"
  | "rejected";

export type VideoProviderEnum =
  | "youtube"
  | "tiktok"
  | "vimeo"
  | "other";

export type ListingValidationStatus =
  | "draft"
  | "pending_verification"
  | "active"
  | "needs_review"
  | "archived";

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "youtube"
  | "tiktok"
  | "website"
  | "other";

export type AgentDocumentKind =
  | "national_id_front"
  | "national_id_back"
  | "selfie"
  | "profile_photo"
  | "business_license"
  | "other";

export type ShortLinkTargetType =
  | "property"
  | "agent"
  | "listing"
  | "review"
  | "blog"
  | "landing"
  | "other";

export type RentalFeeTiming =
  | "before_viewing"
  | "after_viewing"
  | "on_agreement"
  | "on_move_in"
  | "on_first_month";

export type LeadSourceChannel =
  | "website"
  | "whatsapp"
  | "facebook"
  | "instagram"
  | "twitter"
  | "linkedin"
  | "tiktok"
  | "qr"
  | "short_link"
  | "email"
  | "phone"
  | "referral"
  | "other";

// ============================================================
// V2 Row types (mirror the new tables in the migration)
// ============================================================
export type AgentVerificationRow = {
  id: string;
  agent_id: string;
  status: AgentVerificationStatus;
  submitted_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
  documents: any;                  // jsonb
  created_at: string;
  updated_at: string;
};

export type AgentDocumentRow = {
  id: string;
  agent_id: string;
  kind: AgentDocumentKind;
  storage_path: string;
  public_url: string | null;
  mime_type: string | null;
  byte_size: number | null;
  uploaded_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_status: "pending" | "approved" | "rejected";
  review_notes: string | null;
};

export type AgentSocialAccountRow = {
  id: string;
  agent_id: string;
  platform: SocialPlatform;
  handle: string;
  url: string;
  is_verified: boolean;
  created_at: string;
};

export type AgentAreaRow = {
  id: string;
  agent_id: string;
  country: string | null;
  county: string | null;
  town: string | null;
  neighbourhood: string | null;
  created_at: string;
};

export type ShortLinkRow = {
  id: string;
  code: string;
  target_type: ShortLinkTargetType;
  target_id: string | null;
  target_path: string;
  long_url: string;
  created_by: string | null;
  expires_at: string | null;
  click_count: number;
  created_at: string;
};

export type PropertyQrCodeRow = {
  id: string;
  property_id: string;
  short_link_id: string | null;
  storage_path: string;
  public_url: string;
  format: string;
  byte_size: number | null;
  generated_at: string;
};

export type LeadSourceRow = {
  id: string;
  inquiry_id: string | null;
  property_id: string | null;
  agent_id: string | null;
  short_link_id: string | null;
  channel: LeadSourceChannel;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  user_agent: string | null;
  ip_hash: string | null;
  country: string | null;
  created_at: string;
};

export type MarketingAssetRow = {
  id: string;
  property_id: string | null;
  asset_type: string;
  title: string | null;
  description: string | null;
  file_url: string | null;
  thumbnail_url: string | null;
  provider: string | null;
  provider_id: string | null;
  views_count: number;
  created_at: string;
  updated_at: string;
};

export type SocialVideoRow = {
  id: string;
  property_id: string | null;
  agent_id: string | null;
  video_url: string;
  provider: VideoProviderEnum;
  provider_video_id: string | null;
  title: string | null;
  description: string | null;
  thumbnail_url: string | null;
  published: boolean;
  created_at: string;
  updated_at: string;
};

export type ReferralPartnerRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  agency_id: string | null;
  commission_rate: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type SubscriptionRow = {
  id: string;
  agency_id: string | null;
  plan: string;
  status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
};

// ============================================================
// Augment the Database type with V2 additions (for IDE/IntelliSense).
// Supabase's createClient<Database>() is happy as long as the shape
// conforms. We do not change the auto-generated content; we extend.
// ============================================================
declare module "./types" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface Database {
    public: {
      Tables: Database["public"]["Tables"] & {
        agent_verifications: {
          Row: AgentVerificationRow;
          Insert: Partial<AgentVerificationRow> & Pick<AgentVerificationRow, "agent_id">;
          Update: Partial<AgentVerificationRow>;
          Relationships: [];
        };
        agent_documents: {
          Row: AgentDocumentRow;
          Insert: Partial<AgentDocumentRow> & Pick<AgentDocumentRow, "agent_id" | "kind" | "storage_path">;
          Update: Partial<AgentDocumentRow>;
          Relationships: [];
        };
        agent_social_accounts: {
          Row: AgentSocialAccountRow;
          Insert: Partial<AgentSocialAccountRow> & Pick<AgentSocialAccountRow, "agent_id" | "platform" | "handle" | "url">;
          Update: Partial<AgentSocialAccountRow>;
          Relationships: [];
        };
        agent_areas: {
          Row: AgentAreaRow;
          Insert: Partial<AgentAreaRow> & Pick<AgentAreaRow, "agent_id">;
          Update: Partial<AgentAreaRow>;
          Relationships: [];
        };
        short_links: {
          Row: ShortLinkRow;
          Insert: Partial<ShortLinkRow> & Pick<ShortLinkRow, "code" | "target_type" | "target_path" | "long_url">;
          Update: Partial<ShortLinkRow>;
          Relationships: [];
        };
        property_qr_codes: {
          Row: PropertyQrCodeRow;
          Insert: Partial<PropertyQrCodeRow> & Pick<PropertyQrCodeRow, "property_id" | "storage_path" | "public_url">;
          Update: Partial<PropertyQrCodeRow>;
          Relationships: [];
        };
        lead_sources: {
          Row: LeadSourceRow;
          Insert: Partial<LeadSourceRow> & Pick<LeadSourceRow, "channel">;
          Update: Partial<LeadSourceRow>;
          Relationships: [];
        };
        marketing_assets: {
          Row: MarketingAssetRow;
          Insert: Partial<MarketingAssetRow>;
          Update: Partial<MarketingAssetRow>;
          Relationships: [];
        };
        social_videos: {
          Row: SocialVideoRow;
          Insert: Partial<SocialVideoRow> & Pick<SocialVideoRow, "video_url" | "provider">;
          Update: Partial<SocialVideoRow>;
          Relationships: [];
        };
        referral_partners: {
          Row: ReferralPartnerRow;
          Insert: Partial<ReferralPartnerRow> & Pick<ReferralPartnerRow, "name" | "email">;
          Update: Partial<ReferralPartnerRow>;
          Relationships: [];
        };
        subscriptions: {
          Row: SubscriptionRow;
          Insert: Partial<SubscriptionRow>;
          Update: Partial<SubscriptionRow>;
          Relationships: [];
        };
      };
      Views: Database["public"]["Views"] & {
        public_property_view: {
          Row: PublicPropertyViewRow;
          Relationships: [];
        };
        public_agent_view: {
          Row: PublicAgentViewRow;
          Relationships: [];
        };
      };
      Enums: Database["public"]["Enums"] & {
        agent_verification_status: AgentVerificationStatus;
        video_provider: VideoProviderEnum;
        listing_validation_status: ListingValidationStatus;
        social_platform: SocialPlatform;
        agent_document_kind: AgentDocumentKind;
        short_link_target_type: ShortLinkTargetType;
        rental_fee_timing: RentalFeeTiming;
        lead_source_channel: LeadSourceChannel;
      };
    };
  }
}

// ============================================================
// Public view row types (these are what the browser should consume)
// ============================================================
export type PublicPropertyViewRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  meta_description: string | null;
  price: number;
  currency: string;
  price_period: string | null;
  listing_type: "sale" | "rent";
  publish_status: string;
  validation_status: ListingValidationStatus | null;
  featured: boolean;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqft: number | null;
  year_built: number | null;
  parking: number | null;
  address: string | null;
  country: string | null;
  county: string | null;
  town: string | null;
  neighbourhood: string | null;
  landmark: string | null;
  video_url: string | null;
  video_provider: string | null;
  house_hunting_fee_kes: number | null;
  viewing_fee_kes: number | null;
  fees_refundable: boolean;
  fee_payment_timing: RentalFeeTiming | null;
  promoted_until: string | null;
  listing_expires_at: string | null;
  created_at: string;
  published_at: string | null;
  updated_at: string;
  agent_id: string | null;
  location_id: string | null;
  property_type_id: string | null;
  status_id: string | null;
  category_id: string | null;
  virtual_tour_url: string | null;
  floor_plan_url: string | null;
};

export type PublicAgentViewRow = {
  id: string;
  slug: string;
  full_name: string;
  photo: string | null;
  bio: string | null;
  role: string | null;
  team_name: string | null;
  specializations: string[] | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  license_number: string | null;
  verification_status: AgentVerificationStatus | null;
  verification_level: string | null;
  public_badge: boolean;
  active: boolean;
  display_order: number;
  facebook_url: string | null;
  instagram_url: string | null;
  twitter_url: string | null;
  linkedin_url: string | null;
  youtube_url: string | null;
};
