import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { blogPostBySlugQuery } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(blogPostBySlugQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    const p: any = loaderData;
    if (!p) return {};
    return {
      meta: [
        { title: p.meta_title ?? `${p.title}, Bright Edge` },
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
  const p: any = Route.useLoaderData();
  const gallery: string[] = Array.isArray(p.gallery_images) ? p.gallery_images : [];
  const paragraphs = (p.content ?? "").split(/\n+/).filter((x: string) => x.trim().length);
  const mid = Math.max(1, Math.floor(paragraphs.length / 2));
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground">← All articles</Link>
      {p.category ? <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-primary">{p.category.name}</p> : null}
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{p.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{formatDate(p.published_at)} · {p.reading_minutes ?? 5} min read</p>
      {p.featured_image && <img src={p.featured_image} alt={p.title} className="mt-6 aspect-[16/10] w-full rounded-2xl object-cover" />}
      <div className="prose prose-slate mt-8 max-w-none leading-relaxed text-foreground/85">
        {paragraphs.slice(0, mid).map((para: string, i: number) => <p key={`a${i}`}>{para}</p>)}
        {gallery[0] && (
          <figure className="my-8 not-prose">
            <img src={gallery[0]} alt={`${p.title} – figure 1`} className="aspect-[16/9] w-full rounded-2xl object-cover" />
          </figure>
        )}
        {paragraphs.slice(mid).map((para: string, i: number) => <p key={`b${i}`}>{para}</p>)}
      </div>
      {gallery.length >= 2 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold tracking-tight">Gallery</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {gallery.slice(1).map((src, i) => (
              <img key={i} src={src} alt={`${p.title} gallery ${i + 2}`} loading="lazy" className="aspect-[4/3] w-full rounded-xl object-cover" />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
