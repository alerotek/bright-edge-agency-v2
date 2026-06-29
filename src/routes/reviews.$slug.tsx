import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Share2, Star, X } from "lucide-react";
import { reviewBySlugQuery, allReviewsQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/reviews/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(reviewBySlugQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    const r = loaderData;
    if (!r) return {};
    return {
      meta: [
        { title: r.meta_title ?? `${r.title} | Bright Edge Reviews` },
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
            itemReviewed: { "@type": "Residence", name: r.property?.title || r.title },
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
  const r = Route.useLoaderData();
  const gallery: string[] = Array.isArray(r.gallery_images) ? r.gallery_images : [];
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const scrolled = el.scrollTop;
      const height = el.scrollHeight - el.clientHeight;
      setProgress(height > 0 ? Math.min(100, (scrolled / height) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: allReviews = [] } = useQuery(allReviewsQuery);
  const related = allReviews
    .filter((rev: any) => rev.id !== r.id)
    .slice(0, 3);

  const paragraphs = (r.content ?? "").split(/\n+/).filter((x: string) => x.trim().length);
  const hasMultiple = paragraphs.length > 1;
  const mid = Math.max(1, Math.floor(paragraphs.length / 2));

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: r.title, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    }
  };

  return (
    <>
      {/* Reading progress bar */}
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-muted">
        <div className="h-full bg-primary transition-all duration-150" style={{ width: `${progress}%` }} />
      </div>

      <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Back + share */}
        <div className="flex items-center justify-between">
          <Link to="/reviews" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All reviews
          </Link>
          <button onClick={share} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        {/* Header */}
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{r.title}</h1>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>{formatDate(r.published_at)}</span>
          {r.property?.location?.name && (
            <>
              <span>·</span>
              <span>{r.property.location.name}</span>
            </>
          )}
          <span className="inline-flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className={`h-4 w-4 ${i < Math.round(Number(r.rating ?? 0)) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
            ))}
            <span className="ml-1 text-foreground/80">{Number(r.rating ?? 0).toFixed(1)}/5</span>
          </span>
        </div>

        {/* Featured image */}
        {r.featured_image && (
          <img src={r.featured_image} alt={r.title} className="mt-6 aspect-[16/10] w-full rounded-2xl object-cover" />
        )}

        {/* Content */}
        <div className="prose prose-slate mt-8 max-w-none leading-relaxed text-foreground/85">
          {hasMultiple ? (
            <>
              {paragraphs.slice(0, mid).map((para: string, i: number) => <p key={`a${i}`}>{para}</p>)}
              {gallery[0] && (
                <figure className="my-8 not-prose cursor-pointer" onClick={() => setLightbox(0)}>
                  <img src={gallery[0]} alt={`${r.title} - figure 1`} className="aspect-[16/9] w-full rounded-2xl object-cover transition-opacity hover:opacity-90" />
                </figure>
              )}
              {paragraphs.slice(mid).map((para: string, i: number) => <p key={`b${i}`}>{para}</p>)}
            </>
          ) : (
            <>
              {paragraphs.map((para: string, i: number) => <p key={i}>{para}</p>)}
              {gallery[0] && (
                <figure className="my-8 not-prose cursor-pointer" onClick={() => setLightbox(0)}>
                  <img src={gallery[0]} alt={`${r.title} - figure 1`} className="aspect-[16/9] w-full rounded-2xl object-cover transition-opacity hover:opacity-90" />
                </figure>
              )}
            </>
          )}
        </div>

        {/* Gallery grid */}
        {gallery.length >= 2 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold tracking-tight">More from this visit</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {gallery.slice(1).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`${r.title} gallery ${i + 2}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full cursor-pointer rounded-xl object-cover transition-transform hover:scale-[1.02]"
                  onClick={() => setLightbox(i + 1)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Reviewed property card */}
        {r.property && (
          <div className="mt-12 rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Reviewed property</p>
            <p className="mt-2 font-display text-lg font-semibold">{r.property.title}</p>
            {r.property.location?.name && <p className="text-sm text-muted-foreground">{r.property.location.name}</p>}
            <Button asChild className="mt-3">
              <Link to="/property/$slug" params={{ slug: r.property.slug }}>View listing</Link>
            </Button>
          </div>
        )}

        {/* Related reviews */}
        {related.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <h2 className="font-display text-xl font-semibold tracking-tight">More reviews</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-3">
              {related.map((rev: any) => (
                <Link key={rev.id} to="/reviews/$slug" params={{ slug: rev.slug }} className="group">
                  {rev.featured_image && (
                    <img src={rev.featured_image} alt={rev.title} className="aspect-[16/10] w-full rounded-xl object-cover" />
                  )}
                  <h3 className="mt-2 text-sm font-medium leading-snug group-hover:text-primary">{rev.title}</h3>
                  <div className="mt-1 inline-flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < Math.round(Number(rev.rating ?? 0)) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to reviews CTA */}
        <div className="mt-14 rounded-2xl border border-border bg-muted/30 p-6 text-center">
          <p className="font-display text-lg font-semibold">Explore more reviews</p>
          <p className="mt-1 text-sm text-muted-foreground">Honest, on-site reviews of properties and neighborhoods.</p>
          <Button asChild className="mt-4"><Link to="/reviews">Browse all reviews</Link></Button>
        </div>
      </article>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute right-4 top-4 text-white hover:text-white/70" onClick={() => setLightbox(null)}>
            <X className="h-6 w-6" />
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-white/70"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length); }}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
          <img src={gallery[lightbox]} alt="" className="max-h-[85vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-white/70"
            onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % gallery.length); }}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
          <div className="absolute bottom-4 text-sm text-white/60">{lightbox + 1} / {gallery.length}</div>
        </div>
      )}
    </>
  );
}
