import type { AccountMemory, JournalEntry, MoodLog, PanicEpisode, SessionSummary, ThinkingProfile } from "@/lib/types";
import { average } from "@/lib/utils";

const archetypeLibrary = [
  "The Reflective Analyzer",
  "The Quiet Processor",
  "The Inner Navigator",
  "The Pattern Seeker",
  "The Emotional Strategist",
  "The Thoughtful Adapter",
  "The Sensitive Planner",
  "The Deep Processor",
  "The Calm Observer",
  "The Meaning Maker",
  "The Careful Interpreter",
  "The Gentle Overthinker",
  "The Internal Mapper",
  "The Soft Strategist",
  "The Tension Reader",
  "The Steady Interpreter"
] as const;

export function generateThinkingProfile({
  moodLogs,
  journalEntries,
  sessionSummaries,
  panicEpisodes,
  accountMemory
}: {
  moodLogs: MoodLog[];
  journalEntries: JournalEntry[];
  sessionSummaries: SessionSummary[];
  panicEpisodes: PanicEpisode[];
  accountMemory: AccountMemory | null;
}): ThinkingProfile {
  const reflectiveSignals = journalEntries.filter((entry) =>
    /reflect|process|understand|why|meaning|concerned/i.test(entry.emotionalAnalysis?.tone ?? entry.textContent)
  ).length;
  const analyticalSignals = countMatches(
    [
      ...journalEntries.flatMap((entry) => entry.emotionalAnalysis?.distortions ?? []),
      ...journalEntries.map((entry) => entry.textContent),
      ...sessionSummaries.flatMap((summary) => summary.recurringIssues)
    ],
    /(what-if|mind reading|pattern|analyse|overthink|certainty|meaning)/i
  );
  const internalSignals =
    reflectiveSignals +
    countMatches(
      [
        ...journalEntries.map((entry) => entry.textContent),
        ...sessionSummaries.map((summary) => summary.summaryText)
      ],
      /(keep it in|quietly|internally|inside|hold it together)/i
    );
  const workSignals = countMatches(
    [
      ...journalEntries.map((entry) => entry.textContent),
      ...sessionSummaries.map((summary) => summary.mainIssue),
      ...sessionSummaries.flatMap((summary) => summary.possibleTriggers),
      ...(accountMemory?.commonTriggers ?? [])
    ],
    /(work|meeting|boss|deadline|performance|career|pressure)/i
  );
  const relationshipSignals = countMatches(
    [
      ...journalEntries.map((entry) => entry.textContent),
      ...sessionSummaries.map((summary) => summary.mainIssue),
      ...sessionSummaries.flatMap((summary) => summary.possibleTriggers)
    ],
    /(relationship|partner|text|conflict|people|social|friend)/i
  );
  const anxiousSignals = average(moodLogs.map((log) => log.anxietyLevel));
  const stressSignals = average(moodLogs.map((log) => log.stress));
  const lowSleepCount = moodLogs.filter((log) => log.sleepQuality < 6).length;
  const calmerCount = panicEpisodes.filter((episode) => episode.checkIn === "calmer").length;
  const recoverySignal = calmerCount >= Math.ceil(Math.max(1, panicEpisodes.length / 2));
  const enoughDataScore =
    Math.min(1, moodLogs.length / 6) +
    Math.min(1, journalEntries.length / 4) +
    Math.min(1, sessionSummaries.length / 3) +
    Math.min(1, panicEpisodes.length / 2);

  const confidence: ThinkingProfile["confidence"] =
    enoughDataScore >= 3 ? "Strong signal" : enoughDataScore >= 1.8 ? "Medium confidence" : "Early read";

  const archetypeName = selectArchetype({
    reflectiveSignals,
    analyticalSignals,
    internalSignals,
    workSignals,
    relationshipSignals,
    anxiousSignals
  });

  const thinkingStyle =
    analyticalSignals >= 3
      ? "You tend to think in layers and look for meaning before you trust your first reaction."
      : reflectiveSignals >= 2
        ? "You seem to process things reflectively, often trying to understand the emotional shape of an experience before responding."
        : "An early read suggests you think carefully before reacting, especially when something feels emotionally loaded.";

  const stressSignature =
    workSignals >= 2
      ? "Pressure seems to build most around work, responsibility, or performance expectations."
      : relationshipSignals >= 2
        ? "Stress appears to rise fastest around uncertainty in relationships or social interpretation."
        : stressSignals >= 6
          ? "Your system may carry stress quietly until it begins to feel heavy in the body."
          : "Recent signals suggest stress may gather gradually rather than arriving all at once.";

  const emotionalHabits =
    internalSignals >= 2
      ? "You often seem to process emotion internally first, then look for language once the feeling becomes clearer."
      : reflectiveSignals >= 2
        ? "Your system seems to prefer understanding what you feel before expressing it."
        : "An early read indicates you may be noticing emotion inwardly before you share it outwardly.";

  const recoveryProfile =
    lowSleepCount >= 2
      ? "Sleep inconsistency may make recovery slower and make pressure feel sharper the next day."
      : recoverySignal
        ? "Once the feeling is named and regulated, your system seems capable of coming down more steadily."
        : journalEntries.length >= 2
          ? "Writing may already be one of the ways your system metabolizes stress after it builds."
          : "Recovery patterns are still forming, but reflective check-ins may become one of your steadier supports.";

  const traits = deriveTraits({
    reflectiveSignals,
    analyticalSignals,
    internalSignals,
    workSignals,
    relationshipSignals,
    anxiousSignals,
    lowSleepCount
  });

  const strengths = deriveStrengths(archetypeName, analyticalSignals, reflectiveSignals, recoverySignal);
  const watchouts = deriveWatchouts(anxiousSignals, internalSignals, lowSleepCount, workSignals, relationshipSignals);

  const summary = buildSummary(archetypeName, { internalSignals, analyticalSignals, workSignals, relationshipSignals });
  const basis = `Based on ${journalEntries.length} journal ${journalEntries.length === 1 ? "entry" : "entries"}, ${moodLogs.length} mood ${moodLogs.length === 1 ? "log" : "logs"}, and ${sessionSummaries.length} support ${sessionSummaries.length === 1 ? "session" : "sessions"}.`;
  const learningNote =
    confidence === "Strong signal"
      ? "Your profile can still evolve, but the current pattern read already has a stable base."
      : "Your profile can become more accurate as your system learns from new entries.";

  return {
    archetypeName,
    summary,
    traits,
    strengths,
    watchouts,
    confidence,
    basis,
    thinkingStyle,
    stressSignature,
    emotionalHabits,
    recoveryProfile,
    learningNote
  };
}

function selectArchetype({
  reflectiveSignals,
  analyticalSignals,
  internalSignals,
  workSignals,
  relationshipSignals,
  anxiousSignals
}: {
  reflectiveSignals: number;
  analyticalSignals: number;
  internalSignals: number;
  workSignals: number;
  relationshipSignals: number;
  anxiousSignals: number;
}) {
  if (reflectiveSignals >= 2 && internalSignals >= 2 && analyticalSignals >= 3) return "The Reflective Analyzer";
  if (reflectiveSignals >= 2 && internalSignals >= 2 && relationshipSignals >= 2) return "The Quiet Processor";
  if (analyticalSignals >= 3 && anxiousSignals >= 6.5) return "The Inner Navigator";
  if (analyticalSignals >= 3) return "The Pattern Seeker";
  if (workSignals >= 2 && reflectiveSignals >= 1) return "The Emotional Strategist";
  if (reflectiveSignals >= 2 && anxiousSignals < 6) return "The Thoughtful Adapter";
  if (workSignals >= 2 && anxiousSignals >= 6) return "The Sensitive Planner";
  if (reflectiveSignals >= 3) return "The Deep Processor";
  return archetypeLibrary[0];
}

function deriveTraits({
  reflectiveSignals,
  analyticalSignals,
  internalSignals,
  workSignals,
  relationshipSignals,
  anxiousSignals,
  lowSleepCount
}: {
  reflectiveSignals: number;
  analyticalSignals: number;
  internalSignals: number;
  workSignals: number;
  relationshipSignals: number;
  anxiousSignals: number;
  lowSleepCount: number;
}) {
  const traits: string[] = [];
  if (internalSignals >= 2) traits.push("Process emotions internally before sharing them");
  if (analyticalSignals >= 2) traits.push("Look for patterns and meaning in emotionally loaded situations");
  if (relationshipSignals >= 2) traits.push("Replay social moments to understand what they meant");
  if (workSignals >= 2) traits.push("Carry performance pressure quietly until it builds");
  if (anxiousSignals >= 6.5) traits.push("Become more future-focused when uncertainty rises");
  if (lowSleepCount >= 2) traits.push("Feel more emotionally exposed when sleep is uneven");
  if (reflectiveSignals >= 2) traits.push("Feel clearer once thoughts have been expressed in words");
  return traits.slice(0, 5);
}

function deriveStrengths(archetypeName: string, analyticalSignals: number, reflectiveSignals: number, recoverySignal: boolean) {
  const strengths = ["Self-awareness"];
  if (analyticalSignals >= 2) strengths.push("Strong pattern recognition");
  if (reflectiveSignals >= 2) strengths.push("Emotional depth");
  if (archetypeName.includes("Strategist") || archetypeName.includes("Planner")) strengths.push("Thoughtful decision-making");
  if (recoverySignal) strengths.push("Capacity to regulate once the pattern is named");
  return [...new Set(strengths)].slice(0, 4);
}

function deriveWatchouts(
  anxiousSignals: number,
  internalSignals: number,
  lowSleepCount: number,
  workSignals: number,
  relationshipSignals: number
) {
  const watchouts = ["Overthinking"];
  if (internalSignals >= 2) watchouts.push("Delayed emotional release");
  if (anxiousSignals >= 6.5) watchouts.push("Sensitivity to uncertainty");
  if (lowSleepCount >= 2) watchouts.push("Lower resilience after poor sleep");
  if (workSignals >= 2) watchouts.push("Internal pressure around performance");
  if (relationshipSignals >= 2) watchouts.push("Social interpretation loops");
  return [...new Set(watchouts)].slice(0, 4);
}

function buildSummary(
  archetypeName: string,
  signals: { internalSignals: number; analyticalSignals: number; workSignals: number; relationshipSignals: number }
) {
  if (archetypeName === "The Reflective Analyzer") {
    return "You tend to think deeply before reacting, especially when pressure or ambiguity makes the emotional meaning feel unfinished.";
  }

  if (signals.relationshipSignals >= 2) {
    return "You seem to process emotionally loaded interactions slowly and carefully, often trying to understand what happened before deciding how you feel about it.";
  }

  if (signals.workSignals >= 2) {
    return "You tend to stay composed on the outside while your mind works hard to interpret pressure, performance, and what might go wrong next.";
  }

  if (signals.internalSignals >= 2 && signals.analyticalSignals >= 2) {
    return "You appear to think inwardly and analytically, especially when something matters enough to feel emotionally important.";
  }

  return "An early read suggests you are thoughtful, inwardly reflective, and more likely to process emotion through understanding than impulse.";
}

function countMatches(values: string[], regex: RegExp) {
  return values.filter((value) => regex.test(value)).length;
}
