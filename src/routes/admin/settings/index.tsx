import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminSettingsQuery } from "@/lib/admin-queries";

export const Route = createFileRoute("/admin/settings/")({
  component: AdminSettings,
});

function AdminSettings() {
  const qc = useQueryClient();
  const { data: settings } = useQuery(adminSettingsQuery);

  const [form, setForm] = useState({
    company_name: "", tagline: "", primary_phone: "", primary_email: "",
    company_whatsapp: "", office_address: "", business_hours: "",
    hero_headline: "", hero_subheadline: "", seo_default_title: "", seo_default_description: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        company_name: settings.company_name ?? "",
        tagline: settings.tagline ?? "",
        primary_phone: settings.primary_phone ?? "",
        primary_email: settings.primary_email ?? "",
        company_whatsapp: settings.company_whatsapp ?? "",
        office_address: settings.office_address ?? "",
        business_hours: settings.business_hours ?? "",
        hero_headline: settings.hero_headline ?? "",
        hero_subheadline: settings.hero_subheadline ?? "",
        seo_default_title: settings.seo_default_title ?? "",
        seo_default_description: settings.seo_default_description ?? "",
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("settings").upsert({ id: 1, ...form });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "settings"] }),
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Company info and branding</p>
        </div>
        <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save"}</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Company</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div><Label>Company name</Label><Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} /></div>
          <div><Label>Tagline</Label><Input value={form.tagline} onChange={(e) => update("tagline", e.target.value)} /></div>
          <div><Label>Primary phone</Label><Input value={form.primary_phone} onChange={(e) => update("primary_phone", e.target.value)} /></div>
          <div><Label>Primary email</Label><Input type="email" value={form.primary_email} onChange={(e) => update("primary_email", e.target.value)} /></div>
          <div><Label>WhatsApp</Label><Input value={form.company_whatsapp} onChange={(e) => update("company_whatsapp", e.target.value)} /></div>
          <div><Label>Business hours</Label><Input value={form.business_hours} onChange={(e) => update("business_hours", e.target.value)} /></div>
          <div className="sm:col-span-2"><Label>Office address</Label><Textarea value={form.office_address} onChange={(e) => update("office_address", e.target.value)} rows={2} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Branding</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div><Label>Hero headline</Label><Input value={form.hero_headline} onChange={(e) => update("hero_headline", e.target.value)} /></div>
          <div><Label>Hero subheadline</Label><Input value={form.hero_subheadline} onChange={(e) => update("hero_subheadline", e.target.value)} /></div>
          <div><Label>SEO default title</Label><Input value={form.seo_default_title} onChange={(e) => update("seo_default_title", e.target.value)} /></div>
          <div><Label>SEO default description</Label><Input value={form.seo_default_description} onChange={(e) => update("seo_default_description", e.target.value)} /></div>
        </CardContent>
      </Card>
    </form>
  );
}
