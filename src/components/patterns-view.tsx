"use client";

import { useMemo } from "react";
import { MoodChart } from "@/components/mood-chart";
import { Empty } from "@/components/ui/card";
import { clientLocalDate } from "@/lib/date";
import { computeStats } from "@/lib/stats";
import type { DailyCheckIn, JournalEntry, PanicEpisode } from "@/lib/types";

/**
 * Stats are computed in the browser because the day boundary belongs to the
 * user's timezone, not the server's. The inputs are raw rows; nothing is
 * pre-aggregated server-side against a guessed date.
 */
export function PatternsView({
  checkIns,
  panicEpisodes,
  journal,
  days = 28,
}: {
  checkIns: DailyCheckIn[];
  panicEpisodes: PanicEpisode[];
  journal: JournalEntry[];
  days?: number;
}) {
  const stats = useMemo(
    () => computeStats({ today: clientLocalDate(), days, checkIns, panicEpisodes, journal }),
    [checkIns, panicEpisodes, journal, days],
  );

  if (stats.checkInCount === 0 && stats.panicCount === 0 && stats.journalCount === 0) {
    return (
      <Empty
        title="Nothing to read yet"
        body="Patterns need about a week of check-ins before they say anything true. Keep going and this fills itself in."
      />
    );
  }

  const tiles = [
    { label: "Check-ins", value: String(stats.checkInCount), unit: `of ${days} days` },
    { label: "Average mood", value: stats.avgMood?.toFixed(1) ?? "—", unit: "out of 5" },
    { label: "Average anxiety", value: stats.avgAnxiety?.toFixed(1) ?? "—", unit: "out of 5" },
    { label: "SOS sessions", value: String(stats.panicCount), unit: `in ${days} days` },
  ];

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-line bg-surface px-4 py-3.5">
            <dt className="text-[0.68rem] font-semibold uppercase tracking-wide text-faint">
              {tile.label}
            </dt>
            <dd className="mt-1.5 font-serif text-2xl tabular-nums text-ink">{tile.value}</dd>
            <dd className="text-[0.7rem] text-faint">{tile.unit}</dd>
          </div>
        ))}
      </dl>

      <div className="card p-5">
        <h3 className="mb-1 font-serif text-lg text-ink">The last {days} days</h3>
        <p className="mb-4 text-sm text-muted">
          Gaps are days without a check-in. The line breaks rather than guessing across them.
        </p>
        <MoodChart points={stats.series} />
      </div>

      {stats.panicCount > 0 ? (
        <div className="card p-5">
          <h3 className="font-serif text-lg text-ink">Your SOS sessions</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {stats.topTrigger ? (
              <li>
                Most common trigger:{" "}
                <span className="font-medium text-ink">{stats.topTrigger.trigger}</span> —{" "}
                {stats.topTrigger.count} of {stats.panicCount}.
              </li>
            ) : null}
            {stats.topLocation ? (
              <li>
                Most often: <span className="font-medium text-ink">{stats.topLocation.location}</span>.
              </li>
            ) : null}
            {stats.calmerRate !== null ? (
              <li>
                You finished calmer in{" "}
                <span className="font-medium text-ink">{Math.round(stats.calmerRate * 100)}%</span>{" "}
                of them.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {stats.topThemes.length > 0 ? (
        <div className="card p-5">
          <h3 className="font-serif text-lg text-ink">What your journal keeps returning to</h3>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {stats.topThemes.map((theme) => (
              <span
                key={theme.theme}
                className="rounded-full bg-sage-soft px-3 py-1 text-xs text-sage-deep"
              >
                {theme.theme}
                {theme.count > 1 ? ` · ${theme.count}` : ""}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
