import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { reviewBySlugQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/reviews/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(reviewBySlugQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    const r: any = loaderData;
    if (!r) return {};
    return {
      meta: [
        { title: r.meta_title ?? `${r.title} — Bright Edge Reviews` },
        { name: "description", content: r.meta_description ?? r.excerpt ?? "" },
        { property: "og:title", content: r.meta_title ?? r.title },
        { property: "og:description", content: r.meta_description ?? r.excerpt ?? "" },
        { property: "og:type", content: "article" },
        { property: "og:image", content: r.featured_image ?? "" },
        { property: "og:url", content: `/reviews/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/reviews/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Review",
            itemReviewed: { "@type": "Residence", name: r.property?.title ?? r.title },
            reviewBody: r.excerpt ?? "",
            reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
            datePublished: r.published_at,
          }),
        },
      ],
    };
  },
  component: ReviewDetail,
});

function ReviewDetail() {
  const r: any = Route.useLoaderData();
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <Link to="/reviews" className="text-sm text-muted-foreground hover:text-foreground">← All reviews</Link>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{r.title}</h1>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>{formatDate(r.published_at)}</span>
        <span className="inline-flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className={`h-4 w-4 ${i < Math.round(Number(r.rating ?? 0)) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
          ))}
          <span className="ml-1 text-foreground/80">{Number(r.rating ?? 0).toFixed(1)}/5</span>
        </span>
      </div>
      {r.featured_image && (
        <img src={r.featured_image} alt={r.title} className="mt-6 aspect-[16/10] w-full rounded-2xl object-cover" />
      )}
      <div className="prose prose-slate mt-8 max-w-none leading-relaxed text-foreground/85">
        {(r.content ?? "").split(/\n+/).map((p: string, i: number) => <p key={i}>{p}</p>)}
      </div>
      {r.property ? (
        <div className="mt-12 rounded-2xl border border-border bg-card p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Reviewed property</p>
          <p className="mt-2 font-display text-lg font-semibold">{r.property.title}</p>
          <Button asChild className="mt-3"><Link to="/property/$slug" params={{ slug: r.property.slug }}>View listing</Link></Button>
        </div>
      ) : null}
    </article>
  );
}
