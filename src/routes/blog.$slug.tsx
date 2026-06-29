import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Share2, X } from "lucide-react";
import { blogPostBySlugQuery, allBlogPostsQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(blogPostBySlugQuery(params.slug));
    if (!data) throw notFound();
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
            description: p.excerpt,
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

  // Reading progress bar
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

  // Related posts (same category, excluding current)
  const { data: allPosts = [] } = useQuery(allBlogPostsQuery);
  const related = allPosts
    .filter((post: any) => post.id !== p.id && post.category?.slug === p.category?.slug)
    .slice(0, 3);

  const paragraphs = (p.content ?? "").split(/\n+/).filter((x: string) => x.trim().length);
  const hasMultiple = paragraphs.length > 1;
  const mid = Math.max(1, Math.floor(paragraphs.length / 2));

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: p.title, url }); } catch {}
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
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All articles
          </Link>
          <button onClick={share} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        {/* Header */}
        {p.category && (
          <Link to="/blog" className="mt-6 inline-block text-xs font-semibold uppercase tracking-wider text-primary hover:underline">
            {p.category.name}
          </Link>
        )}
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{p.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
          <span>{formatDate(p.published_at)}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.reading_minutes ?? 5} min read</span>
        </div>

        {/* Featured image */}
        {p.featured_image && (
          <img src={p.featured_image} alt={p.title} className="mt-6 aspect-[16/10] w-full rounded-2xl object-cover" />
        )}

        {/* Content */}
        <div className="prose prose-slate mt-8 max-w-none leading-relaxed text-foreground/85">
          {hasMultiple ? (
            <>
              {paragraphs.slice(0, mid).map((para: string, i: number) => <p key={`a${i}`}>{para}</p>)}
              {gallery[0] && (
                <figure className="my-8 not-prose cursor-pointer" onClick={() => setLightbox(0)}>
                  <img src={gallery[0]} alt={`${p.title} - figure 1`} className="aspect-[16/9] w-full rounded-2xl object-cover transition-opacity hover:opacity-90" />
                </figure>
              )}
              {paragraphs.slice(mid).map((para: string, i: number) => <p key={`b${i}`}>{para}</p>)}
            </>
          ) : (
            <>
              {paragraphs.map((para: string, i: number) => <p key={i}>{para}</p>)}
              {gallery[0] && (
                <figure className="my-8 not-prose cursor-pointer" onClick={() => setLightbox(0)}>
                  <img src={gallery[0]} alt={`${p.title} - figure 1`} className="aspect-[16/9] w-full rounded-2xl object-cover transition-opacity hover:opacity-90" />
                </figure>
              )}
            </>
          )}
        </div>

        {/* Gallery grid */}
        {gallery.length >= 2 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-semibold tracking-tight">Gallery</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {gallery.slice(1).map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`${p.title} gallery ${i + 2}`}
                  loading="lazy"
                  className="aspect-[4/3] w-full cursor-pointer rounded-xl object-cover transition-transform hover:scale-[1.02]"
                  onClick={() => setLightbox(i + 1)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Related posts */}
        {related.length > 0 && (
          <section className="mt-14 border-t border-border pt-10">
            <h2 className="font-display text-xl font-semibold tracking-tight">More from {p.category?.name}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {related.map((post: any) => (
                <Link key={post.id} to="/blog/$slug" params={{ slug: post.slug }} className="group flex gap-4">
                  {post.featured_image && (
                    <img src={post.featured_image} alt={post.title} className="h-20 w-20 shrink-0 rounded-lg object-cover" />
                  )}
                  <div>
                    <h3 className="font-medium leading-snug group-hover:text-primary">{post.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(post.published_at)} · {post.reading_minutes ?? 5} min</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to blog CTA */}
        <div className="mt-14 rounded-2xl border border-border bg-muted/30 p-6 text-center">
          <p className="font-display text-lg font-semibold">Want more insights like this?</p>
          <p className="mt-1 text-sm text-muted-foreground">Browse our full journal of market analysis and guides.</p>
          <Button asChild className="mt-4"><Link to="/blog">Browse all articles</Link></Button>
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
