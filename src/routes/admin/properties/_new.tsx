import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { propertyCategoriesQuery, propertyTypesQuery, adminAgentsQuery, adminLocationsQuery } from "@/lib/admin-queries";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/admin/properties/_new")({
  component: PropertyEditor,
});

function PropertyEditor() {
  const navigate = useNavigate();
  const qc = useQueryClient();

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
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("properties").insert({
        ...form,
        price: Number(form.price) || 0,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        area_sqft: form.area_sqft ? Number(form.area_sqft) : null,
      });
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
        <h1 className="text-2xl font-semibold tracking-tight">New property</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/properties" })}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Create"}</Button>
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
        </CardContent>
      </Card>
    </form>
  );
}
