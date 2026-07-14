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
  CalendarDays,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  History,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard/leads/$id")({
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

    const { data: activities } = await supabase
      .from("lead_activities")
      .select("*")
      .eq("inquiry_id", params.id)
      .order("created_at", { ascending: false });

    return { inquiry, activities: activities ?? [] };
  },
  component: AgentLeadDetail,
});

const STATUSES = [
  "new", "contacted", "qualified", "viewing_scheduled", "viewing_completed",
  "offer_made", "negotiation", "won", "lost", "closed", "archived"
];

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  qualified: "bg-purple-100 text-purple-800",
  viewing_scheduled: "bg-indigo-100 text-indigo-800",
  viewing_completed: "bg-teal-100 text-teal-800",
  offer_made: "bg-orange-100 text-orange-800",
  negotiation: "bg-amber-100 text-amber-800",
  won: "bg-green-100 text-green-800",
  lost: "bg-red-100 text-red-800",
  closed: "bg-slate-100 text-slate-600",
  archived: "bg-gray-100 text-gray-500"
};

function AgentLeadDetail() {
  const { inquiry: inq, activities } = Route.useLoaderData() as any;
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

      await supabase.from("lead_activities").insert({
        inquiry_id: inq.id,
        activity_type: "status_change",
        from_status: inq.status,
        to_status: status,
        note: note || null,
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-leads"] });
      toast.success("Lead status updated");
      setNote("");
    },
    onError: (err: any) => toast.error("Update failed: " + err.message),
  });

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      if (!note.trim()) return;
      await supabase.from("lead_activities").insert({
        inquiry_id: inq.id,
        activity_type: "note",
        note,
      } as any);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agent-leads"] });
      toast.success("Note added");
      setNote("");
    },
  });

  if (!inq) return <div className="p-8 text-center">Lead not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link to="/dashboard/leads"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{inq.full_name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{inq.lead_id}</p>
        </div>
        <Badge className={`ml-auto ${STATUS_COLORS[inq.status]}`}>{inq.status.replace("_", " ")}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold">Lead Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Contact</p>
                  <p className="font-medium flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-primary" /> {inq.phone}</p>
                  {inq.email && <p className="text-sm flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-primary" /> {inq.email}</p>}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Property</p>
                  <p className="font-medium text-primary truncate">{inq.property?.title ?? "General Inquiry"}</p>
                  <p className="text-xs text-muted-foreground">Source: {inq.source?.replace("_", " ")}</p>
                </div>
              </div>

              {inq.inquiry_type === 'viewing_request' && (
                <div className="rounded-xl bg-accent/5 border border-accent/20 p-4 flex items-center gap-4">
                  <div className="rounded-full bg-accent/10 p-2 text-accent">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-accent/80">Viewing Requested</p>
                    <p className="text-sm font-semibold">{inq.preferred_viewing_date} at {inq.preferred_viewing_time}</p>
                  </div>
                </div>
              )}

              {inq.message && (
                <div className="space-y-1 pt-4 border-t">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Initial Message</p>
                  <p className="text-sm text-foreground italic bg-muted/30 p-3 rounded-lg leading-relaxed">
                    "{inq.message}"
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="relative pl-6 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-muted">
                {activities.map((act: any) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[19px] top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-primary shadow-sm" />
                    <div className="flex flex-col">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-foreground">
                          {act.activity_type === 'status_change' ? (
                            <>Status changed to <Badge variant="outline" className="ml-1 h-5 text-[10px] capitalize">{act.to_status?.replace("_", " ")}</Badge></>
                          ) : act.activity_type === 'note' ? (
                            "Agent Note"
                          ) : (
                            act.activity_type?.replace("_", " ")
                          )}
                        </p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatDate(act.created_at)}</span>
                      </div>
                      {act.note && <p className="mt-1.5 text-sm text-muted-foreground bg-muted/10 p-2 rounded-md border border-muted/20">{act.note}</p>}
                    </div>
                  </div>
                ))}
                <div className="relative">
                  <div className="absolute -left-[19px] top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-muted shadow-sm" />
                  <p className="text-sm font-semibold text-muted-foreground">Lead Created</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(inq.created_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Manage Lead</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-medium">Status</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => (
                      <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium">Activity Note</label>
                <Textarea 
                  placeholder="Interaction summary..." 
                  className="min-h-[100px] text-sm resize-none"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Button 
                  className="w-full bg-primary" 
                  disabled={updateMutation.isPending || (status === inq.status && !note.trim())}
                  onClick={() => updateMutation.mutate()}
                >
                  {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Update
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  disabled={addNoteMutation.isPending || !note.trim()}
                  onClick={() => addNoteMutation.mutate()}
                >
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 text-white">
            <CardContent className="p-6 space-y-4">
              <p className="text-xs font-bold uppercase tracking-wider text-white/50">Actions</p>
              <Button asChild className="w-full bg-[#25D366] text-white hover:bg-[#25D366]/90 border-0">
                <a href={`https://wa.me/${inq.phone.replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                </a>
              </Button>
              <Button asChild variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white">
                <a href={`tel:${inq.phone.replace(/\s/g, "")}`}>
                  <Phone className="h-4 w-4 mr-2" /> Call Phone
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
