import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Award, Clock, Compass, Home, MessageCircle, ShieldCheck, Star } from "lucide-react";
import {
  allBlogPostsQuery,
  allReviewsQuery,
  featuredPropertiesQuery,
  settingsQuery,
  testimonialsQuery,
  locationsQuery,
} from "@/lib/queries";
import { PropertyCard } from "@/components/site/PropertyCard";
import { SectionHeading } from "@/components/site/SectionHeading";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildWhatsappLink, formatDate } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bright Edge Agency | Premium Real Estate in Kenya" },
      { name: "description", content: "Curated luxury and residential properties for sale and rent across Nairobi and the Kenyan coast. Transparent advisory, professional management." },
      { property: "og:title", content: "Bright Edge Agency | Premium Real Estate in Kenya" },
      { property: "og:description", content: "Curated luxury and residential properties for sale and rent across Kenya." },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(settingsQuery),
      context.queryClient.ensureQueryData(featuredPropertiesQuery),
      context.queryClient.ensureQueryData(allReviewsQuery),
      context.queryClient.ensureQueryData(allBlogPostsQuery),
      context.queryClient.ensureQueryData(testimonialsQuery),
      context.queryClient.ensureQueryData(locationsQuery),
    ]),
  component: HomePage,
});

function HomePage() {
  const { data: settings } = useQuery(settingsQuery);
  const { data: featured = [] } = useQuery(featuredPropertiesQuery);
  const { data: reviews = [] } = useQuery(allReviewsQuery);
  const { data: posts = [] } = useQuery(allBlogPostsQuery);
  const { data: testimonials = [] } = useQuery(testimonialsQuery);
  const { data: locations = [] } = useQuery(locationsQuery);

  const featuredReviews = reviews.filter((r: any) => r.featured).slice(0, 2);
  const marketInsights = posts.filter((p: any) => p.category?.slug === "market-insights").slice(0, 2);
  const investmentGuides = posts.filter((p: any) => p.category?.slug === "investment-guides").slice(0, 2);
  const recentArticles = posts.slice(0, 3);
  const featuredTestimonial = testimonials.find((t: any) => t.featured) ?? testimonials[0];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-slate-900">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-70"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 sm:pt-32 lg:px-8 lg:pb-32">
          <div className="max-w-3xl">
            <Badge className="bg-white/10 text-white hover:bg-white/15 border border-white/20">
              <Home className="mr-1.5 h-3 w-3" /> New listings every week
            </Badge>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-white sm:text-6xl">
              {settings?.hero_headline ?? "Find Your Next Property With Confidence"}
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white/80">
              {settings?.hero_subheadline ??
                "Discover premium rentals, residential homes, and investment opportunities curated by Bright Edge Agency."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/properties">
                  Browse properties <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/15">
                <a href={buildWhatsappLink(settings?.company_whatsapp, "Hi Bright Edge, I'd like help with my property search.")} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" /> Chat on WhatsApp
                </a>
              </Button>
            </div>
            <dl className="mt-16 grid max-w-2xl grid-cols-3 gap-6 border-t border-white/15 pt-8 text-white">
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/60">Live listings</dt>
                <dd className="mt-1 font-display text-2xl font-semibold">22+</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/60">Locations</dt>
                <dd className="mt-1 font-display text-2xl font-semibold">{locations.length}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/60">Avg close time</dt>
                <dd className="mt-1 font-display text-2xl font-semibold">61 days</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* Featured properties */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Featured"
          title="Hand-picked properties"
          description="A rotating selection of the best on our books right now, from coastal villas to executive city rentals."
          action={
            <Button asChild variant="outline">
              <Link to="/properties">View all properties <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          }
        />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      {/* Why Bright Edge */}
      <section className="bg-muted/50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            align="center"
            eyebrow="Why Bright Edge"
            title="A practice, not a marketplace"
            description="We treat every search like a project: scoped, costed, and seen through to completion."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Verified inventory", body: "Every listing on the site has been walked, photographed, and pricing-checked by an agent." },
              { icon: Compass, title: "Local knowledge", body: "Suburb-by-suburb expertise from Diani to Runda, we know the streets and the schools." },
              { icon: Award, title: "Closing track record", body: "Average days-on-market is 61, below the city benchmark of 92." },
              { icon: Clock, title: "Fast response", body: "Inquiries answered within four working hours, every working day of the year." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authority: reviews + insights + guides + recent */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Authority"
          title="Practical real estate knowledge, written by people who close deals"
          description="Independent reviews, quarterly market reads, and investment guides, no fluff, no recycled press releases."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {/* Featured property reviews */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Featured property reviews</h3>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {featuredReviews.map((r: any) => (
                <Link
                  key={r.id}
                  to="/reviews/$slug"
                  params={{ slug: r.slug }}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)]"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-muted">
                    <img src={r.featured_image ?? ""} alt={r.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                  </div>
                  <div className="space-y-2 p-5">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${i < Math.round(Number(r.rating ?? 0)) ? "fill-accent text-accent" : "text-muted-foreground/30"}`}
                        />
                      ))}
                      <span className="ml-1 text-foreground/70">{Number(r.rating ?? 0).toFixed(1)}</span>
                    </div>
                    <h4 className="font-display text-lg font-semibold text-foreground group-hover:text-primary">{r.title}</h4>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{r.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Market insights + investment guides side column */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Market insights</h3>
              <ul className="mt-3 divide-y divide-border">
                {marketInsights.map((p: any) => (
                  <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                    <Link to="/blog/$slug" params={{ slug: p.slug }} className="block hover:text-primary">
                      <p className="text-sm font-semibold text-foreground">{p.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(p.published_at)} · {p.reading_minutes ?? 5} min read</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">Investment guides</h3>
              <ul className="mt-3 divide-y divide-border">
                {investmentGuides.map((p: any) => (
                  <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                    <Link to="/blog/$slug" params={{ slug: p.slug }} className="block hover:text-primary">
                      <p className="text-sm font-semibold text-foreground">{p.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(p.published_at)} · {p.reading_minutes ?? 5} min read</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14">
          <SectionHeading
            eyebrow="From the journal"
            title="Recent articles"
            action={
              <Button asChild variant="ghost">
                <Link to="/blog">All articles <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            }
          />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {recentArticles.map((p: any) => (
              <Link key={p.id} to="/blog/$slug" params={{ slug: p.slug }} className="group">
                <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
                  <img src={p.featured_image ?? ""} alt={p.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                </div>
                <p className="mt-4 text-xs uppercase tracking-wider text-primary">{p.category?.name}</p>
                <h3 className="mt-1 font-display text-lg font-semibold text-foreground group-hover:text-primary">{p.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(p.published_at)} · {p.reading_minutes ?? 5} min read</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial + CTA */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Client voice</p>
            {featuredTestimonial ? (
              <>
                <p className="mt-4 font-display text-2xl leading-snug text-white sm:text-3xl">
                  “{featuredTestimonial.quote}”
                </p>
                <p className="mt-6 text-sm text-white/80">
                  <span className="font-semibold text-white">{featuredTestimonial.author_name}</span>
                  {featuredTestimonial.author_title ? ` · ${featuredTestimonial.author_title}` : null}
                </p>
              </>
            ) : null}
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-8 backdrop-blur">
            <h3 className="font-display text-2xl font-semibold">Ready to start a search?</h3>
            <p className="mt-2 text-sm text-white/80">
              Tell us what you're looking for. We'll shortlist three to five matches inside 48 hours and book the viewings.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link to="/contact">Start a brief</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 bg-transparent text-white hover:bg-white/10">
                <a href={buildWhatsappLink(settings?.company_whatsapp, "Hi Bright Edge, I'd like to discuss a property search.")} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp us
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
