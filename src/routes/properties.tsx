import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { allPropertiesQuery, locationsQuery } from "@/lib/queries";
import { PropertyCard } from "@/components/site/PropertyCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/properties")({
  head: () => ({
    meta: [
      { title: "Properties — Bright Edge Agency" },
      { name: "description", content: "Browse premium properties for sale and rent across Nairobi and the Kenyan coast." },
      { property: "og:title", content: "Properties — Bright Edge Agency" },
      { property: "og:url", content: "/properties" },
    ],
    links: [{ rel: "canonical", href: "/properties" }],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(allPropertiesQuery),
      context.queryClient.ensureQueryData(locationsQuery),
    ]),
  component: PropertiesPage,
});

function PropertiesPage() {
  const { data: properties = [] } = useQuery(allPropertiesQuery);
  const { data: locations = [] } = useQuery(locationsQuery);

  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("all");
  const [listing, setListing] = useState("all");
  const [beds, setBeds] = useState("all");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    let list = [...properties];
    if (q) {
      const needle = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          (p.address ?? "").toLowerCase().includes(needle) ||
          (p.location?.name ?? "").toLowerCase().includes(needle),
      );
    }
    if (loc !== "all") list = list.filter((p) => p.location?.slug === loc);
    if (listing !== "all") list = list.filter((p) => p.listing_type === listing);
    if (beds !== "all") list = list.filter((p) => (p.bedrooms ?? 0) >= Number(beds));
    if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list.sort((a, b) => b.price - a.price);
    if (sort === "newest") list.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
    return list;
  }, [properties, q, loc, listing, beds, sort]);

  const reset = () => { setQ(""); setLoc("all"); setListing("all"); setBeds("all"); setSort("newest"); };

  return (
    <>
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Inventory</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Properties
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            {properties.length} live listings across {locations.length} locations. Refine by city, listing type, or bedrooms.
          </p>
        </div>
      </section>

      <section className="border-b border-border bg-background py-6">
        <div className="mx-auto grid max-w-7xl items-end gap-3 px-4 sm:px-6 lg:px-8 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, address, or area" className="pl-9" />
          </div>
          <Select value={loc} onValueChange={setLoc}>
            <SelectTrigger><SelectValue placeholder="Location" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((l: any) => <SelectItem key={l.id} value={l.slug}>{l.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={listing} onValueChange={setListing}>
            <SelectTrigger><SelectValue placeholder="For sale/rent" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Sale & Rent</SelectItem>
              <SelectItem value="sale">For sale</SelectItem>
              <SelectItem value="rent">For rent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={beds} onValueChange={setBeds}>
            <SelectTrigger><SelectValue placeholder="Bedrooms" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any beds</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger><SelectValue placeholder="Sort" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price ↑</SelectItem>
              <SelectItem value="price-desc">Price ↓</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" onClick={reset} className="text-sm">
            <SlidersHorizontal className="mr-1.5 h-4 w-4" /> Reset
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-6 text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {properties.length} properties
        </p>
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-12 text-center">
            <p className="text-base text-muted-foreground">No properties match those filters.</p>
            <Button variant="outline" className="mt-4" onClick={reset}>Reset filters</Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Can't find what you're after? <Link to="/contact" className="font-medium text-primary hover:underline">Tell us what you need →</Link>
        </p>
      </section>
    </>
  );
}
