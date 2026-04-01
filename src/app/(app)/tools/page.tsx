import { SectionHeading } from "@/components/section-heading";
import { ToolsLibrary } from "@/components/tools-library";
import { getCurrentUser, getSubscription } from "@/lib/data";
import { getSavedTools, getWeeklyPersonalizedTools } from "@/lib/tools";

export default async function ToolsPage() {
  const user = await getCurrentUser();
  const userId = user?.id ?? "demo-user";
  const [subscription, weeklyTools, savedTools] = await Promise.all([
    getSubscription(userId),
    getWeeklyPersonalizedTools({ userId }),
    getSavedTools({ userId })
  ]);

  return (
    <div>
      <SectionHeading
        eyebrow="Regulation Tools"
        title="Regulation tools"
        description="Personalized practices for calming and re-centering."
      />
      <ToolsLibrary plan={subscription.plan} weeklyTools={weeklyTools} savedTools={savedTools} />
    </div>
  );
}
