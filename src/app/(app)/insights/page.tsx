import { InsightsList } from "@/components/insights-list";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getCurrentUser, getInsights } from "@/lib/data";

export default async function InsightsPage() {
  const user = await getCurrentUser();
  const insights = await getInsights(user?.id ?? "demo-user");

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Insights"
        title="Patterns the app is noticing"
        description="These summaries are generated from mood logs, journaling, and coaching context. They are clues, not diagnoses."
      />
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-2xl text-ink">Refresh insight analysis</p>
            <p className="mt-2 text-sm text-pine/70">
              Generate a fresh pattern summary from your recent activity.
            </p>
          </div>
          <form action="/api/insights/generate" method="post">
            <Button type="submit">Generate insights</Button>
          </form>
        </div>
      </Card>
      <InsightsList insights={insights} />
    </div>
  );
}
