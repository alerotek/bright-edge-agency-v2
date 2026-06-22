import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/site/Logo";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — Bright Edge Agency" },
      { name: "description", content: "Bright Edge staff sign-in." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/auth" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const finishLogin = () => navigate({ to: redirect ?? "/admin", replace: true });

  const signInGoogle = async () => {
    setBusy(true);
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/auth" });
    if (res.error) { toast.error("Google sign-in failed", { description: (res.error as Error).message }); setBusy(false); return; }
    if (res.redirected) return;
    finishLogin();
  };

  const signInEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { toast.error("Sign in failed", { description: error.message }); return; }
    toast.success("Signed in.");
    finishLogin();
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden bg-gradient-to-br from-primary via-primary-glow to-accent lg:block">
        <div className="absolute inset-0" style={{ background: "url(https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80) center/cover", mixBlendMode: "overlay", opacity: 0.35 }} aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo className="text-white" />
          <div>
            <p className="font-display text-4xl font-semibold leading-tight">A workspace for the team that closes deals.</p>
            <p className="mt-3 max-w-md text-white/80">Listings, leads, reviews, and reports — all in one place.</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md space-y-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← Back to site</Link>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Staff access only — new accounts are created by your administrator.</p>
          </div>

          <Button onClick={signInGoogle} disabled={busy} variant="outline" className="w-full">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden><path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h6c-.3 1.4-1 2.6-2.2 3.4v2.9h3.6c2.1-1.9 3.2-4.7 3.2-8.3z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.9c-1 .7-2.3 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.3v2.8C4.1 20.6 7.8 23 12 23z"/><path fill="#FBBC05" d="M6 14.2A6.7 6.7 0 0 1 5.6 12c0-.8.1-1.5.4-2.2V7H2.3A11 11 0 0 0 1 12c0 1.8.4 3.5 1.3 5z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .5 4.2 1.6L19.4 3.9C17.4 2 14.9 1 12 1 7.8 1 4.1 3.4 2.3 7l3.7 2.8C6.9 7.3 9.2 5.4 12 5.4z"/></svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> or email <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={signInEmail} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground/80">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            <Button type="submit" disabled={busy} className="w-full">
              <Mail className="mr-2 h-4 w-4" /> Sign in
            </Button>
          </form>

          <p className="text-xs text-muted-foreground">
            By signing in you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
