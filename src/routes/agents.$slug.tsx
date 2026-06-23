import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Mail, MessageCircle, Phone } from "lucide-react";
import { agentBySlugQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { PropertyCard } from "@/components/site/PropertyCard";
import { buildWhatsappLink } from "@/lib/format";

export const Route = createFileRoute("/agents/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(agentBySlugQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    const d: any = loaderData;
    if (!d) return {};
    const a = d.agent;
    return {
      meta: [
        { title: `${a.full_name} | ${a.position} | Bright Edge Agency` },
        { name: "description", content: a.bio?.slice(0, 160) ?? "" },
        { property: "og:title", content: `${a.full_name} | Bright Edge Agency` },
        { property: "og:description", content: a.bio?.slice(0, 160) ?? "" },
        { property: "og:image", content: a.photo ?? "" },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: `/agents/${params.slug}` },
      ],
      links: [{ rel: "canonical", href: `/agents/${params.slug}` }],
      scripts: [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          name: a.full_name,
          jobTitle: a.position,
          image: a.photo,
          telephone: a.phone,
          email: a.email,
          worksFor: { "@type": "RealEstateAgent", name: "Bright Edge Agency" },
        }),
      }],
    };
  },
  component: AgentDetail,
});

function AgentDetail() {
  const { agent: a, properties }: any = Route.useLoaderData();
  return (
    <>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[260px_1fr] lg:px-8">
          {a.photo ? <img src={a.photo} alt={a.full_name} className="aspect-[4/5] w-full rounded-2xl object-cover" /> : null}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{a.position}</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{a.full_name}</h1>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">{a.bio}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {a.whatsapp && (
                <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <a href={buildWhatsappLink(a.whatsapp, `Hi ${a.full_name.split(" ")[0]}, I'd like to discuss a property.`)} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              )}
              {a.phone && <Button asChild variant="outline"><a href={`tel:${a.phone.replace(/\s/g,"")}`}><Phone className="mr-2 h-4 w-4" />{a.phone}</a></Button>}
              {a.email && <Button asChild variant="outline"><a href={`mailto:${a.email}`}><Mail className="mr-2 h-4 w-4" />{a.email}</a></Button>}
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-semibold">Current listings ({properties.length})</h2>
        {properties.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No active listings, get in touch to discuss upcoming inventory.</p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((p: any) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </section>
    </>
  );
}
