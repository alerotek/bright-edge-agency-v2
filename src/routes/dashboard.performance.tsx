import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

export const Route = createFileRoute("/dashboard/performance")({
  component: PerformanceDashboard,
});

function PerformanceDashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["performance-metrics"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: agent } = await supabase
        .from("agents")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!agent) return null;

      // Get leads by status
      const { data: leads } = await supabase
        .from("inquiries")
        .select("status, created_at")
        .eq("agent_id", agent.id);

      // Get property views
      const { data: properties } = await supabase
        .from("properties")
        .select("views_count")
        .eq("agent_id", agent.id);

      const totalViews = properties?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;
      const totalLeads = leads?.length || 0;
      const newLeads = leads?.filter(l => l.status === 'new').length || 0;
      const qualifiedLeads = leads?.filter(l => l.status === 'qualified').length || 0;

      return {
        totalLeads,
        newLeads,
        qualifiedLeads,
        totalViews,
        conversionRate: totalLeads > 0 ? Math.round((qualifiedLeads / totalLeads) * 100) : 0,
      };
    },
  });

  if (isLoading) return <div className="p-12 text-center text-muted-foreground">Loading performance data...</div>;

  if (!metrics) return <div className="p-12 text-center text-muted-foreground">Unable to load performance data</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Performance</h1>
        <p className="text-sm text-muted-foreground">Track your lead conversion and listing performance.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLeads}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.qualifiedLeads}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalViews}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowDownRight className="h-3 w-3 mr-1 text-red-600" />
              -5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-1 text-green-600" />
              +3% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lead Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">New Leads</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${(metrics.newLeads / metrics.totalLeads) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{metrics.newLeads}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Qualified Leads</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ width: `${(metrics.qualifiedLeads / metrics.totalLeads) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{metrics.qualifiedLeads}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">In Progress</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500" 
                    style={{ width: `${((metrics.totalLeads - metrics.newLeads - metrics.qualifiedLeads) / metrics.totalLeads) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{metrics.totalLeads - metrics.newLeads - metrics.qualifiedLeads}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Placeholder for future analytics */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>Detailed analytics including response times, viewing conversion rates, and revenue tracking will be available soon.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
