import { localDateRange, shiftLocalDate } from "@/lib/date";
import type { DailyCheckIn, JournalEntry, PanicEpisode } from "@/lib/types";

/**
 * Every figure on the patterns page is computed here, in plain arithmetic,
 * before any model is involved. The model's job is to phrase — never to
 * calculate, and never to introduce a number that is not in this file.
 */

const SLEEP_VALUE: Record<string, number> = {
  very_poorly: 1,
  poorly: 2,
  okay: 3,
  well: 4,
  very_well: 5,
};

export type Stats = {
  days: number;
  checkInCount: number;
  streak: number;
  avgMood: number | null;
  /** Anxiety is stored 1–10; shown on the same five-point scale as mood. */
  avgAnxiety: number | null;
  avgSleep: number | null;
  moodTrend: number | null;
  anxietyTrend: number | null;
  sleepAnxietyLink: number | null;
  panicCount: number;
  topTrigger: { trigger: string; count: number } | null;
  topLocation: { location: string; count: number } | null;
  calmerRate: number | null;
  journalCount: number;
  topThemes: { theme: string; count: number }[];
  series: { date: string; mood: number | null; anxiety: number | null }[];
};

const round = (value: number, places = 1) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

const average = (values: number[]) =>
  values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;

function trend(values: number[]): number | null {
  if (values.length < 4) return null;
  const midpoint = Math.floor(values.length / 2);
  const first = average(values.slice(0, midpoint));
  const second = average(values.slice(midpoint));
  if (first === null || second === null) return null;
  return round(second - first, 2);
}

/**
 * Pearson correlation, withheld below 5 pairs. With fewer points the figure is
 * noise, and presenting noise as a finding is the failure this app most needs
 * to avoid.
 */
function correlate(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 5) return null;
  const meanX = average(xs);
  const meanY = average(ys);
  if (meanX === null || meanY === null) return null;

  let numerator = 0;
  let sumSqX = 0;
  let sumSqY = 0;
  for (let i = 0; i < xs.length; i += 1) {
    const dx = (xs[i] as number) - meanX;
    const dy = (ys[i] as number) - meanY;
    numerator += dx * dy;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
  }
  const denominator = Math.sqrt(sumSqX * sumSqY);
  return denominator === 0 ? null : round(numerator / denominator, 2);
}

function currentStreak(checkIns: DailyCheckIn[], today: string): number {
  const dates = new Set(checkIns.map((row) => row.local_date));
  let streak = 0;
  // Yesterday still counts: someone who has not checked in yet today has not
  // broken anything.
  let cursor = dates.has(today) ? today : shiftLocalDate(today, -1);
  while (dates.has(cursor) && streak < 400) {
    streak += 1;
    cursor = shiftLocalDate(cursor, -1);
  }
  return streak;
}

function tally<T extends string>(values: T[]): { value: T; count: number }[] {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([value, count]) => ({ value, count }));
}

export function computeStats(input: {
  today: string;
  days: number;
  checkIns: DailyCheckIn[];
  panicEpisodes: PanicEpisode[];
  journal: JournalEntry[];
}): Stats {
  const { today, days, checkIns, panicEpisodes, journal } = input;
  const window = localDateRange(today, days);
  const inWindow = new Set(window);
  const cutoff = window[0] ?? today;

  const scoped = checkIns
    .filter((row) => inWindow.has(row.local_date))
    .sort((a, b) => a.local_date.localeCompare(b.local_date));

  const panic = panicEpisodes.filter((row) => row.created_at.slice(0, 10) >= cutoff);
  const entries = journal.filter((row) => row.created_at.slice(0, 10) >= cutoff);

  const moods = scoped.map((row) => row.mood);
  // Halved so mood and anxiety share one 1–5 axis. A second axis would be a lie.
  const anxieties = scoped.map((row) => row.anxiety_level / 2);
  const sleeps = scoped.map((row) => SLEEP_VALUE[row.sleep_quality] ?? 3);

  const triggers = tally(panic.map((row) => row.trigger));
  const locations = tally(panic.map((row) => row.location));
  const themes = tally(
    entries.flatMap((row) =>
      (row.emotional_analysis_json?.emotionalThemes ?? []).map((theme) => theme.toLowerCase()),
    ),
  ).slice(0, 6);

  const byDate = new Map(scoped.map((row) => [row.local_date, row]));
  const calmer = panic.filter((row) => row.check_in === "calmer").length;

  return {
    days,
    checkInCount: scoped.length,
    streak: currentStreak(checkIns, today),
    avgMood: moods.length ? round(average(moods) as number) : null,
    avgAnxiety: anxieties.length ? round(average(anxieties) as number) : null,
    avgSleep: sleeps.length ? round(average(sleeps) as number) : null,
    moodTrend: trend(moods),
    anxietyTrend: trend(anxieties),
    sleepAnxietyLink: correlate(sleeps, anxieties),
    panicCount: panic.length,
    topTrigger: triggers[0] ? { trigger: triggers[0].value, count: triggers[0].count } : null,
    topLocation: locations[0] ? { location: locations[0].value, count: locations[0].count } : null,
    calmerRate: panic.length > 0 ? round(calmer / panic.length, 2) : null,
    journalCount: entries.length,
    topThemes: themes.map((row) => ({ theme: row.value, count: row.count })),
    series: window.map((date) => {
      const row = byDate.get(date);
      return {
        date,
        mood: row?.mood ?? null,
        anxiety: row ? row.anxiety_level / 2 : null,
      };
    }),
  };
}

/** A compact, factual brief. The only thing a model is given. */
export function statsToBrief(stats: Stats): string {
  const lines: string[] = [
    `Window: last ${stats.days} days.`,
    `Check-ins: ${stats.checkInCount} of ${stats.days} days. Current streak: ${stats.streak}.`,
  ];
  if (stats.avgMood !== null) lines.push(`Average mood: ${stats.avgMood}/5.`);
  if (stats.avgAnxiety !== null) lines.push(`Average anxiety: ${stats.avgAnxiety}/5 (stored 1-10, halved).`);
  if (stats.avgSleep !== null) lines.push(`Average sleep: ${stats.avgSleep}/5.`);
  if (stats.moodTrend !== null) {
    lines.push(`Mood, second half of window minus first: ${stats.moodTrend > 0 ? "+" : ""}${stats.moodTrend}.`);
  }
  if (stats.anxietyTrend !== null) {
    lines.push(`Anxiety, second half minus first: ${stats.anxietyTrend > 0 ? "+" : ""}${stats.anxietyTrend}.`);
  }
  if (stats.sleepAnxietyLink !== null) {
    lines.push(`Sleep-anxiety correlation across ${stats.checkInCount} days: ${stats.sleepAnxietyLink}.`);
  }
  lines.push(`SOS sessions: ${stats.panicCount}.`);
  if (stats.topTrigger) {
    lines.push(`Most common SOS trigger: ${stats.topTrigger.trigger} (${stats.topTrigger.count}).`);
  }
  if (stats.topLocation) {
    lines.push(`Most common SOS setting: ${stats.topLocation.location} (${stats.topLocation.count}).`);
  }
  if (stats.calmerRate !== null) {
    lines.push(`Ended calmer in ${Math.round(stats.calmerRate * 100)}% of SOS sessions.`);
  }
  lines.push(`Journal entries: ${stats.journalCount}.`);
  if (stats.topThemes.length) {
    lines.push(
      `Recurring journal themes: ${stats.topThemes.map((t) => `${t.theme} (${t.count})`).join(", ")}.`,
    );
  }
  return lines.join("\n");
}
