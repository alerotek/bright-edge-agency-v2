import { Link } from "@tanstack/react-router";
import { Bath, BedDouble, MapPin, Maximize } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { PropertyListItem } from "@/lib/queries";

export function PropertyCard({ property: p }: { property: PropertyListItem }) {
  const featuredImg =
    p.images?.find((i) => i.is_featured)?.image_url ??
    [...(p.images ?? [])].sort((a, b) => a.image_order - b.image_order)[0]?.image_url ??
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80";

  const isRent = p.listing_type === "rent";

  return (
    <Link
      to="/property/$slug"
      params={{ slug: p.slug }}
      className="group relative flex aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elegant)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Full-bleed image */}
      <img
        src={featuredImg}
        alt={p.title}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Gradient scrim — bottom 55% */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent"
      />

      {/* Top badges */}
      <div className="absolute left-3 top-3 flex items-center gap-2">
        {/* Listing type pill with left-border accent */}
        <span
          className={`inline-flex items-center rounded-md border-l-2 bg-black/60 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm ${
            isRent ? "border-accent" : "border-primary"
          }`}
        >
          {isRent ? "To Let" : "For Sale"}
        </span>

        {p.featured && (
          <span className="inline-flex items-center rounded-md bg-accent/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-foreground">
            Featured
          </span>
        )}

        {p.status?.name && (
          <span className="inline-flex items-center rounded-md bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
            {p.status.name}
          </span>
        )}
      </div>

      {/* Bottom content on scrim */}
      <div className="absolute inset-x-0 bottom-0 p-4">
        {/* Price */}
        <p className="font-display text-2xl font-semibold tracking-tight text-white drop-shadow">
          {formatPrice(p.price, p.currency, p.price_period)}
        </p>

        {/* Title */}
        <h3 className="mt-0.5 line-clamp-1 text-sm font-medium text-white/90 group-hover:text-white">
          {p.title}
        </h3>

        {/* Location + specs row */}
        <div className="mt-2 flex items-center justify-between gap-3">
          {p.location ? (
            <p className="flex items-center gap-1 text-xs text-white/70">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="line-clamp-1">
                {p.location.name}
                {p.address ? ` · ${p.address.split(",")[0]}` : ""}
              </span>
            </p>
          ) : null}

          <div className="flex shrink-0 items-center gap-3 text-[11px] text-white/70">
            {p.bedrooms != null && p.bedrooms > 0 ? (
              <span className="inline-flex items-center gap-1">
                <BedDouble className="h-3 w-3" />
                {p.bedrooms}
              </span>
            ) : null}
            {p.bathrooms != null && p.bathrooms > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Bath className="h-3 w-3" />
                {p.bathrooms}
              </span>
            ) : null}
            {p.area_sqft ? (
              <span className="inline-flex items-center gap-1">
                <Maximize className="h-3 w-3" />
                {Math.round(p.area_sqft).toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
