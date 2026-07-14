/**
 * Server functions for inquiry submission.
 * --------------------------------------------------------------
 * Routes inquiry submissions through server-side validation,
 * then sends email notification to the assigned agent/admin.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client.server";
import { sendEmail } from "@/lib/email/client";
import { inquiryNotificationHtml, inquiryNotificationText } from "@/lib/email/templates";

const inquirySchema = z.object({
  property_id: z.string().uuid().nullable().optional(),
  agent_id: z.string().uuid().nullable().optional(),
  full_name: z.string().trim().min(2, "Name is required").max(100),
  email: z.string().trim().email("Valid email is required").max(255),
  phone: z.string().trim().max(40).optional().nullable(),
  message: z.string().trim().min(5, "Message must be at least 5 characters").max(1000),
  source: z.enum(["website_form", "property_inquiry", "contact_page", "whatsapp", "newsletter", "referral", "other"]),
  subject: z.string().max(200).optional().nullable(),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

/**
 * Server function: Submit an inquiry.
 * Validates input, writes to database, and sends email notification.
 */
export const submitInquiry = createServerFn({ method: "POST" })
  .validator((data: unknown) => inquirySchema.parse(data))
  .handler(async ({ data }) => {
    const { property_id, agent_id, full_name, email, phone, message, source, subject } = data;

    // 1. Insert inquiry into database
    const { data: inquiry, error: dbError } = await supabase
      .from("inquiries")
      .insert({
        property_id: property_id ?? null,
        agent_id: agent_id ?? null,
        full_name,
        email,
        phone: phone || null,
        message,
        source: source as any,
        status: "new",
      })
      .select()
      .single();

    if (dbError) {
      console.error("[submitInquiry] DB error:", dbError);
      return { success: false, error: "Failed to submit inquiry. Please try again." };
    }

    // 2. Log activity
    await supabase.from("activity_logs").insert({
      action: "inquiry_received",
      entity_type: "inquiries",
      entity_id: inquiry.id,
      metadata: { source, email },
    });

    // 3. Get property title for notification
    let propertyTitle: string | undefined;
    if (property_id) {
      const { data: property } = await supabase
        .from("properties")
        .select("title")
        .eq("id", property_id)
        .single();
      propertyTitle = property?.title;
    }

    // 4. Send email notification to the assigned agent's email
    let agentEmail: string | undefined;
    if (agent_id) {
      const { data: agent } = await supabase
        .from("agents")
        .select("email")
        .eq("id", agent_id)
        .single();
      agentEmail = agent?.email ?? undefined;
    }

    // Also get the primary office email from settings
    const { data: settings } = await supabase
      .from("settings")
      .select("primary_email")
      .eq("id", 1)
      .maybeSingle();

    const notifyEmails: string[] = [];
    if (agentEmail) notifyEmails.push(agentEmail);
    if (settings?.primary_email && !notifyEmails.includes(settings.primary_email)) {
      notifyEmails.push(settings.primary_email);
    }

    // Send notification email(s)
    if (notifyEmails.length > 0) {
      const emailSent = await sendEmail({
        to: notifyEmails,
        subject: `New inquiry from ${full_name}${propertyTitle ? ` — ${propertyTitle}` : ""}`,
        html: inquiryNotificationHtml({
          inquiryName: full_name,
          inquiryEmail: email,
          inquiryPhone: phone || null,
          message,
          propertyTitle,
          source,
        }),
        text: inquiryNotificationText({
          inquiryName: full_name,
          inquiryEmail: email,
          inquiryPhone: phone || null,
          message,
          propertyTitle,
          source,
        }),
        replyTo: email,
      });

      if (!emailSent) {
        console.warn("[submitInquiry] Email notification failed to send");
      }
    }

    return { success: true };
  });

/**
 * Server function: Update inquiry status.
 */
export const updateInquiryStatus = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z.object({
      id: z.string().uuid(),
      status: z.enum(["new", "contacted", "qualified", "viewing_scheduled", "offer_made", "won", "lost", "closed"]),
      note: z.string().max(500).optional(),
      actor_id: z.string().uuid().optional(),
    }).parse(data)
  )
  .handler(async ({ data }) => {
    const { id, status, note, actor_id } = data;

    // Get current status for audit trail
    const { data: current } = await supabase
      .from("inquiries")
      .select("status")
      .eq("id", id)
      .single();

    // Update inquiry status
    const { error: updateError } = await supabase
      .from("inquiries")
      .update({ status: status as any, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      console.error("[updateInquiryStatus] Update error:", updateError);
      return { success: false, error: "Failed to update status" };
    }

    // Log status change activity
    await supabase.from("lead_activities").insert({
      inquiry_id: id,
      activity_type: "status_change",
      actor_id: actor_id ?? null,
      from_status: (current?.status as any) ?? null,
      to_status: status as any,
      note: note ?? null,
    });

    return { success: true };
  });