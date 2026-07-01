/**
 * V2 Short Links + QR Codes
 * --------------------------------------------------------------
 * Short links power social sharing. The DB stores the mapping
 * (short_links table, added in Phase 1). This module is the
 * client/server helper around it.
 *
 * QR codes are generated server-side (Phase 0d uses `qrcode` lib
 * on the client for previews and stores the PNG in R2 / Supabase
 * Storage in a later phase).
 */

import QRCode from "qrcode";
import { nanoid } from "nanoid";
import { env } from "@/lib/env";

export type ShortLink = {
  code: string;        // e.g. "V1StGXR8_Z5jdHi6B-myT"
  shortUrl: string;    // e.g. "https://brightedge.co.ke/p/V1St..."
  longUrl: string;     // canonical target
};

/**
 * Build the canonical long URL for a property page.
 * Property slug is used as the source of truth; the short code
 * is just a friendly alias.
 */
export function buildPropertyLongUrl(slug: string, utm?: { source?: string; medium?: string; campaign?: string }): string {
  const base = `${env.siteUrl().replace(/\/$/, "")}/properties/${slug}`;
  if (!utm) return base;
  const params = new URLSearchParams();
  if (utm.source) params.set("utm_source", utm.source);
  if (utm.medium) params.set("utm_medium", utm.medium);
  if (utm.campaign) params.set("utm_campaign", utm.campaign);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Build the short URL for a code. We use the path `/p/{code}` so
 * Vercel can rewrite it to the public property route. The domain
 * is `VITE_SHORT_URL_BASE` (falls back to site URL).
 */
export function buildShortUrl(code: string): string {
  return `${env.shortUrlBase().replace(/\/$/, "")}/p/${code}`;
}

/**
 * Generate a new short code. 12 chars = ~71 bits of entropy,
 * safe for nanoid's default alphabet.
 */
export function newShortCode(): string {
  return nanoid(12);
}

/**
 * Generate a QR code as a data URL (for live preview, share UI).
 * For storage we will render to a buffer in the server route.
 */
export async function generateQrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 512,
    color: {
      dark: "#0F172A",   // slate-900
      light: "#FFFFFF",
    },
  });
}

/**
 * Generate a QR code as a PNG buffer (server-side).
 */
export async function generateQrPng(value: string): Promise<Buffer> {
  return QRCode.toBuffer(value, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 1024,
    color: {
      dark: "#0F172A",
      light: "#FFFFFF",
    },
  });
}
