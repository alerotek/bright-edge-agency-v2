import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { propertyCategoriesQuery, propertyTypesQuery, adminAgentsQuery, adminLocationsQuery } from "@/lib/admin-queries";
import { Bath, BedDouble, CheckCircle2, Copy, ExternalLink, Maximize, Play, QrCode, Share2, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/admin/properties/$id")({
  loader: async ({ context, params }) => {
    const { data, error } = await supabase.from("properties").select("*").eq("id", params.id).maybeSingle();
    if (error) throw error;
    return data;
  },
  component: PropertyEditor,
});

function PropertyEditor() {
  const { id } = useParams({ from: "/admin/properties/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const loaderData = Route.useLoaderData();

  const { data: categories } = useQuery(propertyCategoriesQuery);
  const { data: types } = useQuery(propertyTypesQuery);
  const { data: agents } = useQuery(adminAgentsQuery);
  const { data: locations } = useQuery(adminLocationsQuery);

  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", description: "",
    category_id: "", property_type_id: "", location_id: "", agent_id: "",
    listing_type: "sale", price: "", currency: "KES",
    bedrooms: "", bathrooms: "", area_sqft: "", address: "",
    publish_status: "draft",
    validation_status: "pending_verification",
    virtual_tour_url: "", floor_plan_url: "", listing_expires_at: "",
    // Bright Edge V2
    house_hunting_fee_kes: "",
    viewing_fee_kes: "",
    fees_refundable: false,
    fee_payment_timing: "" as any,
    video_url: "",
    video_provider: "" as any,
    // Bright Edge V2
    available_from: "",
    furnished_status: "unfurnished" as any,
    lease_period: "",
    deposit_amount_kes: "",
    utilities_info: "",
    ai_captions: "",
    suggested_hashtags: [] as string[],
  });

  useEffect(() => {
    if (loaderData) {
      setForm({
        title: loaderData.title || "",
        slug: loaderData.slug || "",
        excerpt: loaderData.excerpt || "",
        description: loaderData.description || "",
        category_id: loaderData.category_id || "",
        property_type_id: loaderData.property_type_id || "",
        location_id: loaderData.location_id || "",
        agent_id: loaderData.agent_id || "",
        listing_type: loaderData.listing_type || "sale",
        price: String(loaderData.price ?? ""),
        currency: loaderData.currency || "KES",
        bedrooms: String(loaderData.bedrooms ?? ""),
        bathrooms: String(loaderData.bathrooms ?? ""),
        area_sqft: String(loaderData.area_sqft ?? ""),
        address: loaderData.address || "",
        publish_status: loaderData.publish_status || "draft",
        validation_status: loaderData.validation_status || "pending_verification",
        virtual_tour_url: loaderData.virtual_tour_url || "",
        floor_plan_url: loaderData.floor_plan_url || "",
        listing_expires_at: loaderData.listing_expires_at || "",
        // Bright Edge V2
        house_hunting_fee_kes: String(loaderData.house_hunting_fee_kes ?? ""),
        viewing_fee_kes: String(loaderData.viewing_fee_kes ?? ""),
        fees_refundable: !!loaderData.fees_refundable,
        fee_payment_timing: loaderData.fee_payment_timing || "",
        video_url: loaderData.video_url || "",
        video_provider: loaderData.video_provider || "",
        available_from: loaderData.available_from || "",
        furnished_status: (loaderData.furnished_status as any) || "unfurnished",
        lease_period: loaderData.lease_period || "",
        deposit_amount_kes: String(loaderData.deposit_amount_kes ?? ""),
        utilities_info: loaderData.utilities_info || "",
        ai_captions: loaderData.ai_captions || "",
        suggested_hashtags: loaderData.suggested_hashtags || [],
      });
    }
  }, [loaderData]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("properties").update({
        ...form,
        price: Number(form.price) || 0,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        area_sqft: form.area_sqft ? Number(form.area_sqft) : null,
        house_hunting_fee_kes: form.house_hunting_fee_kes ? Number(form.house_hunting_fee_kes) : null,
        viewing_fee_kes: form.viewing_fee_kes ? Number(form.viewing_fee_kes) : null,
        fee_payment_timing: form.fee_payment_timing || null,
        video_provider: form.video_provider || null,
        available_from: form.available_from || null,
        deposit_amount_kes: form.deposit_amount_kes ? Number(form.deposit_amount_kes) : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "properties"] });
      navigate({ to: "/admin/properties" });
    },
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Edit property</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/properties" })}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save"}</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => { update("title", e.target.value); update("slug", slugify(e.target.value)); }} required />
          </div>
          <div className="sm:col-span-2">
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => update("slug", e.target.value)} required />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category_id} onValueChange={(v) => update("category_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{categories?.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={form.property_type_id} onValueChange={(v) => update("property_type_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{types?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Location</Label>
            <Select value={form.location_id} onValueChange={(v) => update("location_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{locations?.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Agent</Label>
            <Select value={form.agent_id} onValueChange={(v) => update("agent_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{agents?.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Listing type</Label>
            <Select value={form.listing_type} onValueChange={(v) => update("listing_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="sale">Sale</SelectItem><SelectItem value="rent">Rent</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.publish_status} onValueChange={(v) => update("publish_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Validation status</Label>
            <Select value={form.validation_status} onValueChange={(v) => update("validation_status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_verification">Pending verification</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="needs_review">Needs review</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Price</Label>
            <Input type="number" value={form.price} onChange={(e) => update("price", e.target.value)} />
          </div>
          <div>
            <Label>Currency</Label>
            <Input value={form.currency} onChange={(e) => update("currency", e.target.value)} />
          </div>
          <div>
            <Label>Bedrooms</Label>
            <Input type="number" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
          </div>
          <div>
            <Label>Bathrooms</Label>
            <Input type="number" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} />
          </div>
          <div>
            <Label>Area (sqft)</Label>
            <Input type="number" value={form.area_sqft} onChange={(e) => update("area_sqft", e.target.value)} />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => update("address", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Excerpt</Label>
            <Textarea value={form.excerpt} onChange={(e) => update("excerpt", e.target.value)} rows={2} />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={5} />
          </div>
          <div>
            <Label>Virtual tour URL</Label>
            <Input value={form.virtual_tour_url} onChange={(e) => update("virtual_tour_url", e.target.value)} placeholder="https://" />
          </div>
          <div>
            <Label>Floor plan URL</Label>
            <Input value={form.floor_plan_url} onChange={(e) => update("floor_plan_url", e.target.value)} placeholder="https://" />
          </div>
          <div>
            <Label>Listing expires at</Label>
            <Input type="date" value={form.listing_expires_at} onChange={(e) => update("listing_expires_at", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {form.listing_type === "rent" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Rental Business Rules</CardTitle>
            <p className="text-xs text-muted-foreground">Transparency on fees is a core trust requirement.</p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>House Hunting Fee (KES)</Label>
              <Input type="number" value={form.house_hunting_fee_kes} onChange={(e) => update("house_hunting_fee_kes", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Viewing Fee (KES)</Label>
              <Input type="number" value={form.viewing_fee_kes} onChange={(e) => update("viewing_fee_kes", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Payment Timing</Label>
              <Select value={form.fee_payment_timing} onValueChange={(v) => update("fee_payment_timing", v)}>
                <SelectTrigger><SelectValue placeholder="Select when fees are paid" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="before_viewing">Before viewing</SelectItem>
                  <SelectItem value="after_viewing">After viewing</SelectItem>
                  <SelectItem value="on_agreement">On agreement</SelectItem>
                  <SelectItem value="on_move_in">On move-in</SelectItem>
                  <SelectItem value="on_first_month">On first month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Furnished Status</Label>
              <Select value={form.furnished_status} onValueChange={(v) => update("furnished_status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unfurnished">Unfurnished</SelectItem>
                  <SelectItem value="semi-furnished">Semi-furnished</SelectItem>
                  <SelectItem value="fully-furnished">Fully furnished</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lease Period</Label>
              <Input value={form.lease_period} onChange={(e) => update("lease_period", e.target.value)} placeholder="e.g. 1 year" />
            </div>
            <div>
              <Label>Deposit Amount (KES)</Label>
              <Input type="number" value={form.deposit_amount_kes} onChange={(e) => update("deposit_amount_kes", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>Available From</Label>
              <Input type="date" value={form.available_from} onChange={(e) => update("available_from", e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label>Utilities Information</Label>
              <Input value={form.utilities_info} onChange={(e) => update("utilities_info", e.target.value)} placeholder="e.g. Water and electricity included" />
            </div>
            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                id="fees_refundable"
                checked={form.fees_refundable}
                onChange={(e) => setForm(f => ({ ...f, fees_refundable: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="fees_refundable" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Fees are refundable
              </Label>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Video Strategy</CardTitle>
          <p className="text-xs text-muted-foreground">Bright Edge never stores videos. Supported: YouTube, TikTok, Instagram/Facebook Reels.</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Social Video URL</Label>
            <Input value={form.video_url} onChange={(e) => update("video_url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Video Provider</Label>
            <Select value={form.video_provider} onValueChange={(v) => update("video_provider", v)}>
              <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="instagram">Instagram Reels</SelectItem>
                <SelectItem value="facebook">Facebook Reels</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Marketing Hub</CardTitle>
          <p className="text-xs text-muted-foreground">AI captions and suggested hashtags for social media.</p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>AI Marketing Caption</Label>
            <Textarea value={form.ai_captions} onChange={(e) => update("ai_captions", e.target.value)} rows={3} placeholder="AI generated caption..." />
          </div>
          <div className="sm:col-span-2">
            <Label>Suggested Hashtags (comma separated)</Label>
            <Input 
              value={form.suggested_hashtags.join(", ")} 
              onChange={(e) => update("suggested_hashtags", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} 
              placeholder="#luxury, #nairobi, #realestate" 
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Marketing Hub</span>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              Score: {form.marketing_score || 0}%
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">Every published listing automatically generates marketing assets.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => {
                    const url = `${window.location.origin}/property/${form.slug}`;
                    navigator.clipboard.writeText(url);
                    toast.success("SEO URL copied to clipboard");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" /> Copy SEO URL
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => toast.info("Short URL generation is automatic on publish")}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Short Link
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="gap-2"
                  onClick={() => toast.info("QR Code is available on public page")}
                >
                  <QrCode className="h-3.5 w-3.5" /> QR Code
                </Button>
              </div>

              <div className="grid gap-2">
                <Label>AI Marketing Caption</Label>
                <Textarea 
                  value={form.ai_captions} 
                  onChange={(e) => update("ai_captions", e.target.value)} 
                  rows={3} 
                  placeholder="The system generates captions for social media..." 
                />
              </div>

              <div className="grid gap-2">
                <Label>Suggested Hashtags</Label>
                <Input 
                  value={form.suggested_hashtags.join(", ")} 
                  onChange={(e) => update("suggested_hashtags", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} 
                  placeholder="#luxury, #nairobi" 
                />
              </div>
            </div>

            <div className="sm:col-span-2 space-y-3">
              <Label className="text-sm font-semibold">Marketing Checklist</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  "SEO URL generated",
                  "Short URL created",
                  "QR Code ready",
                  "AI Captions ready",
                  "Video embedded",
                  "High quality images",
                  "Agent verified",
                  "Social share links"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}