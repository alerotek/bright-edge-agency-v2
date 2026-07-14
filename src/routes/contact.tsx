import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Home, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { settingsQuery } from "@/lib/queries";
import { InquiryForm } from "@/components/site/InquiryForm";
import { Button } from "@/components/ui/button";
import { buildWhatsappLink } from "@/lib/format";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact | Bright Edge Agency" },
      { name: "description", content: "Get in touch with Bright Edge Agency in Nairobi. Phone, email, WhatsApp, and visit-us details." },
      { property: "og:title", content: "Contact | Bright Edge Agency" },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(settingsQuery),
  component: ContactPage,
});

function ContactPage() {
  const { data: s } = useQuery(settingsQuery);
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Get in touch</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Tell us what you need</h1>
        <p className="mt-3 max-w-2xl text-base text-muted-foreground">A short message is the quickest path to a useful answer. We respond to every inquiry inside four working hours.</p>
        <div className="mt-8 rounded-2xl border border-border bg-card p-6">
          <InquiryForm source="contact_page" />
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-semibold">Reach us directly</h2>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            {s?.office_address && <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4" />{s.office_address}</li>}
            {s?.primary_phone && <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4" /><a href={`tel:${s.primary_phone.replace(/\s/g,"")}`} className="hover:text-foreground">{s.primary_phone}</a></li>}
            {s?.primary_email && <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4" /><a href={`mailto:${s.primary_email}`} className="hover:text-foreground">{s.primary_email}</a></li>}
            {s?.business_hours && <li className="text-xs">{s.business_hours}</li>}
          </ul>
        </div>
        {s?.company_whatsapp ? (
          <div className="rounded-2xl bg-accent/15 p-6">
            <h3 className="font-display text-lg font-semibold">Prefer WhatsApp?</h3>
            <p className="mt-1 text-sm text-muted-foreground">Send us a message anytime, most replies inside an hour during business hours.</p>
            <Button asChild className="mt-4 w-full bg-[#25D366] hover:bg-[#25D366]/90 text-white">
              <a href={buildWhatsappLink(s.company_whatsapp, "Hello Bright Edge, I'd like to discuss a property.")} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-4 w-4" /> Chat on WhatsApp
              </a>
            </Button>
          </div>
        ) : null}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-semibold">Join Our Team</h3>
          <p className="mt-1 text-sm text-muted-foreground">Are you a real estate professional? Join Bright Edge as a verified agent.</p>
          <Button asChild className="mt-4 w-full" variant="outline">
            <Link to="/join">Become an Agent</Link>
          </Button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-semibold">List Your Property</h3>
          <p className="mt-1 text-sm text-muted-foreground">Own a property? Get professional marketing and qualified leads.</p>
          <Button asChild className="mt-4 w-full" variant="outline">
            <Link to="/list-property">List Property</Link>
          </Button>
        </div>
      </aside>
    </section>
  );
}
