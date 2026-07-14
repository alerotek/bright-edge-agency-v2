import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  User,
  Wallet,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/inquiries/$id")({
  loader: async ({ params }) => {
    const { data: inquiry, error } = await supabase
      .from("inquiries")
      .select(`
        *,
        property:properties(id, title, slug),
        agent:agents(id, full_name, slug, phone, whatsapp)
      `)
      .eq("id", params.id)
      .maybeSingle();
    if (error) throw error;

    const { data: activities } = await (supabase.from("lead_activities") as any)
      .select("*")
      .eq("inquiry_id", params.id)
      .order("created_at", { ascending: false });

    return { inquiry, activities: activities ?? [] };
  },
  component: InquiryDetail,
});

const STATUSES = [
  "new", "contacted", "qualified", "viewing_scheduled",
  "offer_made", "negotiation", "won", "lost", "closed",
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  viewing_scheduled: "bg-indigo-100 text-indigo-800",
  offer_made: "bg-orange-100 text-orange-800",
  negotiation: "bg-amber-100 text-amber-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  closed: "bg-slate-100 text-slate-600",
};

const TIMELINE_ICONS: Record<string, any> = {
  created: CheckCircle2,
  status_change: ArrowLeft,
  note: MessageCircle,
  whatsapp_sent: MessageCircle,
  agent_viewed: User,
  viewing_scheduled: CalendarDays,
};

function InquiryDetail() {
  const { inquiry: inq, activities } = Route.useLoaderData() as any;
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [status, setStatus] = useState(inq?.status ?? "new");
  const [note, setNote] = useState("");

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("inquiries")
        .update({ status } as any)
        .eq("id", inq.id);
      if (error) throw error;

      await (supabase.from("lead_activities") as any).insert({
        inquiry_id: inq.id,
        activity_type: "status_change",
        from_status: inq.status,
        to_status: status,
        note: note || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      toast.success("Lead updated");
      navigate({ to: "/admin/inquiries" });
    },
    onError: () => toast.error("Update failed"),
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      if (!note.trim()) return;
      await (supabase.from("lead_activities") as any).insert({
        inquiry_id: inq.id,
        activity_type: "note",
        note,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "inquiries"] });
      toast.success("Note added");
      setNote("");
    },
  });

  if (!inq) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Inquiry not found.</p>
        <Button asChild variant="ghost" className="mt-4">
          <Link to="/admin/inquiries">← Back to inquiries</Link>
        </Button>
      </div>
    );
  }

  const leadRef = (inq as any).lead_id ?? `BE-${inq.id.slice(0, 8).toUpperCase()}`;
  const whatsappHref = inq.agent?.whatsapp
    ? `https://wa.me/${inq.agent.whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `*Lead update — ${inq.property?.title ?? "property"}*\nRef: ${leadRef}\nCustomer: ${inq.full_name}\nPhone: ${inq.phone ?? "—"}`
      )}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/inquiries"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{inq.full_name}</h1>
              <span className="font-mono text-sm text-muted-foreground">{leadRef}</span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formatDate(inq.created_at)} · {inq.source?.replace(/_/g, " ")}
              {(inq as any).inquiry_type && (inq as any).inquiry_type !== "general"
                ? ` · ${(inq as any).inquiry_type?.replace(/_/g, " ")}`
                : ""}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${STATUS_COLORS[inq.status] ?? "bg-muted text-muted-foreground"}`}>
          {inq.status?.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="space-y-6">
          {/* Customer details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4 text-primary" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium text-foreground">{inq.full_name}</span>
              </div>
              {inq.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <a href={`tel:${inq.phone.replace(/\s/g, "")}`} className="hover:text-foreground">
                    {inq.phone}
                  </a>
                </div>
              )}
              {inq.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <a href={`mailto:${inq.email}`} className="hover:text-foreground">{inq.email}</a>
                </div>
              )}
              {(inq as any).budget_kes && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Wallet className="h-3.5 w-3.5 shrink-0" />
                  <span>Budget: KES {Number((inq as any).budget_kes).toLocaleString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property + viewing */}
          {(inq.property || (inq as any).preferred_viewing_date) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="h-4 w-4 text-primary" /> Property & Viewing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {inq.property && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <Link
                      to="/property/$slug"
                      params={{ slug: inq.property.slug }}
                      className="hover:text-primary hover:underline"
                    >
                      {inq.property.title}
                    </Link>
                  </div>
                )}
                {(inq as any).preferred_viewing_date && (
                  <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-indigo-800">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {(inq as any).preferred_viewing_date}
                      {(inq as any).preferred_viewing_time ? ` · ${(inq as any).preferred_viewing_time}` : ""}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Message */}
          {inq.message && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Message</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-foreground/80">{inq.message}</p>
              </CardContent>
            </Card>
          )}

          {/* Status update */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Update lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Note (optional)
                </label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="mt-1.5 resize-none text-sm"
                  placeholder="Add a note for this update..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  disabled={updateMutation.isPending}
                  onClick={() => updateMutation.mutate()}
                >
                  {updateMutation.isPending ? "Saving…" : "Save status"}
                </Button>
                <Button
                  variant="outline"
                  disabled={!note.trim() || addNoteMutation.isPending}
                  onClick={() => addNoteMutation.mutate()}
                >
                  {addNoteMutation.isPending ? "Adding…" : "Add note only"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Activity timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Activity timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
              ) : (
                <ol className="relative space-y-4 border-l-2 border-border pl-5">
                  {activities.map((act: any) => {
                    const Icon = TIMELINE_ICONS[act.activity_type] ?? Clock;
                    return (
                      <li key={act.id} className="relative">
                        <div className="absolute -left-[1.625rem] flex h-5 w-5 items-center justify-center rounded-full border-2 border-border bg-card">
                          <Icon className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">{formatDate(act.created_at)}</p>
                          <p className="text-sm font-medium capitalize text-foreground">
                            {act.activity_type.replace(/_/g, " ")}
                            {act.from_status && act.to_status
                              ? `: ${act.from_status.replace(/_/g, " ")} → ${act.to_status.replace(/_/g, " ")}`
                              : ""}
                          </p>
                          {act.note && <p className="text-sm text-muted-foreground">{act.note}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Agent */}
          {inq.agent && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck className="h-4 w-4 text-primary" /> Assigned agent
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="font-semibold text-foreground">{inq.agent.full_name}</p>
                {inq.agent.phone && (
                  <a href={`tel:${inq.agent.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                    <Phone className="h-3.5 w-3.5" /> {inq.agent.phone}
                  </a>
                )}
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-[#25D366] hover:opacity-80"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Notify on WhatsApp
                  </a>
                )}
                <Link
                  to="/agents/$slug"
                  params={{ slug: inq.agent.slug }}
                  className="flex items-center gap-1.5 text-primary hover:underline text-xs"
                >
                  View agent profile →
                </Link>
              </CardContent>
            </Card>
          )}

          {/* WA notification status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-sm">WhatsApp status</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {(inq as any).whatsapp_notified_at ? (
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Notified {formatDate((inq as any).whatsapp_notified_at)}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Not yet notified</span>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
