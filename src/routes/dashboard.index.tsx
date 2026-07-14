import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  MessageSquareText, 
  Clock, 
  TrendingUp,
  ArrowUpRight,
  Calendar
} from "lucide-react";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: agent } = await supabase
        .from("agents")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!agent) return null;

      // Get leads count
      const { count: leadsCount } = await supabase
        .from("inquiries")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agent.id);

      // Get active listings count
      const { count: listingsCount } = await supabase
        .from("properties")
        .select("*", { count: "exact", head: true })
        .eq("agent_id", agent.id)
        .eq("publish_status", "published");

      // Get recent leads
      const { data: recentLeads } = await supabase
        .from("inquiries")
        .select(`
          *,
          property:properties(id, title, slug)
        `)
        .eq("agent_id", agent.id)
        .order("created_at", { ascending: false })
        .limit(5);

      return {
        leadsCount: leadsCount || 0,
        listingsCount: listingsCount || 0,
        recentLeads: recentLeads || [],
      };
    },
  });

  if (isLoading) {
    return <div className="p-12 text-center text-muted-foreground">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="p-12 text-center text-muted-foreground">Unable to load dashboard</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening with your listings and leads.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leadsCount}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.listingsCount}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4h</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-15%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentLeads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No leads yet. Share your listings to start receiving inquiries.
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentLeads.map((lead: any) => (
                <div key={lead.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{lead.full_name}</p>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {lead.lead_id}
                      </Badge>
                      {lead.status === 'new' && <Badge className="bg-accent text-accent-foreground text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {lead.property?.title ?? "General Inquiry"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </p>
                    <Badge variant="secondary" className="capitalize text-xs mt-1">
                      {lead.inquiry_type?.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="/dashboard/listings/new"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-medium">Add New Listing</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="/dashboard/leads"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <MessageSquareText className="h-5 w-5 text-primary" />
                <span className="font-medium">View All Leads</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="/dashboard/marketing"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span className="font-medium">Marketing Hub</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </a>
            <a
              href="/dashboard/performance"
              className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="font-medium">View Performance</span>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
