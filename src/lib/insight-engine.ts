import type { AITwinProfile, AccountMemory, Insight, JournalEntry, MirrorInsight, MoodLog, PanicEpisode, SessionSummary } from "@/lib/types";

type LearningCard = {
  title: string;
  value: string;
  confidence: NonNullable<Insight["confidence"]>;
  basis: string;
};

function buildInsight(
  description: string,
  insightType: Insight["insightType"],
  index: number,
  options?: {
    category?: Insight["category"];
    confidence?: NonNullable<Insight["confidence"]>;
    basis?: string;
  }
): Insight {
  return {
    id: `derived-${insightType}-${index}`,
    insightType,
    category: options?.category ?? getDefaultCategory(insightType),
    description,
    confidence: options?.confidence ?? "Medium confidence",
    basis: options?.basis ?? "Based on your recent mood, journal, and support signals.",
    generatedAt: new Date().toISOString()
  };
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function mostCommon(values: string[], limit = 3) {
  const counts = new Map<string, number>();
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) continue;
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
}

function getStressTimingInsight(moodLogs: MoodLog[]) {
  if (moodLogs.length < 4) return null;

  const grouped = new Map<number, number[]>();
  for (const log of moodLogs) {
    const day = new Date(log.createdAt).getDay();
    grouped.set(day, [...(grouped.get(day) ?? []), log.stress]);
  }

  const ranked = [...grouped.entries()]
    .map(([day, values]) => ({ day, stress: average(values) }))
    .sort((a, b) => b.stress - a.stress);

  const winner = ranked[0];
  if (!winner || winner.stress < 6) return null;

  const label = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(
    new Date(Date.UTC(2026, 0, 4 + winner.day))
  );
  return `Recent logs suggest your stress tends to crest on ${label}s, which may mean pressure builds through the week rather than only in the moment itself.`;
}

function getSleepCorrelationInsight(moodLogs: MoodLog[]) {
  if (moodLogs.length < 4) return null;

  const lowSleep = moodLogs.filter((log) => log.sleepQuality < 6);
  const steadierSleep = moodLogs.filter((log) => log.sleepQuality >= 6);

  if (!lowSleep.length || !steadierSleep.length) return null;

  const lowSleepAnxiety = average(lowSleep.map((log) => log.anxietyLevel));
  const steadierSleepAnxiety = average(steadierSleep.map((log) => log.anxietyLevel));

  if (lowSleepAnxiety - steadierSleepAnxiety < 1) return null;

  return "Sleep inconsistency may be amplifying anxiety on higher-stress days, which makes rest one of your clearest regulation levers right now.";
}

function getJournalThemeInsight(journalEntries: JournalEntry[]) {
  const themes = mostCommon(
    journalEntries.flatMap((entry) => entry.emotionalAnalysis?.emotionalThemes ?? []),
    2
  );

  if (!themes.length) return null;

  return `Your journaling keeps returning to ${themes.join(" and ")}, which suggests those concerns are active threads in your inner world rather than isolated moments.`;
}

function getConversationPatternInsight(sessionSummaries: SessionSummary[]) {
  const issue = mostCommon(sessionSummaries.flatMap((summary) => summary.recurringIssues), 1)[0];
  if (!issue) return null;

  return `Support conversations keep circling back to ${issue}, which suggests this is becoming a familiar loop for your system rather than a one-off difficult day.`;
}

function getAITwinProfileInsight(aiTwinProfile: AITwinProfile | null) {
  if (!aiTwinProfile?.profileSummary) return null;

  const strongestPattern = aiTwinProfile.thinkingPatterns[0] || aiTwinProfile.behavioralHabits[0];
  if (!strongestPattern) return aiTwinProfile.profileSummary;

  return `Your longer-term profile suggests ${strongestPattern.toLowerCase()} is becoming one of the clearest patterns shaping how you react under pressure.`;
}

function getStarterInsights(journalEntries: JournalEntry[], sessionSummaries: SessionSummary[], accountMemory: AccountMemory | null) {
  const starter: Insight[] = [];
  const firstJournal = journalEntries.at(-1);
  const firstSummary = sessionSummaries.at(-1);

  if (firstJournal?.emotionalAnalysis?.tone) {
    starter.push(
      buildInsight(
        `Based on recent entries, your writing sounds ${firstJournal.emotionalAnalysis.tone}, which may mean you process the feeling internally before it becomes visible on the outside.`,
        "starter",
        starter.length,
        {
          category: "Emotional style",
          confidence: "Low confidence",
          basis: `Based on ${journalEntries.length} journal ${journalEntries.length === 1 ? "entry" : "entries"}.`
        }
      )
    );
  }

  if (firstSummary?.mainIssue) {
    starter.push(
      buildInsight(
        `Your first support conversation centered on ${firstSummary.mainIssue.toLowerCase()}, which may be the clearest early sign of where your system is carrying pressure right now.`,
        "starter",
        starter.length,
        {
          category: "Stress pattern",
          confidence: "Low confidence",
          basis: `Based on ${sessionSummaries.length} recent support ${sessionSummaries.length === 1 ? "session" : "sessions"}.`
        }
      )
    );
  }

  if (accountMemory?.bringsYouHere.length) {
    starter.push(
      buildInsight(
        `Based on onboarding, ${accountMemory.bringsYouHere.join(" and ").toLowerCase()} may be the themes most likely to shape your early support and reflection patterns.`,
        "starter",
        starter.length,
        {
          category: "Stress pattern",
          confidence: "Low confidence",
          basis: "Based on onboarding and early account memory."
        }
      )
    );
  }

  return starter;
}

export function generatePatternInsights({
  moodLogs,
  journalEntries,
  sessionSummaries,
  accountMemory,
  aiTwinProfile,
  panicEpisodes = []
}: {
  moodLogs: MoodLog[];
  journalEntries: JournalEntry[];
  sessionSummaries: SessionSummary[];
  accountMemory: AccountMemory | null;
  aiTwinProfile?: AITwinProfile | null;
  panicEpisodes?: PanicEpisode[];
}) {
  const computed: Insight[] = [];

  const stressTiming = getStressTimingInsight(moodLogs);
  if (stressTiming) {
    computed.push(
      buildInsight(stressTiming, "timing", computed.length, {
        category: "Stress pattern",
        confidence: moodLogs.length >= 7 ? "High confidence" : "Medium confidence",
        basis: `Based on ${moodLogs.length} mood ${moodLogs.length === 1 ? "log" : "logs"}.`
      })
    );
  }

  const sleepCorrelation = getSleepCorrelationInsight(moodLogs);
  if (sleepCorrelation) {
    computed.push(
      buildInsight(sleepCorrelation, "correlation", computed.length, {
        category: "Sleep correlation",
        confidence: moodLogs.length >= 6 ? "High confidence" : "Medium confidence",
        basis: `Based on recent sleep and anxiety trends across ${moodLogs.length} mood logs.`
      })
    );
  }

  const journalTheme = getJournalThemeInsight(journalEntries);
  if (journalTheme) {
    computed.push(
      buildInsight(journalTheme, "theme", computed.length, {
        category: "Emotional style",
        confidence: journalEntries.length >= 4 ? "High confidence" : "Medium confidence",
        basis: `Based on ${journalEntries.length} journal ${journalEntries.length === 1 ? "entry" : "entries"}.`
      })
    );
  }

  const conversationPattern = getConversationPatternInsight(sessionSummaries);
  if (conversationPattern) {
    computed.push(
      buildInsight(conversationPattern, "progress", computed.length, {
        category: "Recovery signal",
        confidence: sessionSummaries.length >= 3 ? "High confidence" : "Medium confidence",
        basis: `Based on ${sessionSummaries.length} support ${sessionSummaries.length === 1 ? "session" : "sessions"}.`
      })
    );
  }

  const aiTwinPattern = getAITwinProfileInsight(aiTwinProfile ?? null);
  if (aiTwinPattern) {
    computed.push(
      buildInsight(aiTwinPattern, "theme", computed.length, {
        category: "Cognitive habit",
        confidence: aiTwinProfile?.thinkingPatterns.length ? "Medium confidence" : "Low confidence",
        basis: "Based on your stored AI Twin profile built from repeated account history."
      })
    );
  }

  const trigger = mostCommon(
    [
      ...journalEntries.flatMap((entry) => entry.emotionalAnalysis?.triggers ?? []),
      ...(accountMemory?.commonTriggers ?? []),
      ...sessionSummaries.flatMap((summary) => summary.possibleTriggers)
    ],
    1
  )[0];

  if (trigger) {
    computed.push(
      buildInsight(
        `A repeated trigger seems to be ${trigger.toLowerCase()}, which may point to a moment where support works best before the pressure fully peaks.`,
        "trigger",
        computed.length,
        {
          category: "Social trigger",
          confidence: triggerSourcesCount(journalEntries, sessionSummaries, accountMemory) >= 4 ? "High confidence" : "Medium confidence",
          basis: "Based on recent journaling, support sessions, and stored trigger memory."
        }
      )
    );
  }

  const panicInsight = getPanicPatternInsight(panicEpisodes, moodLogs);
  if (panicInsight) {
    computed.push(
      buildInsight(panicInsight, "trigger", computed.length, {
        category: "Stress pattern",
        confidence: panicEpisodes.length >= 3 ? "High confidence" : "Medium confidence",
        basis: `Based on ${panicEpisodes.length} SOS panic ${panicEpisodes.length === 1 ? "entry" : "entries"}.`
      })
    );
  }

  if (computed.length >= 3) {
    return computed.slice(0, 6);
  }

  return getStarterInsights(journalEntries, sessionSummaries, accountMemory).slice(0, 6);
}

function getPanicPatternInsight(panicEpisodes: PanicEpisode[], moodLogs: MoodLog[]) {
  if (!panicEpisodes.length) return null;

  const trigger = mostCommon(panicEpisodes.map((episode) => episode.trigger), 1)[0];
  const eveningCount = panicEpisodes.filter((episode) => {
    const hour = new Date(episode.createdAt).getHours();
    return hour >= 18 || hour < 2;
  }).length;

  const latestStressByDay = new Map<string, MoodLog>();
  for (const log of moodLogs) {
    const dayKey = new Date(log.createdAt).toISOString().slice(0, 10);
    if (!latestStressByDay.has(dayKey)) {
      latestStressByDay.set(dayKey, log);
    }
  }

  const panicDays = panicEpisodes
    .map((episode) => latestStressByDay.get(new Date(episode.createdAt).toISOString().slice(0, 10)))
    .filter((log): log is MoodLog => Boolean(log));

  const stressAverage = panicDays.length ? average(panicDays.map((log) => log.stress)) : 0;

  if (trigger && eveningCount / panicEpisodes.length >= 0.5) {
    return `Recent panic episodes cluster around ${trigger.toLowerCase()} and tend to surface later in the day, which may mean the pressure is building quietly before it breaks through.`;
  }

  if (trigger && stressAverage >= 7) {
    return `Panic episodes are lining up most with ${trigger.toLowerCase()} on higher-stress days, which may make overall stress load an important early warning sign.`;
  }

  if (trigger) {
    return `Your panic logs already suggest ${trigger.toLowerCase()} is one of the clearest drivers, which starts to make these episodes feel more trackable and less random.`;
  }

  return null;
}

export function generateLearningProfile({
  moodLogs,
  journalEntries,
  sessionSummaries,
  accountMemory
}: {
  moodLogs: MoodLog[];
  journalEntries: JournalEntry[];
  sessionSummaries: SessionSummary[];
  accountMemory: AccountMemory | null;
}): LearningCard[] {
  const thinkingStyle = deriveThinkingStyle(journalEntries, sessionSummaries);
  const stressDrivers = deriveStressDrivers(journalEntries, sessionSummaries, accountMemory);
  const regulationStyle = deriveRegulationStyle(journalEntries, moodLogs);
  const recoveryPattern = deriveRecoveryPattern(moodLogs, journalEntries, accountMemory);

  return [
    {
      title: "Thinking style",
      value: thinkingStyle.value,
      confidence: thinkingStyle.confidence,
      basis: thinkingStyle.basis
    },
    {
      title: "Primary stress drivers",
      value: stressDrivers.value,
      confidence: stressDrivers.confidence,
      basis: stressDrivers.basis
    },
    {
      title: "Emotional regulation style",
      value: regulationStyle.value,
      confidence: regulationStyle.confidence,
      basis: regulationStyle.basis
    },
    {
      title: "Recovery pattern",
      value: recoveryPattern.value,
      confidence: recoveryPattern.confidence,
      basis: recoveryPattern.basis
    }
  ];
}

function deriveThinkingStyle(journalEntries: JournalEntry[], sessionSummaries: SessionSummary[]) {
  const distortions = mostCommon(journalEntries.flatMap((entry) => entry.emotionalAnalysis?.distortions ?? []), 2);
  const reflectiveTone = journalEntries.filter((entry) => /reflect/i.test(entry.emotionalAnalysis?.tone ?? "")).length;

  if (distortions.includes("mind reading") || distortions.includes("what-if thinking")) {
    return {
      value: "Reflective and analytical, with a tendency to think ahead when uncertainty rises.",
      confidence: journalEntries.length >= 4 ? "High confidence" as const : "Medium confidence" as const,
      basis: `Based on ${journalEntries.length} journal ${journalEntries.length === 1 ? "entry" : "entries"} and recent cognitive patterns.`
    };
  }

  if (reflectiveTone || sessionSummaries.length >= 2) {
    return {
      value: "Reflective and analytical",
      confidence: "Medium confidence" as const,
      basis: `Based on ${journalEntries.length} journal entries and ${sessionSummaries.length} support sessions.`
    };
  }

  return {
    value: "Reflective and analytical",
    confidence: "Low confidence" as const,
    basis: "Provisional read based on early journal and support data."
  };
}

function deriveStressDrivers(journalEntries: JournalEntry[], sessionSummaries: SessionSummary[], accountMemory: AccountMemory | null) {
  const trigger = mostCommon(
    [
      ...journalEntries.flatMap((entry) => entry.emotionalAnalysis?.triggers ?? []),
      ...sessionSummaries.flatMap((summary) => summary.possibleTriggers ?? []),
      ...(accountMemory?.commonTriggers ?? [])
    ],
    1
  )[0];

  if (trigger) {
    return {
      value: `${capitalize(trigger)} may be an early stress driver.`,
      confidence: "Medium confidence" as const,
      basis: "Based on journaling themes, support-session triggers, and account memory."
    };
  }

  return {
    value: "Work pressure may be an early stress driver.",
    confidence: "Low confidence" as const,
    basis: "Provisional read based on onboarding and limited early data."
  };
}

function deriveRegulationStyle(journalEntries: JournalEntry[], moodLogs: MoodLog[]) {
  if (journalEntries.length >= 2) {
    return {
      value: "Journaling sounds more reflective than reactive, which may mean you process feelings internally first.",
      confidence: journalEntries.length >= 4 ? "High confidence" as const : "Medium confidence" as const,
      basis: `Based on ${journalEntries.length} journal ${journalEntries.length === 1 ? "entry" : "entries"}.`
    };
  }

  if (moodLogs.length >= 3) {
    return {
      value: "Internal processing before sharing",
      confidence: "Low confidence" as const,
      basis: `Based on ${moodLogs.length} mood logs and limited written reflection.`
    };
  }

  return {
    value: "Internal processing before sharing",
    confidence: "Low confidence" as const,
    basis: "Provisional read from very early account activity."
  };
}

function deriveRecoveryPattern(moodLogs: MoodLog[], journalEntries: JournalEntry[], accountMemory: AccountMemory | null) {
  const lowSleep = moodLogs.filter((log) => log.sleepQuality < 6);
  const steadySleep = moodLogs.filter((log) => log.sleepQuality >= 6);

  if (lowSleep.length && steadySleep.length && average(lowSleep.map((log) => log.anxietyLevel)) > average(steadySleep.map((log) => log.anxietyLevel))) {
    return {
      value: "Sleep inconsistency may be amplifying anxiety on higher-stress days.",
      confidence: moodLogs.length >= 6 ? "High confidence" as const : "Medium confidence" as const,
      basis: `Based on sleep and anxiety patterns across ${moodLogs.length} mood logs.`
    };
  }

  if (journalEntries.length >= 2) {
    return {
      value: "Journaling may support emotional regulation.",
      confidence: "Medium confidence" as const,
      basis: `Based on ${journalEntries.length} journal entries and early recovery signals.`
    };
  }

  return {
    value: accountMemory?.goals.length ? "Recovery patterns are still forming, but reflective check-ins may help." : "Journaling may support emotional regulation.",
    confidence: "Low confidence" as const,
    basis: "Provisional read based on limited recovery data."
  };
}

function getDefaultCategory(insightType: Insight["insightType"]): Insight["category"] {
  switch (insightType) {
    case "timing":
    case "trigger":
      return "Stress pattern";
    case "correlation":
      return "Sleep correlation";
    case "distortion":
      return "Cognitive habit";
    case "progress":
      return "Recovery signal";
    case "theme":
      return "Emotional style";
    case "starter":
    default:
      return "Emotional style";
  }
}

function triggerSourcesCount(journalEntries: JournalEntry[], sessionSummaries: SessionSummary[], accountMemory: AccountMemory | null) {
  return (
    journalEntries.flatMap((entry) => entry.emotionalAnalysis?.triggers ?? []).length +
    sessionSummaries.flatMap((summary) => summary.possibleTriggers).length +
    (accountMemory?.commonTriggers.length ?? 0)
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function generatePanicPatternMap({
  panicEpisodes,
  moodLogs,
  sessionSummaries
}: {
  panicEpisodes: PanicEpisode[];
  moodLogs: MoodLog[];
  sessionSummaries?: SessionSummary[];
}) {
  if (!panicEpisodes.length) {
    return getEarlyPanicPatternMap(moodLogs, sessionSummaries ?? []);
  }

  const topTrigger = getTopCategory(panicEpisodes.map((episode) => episode.trigger));
  const topLocation = getTopCategory(panicEpisodes.map((episode) => episode.location));
  const timeBuckets = getTopCategory(panicEpisodes.map((episode) => getTimeBucket(episode.createdAt)));
  const recoveryTrend = getRecoveryTrend(panicEpisodes, moodLogs);
  const sleepStressCorrelation = getPanicSleepStressCorrelation(panicEpisodes, moodLogs);

  return {
    mostCommonTrigger: topTrigger?.label ?? "Your system needs a few more SOS check-ins to confirm your most common trigger.",
    triggerShare: topTrigger?.share ?? null,
    triggerConfidence: panicEpisodes.length >= 3 ? "Medium confidence" : "Low confidence",
    triggerDetail: topTrigger?.share
      ? `${topTrigger.share}% of logged panic episodes point back to this trigger.`
      : "Your system needs a few more SOS check-ins to confirm your most common trigger.",
    mostCommonTime: timeBuckets?.label ?? "Timing patterns will appear once more SOS sessions are logged.",
    timeConfidence: panicEpisodes.length >= 3 ? "Medium confidence" : "Low confidence",
    timeDetail: timeBuckets?.share
      ? `${timeBuckets.share}% of panic check-ins are clustering around this time window.`
      : "Timing patterns will appear once more SOS sessions are logged.",
    mostCommonLocation: topLocation?.label ?? "Environment patterns will sharpen once more SOS sessions are logged.",
    locationShare: topLocation?.share ?? null,
    locationConfidence: panicEpisodes.length >= 3 ? "Medium confidence" : "Low confidence",
    locationDetail: topLocation?.share
      ? `${topLocation.share}% of logged panic episodes started in this setting.`
      : "Environment patterns will sharpen once more SOS sessions are logged.",
    recoveryTrend,
    recoveryConfidence: panicEpisodes.length >= 2 ? "Medium confidence" : "Low confidence",
    sleepStressCorrelation
  };
}

export function generateMirrorInsightDrafts({
  moodLogs,
  journalEntries,
  sessionSummaries,
  accountMemory
}: {
  moodLogs: MoodLog[];
  journalEntries: JournalEntry[];
  sessionSummaries: SessionSummary[];
  accountMemory: AccountMemory | null;
}): Array<Pick<MirrorInsight, "observation">> {
  const drafts: Array<Pick<MirrorInsight, "observation">> = [];

  const journalTone = journalEntries.map((entry) => entry.emotionalAnalysis?.tone).filter(Boolean);
  const triggers = mostCommon(journalEntries.flatMap((entry) => entry.emotionalAnalysis?.triggers ?? []), 2);
  const recurringIssues = mostCommon(
    [...sessionSummaries.flatMap((summary) => summary.recurringIssues), ...(accountMemory?.recurringIssues ?? [])],
    2
  );

  if (recurringIssues[0]) {
    drafts.push({
      observation: `You seem to return to ${recurringIssues[0].toLowerCase()} even after the moment passes, which suggests it is becoming a repeated emotional loop.`
    });
  }

  if (triggers[0]) {
    drafts.push({
      observation: `Your notes keep pointing back to ${triggers[0].toLowerCase()}, so that may matter more than the story your mind tells afterward.`
    });
  }

  if (journalTone.some((tone) => /what if|worried|concerned|anxious/i.test(tone ?? ""))) {
    drafts.push({
      observation: "Your writing often carries anticipatory tension, as if your mind starts preparing for the next problem before it arrives."
    });
  }

  const lowSleepDays = moodLogs.filter((log) => log.sleepQuality < 6);
  const betterSleepDays = moodLogs.filter((log) => log.sleepQuality >= 6);
  if (lowSleepDays.length && betterSleepDays.length) {
    const lowSleepAnxiety = average(lowSleepDays.map((log) => log.anxietyLevel));
    const betterSleepAnxiety = average(betterSleepDays.map((log) => log.anxietyLevel));
    if (lowSleepAnxiety > betterSleepAnxiety + 1) {
      drafts.push({
        observation: "When sleep drops, your anxiety seems to get louder, which means exhaustion may be amplifying the emotional story."
      });
    }
  }

  if (accountMemory?.goals.length && accountMemory?.commonTriggers.length) {
    drafts.push({
      observation: `You want ${accountMemory.goals[0].toLowerCase()}, but your system keeps getting pulled back by ${accountMemory.commonTriggers[0].toLowerCase()}.`
    });
  }

  return drafts.slice(0, 3);
}

function getTopCategory(values: string[]) {
  if (!values.length) return null;
  const counts = new Map<string, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const [label, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return {
    label,
    share: Math.round((count / values.length) * 100)
  };
}

function getTimeBucket(createdAt: string) {
  const hour = new Date(createdAt).getHours();
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 22) return "Late evening";
  return "Night";
}

function getRecoveryTrend(panicEpisodes: PanicEpisode[], moodLogs: MoodLog[]) {
  const scores = {
    "1-5 minutes": 1,
    "5-10 minutes": 2,
    "10-20 minutes": 3,
    "20+ minutes": 4
  } as const;

  const ordered = [...panicEpisodes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  if (ordered.length < 2) {
    const single = ordered[0]?.recoveryTime;
    if (!single) return "Recovery patterns will become clearer after a few more SOS sessions.";
    return `Average recovery trend: ${single}`;
  }

  const midpoint = Math.ceil(ordered.length / 2);
  const early = ordered.slice(0, midpoint).map((episode) => scores[episode.recoveryTime]);
  const recent = ordered.slice(midpoint).map((episode) => scores[episode.recoveryTime]);

  const linkedLogs = linkPanicEpisodesToMoodLogs(panicEpisodes, moodLogs);
  const avgSleep = linkedLogs.length ? average(linkedLogs.map((log) => log.sleepQuality)) : null;

  if (average(recent) < average(early)) {
    return avgSleep !== null && avgSleep < 6
      ? "Average recovery trend: improving, though lower-sleep days may still slow recovery."
      : "Average recovery trend: improving. Panic seems to be settling faster over recent check-ins.";
  }
  if (average(recent) > average(early)) {
    return avgSleep !== null && avgSleep < 6
      ? "Recovery may be slower after poor sleep, and recent episodes are taking longer to settle."
      : "Average recovery trend: getting slower. Your system may be taking longer to come back down after activation.";
  }
  return "Average recovery trend: holding fairly steady across recent SOS check-ins.";
}

function getPanicSleepStressCorrelation(panicEpisodes: PanicEpisode[], moodLogs: MoodLog[]) {
  if (!panicEpisodes.length || !moodLogs.length) return null;
  const linkedLogs = linkPanicEpisodesToMoodLogs(panicEpisodes, moodLogs);

  if (!linkedLogs.length) return null;

  const avgSleep = average(linkedLogs.map((log) => log.sleepQuality));
  const avgStress = average(linkedLogs.map((log) => log.stress));

  if (avgSleep < 6 && avgStress >= 7) {
    return "Panic episodes tend to happen on lower-sleep, higher-stress days.";
  }
  if (avgSleep < 6) {
    return "Panic episodes are often landing on low-sleep days.";
  }
  if (avgStress >= 7) {
    return "Panic episodes are often landing on high-stress days.";
  }

  return "Your panic episodes do not yet show a strong sleep or stress correlation.";
}

function getEarlyPanicPatternMap(moodLogs: MoodLog[], sessionSummaries: SessionSummary[]) {
  const eveningStressLogs = moodLogs.filter((log) => {
    const hour = new Date(log.createdAt).getHours();
    return (hour >= 17 || hour < 2) && log.stress >= 7;
  });
  const lowSleepStressLogs = moodLogs.filter((log) => log.sleepQuality < 6 && log.stress >= 7);
  const likelyIssue = mostCommon(sessionSummaries.flatMap((summary) => summary.possibleTriggers ?? summary.recurringIssues ?? []), 1)[0];

  return {
    mostCommonTrigger: likelyIssue
      ? `${capitalize(likelyIssue)} may be an early panic trigger.`
      : "Your system needs a few more SOS check-ins to confirm your most common trigger.",
    triggerShare: null,
    triggerConfidence: "Low confidence" as const,
    triggerDetail: likelyIssue
      ? "Early signal from recent support sessions rather than confirmed SOS history."
      : "A few SOS check-ins will make this pattern much more trustworthy.",
    mostCommonTime: eveningStressLogs.length
      ? "Later in the day may be a vulnerable window."
      : "Timing patterns will appear once more SOS sessions are logged.",
    timeConfidence: "Low confidence" as const,
    timeDetail: eveningStressLogs.length
      ? `Early signal from ${eveningStressLogs.length} higher-stress ${eveningStressLogs.length === 1 ? "log" : "logs"} later in the day.`
      : "Timing patterns will appear once more SOS sessions are logged.",
    mostCommonLocation: "Environment patterns need more SOS data.",
    locationShare: null,
    locationConfidence: "Low confidence" as const,
    locationDetail: "Location patterns become readable only after a few panic check-ins are logged.",
    recoveryTrend: lowSleepStressLogs.length
      ? "Recovery may be slower after poor sleep on higher-stress days."
      : "Early signs suggest panic may cluster after higher-stress days.",
    recoveryConfidence: "Low confidence" as const,
    sleepStressCorrelation: lowSleepStressLogs.length
      ? "Early signs suggest panic may cluster after lower-sleep, higher-stress days."
      : "A few SOS check-ins will let the system test whether stress and sleep are shaping panic intensity."
  };
}

function linkPanicEpisodesToMoodLogs(panicEpisodes: PanicEpisode[], moodLogs: MoodLog[]) {
  const latestStressByDay = new Map<string, MoodLog>();
  for (const log of moodLogs) {
    const dayKey = new Date(log.createdAt).toISOString().slice(0, 10);
    if (!latestStressByDay.has(dayKey)) {
      latestStressByDay.set(dayKey, log);
    }
  }

  return panicEpisodes
    .map((episode) => latestStressByDay.get(new Date(episode.createdAt).toISOString().slice(0, 10)))
    .filter((log): log is MoodLog => Boolean(log));
}
