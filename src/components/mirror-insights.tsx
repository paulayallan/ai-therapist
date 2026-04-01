"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MirrorInsight } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const feedbackOptions = [
  { value: "very-accurate", label: "Very accurate" },
  { value: "somewhat-accurate", label: "Somewhat accurate" },
  { value: "not-really", label: "Not really" }
] as const;

export function MirrorInsights({ insights }: { insights: MirrorInsight[] }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);

  if (!insights.length) {
    return (
      <Card className="bg-mist/45">
        <p className="text-xs uppercase tracking-[0.24em] text-pine/55">Reflection from your system</p>
        <p className="mt-3 font-display text-2xl text-ink">Your system is still gathering enough emotional signal for a stronger reflection.</p>
        <p className="mt-3 text-sm text-pine/70">
          Mirror insights appear once recent entries suggest a pattern worth reflecting back in a way that feels personal rather than generic.
        </p>
      </Card>
    );
  }

  async function rateInsight(insightId: string, feedback: (typeof feedbackOptions)[number]["value"]) {
    setSavingId(insightId);
    const response = await fetch("/api/mirror-insights/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insightId, feedback })
    });
    setSavingId(null);

    if (response.ok) {
      router.refresh();
    }
  }

  async function toggleSave(insightId: string, saved: boolean) {
    setSavingId(insightId);
    const response = await fetch("/api/mirror-insights/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insightId, saved })
    });
    setSavingId(null);

    if (response.ok) {
      router.refresh();
    }
  }

  return (
    <div className="grid gap-4">
      {insights.slice(0, 3).map((insight, index) => (
        <Card key={insight.id} className={index === 0 ? "bg-mist/55" : "bg-white/80"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.24em] text-pine/55">What your system is noticing</p>
            <div className="flex items-center gap-2">
              {insight.saved ? (
                <span className="rounded-full bg-white px-2 py-1 text-[11px] text-pine/75 ring-1 ring-pine/10">Saved</span>
              ) : null}
              <span className="text-xs text-pine/55">
                {new Date(insight.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xl leading-8 text-ink md:text-2xl md:leading-10">{insight.observation}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant={insight.saved ? "primary" : "secondary"}
              disabled={savingId === insight.id}
              onClick={() => toggleSave(insight.id, !insight.saved)}
            >
              {insight.saved ? "Saved reflection" : "Save reflection"}
            </Button>
            <p className="text-sm text-pine/70">Does this feel accurate?</p>
            {feedbackOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={insight.feedback === option.value ? "primary" : "secondary"}
                disabled={savingId === insight.id}
                onClick={() => rateInsight(insight.id, option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
