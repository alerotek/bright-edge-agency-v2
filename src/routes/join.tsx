import { createFileRoute, Link } from "@tanstack/react-router";
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
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  Clock,
  Globe,
  Megaphone,
  QrCode,
  Shield,
  Smartphone,
  Star,
  UserCheck,
  Users,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join Bright Edge | Become a Real Estate Agent" },
      {
        name: "description",
        content:
          "Join Bright Edge Agency as an independent real estate agent. Access premium listings, marketing tools, qualified leads, and a professional brand across Nairobi and the Kenyan coast.",
      },
      { property: "og:title", content: "Join Bright Edge | Become a Real Estate Agent" },
      { property: "og:url", content: "/join" },
    ],
    links: [{ rel: "canonical", href: "/join" }],
  }),
  component: JoinPage,
});

// ─── Application form schema ───────────────────────────────
const schema = z.object({
  full_name: z.string().trim().min(3, "Enter your full legal name"),
  email: z.string().trim().email("Enter a valid email"),
  phone: z.string().trim().min(9, "Enter your phone number"),
  years_experience: z.coerce.number().min(0).max(50).optional(),
  areas_of_operation: z.string().trim().min(3, "Tell us which areas you cover"),
  specializations: z.string().trim().optional(),
  message: z.string().trim().max(600).optional(),
});
type FormValues = z.infer<typeof schema>;

// ─── Static content ────────────────────────────────────────
const BENEFITS = [
  {
    icon: Building2,
    title: "Premium inventory access",
    body: "List and market verified properties on Kenya's most professional real estate platform.",
  },
  {
    icon: Megaphone,
    title: "Done-for-you marketing",
    body: "AI captions, social video support, QR codes, and short links generated for every listing.",
  },
  {
    icon: BarChart3,
    title: "Qualified lead pipeline",
    body: "Every inquiry is routed directly to you with full contact details and viewing preferences.",
  },
  {
    icon: Globe,
    title: "Professional digital presence",
    body: "Your own verified agent profile page, shareable bio link, and branded marketing materials.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first dashboard",
    body: "Manage listings, respond to leads, and track performance from any device.",
  },
  {
    icon: BadgeCheck,
    title: "Verified agent badge",
    body: "Stand out with a Bright Edge verified badge that signals trust to buyers and renters.",
  },
];

const REQUIREMENTS = [
  "Valid National ID or Passport",
  "Minimum 1 year of real estate experience",
  "Professional profile photo",
  "Active phone number (WhatsApp preferred)",
  "Real Estate Board of Kenya registration (or actively pursuing)",
  "Commitment to the Bright Edge Code of Conduct",
];

const PROCESS = [
  {
    step: "01",
    title: "Submit your application",
    body: "Fill in the form below. No account needed at this stage.",
  },
  {
    step: "02",
    title: "ID & document upload",
    body: "Once pre-approved, create your account and upload your National ID, selfie, and professional photo.",
  },
  {
    step: "03",
    title: "Human verification",
    body: "Our team reviews your identity and documents. Maximum 24-hour SLA.",
  },
  {
    step: "04",
    title: "Welcome & dashboard access",
    body: "Approved agents receive their verified badge, agent profile, and full dashboard instantly.",
  },
];

const FAQS = [
  {
    q: "How long does the full verification take?",
    a: "We target 24 hours from document submission. Most approvals happen same-day during business hours.",
  },
  {
    q: "Is there a fee to join?",
    a: "There is no upfront joining fee. Bright Edge operates on a commission-share model per closed transaction.",
  },
  {
    q: "Can I join if I am based outside Nairobi?",
    a: "Yes. We welcome agents covering the Kenyan coast (Mombasa, Diani, Nyali), Nakuru, Eldoret, and other major towns.",
  },
  {
    q: "What happens to my leads if I am on leave?",
    a: "Leads remain assigned to you and are visible on your dashboard. You can set an out-of-office note for your admin to reassign temporarily.",
  },
  {
    q: "Do I need to be REBK-registered?",
    a: "You should be registered or actively pursuing registration. We will work with you during the process if you are mid-application.",
  },
];

// ─── FAQ item ──────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-semibold text-foreground hover:text-primary"
      >
        {q}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
}

// ─── Application form ─────────────────────────────────────
function ApplicationForm() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    const { error } = await (supabase.from("agent_applications") as any).insert({
      full_name: values.full_name,
      email: values.email,
      phone: values.phone,
      years_experience: values.years_experience ?? null,
      areas_of_operation: values.areas_of_operation,
      specializations: values.specializations ?? null,
      message: values.message ?? null,
      source: "website",
    });
    if (error) {
      toast.error("Could not submit your application", {
        description: "Please try again or email us directly.",
      });
      return;
    }
    setSubmitted(true);
    toast.success("Application received! We'll be in touch within 24 hours.");
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-accent/40 bg-accent/10 px-6 py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-accent" />
        <h3 className="font-display text-2xl font-semibold">Application submitted</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          We've received your application and will review it within 24 hours. Check your email for next steps.
        </p>
        <Button asChild className="mt-2">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Full legal name *
          </label>
          <Input
            {...form.register("full_name")}
            placeholder="As it appears on your ID"
            className="mt-1.5"
          />
          {form.formState.errors.full_name && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.full_name.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Email *
          </label>
          <Input
            type="email"
            {...form.register("email")}
            placeholder="you@email.com"
            className="mt-1.5"
          />
          {form.formState.errors.email && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Phone / WhatsApp *
          </label>
          <Input
            {...form.register("phone")}
            placeholder="+254 7XX XXX XXX"
            className="mt-1.5"
          />
          {form.formState.errors.phone && (
            <p className="mt-1 text-xs text-destructive">{form.formState.errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Years of experience
          </label>
          <Input
            type="number"
            min={0}
            max={50}
            {...form.register("years_experience")}
            placeholder="e.g. 3"
            className="mt-1.5"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Areas you cover *
          </label>
          <Input
            {...form.register("areas_of_operation")}
            placeholder="e.g. Westlands, Kilimani, Nyali"
            className="mt-1.5"
          />
          {form.formState.errors.areas_of_operation && (
            <p className="mt-1 text-xs text-destructive">
              {form.formState.errors.areas_of_operation.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Specialisations (optional)
          </label>
          <Input
            {...form.register("specializations")}
            placeholder="e.g. Luxury homes, Commercial, Off-plan"
            className="mt-1.5"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Anything else you'd like us to know?
          </label>
          <Textarea
            {...form.register("message")}
            rows={3}
            placeholder="Your background, motivation, notable transactions..."
            className="mt-1.5 resize-none"
          />
        </div>
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? "Submitting…" : "Apply now"}
        {!form.formState.isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link to="/agent-signup" className="font-medium text-primary hover:underline">
          Create your agent account →
        </Link>
      </p>
    </form>
  );
}

// ─── Page component ────────────────────────────────────────
function JoinPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-900">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/50"
        />
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pt-32 lg:px-8">
          <div className="max-w-2xl">
            <Badge className="border border-white/20 bg-white/10 text-white hover:bg-white/15">
              <Users className="mr-1.5 h-3 w-3" /> Now recruiting across Kenya
            </Badge>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl xl:text-6xl">
              Build your real estate career with Bright Edge
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">
              Join a growing network of verified, professional agents. We provide the platform,
              the leads, and the marketing. You close the deals.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <a href="#apply">
                  Apply now <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/15"
              >
                <a href="#how-it-works">How it works</a>
              </Button>
            </div>

            {/* Trust stats */}
            <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-white/15 pt-8 text-white">
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/55">Active agents</dt>
                <dd className="mt-1 font-display text-2xl font-semibold">6+</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/55">Verification SLA</dt>
                <dd className="mt-1 font-display text-2xl font-semibold">24 hrs</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/55">Avg close time</dt>
                <dd className="mt-1 font-display text-2xl font-semibold">61 days</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Why join
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything you need to close more deals
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Bright Edge is built for independent agents who want professional infrastructure
            without building it themselves.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)]"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Application process
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              From application to verified in 4 steps
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map(({ step, title, body }) => (
              <div key={step} className="relative">
                <span
                  aria-hidden
                  className="font-display text-[3.5rem] font-semibold leading-none text-border select-none"
                >
                  {step}
                </span>
                <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Requirements
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              What we look for
            </h2>
            <p className="mt-3 text-base text-muted-foreground">
              We maintain high standards so every client interaction reflects well on all our agents.
            </p>
            <ul className="mt-8 space-y-3">
              {REQUIREMENTS.map((req) => (
                <li key={req} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <span className="text-foreground">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Verification timeline */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Verification SLA
                </p>
                <p className="font-display text-2xl font-semibold">Maximum 24 hours</p>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {[
                { icon: Zap, label: "Instant", desc: "Email confirmation on application" },
                { icon: Shield, label: "Same day", desc: "Document review begins" },
                { icon: UserCheck, label: "≤ 24 hours", desc: "Decision + notification sent" },
                { icon: Star, label: "Immediate", desc: "Badge + dashboard activated on approval" },
              ].map(({ icon: Icon, label, desc }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-foreground">{label}</span>
                    <span className="ml-2 text-sm text-muted-foreground">{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">FAQ</p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Common questions
            </h2>
          </div>
          <div className="mt-10 rounded-2xl border border-border bg-card px-6 shadow-[var(--shadow-card)]">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="mx-auto max-w-2xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Apply</p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to join?
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            Fill in your details below. No account needed at this stage — we'll guide you
            through creating one after pre-approval.
          </p>
        </div>
        <div className="mt-10 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-card)]">
          <ApplicationForm />
        </div>
      </section>
    </>
  );
}
