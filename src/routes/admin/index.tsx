import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, MessageSquareText, PenLine, Plus } from "lucide-react";
import { adminStatsQuery } from "@/lib/admin-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const cards = [
  { key: "properties", label: "Properties", icon: Building2, to: "/admin/properties", accent: "text-blue-600" },
  { key: "agents", label: "Agents", icon: Users, to: "/admin/agents", accent: "text-emerald-600" },
  { key: "newInquiries", label: "New Inquiries", icon: MessageSquareText, to: "/admin/inquiries", accent: "text-amber-600" },
  { key: "blogPosts", label: "Blog Posts", icon: PenLine, to: "/admin/blog", accent: "text-purple-600" },
] as const;

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery(adminStatsQuery);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back. Here's an overview of your site.</p>
        </div>
        <Button asChild size="sm">
          <Link to="/admin/properties/new"><Plus className="h-4 w-4" /> New property</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.key} to={c.to}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <c.icon className={`h-4 w-4 ${c.accent}`} />
              </CardHeader>
              <CardContent>
                {isLoading ? <Skeleton className="h-7 w-16" /> : <div className="text-2xl font-semibold">{stats?.[c.key] ?? 0}</div>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" asChild><Link to="/admin/properties/new">Add property</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/agents/new">Add agent</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/blog/new">Write blog post</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/reviews/new">Add review</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Manage content</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" asChild><Link to="/admin/properties">All properties</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/inquiries">Inquiries</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/locations">Locations</Link></Button>
            <Button variant="outline" asChild><Link to="/admin/settings">Settings</Link></Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
