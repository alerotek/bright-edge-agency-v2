import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/slug";

export const Route = createFileRoute("/admin/agents/_new")({
  component: AgentEditor,
});

function AgentEditor() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    full_name: "", slug: "", position: "", bio: "", photo: "", phone: "", email: "", whatsapp: "",
    active: "true", display_order: "0",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("agents").insert({
        ...form,
        active: form.active === "true",
        display_order: Number(form.display_order) || 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "agents"] });
      navigate({ to: "/admin/agents" });
    },
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">New agent</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/admin/agents" })}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Create"}</Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Agent details</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Full name</Label>
            <Input value={form.full_name} onChange={(e) => { update("full_name", e.target.value); update("slug", slugify(e.target.value)); }} required />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={(e) => update("slug", e.target.value)} required />
          </div>
          <div>
            <Label>Position</Label>
            <Input value={form.position} onChange={(e) => update("position", e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </div>
          <div>
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
          </div>
          <div>
            <Label>Photo URL</Label>
            <Input value={form.photo} onChange={(e) => update("photo", e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Display order</Label>
            <Input type="number" value={form.display_order} onChange={(e) => update("display_order", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Bio</Label>
            <Textarea value={form.bio} onChange={(e) => update("bio", e.target.value)} rows={4} />
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
