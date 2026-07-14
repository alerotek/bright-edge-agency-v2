import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Building2,
  MessageSquareText,
  Image,
  User,
  Settings,
  LogOut,
  ChevronRight,
  TrendingUp,
  LifeBuoy,
  CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw redirect({ to: "/auth", search: { redirect: "/dashboard" } });
    }
    
    const { data: role } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .eq("role", "agent")
      .maybeSingle();
      
    if (!role) {
      throw redirect({ to: "/" });
    }
  },
  component: AgentDashboardLayout,
});

const nav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/dashboard/listings", icon: Building2, label: "My Listings" },
  { to: "/dashboard/leads", icon: MessageSquareText, label: "My Leads" },
  { to: "/dashboard/marketing", icon: Image, label: "Marketing Hub" },
  { to: "/dashboard/performance", icon: TrendingUp, label: "Performance" },
  { to: "/dashboard/profile", icon: User, label: "Profile" },
  { to: "/dashboard/settings", icon: Settings, label: "Settings" },
  { to: "/dashboard/support", icon: LifeBuoy, label: "Support" },
  { to: "/dashboard/billing", icon: CreditCard, label: "Billing" },
];

function AgentDashboardLayout() {
  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <span className="font-display text-lg font-semibold tracking-tight">Bright Edge</span>
          <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent border border-accent/20">Verified Agent</span>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {nav.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-accent/5 hover:text-foreground [&.active]:bg-primary [&.active]:text-primary-foreground shadow-[&.active]:sm"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Agent Dashboard</span>
            <ChevronRight className="h-3 w-3" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">View site</Link>
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
