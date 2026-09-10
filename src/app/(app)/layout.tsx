import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { getEffectiveSubscriptionPlan, starterTrialDaysLeft } from "@/lib/billing";
import { getSubscription, isOnboarded } from "@/lib/data";
import { getSessionUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/auth");

  const [onboarded, subscription] = await Promise.all([isOnboarded(), getSubscription()]);
  if (!onboarded) redirect("/onboarding");

  return (
    <div className="min-h-dvh">
      <AppNav
        plan={getEffectiveSubscriptionPlan(subscription)}
        trialDaysLeft={starterTrialDaysLeft(subscription)}
      />
      <main id="main" className="pb-24 pt-6 sm:pb-16">
        {children}
      </main>
    </div>
  );
}
