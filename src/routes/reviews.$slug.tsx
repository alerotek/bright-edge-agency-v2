import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowUp, ChevronLeft, ChevronRight, Share2, Star, X } from "lucide-react";
import { reviewBySlugQuery, allReviewsQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/reviews/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(reviewBySlugQuery(params.slug));
    if (!data) throw notFound();
    await context.queryClient.ensureQueryData(allReviewsQuery);
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
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      setProgress(el.scrollHeight > el.clientHeight ? Math.min(100, (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100) : 0);
      setShowTop(el.scrollTop > 600);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: allReviews = [] } = useQuery(allReviewsQuery);
  const related = allReviews.filter((rev: any) => rev.id !== r.id).slice(0, 4);

  const paragraphs = (r.content ?? "").split(/\n+/).filter((x: string) => x.trim().length);
  const mid = Math.max(1, Math.floor(paragraphs.length / 2));
  const hasMultiple = paragraphs.length > 1;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: r.title, url }); } catch { /* noop */ } }
    else { try { await navigator.clipboard.writeText(url); alert("Link copied!"); } catch { /* noop */ } }
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-muted/40">
        <div className="h-full bg-gradient-to-r from-primary to-[#2F4DCC] transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      {r.featured_image && (
        <div className="relative h-[45vh] min-h-[320px] w-full overflow-hidden lg:h-[60vh]">
          <img src={r.featured_image} alt={r.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-5xl px-6 pb-10 sm:px-8 lg:px-8">
              <h1 className="mt-4 max-w-4xl font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">{r.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span>{formatDate(r.published_at)}</span>
                <span className="h-1 w-1 rounded-full bg-white/50" />
                {r.property?.location?.name && <span>{r.property.location.name}</span>}
                <span className="inline-flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.round(Number(r.rating ?? 0)) ? "fill-amber-400 text-amber-400" : "text-white/30"}`} />
                  ))}
                  <span className="ml-1 text-white">{Number(r.rating ?? 0).toFixed(1)}/5</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <article className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
          <div className="min-w-0">
            {!r.featured_image && (
              <div className="mx-auto mb-8 max-w-3xl">
                <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">{r.title}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <span>{formatDate(r.published_at)}</span>
                  {r.property?.location?.name && <span>{r.property.location.name}</span>}
                  <span className="inline-flex items-center gap-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < Math.round(Number(r.rating ?? 0)) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />)}<span className="ml-1">{Number(r.rating ?? 0).toFixed(1)}/5</span></span>
                </div>
              </div>
            )}

            <div className="mx-auto max-w-3xl">
              <div className="prose prose-lg prose-slate mt-0 max-w-none leading-relaxed">
                {hasMultiple ? (
                  <>
                    {paragraphs.slice(0, mid).map((para: string, i: number) => <p key={`a${i}`} className="text-[1.0625rem] leading-8 text-foreground/85">{para}</p>)}
                    {gallery[0] && (
                      <figure className="my-10 -mx-4 cursor-pointer not-prose sm:-mx-8 lg:-mx-16" onClick={() => setLightbox(0)}>
                        <img src={gallery[0]} alt={`${r.title} - figure 1`} className="w-full rounded-xl object-cover shadow-lg transition hover:shadow-xl" />
                      </figure>
                    )}
                    {paragraphs.slice(mid).map((para: string, i: number) => <p key={`b${i}`} className="text-[1.0625rem] leading-8 text-foreground/85">{para}</p>)}
                  </>
                ) : (
                  <>
                    {paragraphs.map((para: string, i: number) => <p key={i} className="text-[1.0625rem] leading-8 text-foreground/85">{para}</p>)}
                    {gallery[0] && (
                      <figure className="my-10 -mx-4 cursor-pointer not-prose sm:-mx-8 lg:-mx-16" onClick={() => setLightbox(0)}>
                        <img src={gallery[0]} alt={`${r.title} - figure 1`} className="w-full rounded-xl object-cover shadow-lg transition hover:shadow-xl" />
                      </figure>
                    )}
                  </>
                )}
              </div>

              {gallery.length >= 2 && (
                <section className="mt-14">
                  <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight">More from this visit</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {gallery.slice(1).map((src, i) => (
                      <img key={i} src={src} alt={`${r.title} gallery ${i + 2}`} loading="lazy" className="aspect-[4/3] w-full cursor-pointer rounded-xl object-cover object-center shadow-md transition hover:shadow-lg hover:scale-[1.01]" onClick={() => setLightbox(i + 1)} />
                    ))}
                  </div>
                </section>
              )}

              {r.property && (
                <div className="mt-14 rounded-2xl border border-border bg-card p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Reviewed property</p>
                  <p className="mt-2 font-display text-xl font-semibold">{r.property.title}</p>
                  {r.property.location?.name && <p className="mt-1 text-sm text-muted-foreground">{r.property.location.name}</p>}
                  <Button asChild className="mt-4"><Link to="/property/$slug" params={{ slug: r.property.slug }}>View listing</Link></Button>
                </div>
              )}

              <div className="mt-14 flex justify-center">
                <div className="inline-flex gap-2">
                  <Button variant="outline" asChild><Link to="/reviews"><ChevronLeft className="mr-1 h-4 w-4" />Back to reviews</Link></Button>
                  <Button variant="outline" onClick={share}><Share2 className="mr-1 h-4 w-4" />Share</Button>
                </div>
              </div>

              {related.length > 0 && (
                <section className="mt-16 border-t border-border pt-12">
                  <h2 className="mb-8 font-display text-2xl font-semibold tracking-tight">More reviews</h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {related.map((rev: any) => (
                      <Link key={rev.id} to="/reviews/$slug" params={{ slug: rev.slug }} className="group block overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg">
                        {rev.featured_image && (
                          <div className="aspect-[16/10] overflow-hidden">
                            <img src={rev.featured_image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          </div>
                        )}
                        <div className="p-5">
                          <h3 className="mt-2 font-display text-lg font-semibold leading-snug group-hover:text-primary">{rev.title}</h3>
                          <div className="mt-2 inline-flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-3 w-3 ${i < Math.round(Number(rev.rating ?? 0)) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />)}</div>
                          {rev.property?.location?.name && <p className="mt-2 text-sm text-muted-foreground">{rev.property.location.name}</p>}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <aside className="mt-12 hidden lg:mt-0 lg:block">
            <div className="sticky top-20 space-y-8">
              <div className="rounded-2xl border border-border bg-muted/30 p-6">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">About this review</h3>
                <p className="mt-3 text-sm text-muted-foreground">{r.excerpt}</p>
                <div className="mt-4 inline-flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-5 w-5 ${i < Math.round(Number(r.rating ?? 0)) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />)}
                  <span className="ml-2 text-sm font-semibold">{Number(r.rating ?? 0).toFixed(1)}/5</span>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 p-6">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">Reviewed</h3>
                {r.property ? (
                  <div className="mt-3">
                    <Link to="/property/$slug" params={{ slug: r.property?.slug }} className="font-semibold text-foreground hover:text-primary">{r.property?.title}</Link>
                    {r.property?.location?.name && <p className="mt-1 text-sm text-muted-foreground">{r.property.location.name}</p>}
                  </div>
                ) : null}
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 p-6">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">Share</h3>
                <div className="mt-3 flex gap-2">
                  <button onClick={share} className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
                    <Share2 className="h-4 w-4" />Share review
                  </button>
                </div>
              </div>
              {related.length > 0 && (
                <div className="rounded-2xl border border-border bg-muted/30 p-6">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">More reviews</h3>
                  <div className="mt-4 space-y-4">
                    {related.slice(0, 3).map((rev: any) => (
                      <Link key={rev.id} to="/reviews/$slug" params={{ slug: rev.slug }} className="group flex gap-3">
                        {rev.featured_image && <img src={rev.featured_image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
                        <div>
                          <p className="text-sm font-medium leading-snug group-hover:text-primary">{rev.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(rev.published_at)}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </article>

      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 z-40 rounded-full bg-primary p-3 text-primary-foreground shadow-lg transition-all ${showTop ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`}
        aria-label="Back to top"
      >
        <ArrowUp className="h-5 w-5" />
      </button>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button className="absolute right-4 top-4 text-white hover:text-white/70" onClick={() => setLightbox(null)}><X className="h-6 w-6" /></button>
          <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-white/70" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox - 1 + gallery.length) % gallery.length); }}><ChevronLeft className="h-8 w-8" /></button>
          <img src={gallery[lightbox]} alt="" className="max-h-[85vh] max-w-full rounded-lg object-contain" onClick={(e) => e.stopPropagation()} />
          <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-white/70" onClick={(e) => { e.stopPropagation(); setLightbox((lightbox + 1) % gallery.length); }}><ChevronRight className="h-8 w-8" /></button>
          <div className="absolute bottom-4 text-sm text-white/60">{lightbox + 1} / {gallery.length}</div>
        </div>
      )}
    </>
  );
}
