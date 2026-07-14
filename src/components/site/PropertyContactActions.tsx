/**
 * Property contact action components — Part 3
 *
 * Four independent actions per the spec:
 *  1. WhatsAppButton       — opens WA directly, no form, no DB record
 *  2. InquiryForm          — qualified lead: stores DB first, then WA notification
 *  3. ScheduleViewingForm  — viewing_request lead: same DB-first guarantee
 *  4. CallAgentButton      — tel: link, no DB record required
 *
 * The DB-first guarantee is enforced in InquiryForm and ScheduleViewingForm:
 *   supabase.insert() must succeed before the WhatsApp notification link is shown.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CheckCircle2,
  MessageCircle,
  Phone,
  Send,
  Clock,
} from "lucide-react";
import { buildWhatsappLink } from "@/lib/format";

// ─── Shared types ──────────────────────────────────────────
interface ContactProps {
  propertyId: string;
  propertyTitle: string;
  agentId: string | null;
  agentPhone: string | null;
  agentWhatsapp: string | null;
  agentName: string | null;
  propertySlug: string;
}

// ─── 1. WhatsApp button ───────────────────────────────────
export function WhatsAppButton({
  agentWhatsapp,
  agentName,
  propertyTitle,
}: Pick<ContactProps, "agentWhatsapp" | "agentName" | "propertyTitle">) {
  const msg = `Hi ${agentName?.split(" ")[0] ?? "there"}, I'm interested in "${propertyTitle}". Could we have a quick chat?`;
  const href = buildWhatsappLink(agentWhatsapp, msg);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Open a conversation directly with the listing agent. No form required.
      </p>
      <Button
        asChild
        size="lg"
        className="w-full bg-[#25D366] text-white hover:bg-[#25D366]/90"
      >
        <a href={href} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="mr-2 h-5 w-5" /> Chat on WhatsApp
        </a>
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Opens WhatsApp on your device or browser
      </p>
    </div>
  );
}

// ─── 2. Inquiry form (general + viewing request) ──────────
const inquirySchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name"),
  phone: z.string().trim().min(9, "Enter your phone number"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  message: z.string().trim().min(5, "Add a short message").max(800),
  budget_kes: z.coerce.number().min(0).optional(),
  preferred_viewing_date: z.string().optional(),
  preferred_viewing_time: z.string().optional(),
});
type InquiryValues = z.infer<typeof inquirySchema>;

export function InquiryForm({
  propertyId,
  propertyTitle,
  agentId,
  agentWhatsapp,
  agentName,
  propertySlug,
}: ContactProps) {
  const [leadId, setLeadId] = useState<string | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);

  const form = useForm<InquiryValues>({ resolver: zodResolver(inquirySchema) });

  const onSubmit = async (v: InquiryValues) => {
    // ── DB first — always ──────────────────────────────────
    const { data, error } = await supabase.from("inquiries").insert({
      property_id: propertyId,
      agent_id: agentId,
      full_name: v.full_name,
      phone: v.phone,
      email: v.email || null,
      message: v.message,
      budget_kes: v.budget_kes || null,
      preferred_viewing_date: v.preferred_viewing_date || null,
      preferred_viewing_time: v.preferred_viewing_time || null,
      source: "property_inquiry" as any,
      inquiry_type: "general" as any,
    } as any).select("id").single();

    if (error) {
      toast.error("Couldn't send your inquiry", {
        description: "Please try again or use WhatsApp.",
      });
      return;
    }

    // ── WA notification link — only after successful insert ──
    const lid = `BE-${(data as any).id.slice(0, 8).toUpperCase()}`;
    setLeadId(lid);

    const waMsg =
      `*New inquiry — ${propertyTitle}*\n` +
      `Lead ID: ${lid}\n` +
      `Name: ${v.full_name}\n` +
      `Phone: ${v.phone}\n` +
      (v.email ? `Email: ${v.email}\n` : "") +
      (v.preferred_viewing_date ? `Viewing Date: ${v.preferred_viewing_date}\n` : "") +
      (v.preferred_viewing_time ? `Viewing Time: ${v.preferred_viewing_time}\n` : "") +
      (v.budget_kes ? `Budget: KES ${v.budget_kes.toLocaleString()}\n` : "") +
      `Message: ${v.message}\n` +
      `View in dashboard: https://zieupeziyihobeukiaai.supabase.co/dashboard/leads/${(data as any).id}`;

    const link = buildWhatsappLink(agentWhatsapp, waMsg);
    setWaLink(link);

    // Mark WA notification attempted
    await supabase
      .from("inquiries")
      .update({ whatsapp_notified_at: new Date().toISOString() } as any)
      .eq("id", data.id);

    form.reset();
    toast.success("Inquiry stored successfully.");
  };

  if (leadId) {
    return (
      <div className="space-y-4 rounded-xl border border-accent/40 bg-accent/10 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="font-semibold text-foreground">Inquiry received</p>
            <p className="text-xs text-muted-foreground">
              Reference: <span className="font-mono font-semibold">{leadId}</span>
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          We respond within 4 working hours. You can also reach the agent directly on WhatsApp.
        </p>
        {waLink && (
          <Button asChild size="sm" className="w-full bg-[#25D366] text-white hover:bg-[#25D366]/90">
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> Notify agent on WhatsApp
            </a>
          </Button>
        )}
        <Button variant="ghost" size="sm" className="w-full" onClick={() => setLeadId(null)}>
          Send another inquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-foreground/80">Full name *</label>
          <Input {...form.register("full_name")} placeholder="Your name" className="mt-1" />
          {form.formState.errors.full_name && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.full_name.message}</p>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground/80">Phone *</label>
          <Input {...form.register("phone")} placeholder="+254 7XX XXX XXX" className="mt-1" />
          {form.formState.errors.phone && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground/80">Email (optional)</label>
        <Input type="email" {...form.register("email")} placeholder="you@email.com" className="mt-1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-foreground/80">Preferred date (optional)</label>
          <Input type="date" {...form.register("preferred_viewing_date")} className="mt-1" />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground/80">Preferred time (optional)</label>
          <select {...form.register("preferred_viewing_time")} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
            <option value="">Select a slot</option>
            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground/80">Budget (KES, optional)</label>
        <Input
          type="number"
          {...form.register("budget_kes")}
          placeholder="e.g. 5000000"
          className="mt-1"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-foreground/80">Message *</label>
        <Textarea
          rows={3}
          {...form.register("message")}
          placeholder={`I'd like more information about "${propertyTitle}".`}
          className="mt-1 resize-none"
        />
        {form.formState.errors.message && (
          <p className="mt-1 text-xs text-destructive">{form.formState.errors.message.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Sending…" : (
          <><Send className="mr-2 h-4 w-4" /> Send inquiry</>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Your inquiry is saved to our database before any notification is sent.
      </p>
    </form>
  );
}

// ─── 3. Schedule viewing form ─────────────────────────────
const viewingSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name"),
  phone: z.string().trim().min(9, "Enter your phone number"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  preferred_viewing_date: z.string().min(1, "Select a preferred date"),
  preferred_viewing_time: z.string().min(1, "Select a preferred time"),
  message: z.string().trim().max(400).optional(),
});
type ViewingValues = z.infer<typeof viewingSchema>;

const TIME_SLOTS = [
  "08:00 – 10:00",
  "10:00 – 12:00",
  "12:00 – 14:00",
  "14:00 – 16:00",
  "16:00 – 18:00",
  "Flexible — agent to suggest",
];

export function ScheduleViewingForm({
  propertyId,
  propertyTitle,
  agentId,
  agentWhatsapp,
  agentName,
  propertySlug,
}: ContactProps) {
  const [leadId, setLeadId] = useState<string | null>(null);
  const [waLink, setWaLink] = useState<string | null>(null);

  const form = useForm<ViewingValues>({ resolver: zodResolver(viewingSchema) });

  const onSubmit = async (v: ViewingValues) => {
    // ── DB first ──────────────────────────────────────────
    const { data, error } = await supabase.from("inquiries").insert({
      property_id: propertyId,
      agent_id: agentId,
      full_name: v.full_name,
      phone: v.phone,
      email: v.email || null,
      message: v.message || `Viewing request for "${propertyTitle}"`,
      source: "property_inquiry" as any,
      inquiry_type: "viewing_request" as any,
      preferred_viewing_date: v.preferred_viewing_date,
      preferred_viewing_time: v.preferred_viewing_time,
    } as any).select("id").single();

    if (error) {
      toast.error("Couldn't save your viewing request", {
        description: "Please try again or contact us on WhatsApp.",
      });
      return;
    }

    const lid = `BE-${(data as any).id.slice(0, 8).toUpperCase()}`;
    setLeadId(lid);

    const waMsg =
      `*Viewing request — ${propertyTitle}*\n` +
      `Lead ID: ${lid}\n` +
      `Name: ${v.full_name}\n` +
      `Phone: ${v.phone}\n` +
      `Date: ${v.preferred_viewing_date}\n` +
      `Time: ${v.preferred_viewing_time}\n` +
      (v.message ? `Notes: ${v.message}\n` : "") +
      `View in dashboard: https://zieupeziyihobeukiaai.supabase.co/dashboard/leads/${(data as any).id}`;

    const link = buildWhatsappLink(agentWhatsapp, waMsg);
    setWaLink(link);

    await supabase
      .from("inquiries")
      .update({ whatsapp_notified_at: new Date().toISOString() } as any)
      .eq("id", data.id);

    form.reset();
    toast.success("Viewing request saved. The agent will confirm within 24 hours.");
  };

  if (leadId) {
    return (
      <div className="space-y-4 rounded-xl border border-accent/40 bg-accent/10 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
          <div>
            <p className="font-semibold text-foreground">Viewing request saved</p>
            <p className="text-xs text-muted-foreground">
              Reference: <span className="font-mono font-semibold">{leadId}</span>
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          The agent will confirm your preferred slot within 24 hours.
        </p>
        {waLink && (
          <Button asChild size="sm" className="w-full bg-[#25D366] text-white hover:bg-[#25D366]/90">
            <a href={waLink} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="mr-2 h-4 w-4" /> Confirm with agent on WhatsApp
            </a>
          </Button>
        )}
        <Button variant="ghost" size="sm" className="w-full" onClick={() => setLeadId(null)}>
          Submit another request
        </Button>
      </div>
    );
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-foreground/80">Full name *</label>
          <Input {...form.register("full_name")} placeholder="Your name" className="mt-1" />
          {form.formState.errors.full_name && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.full_name.message}</p>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground/80">Phone *</label>
          <Input {...form.register("phone")} placeholder="+254 7XX XXX XXX" className="mt-1" />
          {form.formState.errors.phone && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground/80">Email (optional)</label>
        <Input type="email" {...form.register("email")} placeholder="you@email.com" className="mt-1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-foreground/80">
            <CalendarDays className="mr-1 inline h-3.5 w-3.5" /> Preferred date *
          </label>
          <Input
            type="date"
            min={minDate}
            {...form.register("preferred_viewing_date")}
            className="mt-1"
          />
          {form.formState.errors.preferred_viewing_date && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.preferred_viewing_date.message}
            </p>
          )}
        </div>
        <div>
          <label className="text-xs font-medium text-foreground/80">
            <Clock className="mr-1 inline h-3.5 w-3.5" /> Preferred time *
          </label>
          <select
            {...form.register("preferred_viewing_time")}
            className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="">Select a slot</option>
            {TIME_SLOTS.map((slot) => (
              <option key={slot} value={slot}>{slot}</option>
            ))}
          </select>
          {form.formState.errors.preferred_viewing_time && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.preferred_viewing_time.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-foreground/80">Special instructions (optional)</label>
        <Textarea
          rows={2}
          {...form.register("message")}
          placeholder="e.g. I'll be arriving with my spouse, parking needed..."
          className="mt-1 resize-none"
        />
      </div>

      <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Saving…" : (
          <><CalendarDays className="mr-2 h-4 w-4" /> Request viewing</>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Viewings available 7 days a week. Same-day slots often available.
      </p>
    </form>
  );
}

// ─── 4. Call agent button ─────────────────────────────────
export function CallAgentButton({
  agentPhone,
  agentName,
}: Pick<ContactProps, "agentPhone" | "agentName">) {
  if (!agentPhone) {
    return (
      <div className="rounded-xl border border-border bg-muted/40 p-5 text-center text-sm text-muted-foreground">
        Phone number not available. Use WhatsApp or the inquiry form.
      </div>
    );
  }

  const clean = agentPhone.replace(/\s/g, "");

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Call {agentName?.split(" ")[0] ?? "the agent"} directly. Available during business hours.
      </p>
      <Button asChild size="lg" variant="outline" className="w-full">
        <a href={`tel:${clean}`}>
          <Phone className="mr-2 h-5 w-5" /> {agentPhone}
        </a>
      </Button>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="text-xs">
          Mon–Fri 8am–6pm
        </Badge>
        <Badge variant="outline" className="text-xs">
          Sat 9am–1pm
        </Badge>
      </div>
    </div>
  );
}
