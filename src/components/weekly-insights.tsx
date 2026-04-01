"use client";

import { useMemo, useState } from "react";
import type { AccountMemory, JournalEntry, MoodLog, PanicEpisode, SessionSummary } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type WeeklyInsightsProps = {
  moodLogs: MoodLog[];
  journalEntries: JournalEntry[];
  panicEpisodes: PanicEpisode[];
  sessionSummaries: SessionSummary[];
  accountMemory: AccountMemory | null;
};

type RangeKey = 7 | 30;
type GraphPoint = {
  id: string;
  x: number;
  y: number;
  mood: number;
  label: string;
  createdAt: string;
  hasAnxietySpike: boolean;
  hasPoorSleep: boolean;
  hasJournalEntry: boolean;
  hasSOSCheckIn: boolean;
};

export function WeeklyInsights({
  moodLogs,
  journalEntries,
  panicEpisodes,
  sessionSummaries,
  accountMemory
}: WeeklyInsightsProps) {
  const [range, setRange] = useState<RangeKey>(7);
  const analytics = useMemo(
    () => buildWeeklyAnalytics({ moodLogs, journalEntries, panicEpisodes, sessionSummaries, accountMemory, range }),
    [accountMemory, journalEntries, moodLogs, panicEpisodes, range, sessionSummaries]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-display text-2xl text-ink">Mood trend graph</p>
            <p className="mt-2 max-w-2xl text-sm text-pine/70">
              {analytics.graphSummary}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-mist/70 p-1">
            {[7, 30].map((days) => (
              <Button
                key={days}
                type="button"
                variant={range === days ? "primary" : "ghost"}
                className="px-3 py-1.5 text-xs"
                onClick={() => setRange(days as RangeKey)}
              >
                {days} days
              </Button>
            ))}
          </div>
        </div>
        <div className="mt-4 rounded-[24px] bg-sand/60 p-4">
          <svg className="h-56 w-full" viewBox="0 0 320 180" preserveAspectRatio="none" aria-label="Mood line graph">
            <path d={analytics.areaPath} fill="rgba(124, 162, 147, 0.18)" stroke="none" />
            <path d={analytics.linePath} fill="none" stroke="#21453d" strokeWidth="3" strokeLinecap="round" />
            {analytics.points.map((point) => (
              <g key={point.id}>
                <circle cx={point.x} cy={point.y} r="4" fill="#21453d" />
                {point.hasAnxietySpike ? (
                  <circle cx={point.x} cy={12} r="4" fill="#d57762" />
                ) : null}
                {point.hasJournalEntry ? (
                  <rect x={point.x - 3} y={22} width="6" height="6" rx="2" fill="#21453d" opacity="0.85" />
                ) : null}
                {point.hasSOSCheckIn ? (
                  <polygon points={`${point.x},35 ${point.x - 4},43 ${point.x + 4},43`} fill="#21453d" opacity="0.7" />
                ) : null}
                {point.hasPoorSleep ? (
                  <circle cx={point.x} cy={52} r="3.5" fill="#8c7a63" opacity="0.9" />
                ) : null}
              </g>
            ))}
          </svg>
          <div className="mt-3 flex justify-between text-[11px] uppercase tracking-[0.2em] text-pine/60">
            {analytics.points.map((point) => (
              <span key={point.id}>{point.label}</span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-pine/75">
            <LegendDot color="bg-coral">Anxiety spike</LegendDot>
            <LegendDot color="bg-pine">Journal entry</LegendDot>
            <LegendDot color="bg-pine/70">SOS check-in</LegendDot>
            <LegendDot color="bg-stone-500">Poor sleep night</LegendDot>
          </div>
          <p className="mt-4 text-xs text-pine/65">{analytics.traceText}</p>
        </div>
      </Card>

      <div className="space-y-4">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
          <p className="font-display text-2xl text-ink">Common stress triggers</p>
          <p className="mt-2 text-sm text-pine/70">
            This read comes from journaling triggers, support-session themes, and where higher-stress moments keep appearing.
          </p>
            </div>
            <span className="rounded-full bg-mist px-2 py-1 text-[11px] text-pine/75">{analytics.triggerConfidence}</span>
          </div>
          <div className="mt-4 space-y-3">
            {analytics.triggerCards.map((trigger) => (
              <div key={trigger.label} className="rounded-[20px] bg-mist/55 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-ink">{trigger.label}</p>
                  <span className="rounded-full bg-white/90 px-2 py-1 text-[11px] text-pine/70">{trigger.tag}</span>
                </div>
                <p className="mt-2 text-sm text-pine/70">{trigger.basis}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="bg-pine text-white">
          <p className="font-display text-2xl">Improvement score</p>
          <p className="mt-3 font-display text-5xl">{analytics.improvementScore}</p>
          <p className="mt-2 text-sm text-white/80">{analytics.improvementSummary}</p>
          <div className="mt-4 space-y-2 text-sm text-white/85">
            {analytics.contributors.map((contributor) => (
              <p key={contributor}>• {contributor}</p>
            ))}
          </div>
          <p className="mt-4 text-xs text-white/70">{analytics.improvementBasis}</p>
        </Card>
      </div>
    </div>
  );
}

function LegendDot({ color, children }: { color: string; children: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
      {children}
    </span>
  );
}

function buildWeeklyAnalytics({
  moodLogs,
  journalEntries,
  panicEpisodes,
  sessionSummaries,
  accountMemory,
  range
}: {
  moodLogs: MoodLog[];
  journalEntries: JournalEntry[];
  panicEpisodes: PanicEpisode[];
  sessionSummaries: SessionSummary[];
  accountMemory: AccountMemory | null;
  range: RangeKey;
}) {
  const orderedLogs = [...moodLogs]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-range);
  const points = buildGraphPoints(orderedLogs, journalEntries, panicEpisodes);
  const linePath = buildLinePath(points);
  const areaPath = buildAreaPath(points);
  const improvement = buildImprovementScore(orderedLogs, journalEntries);
  const triggers = buildTriggerReads({ orderedLogs, journalEntries, sessionSummaries, accountMemory });

  return {
    points,
    linePath,
    areaPath,
    graphSummary: buildGraphSummary(orderedLogs),
    traceText: buildTraceText(points, range),
    improvementScore: `${improvement.score}/100`,
    improvementSummary: improvement.summary,
    contributors: improvement.contributors,
    improvementBasis: improvement.basis,
    triggerCards: triggers.cards,
    triggerConfidence: triggers.confidence
  };
}

function buildGraphPoints(moodLogs: MoodLog[], journalEntries: JournalEntry[], panicEpisodes: PanicEpisode[]): GraphPoint[] {
  const width = 320;
  const height = 180;

  if (!moodLogs.length) {
    return [];
  }

  const step = width / Math.max(moodLogs.length - 1, 1);
  return moodLogs.map((log, index) => {
    const x = index * step;
    const y = height - ((log.mood - 1) / 9) * (height - 28) - 14;
    const dayKey = toDayKey(log.createdAt);

    return {
      id: log.id,
      x,
      y,
      mood: log.mood,
      label: new Date(log.createdAt).toLocaleDateString("en-US", moodLogs.length > 10 ? { month: "short", day: "numeric" } : { weekday: "short" }),
      createdAt: log.createdAt,
      hasAnxietySpike: log.anxietyLevel >= 8,
      hasPoorSleep: log.sleepQuality < 6,
      hasJournalEntry: journalEntries.some((entry) => toDayKey(entry.createdAt) === dayKey),
      hasSOSCheckIn: panicEpisodes.some((episode) => toDayKey(episode.createdAt) === dayKey)
    };
  });
}

function buildLinePath(points: GraphPoint[]) {
  if (!points.length) return "M0 90 L320 90";
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
}

function buildAreaPath(points: GraphPoint[]) {
  if (!points.length) return "M0 180 L0 90 L320 90 L320 180 Z";
  return `${buildLinePath(points)} L${points[points.length - 1]?.x ?? 320} 180 L0 180 Z`;
}

function buildGraphSummary(moodLogs: MoodLog[]) {
  if (!moodLogs.length) {
    return "A few more mood check-ins will give your system enough signal to notice whether your baseline is holding, dipping, or recovering over time.";
  }

  const first = moodLogs[0];
  const last = moodLogs[moodLogs.length - 1];
  const direction = last.mood > first.mood ? "lifting" : last.mood < first.mood ? "running lower" : "holding fairly steady";
  return `Across the selected range, your mood has been ${direction}. The markers show where anxiety spikes, journaling, SOS check-ins, and poor sleep nights seem to intersect with that rhythm.`;
}

function buildTraceText(points: GraphPoint[], range: RangeKey) {
  if (!points.length) {
    return "Your system is still gathering enough signal for a traceable curve here. Mood logs, journal entries, SOS check-ins, and sleep markers will gradually sharpen the read.";
  }

  const anxietySpikes = points.filter((point) => point.hasAnxietySpike).length;
  const journalDays = points.filter((point) => point.hasJournalEntry).length;
  const sosDays = points.filter((point) => point.hasSOSCheckIn).length;
  const poorSleepDays = points.filter((point) => point.hasPoorSleep).length;

  return `Based on ${points.length} mood ${points.length === 1 ? "log" : "logs"} over ${range} days, with ${anxietySpikes} anxiety spike${anxietySpikes === 1 ? "" : "s"}, ${journalDays} journal day${journalDays === 1 ? "" : "s"}, ${sosDays} SOS check-in${sosDays === 1 ? "" : "s"}, and ${poorSleepDays} lower-sleep night${poorSleepDays === 1 ? "" : "s"}.`;
}

function buildImprovementScore(moodLogs: MoodLog[], journalEntries: JournalEntry[]) {
  if (moodLogs.length < 2) {
    return {
      score: 62,
      summary: "This is an early read. It becomes more grounded once your system has a fuller week of mood, anxiety, and sleep movement.",
      contributors: [
        "Recent journaling is beginning to give the system emotional context.",
        "An early read indicates it is too soon to tell whether anxiety spikes are easing.",
        "Sleep stability needs a bit more signal before this read can tighten."
      ],
      basis: "Based on early account activity."
    };
  }

  const midpoint = Math.ceil(moodLogs.length / 2);
  const early = moodLogs.slice(0, midpoint);
  const recent = moodLogs.slice(midpoint);
  const earlyMood = averageValue(early.map((item) => item.mood));
  const recentMood = averageValue(recent.map((item) => item.mood));
  const earlyAnxiety = averageValue(early.map((item) => item.anxietyLevel));
  const recentAnxiety = averageValue(recent.map((item) => item.anxietyLevel));
  const sleepVariance = Math.abs(averageValue(recent.map((item) => item.sleepQuality)) - averageValue(early.map((item) => item.sleepQuality)));
  const journalingConsistency = journalEntries.length >= 2;
  const anxietySpikeDays = moodLogs.filter((log) => log.anxietyLevel >= 8).length;

  const rawScore = 60 + (recentMood - earlyMood) * 6 + (earlyAnxiety - recentAnxiety) * 6 - sleepVariance * 2;
  const score = Math.max(1, Math.min(99, Math.round(rawScore)));

  return {
    score,
    summary: "This score reflects whether your recent baseline, anxiety load, and recovery rhythm appear to be getting steadier or more strained.",
    contributors: [
      journalingConsistency ? "Journaling consistency is improving and giving your system a cleaner emotional read." : "Journaling is still sparse, so this remains an early read.",
      anxietySpikeDays <= Math.max(1, Math.floor(moodLogs.length / 4))
        ? "Recent signals suggest anxiety spikes are less frequent across the current range."
        : "Anxiety spikes are still surfacing often enough to keep the score restrained.",
      sleepVariance <= 1
        ? "Sleep stability looks steadier, which may be supporting a calmer baseline."
        : "Sleep stability still looks uneven, which may be amplifying stress reactivity."
    ],
    basis: `Based on ${moodLogs.length} mood ${moodLogs.length === 1 ? "log" : "logs"} and ${journalEntries.length} journal ${journalEntries.length === 1 ? "entry" : "entries"}.`
  };
}

function buildTriggerReads({
  orderedLogs,
  journalEntries,
  sessionSummaries,
  accountMemory
}: {
  orderedLogs: MoodLog[];
  journalEntries: JournalEntry[];
  sessionSummaries: SessionSummary[];
  accountMemory: AccountMemory | null;
}) {
  const triggers = countValues(journalEntries.flatMap((entry) => entry.emotionalAnalysis?.triggers ?? []));
  const recurringIssues = countValues(sessionSummaries.flatMap((summary) => summary.recurringIssues ?? []));
  const eveningStressShare = orderedLogs.length
    ? Math.round((orderedLogs.filter((log) => {
        const hour = new Date(log.createdAt).getHours();
        return (hour >= 17 || hour < 2) && log.stress >= 7;
      }).length / orderedLogs.length) * 100)
    : 0;

  const cards: Array<{ label: string; tag: string; basis: string }> = [];

  const topTrigger = [...triggers.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topTrigger) {
    cards.push({
      label: `${capitalize(topTrigger[0])} may be an early trigger`,
      tag: topTrigger[1] >= 2 ? "Medium confidence" : "Early signal",
      basis: `Based on ${topTrigger[1]} recent journal ${topTrigger[1] === 1 ? "entry" : "entries"}.`
    });
  }

  if (eveningStressShare >= 40) {
    cards.push({
      label: "Stress appears more often in the evening",
      tag: orderedLogs.length >= 7 ? "Medium confidence" : "Early signal",
      basis: `Recent signals suggest about ${eveningStressShare}% of higher-stress logs landed later in the day.`
    });
  }

  const topIssue = [...recurringIssues.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topIssue) {
    cards.push({
      label: `${capitalize(topIssue[0])} keeps resurfacing in support`,
      tag: topIssue[1] >= 2 ? "Medium confidence" : "Low confidence",
      basis: `Based on ${topIssue[1]} recent support ${topIssue[1] === 1 ? "session" : "sessions"}.`
    });
  }

  if (!cards.length) {
    const fallback = accountMemory?.commonTriggers[0] ?? accountMemory?.bringsYouHere[0] ?? "Work pressure";
    cards.push(
      {
        label: `${capitalize(fallback)} may be an early trigger`,
        tag: "Early signal",
        basis: "An early read based on onboarding and account memory."
      },
      {
        label: "Stress may be accumulating before it feels fully visible",
        tag: "Low confidence",
        basis: "This may sharpen once more mood logs and journal entries are available."
      },
      {
        label: "Relationship uncertainty may be showing up in support",
        tag: "Low confidence",
        basis: "An early read based on recent conversational themes."
      }
    );
  }

  return {
    cards: cards.slice(0, 3),
    confidence: cards.some((card) => card.tag === "Medium confidence") ? "Medium confidence" : "Low confidence"
  };
}

function countValues(values: string[]) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }
  return counts;
}

function averageValue(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function toDayKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
