import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Building2,
  Users,
  MessageSquareText,
  PenLine,
  Star,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { adminStatsQuery } from "@/lib/admin-queries";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { redirect: "/admin" } });
    }
  },
  component: AdminLayout,
});

const nav = [
  { to: "/admin", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/admin/properties", icon: Building2, label: "Properties" },
  { to: "/admin/agents", icon: Users, label: "Agents" },
  { to: "/admin/inquiries", icon: MessageSquareText, label: "Inquiries" },
  { to: "/admin/blog", icon: PenLine, label: "Blog" },
  { to: "/admin/reviews", icon: Star, label: "Reviews" },
  { to: "/admin/locations", icon: MapPin, label: "Locations" },
  { to: "/admin/settings", icon: Settings, label: "Settings" },
];

function AdminLayout() {
  const { data: stats, isLoading } = useQuery(adminStatsQuery);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-5">
          <span className="font-display text-lg font-semibold tracking-tight">Bright Edge</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">Admin</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary/10 [&.active]:text-primary"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Admin</span>
            <ChevronRight className="h-3 w-3" />
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden" asChild>
            <Link to="/">View site</Link>
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
