import { Link } from "@tanstack/react-router";
import { Bath, BedDouble, MapPin, Maximize } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { PropertyListItem } from "@/lib/queries";

export function PropertyCard({ property: p }: { property: PropertyListItem }) {
  const featuredImg =
    p.images?.find((i) => i.is_featured)?.image_url ??
    [...(p.images ?? [])].sort((a, b) => a.image_order - b.image_order)[0]?.image_url ??
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80";

  return (
    <Link
      to="/property/$slug"
      params={{ slug: p.slug }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elegant)]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={featuredImg}
          alt={p.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          {p.status?.name ? (
            <Badge className="bg-background/90 text-foreground hover:bg-background/90">{p.status.name}</Badge>
          ) : null}
          {p.featured ? <Badge className="bg-accent text-accent-foreground hover:bg-accent">Featured</Badge> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-display text-xl font-semibold tracking-tight text-foreground">
            {formatPrice(p.price, p.currency, p.price_period)}
          </span>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{p.listing_type === "rent" ? "Rent" : "Sale"}</span>
        </div>
        <h3 className="line-clamp-2 text-base font-semibold text-foreground group-hover:text-primary">
          {p.title}
        </h3>
        {p.location ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {p.location.name}{p.address ? ` · ${p.address.split(",")[0]}` : ""}
          </p>
        ) : null}
        <div className="mt-auto flex items-center gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
          {p.bedrooms != null ? (
            <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{p.bedrooms} bd</span>
          ) : null}
          {p.bathrooms != null ? (
            <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{p.bathrooms} ba</span>
          ) : null}
          {p.area_sqft ? (
            <span className="inline-flex items-center gap-1"><Maximize className="h-3.5 w-3.5" />{Math.round(p.area_sqft).toLocaleString()} sqft</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
