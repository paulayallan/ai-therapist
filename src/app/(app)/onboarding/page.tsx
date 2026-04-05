import { OnboardingForm } from "@/components/onboarding-form";
import { getCurrentUser, getOnboardingStatus } from "@/lib/data";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (user?.id) {
    const onboarding = await getOnboardingStatus(user.id);
    if (onboarding.completed) {
      redirect("/dashboard");
    }
  }
  return <OnboardingForm />;
}
