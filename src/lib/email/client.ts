/**
 * Resend Email Client
 * --------------------------------------------------------------
 * Centralized email sending via Resend API.
 * API key is kept server-side only (never exposed to client).
 */

import { Resend } from "resend";

let _resend: Resend | null = null;

function getClient(): Resend {
  if (!_resend) {
    const apiKey = (typeof process !== "undefined" ? process.env.RESEND_API_KEY : "") as string;
    if (!apiKey) {
      console.warn("[Email] RESEND_API_KEY is not set. Emails will not be sent.");
      // Return a mock client that logs instead of sending in dev
      _resend = null;
      throw new Error("RESEND_API_KEY environment variable is required");
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

export type EmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export async function sendEmail(opts: EmailOptions): Promise<{ id: string } | null> {
  try {
    const client = getClient();
    const result = await client.emails.send({
      from: "Bright Edge Agency <noreply@brightedge.co.ke>",
      to: Array.isArray(opts.to) ? opts.to : [opts.to],
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      replyTo: opts.replyTo ?? "hello@brightedge.co.ke",
    });
    if (result.error) {
      console.error("[Email] Resend error:", result.error);
      return null;
    }
    return result.data ? { id: result.data.id } : null;
  } catch (error) {
    console.error("[Email] Failed to send email:", error);
    return null;
  }
}
