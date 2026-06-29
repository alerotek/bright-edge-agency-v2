import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mail, Phone } from "lucide-react";
import { allAgentsQuery } from "@/lib/queries";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Our Agents | Bright Edge Agency" },
      { name: "description", content: "Meet the people behind Bright Edge, luxury sales, executive rentals, investment, and coastal specialists." },
      { property: "og:title", content: "Our Agents | Bright Edge Agency" },
      { property: "og:url", content: "/agents" },
    ],
    links: [{ rel: "canonical", href: "/agents" }],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(allAgentsQuery),
  component: AgentsPage,
});

function AgentsPage() {
  const { data: agents = [] } = useQuery(allAgentsQuery);
  const location = useLocation();
  const isIndex = location.pathname === "/agents" || location.pathname === "/agents/";
  return (
    <>
      {isIndex && (
        <>
          <section className="border-b border-border bg-muted/30">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">People</p>
              <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Our agents</h1>
              <p className="mt-3 max-w-2xl text-base text-muted-foreground">The team behind every viewing, valuation, and contract.</p>
            </div>
          </section>
          <section className="mx-auto grid max-w-7xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:px-8">
            {agents.map((a) => (
              <Link key={a.id} to="/agents/$slug" params={{ slug: a.slug }} className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)]">
                <div className="aspect-[4/5] overflow-hidden bg-muted">
                  <img src={a.photo ?? ""} alt={a.full_name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wider text-primary">{a.position}</p>
                  <h2 className="mt-1 font-display text-xl font-semibold group-hover:text-primary">{a.full_name}</h2>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{a.bio}</p>
                  <div className="mt-4 flex gap-3 text-xs text-muted-foreground">
                    {a.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" /> {a.phone}</span>}
                    {a.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" /></span>}
                  </div>
                </div>
              </Link>
            ))}
          </section>
        </>
      )}
      <Outlet />
    </>
  );
}
