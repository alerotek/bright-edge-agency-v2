import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  full_name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().min(5, "Please add a short message").max(1000),
});
type FormValues = z.infer<typeof schema>;

export function InquiryForm({
  propertyId,
  agentId,
  subject,
  source = "property_inquiry",
}: {
  propertyId?: string | null;
  agentId?: string | null;
  subject?: string;
  source?: "property_inquiry" | "contact_page" | "website_form";
}) {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", email: "", phone: "", message: subject ? `I'd like more information about "${subject}".` : "" },
  });

  const onSubmit = async (v: FormValues) => {
    const { error } = await supabase.from("inquiries").insert({
      property_id: propertyId ?? null,
      agent_id: agentId ?? null,
      full_name: v.full_name,
      email: v.email,
      phone: v.phone || null,
      message: v.message,
      source: source as any,
    });
    if (error) {
      toast.error("We couldn't send your message", { description: error.message });
      return;
    }
    setSubmitted(true);
    toast.success("Inquiry sent — we'll be in touch shortly.");
    form.reset();
  };

  if (submitted) {
    return (
      <div className="rounded-xl border border-accent/40 bg-accent/10 p-5 text-sm">
        <p className="font-semibold text-foreground">Thank you — your inquiry is in.</p>
        <p className="mt-1 text-muted-foreground">An agent will respond within four working hours, usually sooner.</p>
        <Button variant="ghost" className="mt-3 -ml-2" onClick={() => setSubmitted(false)}>Send another</Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-1">
        <label className="text-xs font-medium text-foreground/80">Full name</label>
        <Input {...form.register("full_name")} placeholder="Your name" />
        {form.formState.errors.full_name && <p className="mt-1 text-xs text-destructive">{form.formState.errors.full_name.message}</p>}
      </div>
      <div className="sm:col-span-1">
        <label className="text-xs font-medium text-foreground/80">Email</label>
        <Input type="email" {...form.register("email")} placeholder="you@email.com" />
        {form.formState.errors.email && <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>}
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-foreground/80">Phone (optional)</label>
        <Input {...form.register("phone")} placeholder="+254 …" />
      </div>
      <div className="sm:col-span-2">
        <label className="text-xs font-medium text-foreground/80">Message</label>
        <Textarea rows={4} {...form.register("message")} />
        {form.formState.errors.message && <p className="mt-1 text-xs text-destructive">{form.formState.errors.message.message}</p>}
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Sending…" : "Send inquiry"}
        </Button>
      </div>
    </form>
  );
}
