import { createFileRoute, redirect, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Building2,
  MessageSquareText,
  Megaphone,
  User,
  LogOut,
  ChevronRight,
  ClipboardList,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { currentAgentQuery, agentDashboardStatsQuery } from "@/lib/agent-queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agent/")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/auth", search: { redirect: "/agent" } });
    }
  },
  loader: ({ context }) => context.queryClient.ensureQueryData(currentAgentQuery),
  component: AgentLayout,
});

const NAV = [
  { to: "/agent", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/agent/listings", icon: Building2, label: "My Listings" },
  { to: "/agent/enquiries", icon: MessageSquareText, label: "Enquiries" },
  { to: "/agent/marketing", icon: Megaphone, label: "Marketing Hub" },
  { to: "/agent/profile", icon: User, label: "My Profile" },
] as const;

function getPageTitle(pathname: string): string {
  if (pathname.startsWith("/agent/listings/new")) return "New Listing";
  if (pathname.startsWith("/agent/listings")) return "My Listings";
  if (pathname.startsWith("/agent/enquiries")) return "Enquiries";
  if (pathname.startsWith("/agent/marketing")) return "Marketing Hub";
  if (pathname.startsWith("/agent/profile")) return "My Profile";
  if (pathname.startsWith("/agent/onboarding")) return "Onboarding";
  return "Dashboard";
}

function AgentLayout() {
  const { data: agent } = useQuery(currentAgentQuery);
  const { data: stats } = useQuery(agentDashboardStatsQuery);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRoot = pathname === "/agent";

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const onboardingComplete = (agent as any)?.onboarding_completed ?? false;

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-5">
          <span className="font-display text-lg font-semibold tracking-tight">Bright Edge</span>
          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Agent
          </span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              end={item.end}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground [&.active]:bg-primary/10 [&.active]:text-primary"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.label === "Enquiries" && (stats?.inquiries ?? 0) > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                  {stats!.inquiries > 99 ? "99+" : stats!.inquiries}
                </span>
              )}
            </Link>
          ))}

          {!onboardingComplete && (
            <Link
              to="/agent/onboarding"
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-50 [&.active]:bg-amber-100 [&.active]:text-amber-700"
            >
              <ClipboardList className="h-4 w-4 shrink-0" />
              Complete Onboarding
            </Link>
          )}
        </nav>

        <div className="border-t border-border p-3">
          <div className="mb-2 flex items-center gap-2 rounded-md px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground">{agent?.full_name ?? "Agent"}</p>
              <p className="truncate text-[10px] capitalize text-muted-foreground">
                {(agent as any)?.verification_status ?? "pending"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 sm:px-6">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Agent</span>
            <ChevronRight className="h-3 w-3" />
            <span className="font-medium text-foreground">{getPageTitle(pathname)}</span>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">View site</Link>
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {isRoot ? <AgentOverview agent={agent} stats={stats} /> : <Outlet />}
        </main>
      </div>
    </div>
  );
}

function AgentOverview({
  agent,
  stats,
}: {
  agent: ReturnType<typeof useQuery<ReturnType<typeof currentAgentQuery["queryFn"]>>>["data"];
  stats: { listings: number; inquiries: number } | undefined;
}) {
  const verificationStatus = (agent as any)?.verification_status ?? "pending";
  const onboardingComplete = (agent as any)?.onboarding_completed ?? false;
  const firstName = agent?.full_name?.split(" ")[0] ?? "Agent";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {firstName} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your agency dashboard at a glance.</p>
      </div>

      {!onboardingComplete && (
        <div className="flex flex-wrap items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Complete your onboarding</p>
            <p className="mt-0.5 text-xs text-amber-700">
              Your account is not yet active. Complete onboarding to publish listings.
            </p>
          </div>
          <Button size="sm" asChild className="shrink-0 bg-amber-600 hover:bg-amber-700">
            <Link to="/agent/onboarding">Continue →</Link>
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Listings" value={stats?.listings ?? 0} icon={Building2} />
        <StatCard title="Total Enquiries" value={stats?.inquiries ?? 0} icon={MessageSquareText} />
        <StatCard
          title="Verification"
          value={verificationStatus}
          icon={ShieldCheck}
          variant={
            verificationStatus === "verified"
              ? "success"
              : verificationStatus === "under_review"
                ? "warning"
                : "default"
          }
          isText
        />
        <StatCard
          title="Account Status"
          value={agent?.active ? "Active" : "Inactive"}
          icon={User}
          variant={agent?.active ? "success" : "default"}
          isText
        />
      </div>

      {/* Quick Actions + Verification */}
      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/agent/listings/new">
                <Building2 className="h-4 w-4" /> Create New Listing
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/agent/enquiries">
                <MessageSquareText className="h-4 w-4" /> View Enquiries
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link to="/agent/marketing">
                <Megaphone className="h-4 w-4" /> Marketing Hub
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Verification Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">Current status</span>
              <Badge
                variant={
                  verificationStatus === "verified"
                    ? "default"
                    : verificationStatus === "under_review"
                      ? "secondary"
                      : "outline"
                }
                className="capitalize"
              >
                {verificationStatus.replace(/_/g, " ")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {verificationStatus === "verified"
                ? "✓ Your profile is verified. You can publish listings on the platform."
                : verificationStatus === "under_review"
                  ? "Your profile is under review. This typically takes up to 24 hours."
                  : "Submit your onboarding application to start the verification process."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  isText,
  variant = "default",
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  isText?: boolean;
  variant?: "default" | "success" | "warning";
}) {
  return (
    <Card className="border-border">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{title}</p>
            <p
              className={cn(
                "mt-1.5 font-semibold capitalize",
                isText ? "text-base" : "text-2xl",
                variant === "success" && "text-emerald-600",
                variant === "warning" && "text-amber-600",
              )}
            >
              {typeof value === "string" ? value.replace(/_/g, " ") : value}
            </p>
          </div>
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              variant === "success" ? "bg-emerald-50" : variant === "warning" ? "bg-amber-50" : "bg-primary/10",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                variant === "success" ? "text-emerald-600" : variant === "warning" ? "text-amber-600" : "text-primary",
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
