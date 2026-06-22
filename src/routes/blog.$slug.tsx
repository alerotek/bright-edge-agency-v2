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
        { title: p.meta_title ?? `${p.title} — Bright Edge` },
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
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
      <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground">← All articles</Link>
      {p.category ? <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-primary">{p.category.name}</p> : null}
      <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{p.title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{formatDate(p.published_at)} · {p.reading_minutes ?? 5} min read</p>
      {p.featured_image && <img src={p.featured_image} alt={p.title} className="mt-6 aspect-[16/10] w-full rounded-2xl object-cover" />}
      <div className="prose prose-slate mt-8 max-w-none leading-relaxed text-foreground/85">
        {(p.content ?? "").split(/\n+/).map((para: string, i: number) => <p key={i}>{para}</p>)}
      </div>
    </article>
  );
}
