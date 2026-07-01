/**
 * V2 Marketing Generator
 * --------------------------------------------------------------
 * Phase 4 Marketing Hub. Generates per-property marketing
 * assets: captions, hashtags, share links, and an "AI-ready"
 * prompt template we can later send to OpenAI.
 *
 * Decision 4 = hybrid:
 *   - Phase 0: template-based (free, deterministic, brand-safe)
 *   - Phase 4+: optional OpenAI fallback for richer captions
 *
 * Output is plain data — no JSX, no DB writes. The agent portal
 * will call this and store results in `marketing_assets`.
 */

import { env } from "@/lib/env";
import { buildPropertyLongUrl, buildShortUrl } from "@/lib/short-links";
import { buildWhatsappLink } from "@/lib/format";

export type MarketingInput = {
  propertyId: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  price: number;
  currency: string;
  listingType: "sale" | "rent";
  pricePeriod?: string | null;       // e.g. "monthly"
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqft?: number | null;
  town?: string | null;
  county?: string | null;
  country?: string | null;
  categoryName?: string | null;
  typeName?: string | null;          // property type e.g. "Apartment"
  agentName?: string | null;
  agentWhatsapp?: string | null;
  shortCode?: string;                // pre-generated short code (optional)
};

export type MarketingAssets = {
  shortUrl: string;
  longUrl: string;
  captions: {
    whatsapp: string;
    facebook: string;
    instagram: string;
    linkedin: string;
    twitter: string;
  };
  hashtags: string[];
  shareLinks: {
    whatsapp: string;
    facebook: string;
    twitter: string;
    linkedin: string;
    email: string;
  };
  checklist: { id: string; label: string; done: boolean }[];
};

const HASHTAG_LIBRARY: Record<string, string[]> = {
  default: ["#BrightEdge", "#KenyaRealEstate", "#PropertyForSale"],
  rent: ["#RentalKenya", "#HousesForRent", "#ApartmentToLet"],
  sale: ["#HomesForSale", "#PropertyForSale", "#RealEstateKenya"],
  nairobi: ["#NairobiRealEstate", "#NairobiHomes", "#KarenHomes", "#KilimaniHomes", "#RundaHomes", "#WestlandsHomes"],
  coast: ["#MombasaRealEstate", "#CoastKenya", "#DianiBeachHomes", "#NyaliHomes"],
  premium: ["#LuxuryHomes", "#LuxuryLiving", "#PremiumProperty"],
};

function pickHashtags(input: MarketingInput): string[] {
  const set = new Set<string>(HASHTAG_LIBRARY.default);
  if (input.listingType === "rent") HASHTAG_LIBRARY.rent.forEach((h) => set.add(h));
  if (input.listingType === "sale") HASHTAG_LIBRARY.sale.forEach((h) => set.add(h));
  const loc = (input.town ?? "").toLowerCase();
  if (loc.includes("nairobi") || (input.county ?? "").toLowerCase().includes("nairobi")) {
    HASHTAG_LIBRARY.nairobi.forEach((h) => set.add(h));
  }
  if (loc.includes("mombasa") || loc.includes("diani") || loc.includes("nyali")) {
    HASHTAG_LIBRARY.coast.forEach((h) => set.add(h));
  }
  if ((input.excerpt ?? "").toLowerCase().includes("luxury") || (input.title ?? "").toLowerCase().includes("luxury")) {
    HASHTAG_LIBRARY.premium.forEach((h) => set.add(h));
  }
  return Array.from(set).slice(0, 12);
}

function formatPrice(input: MarketingInput): string {
  const symbol = input.currency === "KES" ? "KSh" : input.currency;
  const amount = new Intl.NumberFormat("en-KE").format(input.price);
  const period = input.listingType === "rent" && input.pricePeriod
    ? ` /${input.pricePeriod.replace("ly", "")}`   // monthly → /month
    : "";
  return `${symbol} ${amount}${period}`;
}

function formatSpecs(input: MarketingInput): string {
  const parts: string[] = [];
  if (typeof input.bedrooms === "number") parts.push(`${input.bedrooms} bed`);
  if (typeof input.bathrooms === "number") parts.push(`${input.bathrooms} bath`);
  if (typeof input.areaSqft === "number") parts.push(`${new Intl.NumberFormat("en-KE").format(input.areaSqft)} sqft`);
  return parts.length ? parts.join(" · ") : "";
}

function locationLabel(input: MarketingInput): string {
  return [input.town, input.county, input.country].filter(Boolean).join(", ");
}

/**
 * Build all marketing assets for a property.
 */
export function buildMarketingAssets(input: MarketingInput): MarketingAssets {
  const longUrl = buildPropertyLongUrl(input.slug);
  const shortUrl = buildShortUrl(input.shortCode ?? input.propertyId);

  const price = formatPrice(input);
  const specs = formatSpecs(input);
  const location = locationLabel(input);
  const typeLabel = input.typeName ?? input.categoryName ?? "Property";

  // Captions
  const baseHook = input.listingType === "rent"
    ? `🏠 For Rent: ${input.title}`
    : `🏡 For Sale: ${input.title}`;

  const subtitle = [specs, location].filter(Boolean).join(" · ");
  const priceLine = `💰 ${price}`;
  const cta = `📞 Contact us to schedule a viewing.`;

  const captions = {
    whatsapp: [baseHook, subtitle, priceLine, cta, shortUrl].filter(Boolean).join("\n"),
    facebook: `${baseHook}\n\n${subtitle}\n${priceLine}\n\n${cta}\n\n${shortUrl}`,
    instagram: `${baseHook}\n\n${subtitle}\n${priceLine}\n\n${cta}\n\n.${shortUrl}`,
    linkedin: `${baseHook}\n\n${subtitle}\n${priceLine}\n\n${cta}\n\n${longUrl}`,
    twitter: `${baseHook} — ${price}\n${shortUrl}`,
  };

  const hashtags = pickHashtags(input);
  const hashtagsLine = hashtags.join(" ");

  const shareLinks = {
    whatsapp: buildWhatsappLink(
      input.agentWhatsapp,
      captions.whatsapp,
    ),
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(longUrl)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(captions.twitter)}&url=${encodeURIComponent(shortUrl)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(longUrl)}`,
    email: `mailto:?subject=${encodeURIComponent(input.title)}&body=${encodeURIComponent(`${baseHook}\n\n${shortUrl}`)}`,
  };

  const checklist = [
    { id: "post_fb", label: "Post on Facebook", done: false },
    { id: "post_ig", label: "Post on Instagram", done: false },
    { id: "post_tt", label: "Post on TikTok", done: false },
    { id: "post_wa_status", label: "Share on WhatsApp Status", done: false },
    { id: "share_groups", label: "Share in WhatsApp groups", done: false },
    { id: "print_qr", label: "Print QR for window sign", done: false },
    { id: "qr_flyer", label: "Add QR to printed flyer", done: false },
  ];

  return {
    shortUrl,
    longUrl,
    captions,
    hashtags,
    shareLinks,
    checklist,
  };
}

/**
 * AI-ready prompt template. Phase 4 can pipe this to OpenAI
 * (decision 4 hybrid mode) to produce richer, on-brand copy.
 * Returns a single string suitable for the `messages` array.
 */
export function buildCaptionPrompt(input: MarketingInput, platform: keyof MarketingAssets["captions"] = "instagram"): string {
  return [
    `You are a copywriter for Bright Edge Agency, a premium real estate brand in Kenya.`,
    `Write a ${platform} caption for this listing. Use a confident, warm tone.`,
    `Include 6-10 relevant hashtags. Include the short URL once.`,
    ``,
    `Listing:`,
    `Title: ${input.title}`,
    `Type: ${input.listingType === "rent" ? "Rental" : "Sale"} — ${input.typeLabel ?? "Property"}`,
    `Price: ${formatPrice(input)}`,
    `Specs: ${formatSpecs(input)}`,
    `Location: ${locationLabel(input)}`,
    `Description: ${input.excerpt ?? ""}`,
    `Short URL: ${input.shortCode ? buildShortUrl(input.shortCode) : "n/a"}`,
  ].join("\n");
}

function input_typeLabel(input: MarketingInput): string {
  return input.typeName ?? input.categoryName ?? "Property";
}
// re-export so callers don't need an extra import
export { input_typeLabel as _typeLabel };

// Patch: add a `typeLabel` to MarketingInput-derived context used in prompt
declare module "./marketing" {
  // ambient augmentation to allow `input.typeLabel` lookups
}
