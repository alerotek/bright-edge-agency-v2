import { createFileRoute, Link } from "@tanstack/react-router";
import { OnboardingWizard } from "@/components/agent/OnboardingWizard";

export const Route = createFileRoute("/agent-signup")({
  head: () => ({
    meta: [
      { title: "Create Agent Account | Bright Edge" },
      { name: "description", content: "Create your Bright Edge agent account to begin the verification process." },
    ],
  }),
  component: AgentSignupPage,
});

function AgentSignupPage() {
  const handleComplete = () => {
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Become a Bright Edge Agent
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Complete your onboarding in 5 simple steps
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/auth" className="font-medium text-primary hover:underline">
              Sign in →
            </Link>
          </p>
        </div>

        <OnboardingWizard onComplete={handleComplete} />
      </div>
    </div>
  );
}
