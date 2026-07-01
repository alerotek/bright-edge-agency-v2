import { createServerFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client.server";
import { createMiddleware } from "hono/factory";

export async function requireAgent(context: any) {
  const { user } = context;
  if (!user) {
    throw redirect({ to: "/agent-signup" });
  }
  const { data, error } = await supabase
    .from("agents")
    .select("id, onboarding_completed, verification_status")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw redirect({ to: "/agent-signup" });
  }
  return { agent: data };
}