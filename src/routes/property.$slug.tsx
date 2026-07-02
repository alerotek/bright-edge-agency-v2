import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bath, BedDouble, Calendar, Car, ChevronLeft, ChevronRight, Copy, ExternalLink, MapPin, Maximize, MessageCircle, Phone, Play, QrCode, Share2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { propertyBySlugQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buildWhatsappLink, formatPrice } from "@/lib/format";
import { InquiryForm } from "@/components/site/InquiryForm";

export const Route = createFileRoute("/property/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(propertyBySlugQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) => {
    const p: any = loaderData;
    if (!p) return {};
    return {
      meta: [
        { title: p.meta_title ?? `${p.title} | Bright Edge Agency` },
        { name: "description", content: p.meta_description ?? p.excerpt ?? p.description?.slice(0, 160) ?? "" },
        { property: "og:title", content: p.meta_title ?? p.title },
        { property: "og:description", content: p.meta_description ?? p.excerpt ?? "" },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/property/${params.slug}` },
        { property: "og:image", content: p.images?.[0]?.image_url ?? "" },
      ],
      links: [{ rel: "canonical", href: `/property/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Residence",
            name: p.title,
            description: p.excerpt ?? p.meta_description ?? "",
            url: `/property/${params.slug}`,
            address: p.address,
            numberOfRooms: p.bedrooms,
            image: (p.images ?? []).map((i: any) => i.image_url),
            offers: {
              "@type": "Offer",
              price: p.price,
              priceCurrency: p.currency,
              availability: "https://schema.org/InStock",
            },
          }),
        },
      ],
    };
  },
  component: PropertyDetail,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">Property not found</h1>
      <p className="mt-2 text-muted-foreground">It may have been removed or the link is incorrect.</p>
      <Button asChild className="mt-6"><Link to="/properties">Browse properties</Link></Button>
    </div>
  ),
});

function PropertyDetail() {
  const p: any = Route.useLoaderData();
  const images = [...(p.images ?? [])].sort((a: any, b: any) => a.image_order - b.image_order);
  const amenities = (p.property_amenities ?? []).map((pa: any) => pa.amenity).filter(Boolean);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const waPrefix = `Hi Bright Edge, I'm interested in "${p.title}" (${p.slug}).`;
  const wa = (msg: string) => buildWhatsappLink(p.agent?.whatsapp ?? null, `${waPrefix} ${msg}`);

  return (
    <>
      {/* Gallery — 2+3 mosaic */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
          <Link
            to="/properties"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> All properties
          </Link>
        </div>

        <div className="mx-auto mt-4 max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          {images.length === 0 ? null : (
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
              {/* Hero image — full height left column */}
              <button
                type="button"
                onClick={() => setLightbox(0)}
                className="relative row-span-2 aspect-[3/4] overflow-hidden rounded-2xl bg-muted sm:aspect-auto sm:min-h-[420px]"
              >
                <img
                  src={images[0]?.image_url}
                  alt={p.title}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                />
                {/* View all overlay on first image when on mobile */}
                {images.length > 1 && (
                  <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm sm:hidden">
                    1 / {images.length}
                  </span>
                )}
              </button>

              {/* Three smaller images — right column */}
              {images.slice(1, 4).map((img: any, i: number) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setLightbox(i + 1)}
                  className="relative hidden aspect-square overflow-hidden rounded-2xl bg-muted sm:block"
                >
                  <img
                    src={img.image_url}
                    alt={`${p.title} ${i + 2}`}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                  />
                  {/* +N overlay on last visible thumbnail */}
                  {i === 2 && images.length > 4 && (
                    <span className="absolute inset-0 grid place-items-center bg-black/55 text-sm font-semibold text-white">
                      +{images.length - 4} photos
                    </span>
                  )}
                </button>
              ))}

              {/* Placeholder slots if fewer than 4 images */}
              {Array.from({ length: Math.max(0, 3 - Math.min(images.length - 1, 3)) }).map(
                (_, i) => (
                  <div
                    key={`placeholder-${i}`}
                    className="hidden aspect-square overflow-hidden rounded-2xl bg-muted/60 sm:block"
                  />
                ),
              )}
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
        <div className="min-w-0 space-y-10">
          <header className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {p.status?.name ? <Badge variant="secondary">{p.status.name}</Badge> : null}
              {p.category?.name ? <Badge variant="outline">{p.category.name}</Badge> : null}
              {p.featured ? <Badge className="bg-accent text-accent-foreground">Featured</Badge> : null}
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{p.title}</h1>
            {p.address ? (
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" /> {p.address}
              </p>
            ) : null}
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 pt-2">
              <span className="font-display text-3xl font-semibold text-primary">
                {formatPrice(p.price, p.currency, p.price_period)}
              </span>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {p.listing_type === "rent" ? "For rent" : "For sale"}
              </span>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-4">
            {[
              { icon: BedDouble, label: "Bedrooms", v: p.bedrooms ?? "N/A" },
              { icon: Bath, label: "Bathrooms", v: p.bathrooms ?? "N/A" },
              { icon: Maximize, label: "Area", v: p.area_sqft ? `${Math.round(p.area_sqft).toLocaleString()} sqft` : "N/A" },
              { icon: Car, label: "Parking", v: p.parking ?? "N/A" },
            ].map(({ icon: Icon, label, v }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-secondary/60 p-3">
                <Icon className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="text-sm font-semibold text-foreground">{v}</p>
                </div>
              </div>
            ))}
          </div>

          {p.video_url && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex items-center gap-2 border-b bg-muted/30 px-6 py-3">
                <Play className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold uppercase tracking-wider">Property Video</h2>
              </div>
              <div className="aspect-video w-full bg-black">
                {p.video_provider === "youtube" ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${p.video_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1] || p.video_url.split("/").pop()}`}
                    className="h-full w-full"
                    allowFullScreen
                    title={p.title}
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center p-8 text-center text-white">
                    <p className="mb-4 text-sm opacity-80">Video hosted on {p.video_provider || "external platform"}</p>
                    <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      <a href={p.video_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" /> Watch on {p.video_provider || "Platform"}
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-display text-2xl font-semibold">About this property</h2>
            <div className="prose prose-slate mt-3 max-w-none text-base leading-relaxed text-foreground/85">
              {(p.description ?? "").split(/\n+/).map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {p.listing_type === "rent" && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-semibold">Rental Policy & Fees</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">House Hunting Fee</p>
                  <p className="text-lg font-bold text-foreground">{formatPrice(p.house_hunting_fee_kes, "KES")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Viewing Fee</p>
                  <p className="text-lg font-bold text-foreground">{formatPrice(p.viewing_fee_kes, "KES")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Payment Timing</p>
                  <p className="text-sm font-medium capitalize text-foreground">{(p.fee_payment_timing || "Unspecified").replace(/_/g, " ")}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Refund Policy</p>
                  <p className="text-sm font-medium text-foreground">{p.fees_refundable ? "Fully Refundable" : "Non-refundable"}</p>
                </div>
                {p.furnished_status && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Furnished Status</p>
                    <p className="text-sm font-medium capitalize text-foreground">{p.furnished_status.replace(/-/g, " ")}</p>
                  </div>
                )}
                {p.lease_period && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Lease Period</p>
                    <p className="text-sm font-medium text-foreground">{p.lease_period}</p>
                  </div>
                )}
                {p.deposit_amount_kes > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Security Deposit</p>
                    <p className="text-sm font-medium text-foreground">{formatPrice(p.deposit_amount_kes, "KES")}</p>
                  </div>
                )}
                {p.available_from && (
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Available From</p>
                    <p className="text-sm font-medium text-foreground">{p.available_from}</p>
                  </div>
                )}
                {p.utilities_info && (
                  <div className="sm:col-span-2 space-y-1">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Utilities</p>
                    <p className="text-sm font-medium text-foreground">{p.utilities_info}</p>
                  </div>
                )}
              </div>
              <p className="mt-4 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                Note: Bright Edge standardizes agency operations to build customer trust.
              </p>
            </div>
          )}

          {amenities.length > 0 ? (
            <div>
              <h2 className="font-display text-2xl font-semibold">Amenities</h2>
              <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {amenities.map((a: any) => (
                  <li key={a.id} className="flex items-center gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" /> {a.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {p.virtual_tour_url ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Virtual tour</h2>
              <Button asChild variant="outline" className="mt-4">
                <a href={p.virtual_tour_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" /> Open virtual tour
                </a>
              </Button>
            </div>
          ) : null}

          {p.floor_plan_url ? (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold">Floor plan</h2>
              <img src={p.floor_plan_url} alt="Floor plan" className="mt-4 rounded-lg" />
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-semibold">Inquire about this property</h2>
            <p className="mt-1 text-sm text-muted-foreground">We typically respond within four working hours.</p>
            <div className="mt-4">
              <InquiryForm propertyId={p.id} agentId={p.agent?.id ?? null} subject={p.title} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {p.agent ? (
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Listing agent</p>
              <div className="mt-3 flex items-center gap-3">
                {p.agent.photo ? (
                  <img src={p.agent.photo} alt={p.agent.full_name} className="h-14 w-14 rounded-full object-cover" />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-secondary" />
                )}
                <div>
                  <p className="font-semibold text-foreground">{p.agent.full_name}</p>
                  <Link to="/agents/$slug" params={{ slug: p.agent.slug }} className="text-xs text-primary hover:underline">
                    View profile →
                  </Link>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <a href={wa("Could we schedule a viewing?")} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> Schedule a viewing
                  </a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <a href={wa("Could you share more details and floor plans?")} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="mr-2 h-4 w-4" /> Request details
                  </a>
                </Button>
                {p.agent.phone ? (
                  <Button asChild variant="ghost" className="w-full">
                    <a href={`tel:${p.agent.phone.replace(/\s/g, "")}`}>
                      <Phone className="mr-2 h-4 w-4" /> {p.agent.phone}
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Marketing Hub</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                }}
              >
                <Copy className="h-4 w-4" /> Copy Link
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => toast.info("Social sharing enabled")}>
                <Share2 className="h-4 w-4" /> Share
              </Button>
              <Button variant="outline" size="sm" className="w-full gap-2 col-span-2">
                <QrCode className="h-4 w-4" /> Property QR Code
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
            <Calendar className="h-5 w-5 text-primary" />
            <p className="mt-3 font-semibold text-foreground">Viewings 7 days a week</p>
            <p className="mt-1">Same-day viewings often available. Pick a window that suits you and we'll confirm by message.</p>
          </div>
        </aside>
      </section>

      {/* Lightbox */}
      {lightbox !== null ? (
        <div role="dialog" aria-modal className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
          <button onClick={() => setLightbox(null)} aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          <button onClick={() => setLightbox((i) => (i! - 1 + images.length) % images.length)} aria-label="Previous" className="absolute left-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <img src={images[lightbox].image_url} alt={`${p.title} ${lightbox + 1}`} className="max-h-[85vh] max-w-full rounded-lg object-contain" />
          <button onClick={() => setLightbox((i) => (i! + 1) % images.length)} aria-label="Next" className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <ChevronRight className="h-6 w-6" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
            {lightbox + 1} / {images.length}
          </p>
        </div>
      ) : null}
    </>
  );
}
