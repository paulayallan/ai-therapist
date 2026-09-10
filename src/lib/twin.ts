import type { DailyCheckIn, JournalEntry, PanicEpisode, SessionSummary } from "@/lib/types";
import { SIGNAL_LABELS, topSignals } from "@/lib/signals";
import type { ToolSignals } from "@/lib/tools";

/**
 * The Twin's profile — what it knows about someone.
 *
 * Built deterministically from their own rows first. A model may then phrase
 * it more warmly, but it can never introduce a trait the data does not
 * support. This is the difference between "a friend who knows you" and "a
 * chatbot that flatters you", and it is the whole point of the feature.
 */

export type TwinProfileDraft = {
  emotional_tendencies: string[];
  thinking_patterns: string[];
  common_triggers: string[];
  behavioral_habits: string[];
  profile_summary: string;
};

/** How much material exists to build from. Below `ready`, we do not pretend. */
export type TwinReadiness = {
  ready: boolean;
  checkIns: number;
  journal: number;
  episodes: number;
  missing: string[];
};

const MIN_CHECKINS = 5;
const MIN_SIGNALS = 2;

export function assessReadiness(input: {
  checkIns: DailyCheckIn[];
  journal: JournalEntry[];
  panicEpisodes: PanicEpisode[];
  signals: ToolSignals;
}): TwinReadiness {
  const missing: string[] = [];
  if (input.checkIns.length < MIN_CHECKINS) {
    missing.push(`${MIN_CHECKINS - input.checkIns.length} more daily check-ins`);
  }
  if (topSignals(input.signals, 5).length < MIN_SIGNALS) {
    missing.push("a bit more to go on — a journal entry or two helps most");
  }

  return {
    ready: missing.length === 0,
    checkIns: input.checkIns.length,
    journal: input.journal.length,
    episodes: input.panicEpisodes.length,
    missing,
  };
}

const unique = (values: (string | null | undefined)[]) =>
  [...new Set(values.filter((value): value is string => Boolean(value && value.trim())))];

const SIGNAL_TENDENCIES: Partial<Record<keyof ToolSignals, string>> = {
  panicPattern: "Your system escalates fast — it goes from fine to a lot with very little in between.",
  highAnxiety: "Anxiety sits at a high baseline for you rather than arriving in occasional spikes.",
  poorSleep: "Short sleep hits you harder than it hits most people, and it shows up the next day.",
  bodilyStress: "Stress lands in your body before you have consciously registered it.",
  overthinking: "You process by turning things over, and the turning does not stop on its own.",
  workStress: "Work is where the pressure concentrates, and it follows you out of the day.",
  socialStress: "Social situations cost you something afterwards, not only during.",
  lowMood: "Your mood has been running low enough that it is shaping the rest.",
  selfCriticism: "You are harder on yourself than the situation usually warrants.",
  relationshipStrain: "Relationship tension takes up more room in your head than you would like.",
};

const SIGNAL_HABITS: Partial<Record<keyof ToolSignals, string>> = {
  panicPattern: "You reach for the SOS flow rather than trying to think your way out. That is the right instinct.",
  poorSleep: "The hard days tend to follow the short nights, not the other way round.",
  overthinking: "You write things down to get them out of your head, which works better for you than talking first.",
  workStress: "You stay functional on the outside while carrying a lot of it internally.",
  selfCriticism: "You tend to explain your own behaviour more harshly than anyone else's.",
};

/**
 * A profile built only from what the person actually logged. Every line is
 * traceable to a row.
 */
export function buildProfileDraft(input: {
  signals: ToolSignals;
  checkIns: DailyCheckIn[];
  journal: JournalEntry[];
  panicEpisodes: PanicEpisode[];
  summaries: SessionSummary[];
  displayName: string | null;
}): TwinProfileDraft {
  const strongest = topSignals(input.signals, 4);

  const emotional = unique(strongest.map(({ key }) => SIGNAL_TENDENCIES[key]));
  const habits = unique(strongest.map(({ key }) => SIGNAL_HABITS[key]));

  const thinking = unique([
    ...input.journal.flatMap((entry) => entry.emotional_analysis_json?.distortions ?? []),
    ...input.summaries.flatMap((summary) => summary.recurring_issues ?? []),
  ]).slice(0, 4);

  const triggers = unique([
    ...input.journal.flatMap((entry) => entry.emotional_analysis_json?.triggers ?? []),
    ...input.summaries.flatMap((summary) => summary.possible_triggers ?? []),
    ...input.panicEpisodes.map((episode) => episode.trigger),
    ...input.checkIns.flatMap((row) => row.contributing_factors),
  ]).slice(0, 5);

  const parts: string[] = [];
  if (strongest[0]) {
    parts.push(
      `What stands out most across your entries is ${SIGNAL_LABELS[strongest[0].key]}.`,
    );
  }
  if (triggers.length) {
    parts.push(`The things that set it off most often: ${triggers.slice(0, 3).join(", ")}.`);
  }
  if (input.panicEpisodes.length > 0) {
    const calmer = input.panicEpisodes.filter((row) => row.check_in === "calmer").length;
    parts.push(
      `You have logged ${input.panicEpisodes.length} SOS ${input.panicEpisodes.length === 1 ? "session" : "sessions"}, and finished calmer in ${calmer} of them.`,
    );
  }
  if (thinking.length) {
    parts.push(`Patterns that keep coming back: ${thinking.slice(0, 2).join(" and ")}.`);
  }

  return {
    emotional_tendencies: emotional.length
      ? emotional
      : ["Not enough yet to say much about your patterns with any confidence."],
    thinking_patterns: thinking,
    common_triggers: triggers,
    behavioral_habits: habits,
    profile_summary: parts.join(" "),
  };
}

/** The brief the Twin is given. Facts only — no interpretation added here. */
export function profileToBrief(profile: TwinProfileDraft): string {
  const lines: string[] = [];
  if (profile.profile_summary) lines.push(profile.profile_summary);
  if (profile.emotional_tendencies.length) {
    lines.push(`Emotional tendencies: ${profile.emotional_tendencies.join(" ")}`);
  }
  if (profile.thinking_patterns.length) {
    lines.push(`Thinking patterns: ${profile.thinking_patterns.join(", ")}.`);
  }
  if (profile.common_triggers.length) {
    lines.push(`Common triggers: ${profile.common_triggers.join(", ")}.`);
  }
  if (profile.behavioral_habits.length) {
    lines.push(`Habits: ${profile.behavioral_habits.join(" ")}`);
  }
  return lines.join("\n");
}
