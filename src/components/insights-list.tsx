import type { Insight } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function InsightsList({ insights }: { insights: Insight[] }) {
  if (!insights.length) {
    return <Card><p className="text-sm text-pine/70">No insights yet. Add mood logs and journal entries first.</p></Card>;
  }

  return (
    <div className="grid gap-4">
      {insights.map((insight) => (
        <Card key={insight.id}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-pine/60">{insight.insightType}</p>
              <p className="mt-2 text-base text-ink">{insight.description}</p>
            </div>
            <p className="text-sm text-pine/60">{formatDate(insight.generatedAt)}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
