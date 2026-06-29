import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { allBlogPostsQuery } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Insights | Bright Edge Agency" },
      { name: "description", content: "Market insights, investment guides, and neighbourhood reads from Bright Edge Agency." },
      { property: "og:title", content: "Insights | Bright Edge Agency" },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(allBlogPostsQuery),
  component: BlogPage,
});

function BlogPage() {
  const { data: posts = [] } = useQuery(allBlogPostsQuery);
  const match = Route.useMatch();
  const isIndex = match.id === "/blog";
  return (
    <>
      {isIndex && (
        <>
          <section className="border-b border-border bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Journal</p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Insights</h1>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground">Quarterly reads, investment guides, and the suburb knowledge our clients ask us for.</p>
            </div>
          </section>
          <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
            {posts.map((p) => (
              <article key={p.id} className="group flex flex-col">
                <Link to="/blog/$slug" params={{ slug: p.slug }} className="block">
                  <div className="aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
                    <img src={p.featured_image ?? ""} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                </Link>
                <p className="mt-4 text-xs uppercase tracking-wider text-primary">{p.category?.name}</p>
                <Link to="/blog/$slug" params={{ slug: p.slug }}>
                  <h2 className="mt-1 font-display text-lg font-semibold text-foreground group-hover:text-primary">{p.title}</h2>
                </Link>
                <p className="mt-1 text-sm text-muted-foreground">{formatDate(p.published_at)} - {p.reading_minutes ?? 5} min read</p>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.excerpt}</p>
                <Link to="/blog/$slug" params={{ slug: p.slug }} className="group/link mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Read more
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-0.5" />
                </Link>
              </article>
            ))}
          </section>
        </>
      )}
      <Outlet />
    </>
  );
}
