import { getCurrentUser, getStrategySessions, getSubscription } from "@/lib/data";
import { SectionHeading } from "@/components/section-heading";
import { StrategyExperience } from "@/components/strategy-client";

export default async function StrategyPage() {
  const user = await getCurrentUser();
  const userId = user?.id ?? "demo-user";
  const [subscription, sessions] = await Promise.all([getSubscription(userId), getStrategySessions(userId)]);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Strategy"
        title="The AI life operating system"
        description="This is where the product moves beyond support and into decision-making, social intelligence, life planning, and burnout optimization."
      />
      <StrategyExperience plan={subscription.plan} sessions={sessions} />
    </div>
  );
}
