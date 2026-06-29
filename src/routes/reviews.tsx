import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Star } from "lucide-react";
import { allReviewsQuery } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/reviews")({
  head: () => ({
    meta: [
      { title: "Property Reviews | Bright Edge Agency" },
      { name: "description", content: "Independent property, estate, and neighbourhood reviews by Bright Edge Agency." },
      { property: "og:title", content: "Property Reviews | Bright Edge Agency" },
      { property: "og:url", content: "/reviews" },
    ],
    links: [{ rel: "canonical", href: "/reviews" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(allReviewsQuery),
  component: ReviewsPage,
});

function ReviewsPage() {
  const { data: reviews = [] } = useQuery(allReviewsQuery);
  return (
    <>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Authority</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Property reviews</h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            Hands-on, on-site reviews of properties, estates, and neighbourhoods we've walked. Honest notes, ratings, and the questions we asked the seller.
          </p>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
        {reviews.map((r: any) => (
          <article key={r.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)]">
            <Link to="/reviews/$slug" params={{ slug: r.slug }} className="block aspect-[16/10] overflow-hidden bg-muted">
              <img src={r.featured_image ?? ""} alt={r.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-5">
              <div className="flex items-center gap-1 text-xs">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(Number(r.rating ?? 0)) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                ))}
                <span className="ml-1 text-foreground/70">{Number(r.rating ?? 0).toFixed(1)}</span>
              </div>
              <Link to="/reviews/$slug" params={{ slug: r.slug }}>
                <h2 className="font-display text-lg font-semibold text-foreground group-hover:text-primary">{r.title}</h2>
              </Link>
              <p className="line-clamp-3 text-sm text-muted-foreground">{r.excerpt}</p>
              <p className="text-xs text-muted-foreground">{formatDate(r.published_at)}{r.property?.location?.name ? ` · ${r.property.location.name}` : ""}</p>
              <Link to="/reviews/$slug" params={{ slug: r.slug }} className="group/link mt-auto inline-flex items-center gap-1 pt-2 text-sm font-semibold text-primary">
                Read full review
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
              </Link>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
