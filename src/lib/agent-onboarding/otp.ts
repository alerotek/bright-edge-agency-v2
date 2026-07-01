/**
 * V2 Agent Onboarding — WhatsApp OTP helpers
 * --------------------------------------------------------------
 * Decision 2 = WhatsApp-only (no Twilio).
 *
 * Flow:
 *   1. Client generates a 6-digit code (crypto.getRandomValues).
 *   2. We render a wa.me deep link that includes the code.
 *   3. The agent reads the code from the WhatsApp message and pastes
 *      it into the form. We verify locally and mark the phone
 *      as verified.
 *
 * Why no Twilio:
 *   - V2 launch runs on free tier; the wa.me click-to-chat pattern
 *     requires zero SMS provider configuration and works in any
 *     country where the agent has WhatsApp installed.
 *   - Codes are short-lived (10 min) and single-use.
 */

import { env } from "@/lib/env";

/**
 * Generate a 6-digit numeric OTP using the platform CSPRNG.
 * Falls back to Math.random only if the API is unavailable
 * (should not happen in any modern browser or Node 18+).
 */
export function generateOtpCode(): string {
  const arr = new Uint32Array(1);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    arr[0] = Math.floor(Math.random() * 0xffffffff);
  }
  // Range 100000..999999 (always 6 digits, never starts with 0)
  const code = (100000 + (arr[0] % 900000)).toString();
  return code;
}

/**
 * Build the wa.me link the agent will tap. The body contains the
 * OTP code + the agent's phone so the office can audit.
 *
 * `agentPhone` is the agent's phone in E.164-ish format (digits only
 * is best; we strip non-digits below).
 */
export function buildWhatsappOtpLink(args: {
  agentPhone: string;
  code: string;
  agentName: string;
}): string {
  const number = env.whatsappOtpNumber() || "254700000000";
  const cleanNumber = number.replace(/[^0-9]/g, "");
  const body = [
    `Hello Bright Edge,`,
    ``,
    `My name is ${args.agentName}.`,
    `Phone: ${args.agentPhone}`,
    ``,
    `My verification code is: *${args.code}*`,
    ``,
    `I'll enter it in the onboarding form now.`,
  ].join("\n");
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(body)}`;
}

/**
 * Verifies a code the user typed in the form against the one we
 * generated. Pure function, safe to call client-side.
 */
export function verifyOtpCode(input: string, expected: string): boolean {
  if (!input || !expected) return false;
  return input.trim() === expected.trim();
}

/**
 * OTP TTL in milliseconds. 10 minutes.
 */
export const OTP_TTL_MS = 10 * 60 * 1000;

export function isOtpExpired(issuedAt: number, now = Date.now()): boolean {
  return now - issuedAt > OTP_TTL_MS;
}
