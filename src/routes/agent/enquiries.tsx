import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { agentInquiriesQuery } from "@/lib/agent-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageCircle,
  Phone,
  User,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/agent/enquiries")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/auth", search: { redirect: "/agent/enquiries" } });
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(agentInquiriesQuery),
  component: AgentEnquiries,
});

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 border-blue-200",
  contacted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  qualified: "bg-purple-100 text-purple-800 border-purple-200",
  viewing_scheduled: "bg-indigo-100 text-indigo-800 border-indigo-200",
  offer_made: "bg-orange-100 text-orange-800 border-orange-200",
  won: "bg-green-100 text-green-800 border-green-200",
  lost: "bg-red-100 text-red-800 border-red-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUSES = [
  "new", "contacted", "qualified", "viewing_scheduled",
  "offer_made", "negotiation", "won", "lost", "closed",
];

const TYPE_LABELS: Record<string, string> = {
  general: "General",
  viewing_request: "Viewing Request",
  offer: "Offer",
  valuation: "Valuation",
};

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function LeadCard({ lead }: { lead: any }) {
  const [expanded, setExpanded] = useState(false);
  const [newStatus, setNewStatus] = useState(lead.status);
  const [note, setNote] = useState("");
  const qc = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("inquiries")
        .update({ status: newStatus } as any)
        .eq("id", lead.id);
      if (error) throw error;

      // Log the activity
      await (supabase.from("lead_activities") as any).insert({
        inquiry_id: lead.id,
        activity_type: "status_change",
        from_status: lead.status,
        to_status: newStatus,
        note: note || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent", "inquiries"] });
      toast.success("Lead status updated");
      setNote("");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const whatsappHref = lead.phone
    ? `https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `Hi ${lead.full_name.split(" ")[0]}, this is regarding your inquiry about ${lead.property?.title ?? "the property"} (Ref: ${lead.lead_id ?? lead.id.slice(0, 8).toUpperCase()}).`
      )}`
    : null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">{lead.full_name}</CardTitle>
              {lead.lead_id && (
                <span className="font-mono text-xs text-muted-foreground">{lead.lead_id}</span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {lead.phone && (
                <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1 hover:text-foreground">
                  <Phone className="h-3 w-3" /> {lead.phone}
                </a>
              )}
              {lead.email && <span>{lead.email}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lead.inquiry_type && lead.inquiry_type !== "general" && (
              <Badge variant="outline" className="text-xs capitalize">
                {TYPE_LABELS[lead.inquiry_type] ?? lead.inquiry_type}
              </Badge>
            )}
            <StatusBadge status={lead.status} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-0">
        {/* Property link */}
        {lead.property && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <Link
              to="/property/$slug"
              params={{ slug: lead.property.slug }}
              className="hover:text-primary hover:underline"
            >
              {lead.property.title}
            </Link>
          </div>
        )}

        {/* Viewing details */}
        {(lead.preferred_viewing_date || lead.preferred_viewing_time) && (
          <div className="flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-2 text-xs text-indigo-800">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <span>
              Requested viewing: {lead.preferred_viewing_date ?? ""}
              {lead.preferred_viewing_time ? ` · ${lead.preferred_viewing_time}` : ""}
            </span>
          </div>
        )}

        {/* Message */}
        {lead.message && (
          <p className="text-sm text-foreground/80 line-clamp-2">{lead.message}</p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDate(lead.created_at)}
          </span>
          <div className="flex gap-2">
            {whatsappHref && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-[#25D366]/10 px-2 py-1 text-xs font-medium text-[#25D366] hover:bg-[#25D366]/20"
              >
                <MessageCircle className="h-3 w-3" /> WhatsApp
              </a>
            )}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Collapse" : "Update"}
            </button>
          </div>
        </div>

        {/* Expanded: status update */}
        {expanded && (
          <div className="mt-2 space-y-3 rounded-xl border border-border bg-muted/30 p-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Update status
              </label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="mt-1.5 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s} className="capitalize text-xs">
                      {s.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Add a note (optional)
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="mt-1.5 resize-none text-xs"
                placeholder="e.g. Customer confirmed viewing for Thursday..."
              />
            </div>
            <Button
              size="sm"
              className="w-full"
              disabled={updateMutation.isPending || newStatus === lead.status}
              onClick={() => updateMutation.mutate()}
            >
              {updateMutation.isPending ? "Saving…" : (
                <><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Save update</>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AgentEnquiries() {
  const { data: leads = [] } = useQuery(agentInquiriesQuery);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = leads.filter((l: any) => {
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    if (typeFilter !== "all" && l.inquiry_type !== typeFilter) return false;
    return true;
  });

  const newCount = leads.filter((l: any) => l.status === "new").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Enquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {leads.length} total
            {newCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                {newCount} new
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize text-xs">
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {leads.length === 0
              ? "No enquiries yet. Share your listings to start receiving leads."
              : "No enquiries match the selected filters."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((lead: any) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
