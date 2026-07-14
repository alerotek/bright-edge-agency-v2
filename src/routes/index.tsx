import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Award,
  Clock,
  Compass,
  MessageCircle,
  ShieldCheck,
  Star,
} from "lucide-react";
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
      {
        name: "description",
        content:
          "Curated luxury and residential properties for sale and rent across Nairobi and the Kenyan coast. Transparent advisory, professional management.",
      },
      { property: "og:title", content: "Bright Edge Agency | Premium Real Estate in Kenya" },
      {
        property: "og:description",
        content: "Curated luxury and residential properties for sale and rent across Kenya.",
      },
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

/* ─── Location card images (keyed by slug) ─── */
const LOCATION_IMAGES: Record<string, string> = {
  westlands:
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  kilimani:
    "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
  "mombasa-road":
    "https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?w=800&q=80",
  nyali:
    "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80",
  kileleshwa:
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
};
const FALLBACK_LOCATION_IMG =
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80";

function HomePage() {
  const { data: settings } = useQuery(settingsQuery);
  const { data: featured = [] } = useQuery(featuredPropertiesQuery);
  const { data: reviews = [] } = useQuery(allReviewsQuery);
  const { data: posts = [] } = useQuery(allBlogPostsQuery);
  const { data: testimonials = [] } = useQuery(testimonialsQuery);
  const { data: locations = [] } = useQuery(locationsQuery);

  const featuredReviews = reviews.filter((r: any) => r.featured).slice(0, 2);
  const marketInsights = posts
    .filter((p: any) => p.category?.slug === "market-insights")
    .slice(0, 2);
  const investmentGuides = posts
    .filter((p: any) => p.category?.slug === "investment-guides")
    .slice(0, 2);
  const recentArticles = posts.slice(0, 3);
  const featuredTestimonial =
    testimonials.find((t: any) => t.featured) ?? testimonials[0];

  /* Two cards to float in the hero */
  const heroCards = featured.slice(0, 2);

  return (
    <>
      {/* ══════════════════════════════════════════
          HERO — asymmetric two-column
      ══════════════════════════════════════════ */}
      <section className="relative isolate overflow-hidden bg-slate-900">
        {/* Background image */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-50"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        {/* Gradient overlay — heavier on left so text stays readable */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-slate-900/30"
        />

        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:pb-28">
          {/* Left — text */}
          <div className="max-w-xl">
            <Badge className="bg-white/10 text-white hover:bg-white/15 border border-white/20">
              New listings every week
            </Badge>
            <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl xl:text-6xl">
              {settings?.hero_headline ?? "Find Your Next Property With Confidence"}
            </h1>
            <p className="mt-5 text-lg text-white/75">
              {settings?.hero_subheadline ??
                "Discover premium rentals, residential homes, and investment opportunities curated by Bright Edge Agency."}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                asChild
                size="lg"
                className="bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link to="/properties">
                  Browse properties <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/15"
              >
                <a
                  href={buildWhatsappLink(
                    settings?.company_whatsapp,
                    "Hi Bright Edge, I'd like help with my property search.",
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" /> Chat on WhatsApp
                </a>
              </Button>
            </div>

            {/* Stats row */}
            <dl className="mt-14 grid grid-cols-3 gap-6 border-t border-white/15 pt-8 text-white">
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/55">
                  Live listings
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold">22+</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/55">
                  Locations
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold">
                  {locations.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wider text-white/55">
                  Avg close
                </dt>
                <dd className="mt-1 font-display text-2xl font-semibold">61 days</dd>
              </div>
            </dl>
          </div>

          {/* Right — floating property card previews */}
          {heroCards.length > 0 ? (
            <div className="relative hidden lg:block" aria-hidden>
              {/* Card 1 — slightly rotated, behind */}
              {heroCards[1] && (
                <div className="absolute -right-4 top-8 w-[260px] rotate-3 opacity-80 drop-shadow-2xl transition-transform duration-500 hover:rotate-1 hover:opacity-100">
                  <PropertyCard property={heroCards[1]} />
                </div>
              )}
              {/* Card 0 — front, counter-rotated */}
              <div className="relative z-10 w-[280px] -rotate-2 drop-shadow-2xl transition-transform duration-500 hover:rotate-0">
                <PropertyCard property={heroCards[0]} />
              </div>
              {/* Subtle glow behind cards */}
              <div
                aria-hidden
                className="absolute inset-0 -z-10 blur-3xl opacity-30 rounded-full"
                style={{ background: "var(--gradient-brand)" }}
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURED PROPERTIES
      ══════════════════════════════════════════ */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <SectionHeading
          variant="ruled"
          eyebrow="Featured"
          title="Hand-picked properties"
          description="A rotating selection of the best on our books right now, from coastal villas to executive city rentals."
          action={
            <Button asChild variant="outline">
              <Link to="/properties">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LOCATIONS STRIP
      ══════════════════════════════════════════ */}
      <section className="bg-muted/40 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            variant="ruled"
            eyebrow="Where we operate"
            title="Nairobi · Coast · Nationwide"
          />
        </div>

        {/* Horizontally scrollable strip */}
        <div className="mt-8 flex gap-4 overflow-x-auto px-4 pb-4 sm:px-6 lg:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(locations as any[]).map((loc) => {
            const img =
              LOCATION_IMAGES[loc.slug] ?? loc.hero_image ?? FALLBACK_LOCATION_IMG;
            return (
              <Link
                key={loc.id}
                to="/properties"
                search={{ location: loc.slug } as any}
                className="group relative flex h-48 w-52 shrink-0 overflow-hidden rounded-2xl bg-slate-800 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-52 sm:w-60"
              >
                <img
                  src={img}
                  alt={loc.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Dark scrim */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
                />
                {/* Text */}
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-display text-lg font-semibold text-white">
                    {loc.name}
                  </p>
                  {loc.region ? (
                    <p className="mt-0.5 text-xs text-white/65">{loc.region}</p>
                  ) : null}
                </div>
                {/* Accent border on hover */}
                <div
                  aria-hidden
                  className="absolute inset-0 rounded-2xl ring-2 ring-accent ring-offset-0 opacity-0 transition-opacity group-hover:opacity-100"
                />
              </Link>
            );
          })}

          {/* "All properties" tail card */}
          <Link
            to="/properties"
            className="group relative flex h-48 w-40 shrink-0 flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-card text-center transition-all duration-300 hover:border-primary hover:bg-secondary sm:h-52 sm:w-48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowRight className="h-6 w-6 text-muted-foreground transition-colors group-hover:text-primary" />
            <span className="text-sm font-semibold text-muted-foreground group-hover:text-foreground">
              All properties
            </span>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          AGENT RECRUITMENT STRIP
      ══════════════════════════════════════════ */}
      <section className="border-y border-border bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Now recruiting
            </p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white sm:text-3xl">
              Are you a real estate professional?
            </h2>
            <p className="mt-2 text-sm text-white/70">
              Join Bright Edge as a verified independent agent. We provide the platform, the leads,
              and the marketing — you close the deals.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-3">
            <Button
              asChild
              size="lg"
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link to="/join">
                Learn more <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-transparent text-white hover:bg-white/10"
            >
              <Link to="/agent-signup">Create account</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          WHY BRIGHT EDGE — horizontal stat strip
      ══════════════════════════════════════════ */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            variant="numbered"
            step="01"
            eyebrow="Why Bright Edge"
            title="A practice, not a marketplace"
            description="We treat every search like a project: scoped, costed, and seen through to completion."
          />

          {/* Stat strip */}
          <div className="mt-12 grid grid-cols-2 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {[
              {
                icon: ShieldCheck,
                stat: "100%",
                label: "Verified inventory",
                body: "Every listing walked & photographed by an agent",
              },
              {
                icon: Compass,
                stat: "15+",
                label: "Suburbs covered",
                body: "Diani to Runda — we know the streets and the schools",
              },
              {
                icon: Award,
                stat: "61 days",
                label: "Avg close time",
                body: "Below the city benchmark of 92 days",
              },
              {
                icon: Clock,
                stat: "4 hrs",
                label: "Response time",
                body: "Inquiries answered every working day",
              },
            ].map(({ icon: Icon, stat, label, body }) => (
              <div
                key={label}
                className="group flex flex-col gap-3 p-6 transition-colors hover:bg-muted/40"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-display text-3xl font-semibold text-foreground">
                  {stat}
                </p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          AUTHORITY — reviews + insights + articles
      ══════════════════════════════════════════ */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            variant="numbered"
            step="02"
            eyebrow="Authority"
            title="Practical knowledge, written by people who close deals"
            description="Independent reviews, quarterly market reads, and investment guides — no fluff, no recycled press releases."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {/* Featured property reviews */}
            <div className="lg:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Featured property reviews
              </p>
              <div className="mt-4 grid gap-5 sm:grid-cols-2">
                {featuredReviews.map((r: any) => (
                  <Link
                    key={r.id}
                    to="/reviews/$slug"
                    params={{ slug: r.slug }}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)]"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-muted">
                      <img
                        src={r.featured_image ?? ""}
                        alt={r.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-2 p-5">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < Math.round(Number(r.rating ?? 0))
                                ? "fill-accent text-accent"
                                : "text-muted-foreground/30"
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-foreground/70">
                          {Number(r.rating ?? 0).toFixed(1)}
                        </span>
                      </div>
                      <h4 className="font-display text-lg font-semibold text-foreground group-hover:text-primary">
                        {r.title}
                      </h4>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {r.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Market insights + investment guides */}
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Market insights
                </p>
                <ul className="mt-3 divide-y divide-border">
                  {marketInsights.map((p: any) => (
                    <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        to="/blog/$slug"
                        params={{ slug: p.slug }}
                        className="block hover:text-primary"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {p.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(p.published_at)} · {p.reading_minutes ?? 5} min
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Investment guides
                </p>
                <ul className="mt-3 divide-y divide-border">
                  {investmentGuides.map((p: any) => (
                    <li key={p.id} className="py-3 first:pt-0 last:pb-0">
                      <Link
                        to="/blog/$slug"
                        params={{ slug: p.slug }}
                        className="block hover:text-primary"
                      >
                        <p className="text-sm font-semibold text-foreground">
                          {p.title}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDate(p.published_at)} · {p.reading_minutes ?? 5} min
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Recent articles */}
          <div className="mt-16">
            <SectionHeading
              variant="ruled"
              eyebrow="From the journal"
              title="Recent articles"
              action={
                <Button asChild variant="ghost">
                  <Link to="/blog">
                    All articles <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              }
            />
            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {recentArticles.map((p: any) => (
                <Link
                  key={p.id}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className="group"
                >
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
                    <img
                      src={p.featured_image ?? ""}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <p className="mt-4 text-xs uppercase tracking-wider text-primary">
                    {p.category?.name}
                  </p>
                  <h3 className="mt-1 font-display text-lg font-semibold text-foreground group-hover:text-primary">
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(p.published_at)} · {p.reading_minutes ?? 5} min read
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIAL
      ══════════════════════════════════════════ */}
      {featuredTestimonial ? (
        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
                  Client voice
                </p>
                <p className="mt-4 font-display text-2xl leading-snug text-white sm:text-3xl">
                  "{featuredTestimonial.quote}"
                </p>
                <p className="mt-6 text-sm text-white/80">
                  <span className="font-semibold text-white">
                    {featuredTestimonial.author_name}
                  </span>
                  {featuredTestimonial.author_title
                    ? ` · ${featuredTestimonial.author_title}`
                    : null}
                </p>
              </div>
              {featuredTestimonial.author_photo ? (
                <img
                  src={featuredTestimonial.author_photo}
                  alt={featuredTestimonial.author_name}
                  className="hidden h-24 w-24 rounded-full object-cover ring-4 ring-white/20 lg:block"
                  loading="lazy"
                />
              ) : null}
            </div>
          </div>
        </section>
      ) : null}
      {/* ══════════════════════════════════════════
          JOIN BRIGHT EDGE CTA (Recruitment)
      ══════════════════════════════════════════ */}
      <section className="bg-secondary/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative isolate overflow-hidden bg-primary px-6 py-16 shadow-2xl rounded-3xl sm:px-16 md:pt-24 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
            <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Are you a qualified agent?<br />Join Bright Edge today.
              </h2>
              <p className="mt-6 text-lg text-white/70 leading-8">
                Gain access to exclusive leads, professional marketing support, and our advanced technology platform. 
                Build your real estate career with a brand that values excellence.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6 lg:justify-start">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/join">Learn more</Link>
                </Button>
                <Link to="/apply" className="text-sm font-semibold leading-6 text-white hover:text-white/80">
                  Apply Now <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
            <div className="relative mt-16 h-80 lg:mt-8 flex items-center justify-center">
              <div className="h-64 w-64 rounded-full bg-white/5 p-8 ring-1 ring-white/10 backdrop-blur-3xl">
                <div className="flex h-full w-full items-center justify-center rounded-full bg-accent/20">
                  <Award className="h-24 w-24 text-accent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
