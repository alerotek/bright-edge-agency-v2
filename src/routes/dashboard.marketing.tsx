import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  QrCode, 
  Link as LinkIcon, 
  Share2, 
  Copy, 
  Download,
  Megaphone,
  Image as ImageIcon,
  Video
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/marketing")({
  component: MarketingHub,
});

function MarketingHub() {
  const { data: properties, isLoading } = useQuery({
    queryKey: ["marketing-properties"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: agent } = await supabase
        .from("agents")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!agent) return [];

      const { data } = await supabase
        .from("properties")
        .select("id, title, slug, publish_status")
        .eq("agent_id", agent.id)
        .eq("publish_status", "published")
        .order("created_at", { ascending: false });

      return data || [];
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading marketing tools...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Marketing Hub</h1>
        <p className="text-sm text-muted-foreground">Generate QR codes, short links, and share your listings.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">QR Codes</CardTitle>
            <QrCode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Generate QR codes for property flyers and print materials.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Generate QR Code
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Short Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Create trackable short links for social media and campaigns.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Create Short Link
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Social Share</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Share listings directly to Facebook, Instagram, and WhatsApp.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Share Listing
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Property Marketing Tools */}
      <Card>
        <CardHeader>
          <CardTitle>Property Marketing</CardTitle>
        </CardHeader>
        <CardContent>
          {properties?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No published listings available for marketing.
            </div>
          ) : (
            <div className="space-y-4">
              {properties?.map((property: any) => (
                <div key={property.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{property.title}</h3>
                      <Badge variant="outline" className="mt-1 capitalize">{property.publish_status}</Badge>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-medium">Property URL</label>
                      <div className="flex gap-2">
                        <Input
                          value={`${window.location.origin}/property/${property.slug}`}
                          readOnly
                          className="text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(`${window.location.origin}/property/${property.slug}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium">Short Link</label>
                      <div className="flex gap-2">
                        <Input
                          value={`brightedge.co.ke/p/${property.slug.slice(0, 8)}`}
                          readOnly
                          className="text-xs"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard(`brightedge.co.ke/p/${property.slug.slice(0, 8)}`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Code
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Flyer
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Tools Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            AI Marketing Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                <h3 className="font-medium">AI Captions</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Generate engaging captions for social media posts.
              </p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Video className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Video Scripts</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                Create video scripts for property tours and social media.
              </p>
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
