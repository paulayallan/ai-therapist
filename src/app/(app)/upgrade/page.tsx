import type { Metadata } from "next";
import { UpgradePlans } from "@/components/upgrade-plans";
import { getEffectiveSubscriptionPlan, starterTrialDaysLeft } from "@/lib/billing";
import { getSubscription } from "@/lib/data";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Plans" };

export default async function UpgradePage() {
  const [subscription, user] = await Promise.all([getSubscription(), getSessionUser()]);

  return (
    <div className="stack space-y-6">
      <header>
        <h1 className="font-serif text-2xl text-ink sm:text-3xl">What you get</h1>
        <p className="mt-2 max-w-prose leading-relaxed text-muted">
          The free layer is not a demo. SOS, the core tools, journalling and daily check-ins stay
          free for as long as you use Mentara. Paying buys depth — pattern analysis over months
          rather than days, and a memory that holds what you have already told it.
        </p>
      </header>

      <UpgradePlans
        currentPlan={getEffectiveSubscriptionPlan(subscription)}
        trialDaysLeft={starterTrialDaysLeft(subscription)}
        userId={user?.id ?? null}
      />
    </div>
  );
}
