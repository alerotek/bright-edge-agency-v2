import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  MessageSquareText, 
  Clock, 
  Calendar, 
  Phone, 
  Mail, 
  Search,
  Filter,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/dashboard/leads")({
  component: AgentLeads,
});

function AgentLeads() {
  const { data: leads, isLoading } = useQuery({
    queryKey: ["agent-leads"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: agent } = await supabase
        .from("agents")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!agent) return [];

      const { data, error } = await supabase
        .from("inquiries")
        .select(`
          *,
          property:properties(id, title, slug)
        `)
        .eq("agent_id", agent.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading your leads...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Leads</h1>
          <p className="text-sm text-muted-foreground">Manage your property inquiries and viewing requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search leads..." className="pl-9" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {leads?.map((lead) => (
          <Card key={lead.id} className="overflow-hidden hover:border-primary/40 transition-colors">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{lead.full_name}</h3>
                      <Badge variant="outline" className="font-mono text-[10px] tracking-tight">{lead.lead_id}</Badge>
                      {lead.status === 'new' && <Badge className="bg-accent text-accent-foreground">New</Badge>}
                    </div>
                    <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {lead.phone}</span>
                      {lead.email && <span className="flex items-center gap-1.5 hidden sm:flex"><Mail className="h-3.5 w-3.5" /> {lead.email}</span>}
                    </div>
                  </div>
                  <Badge variant="secondary" className="capitalize">{lead.status.replace("_", " ")}</Badge>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-6 border-t pt-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Interest</p>
                    <p className="text-sm font-medium line-clamp-1">{lead.property?.title ?? "General Inquiry"}</p>
                    <Badge variant="outline" className="mt-1 h-5 text-[10px] capitalize">{lead.inquiry_type?.replace("_", " ")}</Badge>
                  </div>
                  
                  {lead.inquiry_type === 'viewing_request' && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Preferred Viewing</p>
                      <div className="flex flex-col text-sm font-medium">
                        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-primary" /> {lead.preferred_viewing_date}</span>
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" /> {lead.preferred_viewing_time}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Last Activity</p>
                    <p className="text-sm font-medium">{formatDate(lead.updated_at)}</p>
                    <p className="text-[10px] text-muted-foreground italic">Source: {lead.source?.replace("_", " ")}</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/20 p-6 md:w-56 border-t md:border-t-0 md:border-l flex flex-col justify-center gap-2">
                <Button className="w-full justify-between group" variant="default" asChild>
                  <Link to="/dashboard/leads/$id" params={{ id: lead.id }}>
                    Details <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`tel:${lead.phone.replace(/\s/g, "")}`}>
                    Call Now
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {leads?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center rounded-3xl border border-dashed border-border bg-card">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4 text-muted-foreground">
              <MessageSquareText className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold">No leads yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Your property inquiries and viewing requests will appear here once submitted by clients.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
