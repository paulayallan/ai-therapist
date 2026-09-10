import { EMPTY_SIGNALS, type ToolSignals } from "@/lib/tools";
import type { DailyCheckIn, JournalEntry, MoodLog, PanicEpisode } from "@/lib/types";
import { daysAgo } from "@/lib/date";

/**
 * Turns someone's recent entries into the signals that drive tool
 * recommendations and observations.
 *
 * Two rules:
 *  - Only the last 14 days count. A hard fortnight three months ago is not
 *    what today's recommendation should be built on.
 *  - Every signal is 0–10 and every one of them is traceable to rows the
 *    person created. Nothing here is inferred from behaviour they did not log.
 */

const WINDOW_DAYS = 14;
const clamp = (value: number) => Math.max(0, Math.min(10, value));

/** Keyword buckets, matched against the person's own written words. */
const THEME_PATTERNS: { key: keyof ToolSignals; patterns: RegExp[] }[] = [
  { key: "overthinking", patterns: [/overthink/i, /rumin/i, /spiral/i, /can'?t stop thinking/i, /replay/i, /loop/i] },
  { key: "workStress", patterns: [/\bwork\b/i, /\bjob\b/i, /\bboss\b/i, /deadline/i, /meeting/i, /career/i, /burnout/i] },
  { key: "socialStress", patterns: [/social/i, /people/i, /party/i, /awkward/i, /judged/i, /embarrass/i] },
  { key: "relationshipStrain", patterns: [/relationship/i, /partner/i, /boyfriend/i, /girlfriend/i, /husband/i, /wife/i, /argument/i, /friend/i, /family/i] },
  { key: "selfCriticism", patterns: [/stupid/i, /failure/i, /not good enough/i, /hate myself/i, /useless/i, /pathetic/i, /my fault/i, /should have/i] },
  { key: "lowMood", patterns: [/sad/i, /empty/i, /hopeless/i, /flat/i, /numb/i, /lonely/i, /pointless/i] },
  { key: "bodilyStress", patterns: [/chest/i, /stomach/i, /headache/i, /tense/i, /shoulders/i, /nausea/i, /dizzy/i, /heart/i] },
  { key: "poorSleep", patterns: [/sleep/i, /insomnia/i, /awake/i, /tired/i, /exhaust/i, /3am/i] },
];

const SLEEP_SCORE: Record<string, number> = {
  very_poorly: 10,
  poorly: 7,
  okay: 3,
  well: 1,
  very_well: 0,
};

/** Panic triggers map onto the same signal space as written themes. */
const TRIGGER_SIGNAL: Record<string, keyof ToolSignals> = {
  "Work stress": "workStress",
  "Social situation": "socialStress",
  Relationship: "relationshipStrain",
  Overthinking: "overthinking",
  "Physical symptoms": "bodilyStress",
};

export function deriveSignals(input: {
  checkIns: DailyCheckIn[];
  panicEpisodes: PanicEpisode[];
  journal: JournalEntry[];
  moodLogs: MoodLog[];
}): ToolSignals {
  const cutoff = daysAgo(WINDOW_DAYS);
  const signals: ToolSignals = { ...EMPTY_SIGNALS };

  const checkIns = input.checkIns.filter((row) => row.local_date >= cutoff);
  const panic = input.panicEpisodes.filter((row) => row.created_at >= cutoff);
  const journal = input.journal.filter((row) => row.created_at >= cutoff);
  const moods = input.moodLogs.filter((row) => row.created_at >= cutoff);

  /* --- check-ins: anxiety 1–10, mood 1–5, sleep as a word --------------- */
  if (checkIns.length > 0) {
    const avgAnxiety = checkIns.reduce((s, r) => s + r.anxiety_level, 0) / checkIns.length;
    const avgMood = checkIns.reduce((s, r) => s + r.mood, 0) / checkIns.length;
    const avgSleep =
      checkIns.reduce((s, r) => s + (SLEEP_SCORE[r.sleep_quality] ?? 3), 0) / checkIns.length;

    signals.highAnxiety = clamp(avgAnxiety);
    // Mood is 1–5 where 5 is good; invert onto a 0–10 "low mood" scale.
    signals.lowMood = clamp((5 - avgMood) * 2.5);
    signals.poorSleep = clamp(avgSleep);

    const symptoms = checkIns.flatMap((r) => r.physical_symptoms).length;
    signals.bodilyStress = clamp((symptoms / checkIns.length) * 4);

    const factors = checkIns.flatMap((r) => r.contributing_factors.map((f) => f.toLowerCase()));
    for (const factor of factors) {
      for (const { key, patterns } of THEME_PATTERNS) {
        if (patterns.some((p) => p.test(factor))) signals[key] = clamp(signals[key] + 1.5);
      }
    }
  }

  /* --- mood_logs: everything 1–10 -------------------------------------- */
  if (moods.length > 0) {
    const avgAnxiety = moods.reduce((s, r) => s + r.anxiety_level, 0) / moods.length;
    const avgStress = moods.reduce((s, r) => s + r.stress, 0) / moods.length;
    const avgSleep = moods.reduce((s, r) => s + r.sleep_quality, 0) / moods.length;
    const avgMood = moods.reduce((s, r) => s + r.mood, 0) / moods.length;

    signals.highAnxiety = clamp(Math.max(signals.highAnxiety, avgAnxiety));
    signals.bodilyStress = clamp(Math.max(signals.bodilyStress, avgStress * 0.7));
    signals.poorSleep = clamp(Math.max(signals.poorSleep, 10 - avgSleep));
    signals.lowMood = clamp(Math.max(signals.lowMood, 10 - avgMood));
  }

  /* --- panic episodes --------------------------------------------------- */
  if (panic.length > 0) {
    signals.panicPattern = clamp(panic.length * 2.5);
    for (const episode of panic) {
      const key = TRIGGER_SIGNAL[episode.trigger];
      if (key) signals[key] = clamp(signals[key] + 2);
    }
    const slowRecovery = panic.filter((e) => e.recovery_time === "20+ minutes").length;
    if (slowRecovery > 0) signals.panicPattern = clamp(signals.panicPattern + slowRecovery);
  }

  /* --- journal: their own words and extracted themes -------------------- */
  for (const entry of journal) {
    const haystack = [
      entry.text_content,
      ...(entry.emotional_analysis_json?.emotionalThemes ?? []),
      ...(entry.emotional_analysis_json?.triggers ?? []),
    ]
      .join(" ")
      .slice(0, 4000);

    for (const { key, patterns } of THEME_PATTERNS) {
      if (patterns.some((p) => p.test(haystack))) signals[key] = clamp(signals[key] + 1.2);
    }
  }

  return signals;
}

/** The signals actually driving a recommendation, strongest first. */
export function topSignals(signals: ToolSignals, count = 3): { key: keyof ToolSignals; value: number }[] {
  return (Object.entries(signals) as [keyof ToolSignals, number][])
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([key, value]) => ({ key, value }));
}

export const SIGNAL_LABELS: Record<keyof ToolSignals, string> = {
  panicPattern: "panic episodes",
  highAnxiety: "anxiety levels",
  poorSleep: "sleep quality",
  bodilyStress: "physical symptoms",
  overthinking: "overthinking",
  workStress: "work pressure",
  socialStress: "social situations",
  lowMood: "low mood",
  selfCriticism: "self-criticism",
  relationshipStrain: "relationships",
};
