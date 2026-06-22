import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Compass, FileSearch, Home, KeyRound, LineChart } from "lucide-react";

const SERVICES = [
  { icon: Home, title: "Residential sales", body: "Family homes, apartments, and townhouses across Nairobi and the coast — from listing to exchange." },
  { icon: Building2, title: "Luxury sales", body: "Discreet representation for premium villas, penthouses, and waterfront homes." },
  { icon: KeyRound, title: "Executive rentals", body: "Furnished, corporate-grade rental inventory for relocations and short-term needs." },
  { icon: LineChart, title: "Investment advisory", body: "Yield modelling, off-plan due diligence, and portfolio structuring for serious investors." },
  { icon: FileSearch, title: "Due diligence", body: "Title verification, encumbrance checks, structural and management-company review before you sign." },
  { icon: Compass, title: "Property management", body: "Tenant placement, service-charge audits, and on-the-ground property care for landlords." },
];

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services — Bright Edge Agency" },
      { name: "description", content: "Residential and luxury sales, executive rentals, investment advisory, due diligence, and property management across Kenya." },
      { property: "og:title", content: "Services — Bright Edge Agency" },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: ServicesPage,
});

function ServicesPage() {
  return (
    <>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">What we do</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Services</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">Six practice areas, one team, one set of standards.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 lg:px-8">
        {SERVICES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-display text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-primary p-8 text-primary-foreground">
          <h2 className="font-display text-2xl font-semibold">Tell us what you're looking for</h2>
          <p className="mt-2 max-w-2xl text-sm text-primary-foreground/85">A short brief is the fastest way to a shortlist. We'll come back to you inside 48 hours with options worth your time.</p>
          <Link to="/contact" className="mt-5 inline-flex items-center rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90">
            Start a brief
          </Link>
        </div>
      </section>
    </>
  );
}
