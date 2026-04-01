import { getCurrentUser, getSubscription } from "@/lib/data";
import { UpgradePricing } from "@/components/upgrade-pricing";

export default async function UpgradePage() {
  const user = await getCurrentUser();
  const userId = user?.id ?? "demo-user";
  const subscription = await getSubscription(userId);

  return <UpgradePricing currentPlan={subscription.plan} userId={userId} />;
}
