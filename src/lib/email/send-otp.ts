/**
 * OTP Email Sending
 * --------------------------------------------------------------
 * Server-side function to generate and send OTP codes via Resend.
 * The OTP is stored hashed in the database for verification.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendEmail } from "./client";
import { otpEmailHtml, otpEmailText } from "./templates";
import { supabase } from "@/integrations/supabase/client.server";

// Type for the otp_codes table (not yet in generated database types)
interface OtpCode {
  id: string;
  email: string;
  code_hash: string;
  purpose: "onboarding" | "password_reset" | "email_verification";
  created_at: string;
  expires_at: string;
  used_at: string | null;
}

/**
 * Generate a cryptographically random 6-digit OTP code.
 */
function generateOtpCode(): string {
  const arr = new Uint32Array(1);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    arr[0] = Math.floor(Math.random() * 0xffffffff);
  }
  return (100000 + (arr[0] % 900000)).toString();
}

/**
 * Hash a code using SHA-256 for storage.
 * We hash rather than store plaintext so a DB leak doesn't expose codes.
 */
async function hashCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const sendOtpSchema = z.object({
  email: z.string().email(),
  agentName: z.string().min(1),
  purpose: z.enum(["onboarding", "password_reset", "email_verification"]).default("onboarding"),
});

/**
 * Server function: Send an OTP code to the given email.
 * Stores the hashed code in the `otp_codes` table for later verification.
 */
export const sendOtpEmail = createServerFn({ method: "POST" })
  .validator((data: unknown) => sendOtpSchema.parse(data))
  .handler(async ({ data }) => {
    const { email, agentName, purpose } = data;

    const code = generateOtpCode();
    const codeHash = await hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Store hashed code in database (type assertion for new table not in generated types)
    const { error: dbError } = await (supabase as any)
      .from("otp_codes")
      .insert({ email, code_hash: codeHash, purpose, expires_at: expiresAt });

    if (dbError) {
      console.error("[sendOtpEmail] DB insert error:", dbError);
      return { success: false, error: "Failed to create verification code" };
    }

    // Send email via Resend
    const result = await sendEmail({
      to: email,
      subject: `Your Bright Edge verification code: ${code}`,
      html: otpEmailHtml({ code, agentName }),
      text: otpEmailText({ code, agentName }),
    });

    if (!result) {
      return { success: false, error: "Failed to send verification email" };
    }

    return { success: true };
  });

const verifyOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  purpose: z.enum(["onboarding", "password_reset", "email_verification"]).default("onboarding"),
});

/**
 * Server function: Verify an OTP code submitted by the user.
 * Checks the hash against stored codes and marks as used.
 */
export const verifyOtpCode = createServerFn({ method: "POST" })
  .validator((data: unknown) => verifyOtpSchema.parse(data))
  .handler(async ({ data }) => {
    const { email, code, purpose } = data;
    const codeHash = await hashCode(code);

    // Find matching, unexpired, unused OTP
    const { data: otpRecords, error } = await (supabase as any)
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .eq("code_hash", codeHash)
      .eq("purpose", purpose)
      .is("used_at", null)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[verifyOtpCode] DB query error:", error);
      return { success: false, error: "Verification failed" };
    }

    if (!otpRecords || (Array.isArray(otpRecords) && otpRecords.length === 0)) {
      return { success: false, error: "Invalid or expired verification code" };
    }

    const record = Array.isArray(otpRecords) ? otpRecords[0] : otpRecords;

    // Mark as used
    const { error: updateError } = await (supabase as any)
      .from("otp_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("id", record.id);

    if (updateError) {
      console.error("[verifyOtpCode] Update error:", updateError);
      return { success: false, error: "Verification failed" };
    }

    return { success: true };
  });