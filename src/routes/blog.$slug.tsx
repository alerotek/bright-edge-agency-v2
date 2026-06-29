import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowUp, ChevronLeft, ChevronRight, Clock, Share2, X } from "lucide-react";
import { blogPostBySlugQuery, allBlogPostsQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(blogPostBySlugQuery(params.slug));
    if (!data) throw notFound();
    await context.queryClient.ensureQueryData(allBlogPostsQuery);
    return data;
  },
  head: ({ loaderData, params }) => {
    const p = loaderData;
    if (!p) return {};
    return {
      meta: [
        { title: p.meta_title ?? `${p.title} | Bright Edge` },
        { name: "description", content: p.meta_description ?? p.excerpt ?? "" },
        { property: "og:title", content: p.meta_title ?? p.title },
        { property: "og:description", content: p.meta_description ?? p.excerpt ?? "" },
        { property: "og:type", content: "article" },
        { property: "og:image", content: p.featured_image ?? "" },
        { property: "og:url", content: `/blog/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/blog/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: p.title,
            description: p.excerpt ?? "",
            image: p.featured_image,
            datePublished: p.published_at,
          }),
        },
      ],
    };
  },
  component: BlogPost,
});

function BlogPost() {
  const p = Route.useLoaderData();
  const gallery: string[] = Array.isArray(p.gallery_images) ? p.gallery_images : [];
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

  const { data: allPosts = [] } = useQuery(allBlogPostsQuery);
  const related = allPosts.filter((post: any) => post.id !== p.id && post.category?.slug === p.category?.slug).slice(0, 4);

  const paragraphs = (p.content ?? "").split(/\n+/).filter((x: string) => x.trim().length);
  const mid = Math.max(1, Math.floor(paragraphs.length / 2));
  const hasMultiple = paragraphs.length > 1;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: p.title, url }); } catch { /* noop */ } }
    else { try { await navigator.clipboard.writeText(url); alert("Link copied!"); } catch { /* noop */ } }
  };

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 h-1 bg-muted/40">
        <div className="h-full bg-gradient-to-r from-primary to-[#2F4DCC] transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>

      {p.featured_image && (
        <div className="relative h-[45vh] min-h-[320px] w-full overflow-hidden lg:h-[60vh]">
          <img src={p.featured_image} alt={p.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0">
            <div className="mx-auto max-w-5xl px-6 pb-10 sm:px-8 lg:px-8">
              {p.category && (
                <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                  {p.category.name}
                </span>
              )}
              <h1 className="mt-4 max-w-4xl font-display text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">{p.title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-white/80">
                <span>{formatDate(p.published_at)}</span>
                <span className="h-1 w-1 rounded-full bg-white/50" />
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{p.reading_minutes ?? 5} min read</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <article className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-12">
          <div className="min-w-0">
            {!p.featured_image && (
              <div className="mx-auto mb-8 max-w-3xl">
                {p.category && <span className="text-xs font-semibold uppercase tracking-widest text-primary">{p.category.name}</span>}
                <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">{p.title}</h1>
                <p className="mt-3 text-sm text-muted-foreground">{formatDate(p.published_at)} · {p.reading_minutes ?? 5} min read</p>
              </div>
            )}

            <div className="mx-auto max-w-3xl">
              <div className="prose prose-lg prose-slate mt-0 max-w-none leading-relaxed">
                {hasMultiple ? (
                  <>
                    {paragraphs.slice(0, mid).map((para: string, i: number) => <p key={`a${i}`} className="text-[1.0625rem] leading-8 text-foreground/85">{para}</p>)}
                    {gallery[0] && (
                      <figure className="my-10 -mx-4 cursor-pointer not-prose sm:-mx-8 lg:-mx-16" onClick={() => setLightbox(0)}>
                        <img src={gallery[0]} alt="" className="w-full rounded-xl object-cover shadow-lg transition hover:shadow-xl" />
                      </figure>
                    )}
                    {paragraphs.slice(mid).map((para: string, i: number) => <p key={`b${i}`} className="text-[1.0625rem] leading-8 text-foreground/85">{para}</p>)}
                  </>
                ) : (
                  <>
                    {paragraphs.map((para: string, i: number) => <p key={i} className="text-[1.0625rem] leading-8 text-foreground/85">{para}</p>)}
                    {gallery[0] && (
                      <figure className="my-10 -mx-4 cursor-pointer not-prose sm:-mx-8 lg:-mx-16" onClick={() => setLightbox(0)}>
                        <img src={gallery[0]} alt="" className="w-full rounded-xl object-cover shadow-lg transition hover:shadow-xl" />
                      </figure>
                    )}
                  </>
                )}
              </div>

              {gallery.length >= 2 && (
                <section className="mt-14">
                  <h2 className="mb-6 font-display text-2xl font-semibold tracking-tight">Gallery</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {gallery.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`${p.title} gallery ${i + 2}`}
                        loading="lazy"
                        className="aspect-[4/3] w-full cursor-pointer rounded-xl object-cover object-center shadow-md transition hover:shadow-lg hover:scale-[1.01]"
                        onClick={() => setLightbox(i + 1)}
                      />
                    ))}
                  </div>
                </section>
              )}

              <div className="mt-14 flex justify-center">
                <div className="inline-flex gap-2">
                  <Button variant="outline" asChild><Link to="/blog"><ChevronLeft className="mr-1 h-4 w-4" />Back to insights</Link></Button>
                  <Button variant="outline" onClick={share}><Share2 className="mr-1 h-4 w-4" />Share</Button>
                </div>
              </div>

              {related.length > 0 && (
                <section className="mt-16 border-t border-border pt-12">
                  <h2 className="mb-8 font-display text-2xl font-semibold tracking-tight">Read more like this</h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {related.map((post: any) => (
                      <Link key={post.id} to="/blog/$slug" params={{ slug: post.slug }} className="group block overflow-hidden rounded-2xl border border-border bg-card transition hover:border-primary/40 hover:shadow-lg">
                        {post.featured_image && (
                          <div className="aspect-[16/10] overflow-hidden">
                            <img src={post.featured_image} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          </div>
                        )}
                        <div className="p-5">
                          {post.category && <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">{post.category.name}</span>}
                          <h3 className="mt-2 font-display text-lg font-semibold leading-snug group-hover:text-primary">{post.title}</h3>
                          <p className="mt-2 text-sm text-muted-foreground">{formatDate(post.published_at)}</p>
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
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">About this article</h3>
                <p className="mt-3 text-sm text-muted-foreground">{p.excerpt}</p>
              </div>
              <div className="rounded-2xl border border-border bg-muted/30 p-6">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">Share</h3>
                <div className="mt-3 flex gap-2">
                  <button onClick={share} className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent">
                    <Share2 className="h-4 w-4" />Share article
                  </button>
                </div>
              </div>
              {related.length > 0 && (
                <div className="rounded-2xl border border-border bg-muted/30 p-6">
                  <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">More reads</h3>
                  <div className="mt-4 space-y-4">
                    {related.slice(0, 3).map((post: any) => (
                      <Link key={post.id} to="/blog/$slug" params={{ slug: post.slug }} className="group flex gap-3">
                        {post.featured_image && <img src={post.featured_image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
                        <div>
                          <p className="text-sm font-medium leading-snug group-hover:text-primary">{post.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatDate(post.published_at)}</p>
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
