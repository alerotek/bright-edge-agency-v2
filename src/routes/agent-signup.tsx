import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/agent-signup")({
  component: AgentSignup,
});

function AgentSignup() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "",
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      alert("Account created! Please log in to continue your onboarding.");
      window.location.href = "/auth";
    },
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Join Bright Edge</h1>
      <p className="mt-2 text-muted-foreground">Create your agent account to get started.</p>
      <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="mt-8 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Account details</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div>
              <Label>Full name</Label>
              <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} required />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required minLength={6} />
            </div>
          </CardContent>
        </Card>
        <Button type="submit" disabled={mutation.isPending}>Create account</Button>
        {mutation.isError && <p className="text-sm text-red-500">{(mutation.error as Error).message}</p>}
      </form>
    </div>
  );
}