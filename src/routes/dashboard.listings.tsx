import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Building2, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  MapPin,
  BedDouble,
  Bath,
  Calendar
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/format";

export const Route = createFileRoute("/dashboard/listings")({
  component: AgentListings,
});

function AgentListings() {
  const { data: listings, isLoading } = useQuery({
    queryKey: ["agent-listings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: agent } = await supabase
        .from("agents")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!agent) return [];

      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          property_images(image_url, image_order)
        `)
        .eq("agent_id", agent.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading your listings...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Listings</h1>
          <p className="text-sm text-muted-foreground">Manage your property listings.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/listings/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Listing
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search listings..." className="pl-9" />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4">
        {listings?.map((listing: any) => (
          <Card key={listing.id} className="overflow-hidden hover:border-primary/40 transition-colors">
            <div className="flex flex-col md:flex-row">
              <div className="md:w-48 h-48 md:h-auto bg-muted relative">
                {listing.property_images?.[0] ? (
                  <img
                    src={listing.property_images[0].image_url}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Building2 className="h-12 w-12" />
                  </div>
                )}
                <Badge className="absolute top-2 right-2 capitalize">
                  {listing.publish_status}
                </Badge>
              </div>
              
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{listing.title}</h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      {listing.address}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-semibold">{formatPrice(listing.price, listing.currency)}</p>
                    <Badge variant="outline" className="mt-1 capitalize">{listing.listing_type}</Badge>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <BedDouble className="h-4 w-4" />
                    {listing.bedrooms} beds
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Bath className="h-4 w-4" />
                    {listing.bathrooms} baths
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    {listing.views_count} views
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {formatDate(listing.created_at)}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/property/${listing.slug}`}>
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {listings?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border border-dashed border-border bg-card">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
              <Building2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">No listings yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
              Start by adding your first property listing to reach potential buyers and renters.
            </p>
            <Button asChild className="mt-4">
              <Link to="/dashboard/listings/new">
                <Plus className="mr-2 h-4 w-4" /> Add Your First Listing
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
