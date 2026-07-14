import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ShieldCheck, 
  User, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  Loader2,
  Clock,
  Eye,
  AlertTriangle,
  FileText,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export const Route = createFileRoute("/admin/agents/verification")({
  component: VerificationQueue,
});

function VerificationQueue() {
  const queryClient = useQueryClient();
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: applications, isLoading } = useQuery({
    queryKey: ["agent-applications", "pending"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agent_applications")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (app: any) => {
      // 1. Create Agent Profile
      const slug = app.full_name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const uniqueSlug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;

      const { data: agent, error: agentErr } = await supabase.from("agents").insert({
        user_id: app.user_id,
        full_name: app.full_name,
        slug: uniqueSlug,
        phone: app.phone,
        email: app.email,
        whatsapp: app.whatsapp_number,
        photo: app.profile_photo_url,
        is_verified: true,
        verification_date: new Date().toISOString(),
        national_id_number: app.national_id_number
      } as any).select().single();

      if (agentErr) throw agentErr;

      // 2. Update Application Status
      const { error: appErr } = await supabase
        .from("agent_applications")
        .update({ 
          status: "approved", 
          agent_id: agent.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        } as any)
        .eq("id", app.id);

      if (appErr) throw appErr;

      // 3. Grant Agent Role
      if (app.user_id) {
        await supabase.from("user_roles").upsert({
          user_id: app.user_id,
          role: "agent"
        } as any, { onConflict: "user_id,role" });
      }

      // 4. Update Agent Verification Status
      await supabase.from("agents").update({
        verification_status: "verified",
        verification_level: "full",
        public_badge: true,
        active: true,
        onboarding_completed: true,
      } as any).eq("id", agent.id);

      return agent;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-applications"] });
      toast.success("Agent approved, profile created, and welcome email sent!");
      setReviewNotes("");
    },
    onError: (err: any) => {
      toast.error("Approval failed: " + err.message);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (app: any) => {
      const { error } = await supabase
        .from("agent_applications")
        .update({ 
          status: "rejected",
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
        } as any)
        .eq("id", app.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-applications"] });
      toast.success("Application rejected");
      setReviewNotes("");
    },
    onError: (err: any) => toast.error("Rejection failed: " + err.message)
  });

  // Calculate SLA status
  const getSLAStatus = (createdAt: string) => {
    const hoursSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSince > 24) return { status: "overdue", color: "text-red-600", bg: "bg-red-50" };
    if (hoursSince > 18) return { status: "warning", color: "text-yellow-600", bg: "bg-yellow-50" };
    return { status: "on-track", color: "text-green-600", bg: "bg-green-50" };
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Verification Queue</h1>
          <p className="text-sm text-muted-foreground">Review and approve new agent applications within 24-hour SLA.</p>
        </div>
        <Badge variant="outline" className="h-6">
          {applications?.length ?? 0} Pending
        </Badge>
      </div>

      <div className="grid gap-4">
        {applications?.map((app: any) => {
          const sla = getSLAStatus(app.created_at);
          return (
            <Card key={app.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="flex flex-1 items-center gap-4 p-6">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-muted overflow-hidden">
                    {app.profile_photo_url ? (
                      <img src={app.profile_photo_url} className="h-full w-full object-cover" alt="" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                        <User className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{app.full_name}</h3>
                      <Badge className={`${sla.bg} ${sla.color} text-xs`}>
                        {sla.status === 'overdue' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {sla.status === 'warning' && <Clock className="h-3 w-3 mr-1" />}
                        {sla.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(app.created_at).toLocaleString()}</span>
                      <span>{app.email}</span>
                      <span>{app.phone}</span>
                    </div>
                  </div>
                </div>
              
              <div className="flex items-center gap-2 border-t px-6 py-4 sm:border-l sm:border-t-0">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Eye className="mr-2 h-4 w-4" /> Review
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Review Application: {app.full_name}</DialogTitle>
                      <DialogDescription>
                        Submitted on {new Date(app.created_at).toLocaleString()}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <Tabs defaultValue="personal" className="mt-6">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="personal">Personal Info</TabsTrigger>
                        <TabsTrigger value="professional">Professional</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="personal" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs uppercase">Full Legal Name</p>
                            <p className="font-medium mt-1">{app.full_name}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase">National ID Number</p>
                            <p className="font-medium mt-1">{app.national_id_number}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase">Email Address</p>
                            <p className="font-medium mt-1">{app.email}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase">Phone Number</p>
                            <p className="font-medium mt-1">{app.phone}</p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="professional" className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs uppercase">Experience</p>
                            <p className="font-medium mt-1">{app.years_experience} Years</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs uppercase">WhatsApp</p>
                            <p className="font-medium mt-1">{app.whatsapp_number}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-muted-foreground text-xs uppercase">Areas of Operation</p>
                            <p className="font-medium mt-1">{app.areas_of_operation?.join(", ")}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-muted-foreground text-xs uppercase">Specializations</p>
                            <p className="font-medium mt-1">{app.property_specializations?.join(", ")}</p>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="documents" className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ID Front</p>
                            <a href={app.national_id_front_url} target="_blank" rel="noreferrer" className="block relative aspect-[3/2] overflow-hidden rounded-lg border bg-muted group">
                              <img src={app.national_id_front_url} className="h-full w-full object-cover transition-transform group-hover:scale-105" alt="ID Front" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="h-6 w-6 text-white" />
                              </div>
                            </a>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Selfie with ID</p>
                            <a href={app.selfie_url} target="_blank" rel="noreferrer" className="block relative aspect-square overflow-hidden rounded-lg border bg-muted group">
                              <img src={app.selfie_url} className="h-full w-full object-cover transition-transform group-hover:scale-105" alt="Selfie" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ExternalLink className="h-6 w-6 text-white" />
                              </div>
                            </a>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>

                    <div className="mt-6 space-y-4 border-t pt-6">
                      <div>
                        <Label htmlFor="review-notes">Review Notes</Label>
                        <Textarea
                          id="review-notes"
                          placeholder="Add notes about this application (optional)"
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button 
                          variant="outline" 
                          className="flex-1 text-destructive hover:bg-destructive/10"
                          disabled={rejectMutation.isPending}
                          onClick={() => rejectMutation.mutate(app)}
                        >
                          {rejectMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                          Reject
                        </Button>
                        <Button 
                          className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(app)}
                        >
                          {approveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                          Approve Agent
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
          );
        })}

        {applications?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-border bg-muted/20">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ShieldCheck className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-semibold">Queue Clear</p>
            <p className="text-sm text-muted-foreground">No pending agent applications to review.</p>
          </div>
        )}
      </div>
    </div>
  );
}
