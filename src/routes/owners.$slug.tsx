import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ReputationStars } from "@/components/marketplace/ListingBadge";
import { ArrowLeft, ShieldCheck, Mail, Phone, Clock, Home, Star } from "lucide-react";
import { formatDate } from "@/lib/format";
import { PropertyCard } from "@/components/site/PropertyCard";

const ownerBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: ["owner", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_owners")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

const ownerListingsQuery = (ownerId: string) =>
  queryOptions({
    queryKey: ["owner-listings", ownerId],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, title, slug, price, currency, listing_type, address, bedrooms, bathrooms, area_sqft, created_at, images:property_images(id,image_url,is_featured)")
        .eq("listing_owner_id", ownerId)
        .in("property_status", ["published", "featured", "sold", "rented"])
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

export const Route = createFileRoute("/owners/$slug")({
  loader: async ({ params, context }) => {
    const owner = await context.queryClient.ensureQueryData(ownerBySlugQuery(params.slug));
    if (!owner) throw notFound();
    return owner;
  },
  head: ({ loaderData }: any) => ({
    meta: [
      { title: `${loaderData.full_name} | Property Owner | Bright Edge` },
      { name: "description", content: `View ${loaderData.full_name}'s property listings on Bright Edge Marketplace.` },
    ],
  }),
  component: OwnerProfilePage,
});

function OwnerProfilePage() {
  const owner: any = Route.useLoaderData();
  const { data: listings = [] } = useQuery(ownerListingsQuery(owner.id));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link to="/properties" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
        <ArrowLeft className="mr-1 h-4 w-4" /> Browse properties
      </Link>

      <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
        {/* Main content */}
        <div>
          {/* Profile header */}
          <div className="flex items-start gap-6 mb-8">
            <div className="h-20 w-20 rounded-full bg-muted overflow-hidden shrink-0">
              {owner.photo ? (
                <img src={owner.photo} alt={owner.full_name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  <Home className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="font-display text-3xl font-semibold">{owner.full_name}</h1>
                {owner.verification_status === "verified" && (
                  <Badge className="bg-green-500 text-white border-0">
                    <ShieldCheck className="h-3 w-3 mr-1" /> Verified Owner
                  </Badge>
                )}
              </div>
              {owner.joined_at && (
                <p className="text-sm text-muted-foreground mt-1">
                  <Clock className="h-3 w-3 inline mr-1" />
                  Joined {formatDate(owner.joined_at)}
                </p>
              )}
              <div className="mt-2">
                <ReputationStars score={owner.overall_rating ?? 0} totalReviews={owner.total_reviews ?? 0} size="md" />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{owner.properties_listed ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Properties Listed</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{owner.deals_closed ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Deals Closed</p>
            </div>
            <div className="rounded-xl border bg-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{owner.response_rate ?? 100}%</p>
              <p className="text-xs text-muted-foreground mt-1">Response Rate</p>
            </div>
          </div>

          {/* Bio */}
          {owner.bio && (
            <div className="mb-8">
              <h2 className="font-display text-xl font-semibold mb-2">About</h2>
              <p className="text-muted-foreground">{owner.bio}</p>
            </div>
          )}

          {/* Listings */}
          <h2 className="font-display text-2xl font-semibold mb-6">
            {listings.length} Property{listings.length !== 1 ? "ies" : "y"} Listed
          </h2>
          {listings.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
              No properties listed yet.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((p: any) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="font-display text-lg font-semibold mb-3">Contact {owner.full_name}</h3>
            {owner.email && (
              <Button asChild variant="outline" className="w-full mb-2 justify-start">
                <a href={`mailto:${owner.email}`}>
                  <Mail className="h-4 w-4 mr-2" /> Send Email
                </a>
              </Button>
            )}
            {owner.phone && (
              <Button asChild variant="outline" className="w-full justify-start">
                <a href={`tel:${owner.phone}`}>
                  <Phone className="h-4 w-4 mr-2" /> Call {owner.phone}
                </a>
              </Button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}