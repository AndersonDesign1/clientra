import { createFileRoute } from "@tanstack/react-router";
import { requireOnboardingSession } from "@/auth/guards";
import { OnboardingForm } from "@/components/auth/onboarding-form";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: requireOnboardingSession,
  component: OnboardingPage,
});

function OnboardingPage() {
  return <OnboardingForm />;
}
