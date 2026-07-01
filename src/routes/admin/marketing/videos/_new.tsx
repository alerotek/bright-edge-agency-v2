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
import { adminAgentsQuery } from "@/lib/admin-queries";

export const Route = createFileRoute("/admin/marketing/videos/_new")({
  component: VideoEditor,
});

function VideoEditor() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: agents = [] } = useQuery(adminAgentsQuery);

  const [form, setForm] = useState({
    title: "", description: "", video_url: "", provider: "",
    provider_video_id: "", thumbnail_url: "", published: "false",
    property_id: "", agent_id: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("social_videos").insert({
        ...form,
        published: form.published === "true",
        property_id: form.property_id || null,
        agent_id: form.agent_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "marketing", "videos"] });
      navigate({ to: "/admin/marketing/videos" });
    },
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">New social video</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/marketing/videos" })}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Create"}</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Video details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} />
          </div>
          <div>
            <Label>Provider</Label>
            <Select value={form.provider} onValueChange={(v) => update("provider", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="tiktok">TikTok</SelectItem>
                <SelectItem value="vimeo">Vimeo</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Video URL</Label>
            <Input value={form.video_url} onChange={(e) => update("video_url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Provider video ID</Label>
            <Input value={form.provider_video_id} onChange={(e) => update("provider_video_id", e.target.value)} />
          </div>
          <div>
            <Label>Thumbnail URL</Label>
            <Input value={form.thumbnail_url} onChange={(e) => update("thumbnail_url", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={form.published} onValueChange={(v) => update("published", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="true">Published</SelectItem><SelectItem value="false">Draft</SelectItem></SelectContent>
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
