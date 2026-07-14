import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/format";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  ShieldCheck,
  User,
  XCircle,
  AlertTriangle,
  Phone,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/agents/verification")({
  loader: ({ context }) => context.queryClient.ensureQueryData(pendingVerificationsQuery),
  component: AgentVerificationQueue,
});

// ─── Query ────────────────────────────────────────────────
const pendingVerificationsQuery = queryOptions({
  queryKey: ["admin", "agent-verifications"],
  queryFn: async () => {
    const { data, error } = await (supabase.from("agent_verifications") as any)
      .select(`
        id, status, submitted_at, reviewed_at, notes, documents, created_at,
        agent:agents(
          id, full_name, slug, email, phone, national_id_number,
          verification_status, onboarding_completed, created_at,
          photo, bio, position, license_number
        )
      `)
      .in("status", ["pending", "under_review"])
      .order("submitted_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
  staleTime: 30_000,
});

// ─── Status badge ─────────────────────────────────────────
function VerifBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    under_review: "bg-blue-100 text-blue-800 border-blue-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${map[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

// ─── Single verification card ─────────────────────────────
function VerificationCard({ verification }: { verification: any }) {
  const [notes, setNotes] = useState(verification.notes ?? "");
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const decideMutation = useMutation({
    mutationFn: async (decision: "approved" | "rejected") => {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Update verification record
      const { error: verifError } = await (supabase.from("agent_verifications") as any)
        .update({
          status: decision,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id ?? null,
          notes,
        })
        .eq("id", verification.id);
      if (verifError) throw verifError;

      // 2. Update agent row
      const agentUpdate: any = {
        verification_status: decision === "approved" ? "verified" : "rejected",
      };
      if (decision === "approved") {
        agentUpdate.active = true;
        agentUpdate.public_badge = true;
      }
      const { error: agentError } = await supabase
        .from("agents")
        .update(agentUpdate)
        .eq("id", verification.agent.id);
      if (agentError) throw agentError;

      // 3. If approved — grant agent role
      if (decision === "approved" && verification.agent?.user_id) {
        await supabase.from("user_roles").upsert(
          { user_id: verification.agent.user_id, role: "agent" as any },
          { onConflict: "user_id,role" }
        );
      }

      // 4. Log step
      await (supabase.from("agent_verification_steps") as any).insert({
        agent_id: verification.agent.id,
        verification_id: verification.id,
        step: decision === "approved" ? "verified" : "rejected",
        status: "completed",
        metadata: { notes, reviewed_by: user?.id },
      });
    },
    onSuccess: (_, decision) => {
      qc.invalidateQueries({ queryKey: ["admin", "agent-verifications"] });
      qc.invalidateQueries({ queryKey: ["admin", "agents"] });
      toast.success(decision === "approved" ? "Agent approved and activated." : "Application rejected.");
    },
    onError: () => toast.error("Action failed. Please try again."),
  });

  const a = verification.agent;
  const docs: any[] = Array.isArray(verification.documents) ? verification.documents : [];

  // SLA warning: submitted > 20 hours ago
  const submittedAt = new Date(verification.submitted_at);
  const hoursAgo = (Date.now() - submittedAt.getTime()) / 3_600_000;
  const slaWarning = hoursAgo > 20;

  return (
    <Card className={`border ${slaWarning ? "border-orange-300 bg-orange-50/30" : "border-border"}`}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {a?.photo ? (
              <img src={a.photo} alt={a.full_name} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{a?.full_name ?? "Unknown"}</CardTitle>
                <VerifBadge status={verification.status} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {a?.email && (
                  <a href={`mailto:${a.email}`} className="flex items-center gap-1 hover:text-foreground">
                    <Mail className="h-3 w-3" /> {a.email}
                  </a>
                )}
                {a?.phone && (
                  <a href={`tel:${a.phone.replace(/\s/g,"")}`} className="flex items-center gap-1 hover:text-foreground">
                    <Phone className="h-3 w-3" /> {a.phone}
                  </a>
                )}
                {a?.national_id_number && (
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" /> ID: {a.national_id_number}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {slaWarning && (
              <span className="flex items-center gap-1 rounded-md bg-orange-100 px-2 py-1 text-orange-700">
                <AlertTriangle className="h-3 w-3" /> SLA at risk
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {formatDate(verification.submitted_at)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Profile snapshot */}
        <div className="grid gap-3 rounded-xl bg-muted/40 p-4 text-sm sm:grid-cols-2">
          {a?.position && <div><span className="text-xs font-semibold text-muted-foreground">Position</span><p>{a.position}</p></div>}
          {a?.license_number && <div><span className="text-xs font-semibold text-muted-foreground">License #</span><p>{a.license_number}</p></div>}
          {a?.bio && (
            <div className="sm:col-span-2">
              <span className="text-xs font-semibold text-muted-foreground">Bio</span>
              <p className="mt-0.5 line-clamp-2 text-muted-foreground">{a.bio}</p>
            </div>
          )}
        </div>

        {/* Documents */}
        {docs.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Submitted documents ({docs.length})
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {docs.map((doc: any, i: number) => (
                <a
                  key={i}
                  href={doc.public_url ?? doc.storage_path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="flex-1 capitalize">{doc.kind?.replace(/_/g, " ") ?? `Document ${i + 1}`}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Review notes + actions */}
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Review notes
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1.5 resize-none text-sm"
              placeholder="Notes visible to the agent on decision..."
            />
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 bg-green-600 text-white hover:bg-green-700"
              disabled={decideMutation.isPending}
              onClick={() => decideMutation.mutate("approved")}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              {decideMutation.isPending ? "Processing…" : "Approve"}
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              disabled={decideMutation.isPending}
              onClick={() => decideMutation.mutate("rejected")}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>

          <div className="text-center">
            <Link
              to="/agents/$slug"
              params={{ slug: a?.slug ?? "" }}
              className="text-xs text-primary hover:underline"
            >
              View public profile →
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────
function AgentVerificationQueue() {
  const { data: verifications = [] } = useQuery(pendingVerificationsQuery);

  const slaAtRisk = verifications.filter((v: any) => {
    const h = (Date.now() - new Date(v.submitted_at).getTime()) / 3_600_000;
    return h > 20;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agent Verification Queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {verifications.length} pending · 24-hour review SLA
            {slaAtRisk > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                <AlertTriangle className="h-3 w-3" /> {slaAtRisk} at risk
              </span>
            )}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/agents">← All agents</Link>
        </Button>
      </div>

      {verifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <p className="font-semibold text-foreground">Queue clear</p>
          <p className="text-sm text-muted-foreground">
            No agent verifications are currently pending.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {verifications.map((v: any) => (
            <VerificationCard key={v.id} verification={v} />
          ))}
        </div>
      )}
    </div>
  );
}
