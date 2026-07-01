/**
 * V2 Listing Validation Engine
 * --------------------------------------------------------------
 * Config-driven, side-effect-free, runs on the server.
 *
 * Replaces the V1 "manual approval" flow with automatic validation:
 *   - hard_fail  → blocks publish
 *   - soft fail  → reduces score; if total < threshold → "needs_review"
 *   - all pass   → "active" (auto-publish)
 *
 * The rules are defined here in TypeScript. Each rule returns:
 *   { passed: true }                               → contributes weight to score
 *   { passed: false, severity: "hard" | "soft", message }  → blocks or flags
 *
 * This module is consumed by:
 *   - Phase 3: server function `validate_property()` (DB or app)
 *   - Phase 3: agent portal listing form (live preview)
 *   - Phase 5: admin review queue (show validation errors)
 */

import { detectVideoProvider } from "@/lib/video-providers";

export type ValidationSeverity = "hard" | "soft";

export type ValidationIssue = {
  ruleId: string;
  field: string;
  message: string;
  severity: ValidationSeverity;
};

export type ValidationContext = {
  // shape mirrors a property row (V1 + V2 columns)
  title?: string | null;
  description?: string | null;
  excerpt?: string | null;
  price?: number | null;
  currency?: string | null;
  price_period?: string | null;
  listing_type?: "sale" | "rent" | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area_sqft?: number | null;
  address?: string | null;
  country?: string | null;
  county?: string | null;
  town?: string | null;
  // related data
  images?: Array<{ image_url: string; alt_text?: string | null; is_featured?: boolean }>;
  amenities?: Array<{ amenity_id: string }>;
  video_url?: string | null;
  // agent context
  agent?: { id: string; published_listing_count?: number } | null;
  // configurable threshold
  publishThreshold?: number;
  // safety: how many listings the agent has had reviewed/approved already
  agentListingsReviewedCount?: number;
};

export type ValidationResult = {
  passed: boolean;            // true if no hard fails
  score: number;              // 0..100
  status: "active" | "needs_review" | "draft";
  issues: ValidationIssue[];
  hardFails: ValidationIssue[];
  softFails: ValidationIssue[];
  // Suggested actions for the agent UI
  suggestions: string[];
};

type Rule = {
  id: string;
  field: string;
  weight: number;
  hard?: boolean;
  run: (ctx: ValidationContext) => { passed: boolean; message?: string };
};

// ============================================================
// Rules
// ============================================================
const rules: Rule[] = [
  {
    id: "title.required",
    field: "title",
    weight: 5,
    hard: true,
    run: (c) => ({
      passed: Boolean(c.title && c.title.trim().length >= 10),
      message: "Title must be at least 10 characters.",
    }),
  },
  {
    id: "title.length",
    field: "title",
    weight: 3,
    run: (c) => ({
      passed: Boolean(c.title && c.title.length <= 120),
      message: "Keep the title under 120 characters for search results.",
    }),
  },
  {
    id: "description.required",
    field: "description",
    weight: 10,
    hard: true,
    run: (c) => ({
      passed: Boolean(c.description && c.description.trim().length >= 120),
      message: "Description must be at least 120 characters.",
    }),
  },
  {
    id: "excerpt.required",
    field: "excerpt",
    weight: 3,
    run: (c) => ({
      passed: Boolean(c.excerpt && c.excerpt.trim().length >= 30),
      message: "Add a short excerpt (30+ chars) for cards and previews.",
    }),
  },
  {
    id: "price.required",
    field: "price",
    weight: 8,
    hard: true,
    run: (c) => ({
      passed: typeof c.price === "number" && c.price > 0,
      message: "Set a positive price.",
    }),
  },
  {
    id: "currency.required",
    field: "currency",
    weight: 2,
    run: (c) => ({
      passed: Boolean(c.currency && /^[A-Z]{3}$/.test(c.currency)),
      message: "Use a 3-letter currency code (e.g. KES, USD).",
    }),
  },
  {
    id: "price.sane",
    field: "price",
    weight: 4,
    run: (c) => {
      // Flag suspicious outliers
      if (typeof c.price !== "number") return { passed: true };
      const ok = c.price >= 1000 && c.price <= 1_000_000_000;
      return {
        passed: ok,
        message: "Price looks unusual — double-check the amount.",
      };
    },
  },
  {
    id: "rent.period",
    field: "price_period",
    weight: 3,
    hard: true,
    run: (c) => {
      if (c.listing_type !== "rent") return { passed: true };
      const allowed = ["monthly", "quarterly", "yearly"];
      return {
        passed: Boolean(c.price_period && allowed.includes(c.price_period)),
        message: "Rentals must declare a price period (monthly, quarterly, yearly).",
      };
    },
  },
  {
    id: "bedrooms.required",
    field: "bedrooms",
    weight: 2,
    run: (c) => ({
      passed: typeof c.bedrooms === "number" && c.bedrooms >= 0,
      message: "Provide the bedroom count (0 for studio).",
    }),
  },
  {
    id: "bathrooms.required",
    field: "bathrooms",
    weight: 2,
    run: (c) => ({
      passed: typeof c.bathrooms === "number" && c.bathrooms >= 0,
      message: "Provide the bathroom count.",
    }),
  },
  {
    id: "area.required",
    field: "area_sqft",
    weight: 3,
    run: (c) => ({
      passed: typeof c.area_sqft === "number" && c.area_sqft > 0,
      message: "Provide the interior area in sqft.",
    }),
  },
  {
    id: "location.country",
    field: "country",
    weight: 4,
    hard: true,
    run: (c) => ({
      passed: Boolean(c.country && c.country.trim().length >= 2),
      message: "Country is required.",
    }),
  },
  {
    id: "location.county",
    field: "county",
    weight: 3,
    run: (c) => ({
      passed: Boolean(c.county && c.county.trim().length >= 2),
      message: "Add a county for better discovery.",
    }),
  },
  {
    id: "location.town",
    field: "town",
    weight: 4,
    run: (c) => ({
      passed: Boolean(c.town && c.town.trim().length >= 2),
      message: "Add a town / neighbourhood.",
    }),
  },
  {
    id: "address.landmark",
    field: "address",
    weight: 2,
    run: (c) => ({
      passed: Boolean(c.address && c.address.trim().length >= 5),
      message: "Add a landmark or short address hint.",
    }),
  },
  {
    id: "images.min",
    field: "images",
    weight: 10,
    hard: true,
    run: (c) => {
      const n = c.images?.length ?? 0;
      return {
        passed: n >= 5,
        message: "Upload at least 5 photos.",
      };
    },
  },
  {
    id: "images.featured",
    field: "images",
    weight: 3,
    run: (c) => {
      const hasFeatured = (c.images ?? []).some((i) => i.is_featured);
      return {
        passed: hasFeatured,
        message: "Mark one image as the cover photo.",
      };
    },
  },
  {
    id: "images.alt",
    field: "images",
    weight: 2,
    run: (c) => {
      const missing = (c.images ?? []).filter(
        (i) => !i.alt_text || i.alt_text.trim().length < 5,
      ).length;
      return {
        passed: missing === 0,
        message: "Every photo needs alt text for accessibility and SEO.",
      };
    },
  },
  {
    id: "amenities.min",
    field: "amenities",
    weight: 2,
    run: (c) => ({
      passed: (c.amenities?.length ?? 0) >= 1,
      message: "Add at least one amenity.",
    }),
  },
  {
    id: "video.url",
    field: "video_url",
    weight: 5,
    run: (c) => {
      if (!c.video_url) return { passed: true }; // optional
      const detected = detectVideoProvider(c.video_url);
      return {
        passed: detected.provider !== "unknown" && detected.isValid,
        message: "Video URL must be a valid YouTube, TikTok, Instagram or Facebook Reel link.",
      };
    },
  },
];

// ============================================================
// Scoring
// ============================================================
const DEFAULT_THRESHOLD = 80;

export function validateProperty(ctx: ValidationContext): ValidationResult {
  const issues: ValidationIssue[] = [];

  for (const rule of rules) {
    const r = rule.run(ctx);
    if (r.passed) continue;
    issues.push({
      ruleId: rule.id,
      field: rule.field,
      message: r.message ?? `${rule.field} failed validation.`,
      severity: rule.hard ? "hard" : "soft",
    });
  }

  // First-N-listings safety net (Phase 0 decision: first 3 reviewed)
  const reviewed = ctx.agentListingsReviewedCount ?? 0;
  const publishedSoFar = ctx.agent?.published_listing_count ?? 0;
  const requireReview = publishedSoFar < 3 && reviewed < 3;

  const hardFails = issues.filter((i) => i.severity === "hard");
  const softFails = issues.filter((i) => i.severity === "soft");

  // Score = sum of passed rule weights / total weight * 100
  const totalWeight = rules.reduce((s, r) => s + r.weight, 0);
  const failedWeight = issues.reduce(
    (s, i) => s + (rules.find((r) => r.id === i.ruleId)?.weight ?? 0),
    0,
  );
  const score = Math.max(0, Math.round(((totalWeight - failedWeight) / totalWeight) * 100));

  const threshold = ctx.publishThreshold ?? DEFAULT_THRESHOLD;
  const noHardFails = hardFails.length === 0;
  const passedScore = score >= threshold;

  let status: ValidationResult["status"];
  if (!noHardFails) {
    status = "draft";
  } else if (requireReview || !passedScore) {
    status = "needs_review";
  } else {
    status = "active";
  }

  const suggestions = softFails.map((i) => i.message);

  return {
    passed: noHardFails,
    score,
    status,
    issues,
    hardFails,
    softFails,
    suggestions,
  };
}

/**
 * Lightweight client-side preview. Skips server-only fields.
 * Use in the listing form to show issues live.
 */
export function previewValidation(ctx: ValidationContext): ValidationResult {
  return validateProperty(ctx);
}
