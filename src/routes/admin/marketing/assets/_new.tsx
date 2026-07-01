import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminAgentsQuery, adminPropertiesQuery } from "@/lib/admin-queries";

export const Route = createFileRoute("/admin/marketing/assets/_new")({
  component: AssetEditor,
});

function AssetEditor() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: agents = [] } = useQuery(adminAgentsQuery);
  const { data: properties = [] } = useQuery(adminPropertiesQuery);

  const [form, setForm] = useState({
    asset_type: "social", title: "", description: "", file_url: "", thumbnail_url: "",
    provider: "", provider_id: "", property_id: "", agent_id: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("marketing_assets").insert({
        ...form,
        property_id: form.property_id || null,
        agent_id: form.agent_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "marketing", "assets"] });
      navigate({ to: "/admin/marketing/assets" });
    },
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">New marketing asset</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/marketing/assets" })}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Create"}</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Asset details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Asset type</Label>
            <Select value={form.asset_type} onValueChange={(v) => update("asset_type", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="social">Social</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="banner">Banner</SelectItem></SelectContent>
            </Select>
          </div>
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} rows={3} />
          </div>
          <div className="sm:col-span-2">
            <Label>File URL</Label>
            <Input value={form.file_url} onChange={(e) => update("file_url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Thumbnail URL</Label>
            <Input value={form.thumbnail_url} onChange={(e) => update("thumbnail_url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Provider</Label>
            <Select value={form.provider} onValueChange={(v) => update("provider", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Provider ID</Label>
            <Input value={form.provider_id} onChange={(e) => update("provider_id", e.target.value)} placeholder="e.g. video_id" />
          </div>
          <div>
            <Label>Linked property</Label>
            <Select value={form.property_id} onValueChange={(v) => update("property_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{properties?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Linked agent</Label>
            <Select value={form.agent_id} onValueChange={(v) => update("agent_id", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{agents?.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
