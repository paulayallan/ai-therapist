import { demoAccountMemory, demoJournalEntries, demoMentalProfile, demoMoodLogs, demoPanicEpisodes, demoSessionSummaries } from "@/lib/demo-data";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { generateThinkingProfile } from "@/lib/thinking-profile";
import type { AccountMemory, JournalEntry, MentalProfile, MoodLog, PanicEpisode, PersonalizedTool, SavedTool, SessionSummary, Subscription, ToolTier } from "@/lib/types";
import { average } from "@/lib/utils";

type ToolDefinition = {
  id: string;
  title: string;
  tier: ToolTier;
  tag: string;
  estimatedTime: string;
  description: string;
  steps: string[];
  weights: Partial<Record<ToolSignalKey, number>>;
  reasons: Partial<Record<ToolSignalKey, { label: string; text: string }>>;
  defaultReason: {
    label: string;
    text: string;
  };
};

type ToolSignals = ReturnType<typeof deriveToolSignals>;
type ToolSignalKey = keyof ToolSignals;

const TOOL_LIBRARY: ToolDefinition[] = [
  {
    id: "long-exhale-breathing",
    title: "Long exhale breathing",
    tier: "free",
    tag: "Anxiety spikes",
    estimatedTime: "2 min",
    description: "A quick downshift when your chest feels tight and your nervous system needs a slower rhythm.",
    steps: ["Inhale for 4.", "Exhale softly for 6.", "Repeat for 8 rounds.", "Let the exhale stay easy rather than forceful."],
    weights: { panicPattern: 6, highAnxiety: 5, bodilyStress: 4 },
    reasons: {
      panicPattern: {
        label: "Based on recent SOS patterns",
        text: "Chosen because your recent SOS check-ins suggest fast activation and a need for immediate nervous-system downshifting."
      },
      highAnxiety: {
        label: "Based on recent anxiety patterns",
        text: "Recent anxiety logs suggest your system may settle faster when the breath gets longer on the exhale."
      },
      bodilyStress: {
        label: "Held in the body",
        text: "Recent signals suggest stress may be landing physically, which makes breath work especially useful this week."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A steady first-line tool when your system needs a simple way back to center."
    }
  },
  {
    id: "five-four-three-two-one",
    title: "5-4-3-2-1 grounding",
    tier: "free",
    tag: "Overwhelm",
    estimatedTime: "3 min",
    description: "A sensory grounding reset when thoughts are moving too fast and your attention needs something concrete.",
    steps: ["Name 5 things you can see.", "Name 4 things you can feel.", "Name 3 things you can hear.", "Name 2 things you can smell.", "Name 1 thing you can taste."],
    weights: { panicPattern: 5, overthinking: 5, socialStress: 3 },
    reasons: {
      panicPattern: {
        label: "Based on recent SOS patterns",
        text: "Your system is noticing moments where grounding could interrupt a fast escalation before it turns into full panic."
      },
      overthinking: {
        label: "Good for overthinking",
        text: "Useful when overthinking loops start to build and your attention needs help returning to the present."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A reliable reset when your mind needs something concrete and sensory."
    }
  },
  {
    id: "body-scan-reset",
    title: "Body scan reset",
    tier: "free",
    tag: "Body-held stress",
    estimatedTime: "4 min",
    description: "A gentle scan for the days when your mind seems functional but your body is still carrying the strain.",
    steps: ["Start at your forehead.", "Move slowly through jaw, shoulders, chest, stomach, hips, and legs.", "Notice where tension is held.", "Soften each area on the exhale."],
    weights: { bodilyStress: 6, workStress: 4, poorSleep: 3 },
    reasons: {
      bodilyStress: {
        label: "Chosen for body stress",
        text: "Recent entries suggest stress may be getting stored in the body before it becomes fully conscious."
      },
      workStress: {
        label: "Based on recent stress",
        text: "Chosen because recent work-related strain may be lingering physically after the day ends."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A useful reset when your body seems to be carrying more than your words are."
    }
  },
  {
    id: "thought-check",
    title: "Thought check",
    tier: "free",
    tag: "Overthinking loops",
    estimatedTime: "2 min",
    description: "A quick cognitive reset for catching mind-reading, catastrophizing, and certainty loops earlier.",
    steps: ["Name the thought clearly.", "Ask what evidence supports it.", "Ask what evidence weakens it.", "Write one more balanced possibility."],
    weights: { overthinking: 6, relationshipStress: 3, workStress: 3 },
    reasons: {
      overthinking: {
        label: "Good for overthinking",
        text: "Recent patterns suggest your mind can move into prediction loops quickly, especially when uncertainty is still unresolved."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A short reset when your mind needs less certainty and more balance."
    }
  },
  {
    id: "quick-sensory-reset",
    title: "Quick sensory reset",
    tier: "free",
    tag: "Fast reset",
    estimatedTime: "2 min",
    description: "A fast grounding tool for the moments when you need something brief, physical, and immediately usable.",
    steps: ["Place both feet on the floor.", "Name one sensation in your hands, jaw, chest, and stomach.", "Loosen your jaw and shoulders.", "Take one slower breath before moving on."],
    weights: { highStress: 5, panicPattern: 4, socialStress: 3 },
    reasons: {
      highStress: {
        label: "Based on recent stress",
        text: "Recent signals suggest you may benefit from a short reset that does not require much mental effort."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A light-touch regulation tool for the moments when you need something fast and usable."
    }
  },
  {
    id: "work-decompression-reset",
    title: "Work decompression reset",
    tier: "pro",
    tag: "Work pressure",
    estimatedTime: "5 min",
    description: "A transition tool for helping work stress stop following you into the rest of the day.",
    steps: ["Name the sharpest pressure from the day.", "Name what is still unresolved and what can wait.", "Loosen shoulders and jaw.", "Choose one sentence to mentally end the workday."],
    weights: { workStress: 7, eveningStress: 4, burnoutPattern: 3 },
    reasons: {
      workStress: {
        label: "Based on work pressure",
        text: "Recent entries suggest work pressure may be one of the stronger stress drivers in your week."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A useful bridge when your system needs help ending the workday instead of carrying it forward."
    }
  },
  {
    id: "sleep-wind-down-ritual",
    title: "Sleep wind-down ritual",
    tier: "pro",
    tag: "Poor sleep nights",
    estimatedTime: "8 min",
    description: "A structured evening reset when tension is still active late in the day and sleep is becoming less reliable.",
    steps: ["Dim the room or screen brightness.", "Write down the unfinished thought that keeps returning.", "Take 6 long exhales.", "Choose one sentence to revisit tomorrow instead of tonight."],
    weights: { poorSleep: 7, eveningStress: 5, highAnxiety: 3 },
    reasons: {
      poorSleep: {
        label: "Based on sleep instability",
        text: "Sleep inconsistency may be amplifying anxiety on higher-stress days, which makes an evening reset more relevant right now."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A calmer evening structure when your system needs a clearer landing before sleep."
    }
  },
  {
    id: "cognitive-reframing-sequence",
    title: "Cognitive reframing sequence",
    tier: "pro",
    tag: "Stress interpretation",
    estimatedTime: "6 min",
    description: "A deeper thought reframing sequence for the patterns that keep coming back even after you notice them.",
    steps: ["Write the interpretation that feels most true.", "Name the emotional cost of holding it tightly.", "Write two alternative readings.", "Choose the one that feels most grounded, not most soothing."],
    weights: { overthinking: 6, workStress: 4, relationshipStress: 4 },
    reasons: {
      overthinking: {
        label: "Chosen for recurring loops",
        text: "Recent signals suggest the same interpretation loops may be reappearing, which makes a fuller reframing sequence useful."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A deeper reset when a surface reframe no longer feels like enough."
    }
  },
  {
    id: "emotional-naming-practice",
    title: "Emotional naming practice",
    tier: "pro",
    tag: "Internal processing",
    estimatedTime: "4 min",
    description: "A short practice for turning vague internal tension into clearer emotional language.",
    steps: ["Name the emotion that seems closest.", "Name what is underneath it.", "Name what the emotion may be trying to protect.", "Write one honest sentence without softening it."],
    weights: { internalProcessing: 6, lowData: 2, relationshipStress: 2 },
    reasons: {
      internalProcessing: {
        label: "Based on recent entries",
        text: "Your journaling sounds more reflective than reactive, which may mean you process feelings internally first."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A helpful tool when your system knows something is there before you have words for it."
    }
  },
  {
    id: "post-conflict-regulation-reset",
    title: "Post-conflict regulation reset",
    tier: "pro",
    tag: "After difficult interactions",
    estimatedTime: "7 min",
    description: "A regulation sequence for the after-effects of tense conversations, mixed signals, or interpersonal friction.",
    steps: ["Name what interaction is still echoing.", "Separate what happened from what you fear it means.", "Regulate the body with one long exhale cycle.", "Choose whether the next step is pause, repair, or boundary."],
    weights: { relationshipStress: 6, socialStress: 5, rejectionSensitivity: 3 },
    reasons: {
      relationshipStress: {
        label: "Based on relationship strain",
        text: "Recent support sessions suggest relational stress may be taking longer to leave your system once the interaction ends."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A steadier reset after social or relational friction has lingered longer than you wanted."
    }
  },
  {
    id: "personalized-panic-interruption-flow",
    title: "Personalized panic interruption flow",
    tier: "premium",
    tag: "Panic interruption",
    estimatedTime: "6 min",
    description: "A higher-touch interruption flow for panic patterns that seem to arrive fast and hit physically.",
    steps: ["Name the first physical cue you notice.", "Use one minute of long exhale breathing.", "Shift into grounding with 3 sensory anchors.", "Choose one reassuring sentence that feels believable.", "Re-check your body after 90 seconds."],
    weights: { panicPattern: 8, bodilyStress: 4, poorSleep: 2 },
    reasons: {
      panicPattern: {
        label: "Based on SOS history",
        text: "Your recent SOS history suggests a more structured interruption flow may fit better than a single standalone tool."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A deeper panic reset when activation tends to rise quickly and needs a fuller sequence."
    }
  },
  {
    id: "relationship-trigger-recovery-tool",
    title: "Relationship trigger recovery tool",
    tier: "premium",
    tag: "Relationship triggers",
    estimatedTime: "8 min",
    description: "A more personal reset for relational tension, mixed signals, or feeling emotionally flooded after contact.",
    steps: ["Name the moment that triggered the reaction.", "Separate fact from interpretation.", "Notice what part of you feels most activated.", "Write what would feel grounding before any reply or decision."],
    weights: { relationshipStress: 7, rejectionSensitivity: 5, internalProcessing: 2 },
    reasons: {
      relationshipStress: {
        label: "Based on recent support sessions",
        text: "Recent signals suggest relationship uncertainty may be one of the places your system holds stress longest."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A calmer recovery tool when relational stress is taking up more space than usual."
    }
  },
  {
    id: "sunday-night-anxiety-reset",
    title: "Sunday-night anxiety reset",
    tier: "premium",
    tag: "Evening anticipation",
    estimatedTime: "7 min",
    description: "A weekly reset for anticipatory anxiety that starts before the pressure has even arrived.",
    steps: ["Name the week-ahead thought that is pulling hardest.", "Sort what is real, what is possible, and what is imagined.", "Write one first step for tomorrow.", "Close with an evening grounding cue."],
    weights: { sundayStress: 8, workStress: 5, poorSleep: 2 },
    reasons: {
      sundayStress: {
        label: "Based on timing patterns",
        text: "Your system is noticing a pattern where stress may rise before the week begins, not only once it is underway."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A useful weekly reset when anticipatory pressure tends to gather before Monday."
    }
  },
  {
    id: "burnout-prevention-reset",
    title: "Burnout prevention reset",
    tier: "premium",
    tag: "Burnout strain",
    estimatedTime: "9 min",
    description: "A deeper pause for the weeks when pressure, low recovery, and responsibility are stacking together.",
    steps: ["Name what has felt relentless lately.", "Notice what is depleted: body, focus, patience, or hope.", "Reduce one demand for the next 24 hours.", "Choose one act of nervous-system recovery before sleep."],
    weights: { burnoutPattern: 8, workStress: 5, poorSleep: 4 },
    reasons: {
      burnoutPattern: {
        label: "Based on recent strain",
        text: "Recent patterns suggest stress may be staying active long enough to affect recovery, which can be an early burnout signal."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A deeper reset when pressure seems to be outlasting your current recovery window."
    }
  },
  {
    id: "shame-spiral-interrupt",
    title: "Shame spiral interrupt",
    tier: "premium",
    tag: "Internal criticism",
    estimatedTime: "5 min",
    description: "A guided interruption for the moments when self-criticism becomes harsher than the situation itself.",
    steps: ["Name the harshest sentence your mind is repeating.", "Ask what mistake or fear it is trying to contain.", "Write the same truth without punishment.", "Choose one humane next step."],
    weights: { shameSensitivity: 7, rejectionSensitivity: 4, overthinking: 3 },
    reasons: {
      shameSensitivity: {
        label: "Based on recent entries",
        text: "Recent signals suggest internal pressure may be turning stressful moments into self-critical spirals."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A stronger interruption when the inner voice becomes harsher than the actual event."
    }
  },
  {
    id: "social-overthinking-reset",
    title: "Social overthinking reset",
    tier: "premium",
    tag: "Social replay",
    estimatedTime: "6 min",
    description: "A reset for replaying conversations, tone, and what someone might have meant after the moment has passed.",
    steps: ["Write the social moment you keep replaying.", "Name what you know versus what you are inferring.", "Name the feeling underneath the replay.", "Choose whether closure is needed or whether the loop needs release."],
    weights: { socialStress: 7, overthinking: 6, relationshipStress: 3 },
    reasons: {
      socialStress: {
        label: "Based on social patterning",
        text: "Recent patterns suggest social moments may be lingering longer than the interaction itself."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A useful reset when social interpretation keeps extending the life of a stressful moment."
    }
  },
  {
    id: "decision-overload-clarity-tool",
    title: "Decision overload clarity tool",
    tier: "premium",
    tag: "Too many variables",
    estimatedTime: "7 min",
    description: "A structure for when too many possible outcomes make even a small decision feel heavy.",
    steps: ["Name the decision in one sentence.", "List the two most real fears attached to it.", "List the two most realistic next options.", "Choose the next smallest decision, not the final one."],
    weights: { decisionFatigue: 7, overthinking: 5, workStress: 2 },
    reasons: {
      decisionFatigue: {
        label: "Based on current overload",
        text: "An early read suggests your system may be carrying decision pressure alongside the emotional load, which makes clarity work more useful."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A steadier structure for when mental load is making decisions feel heavier than usual."
    }
  },
  {
    id: "rejection-sensitivity-reset",
    title: "Rejection sensitivity reset",
    tier: "premium",
    tag: "Interpretation spikes",
    estimatedTime: "6 min",
    description: "A recovery tool for when ambiguity or distance quickly starts to feel personal.",
    steps: ["Name the cue that felt rejecting.", "Describe what happened without interpretation.", "Name the fear it touched.", "Choose one grounding truth that keeps the story open."],
    weights: { rejectionSensitivity: 7, relationshipStress: 5, socialStress: 4 },
    reasons: {
      rejectionSensitivity: {
        label: "Based on recent ambiguity",
        text: "Recent signals suggest ambiguous interactions may be landing with more emotional intensity than they first appear to."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A gentle reset for the moments when distance or uncertainty starts to feel personal quickly."
    }
  },
  {
    id: "high-stress-workday-recovery",
    title: "High-stress workday recovery",
    tier: "premium",
    tag: "Post-pressure recovery",
    estimatedTime: "10 min",
    description: "A deeper decompression sequence for the days when work pressure keeps running even after the day ends.",
    steps: ["Name the part of the day your body is still holding.", "Do one minute of breath downshifting.", "Write the thought you keep carrying home.", "Choose one boundary for tonight."],
    weights: { workStress: 8, burnoutPattern: 4, poorSleep: 3 },
    reasons: {
      workStress: {
        label: "Based on work strain",
        text: "Recent entries suggest work stress may be following you beyond the moment, which makes recovery work more important than just getting through."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A stronger end-of-day recovery tool when work pressure seems slow to leave the body."
    }
  },
  {
    id: "self-soothing-sequence",
    title: "Self-soothing sequence",
    tier: "premium",
    tag: "Personalized regulation",
    estimatedTime: "7 min",
    description: "A profile-informed regulation sequence for the moments when your system needs comfort more than analysis.",
    steps: ["Name what feels most tender right now.", "Choose one sensory comfort cue.", "Add one sentence of reassurance that feels believable.", "Stay with the softer state for one minute before moving on."],
    weights: { internalProcessing: 5, lowMood: 5, poorSleep: 3, bodilyStress: 2 },
    reasons: {
      internalProcessing: {
        label: "Based on your profile",
        text: "Your system is noticing that you often process internally first, which makes a softer, less cognitive regulation tool worth surfacing this week."
      }
    },
    defaultReason: {
      label: "Recommended this week",
      text: "A gentler sequence when your system needs soothing rather than solving."
    }
  }
];

export async function getWeeklyPersonalizedTools({
  userId
}: {
  userId: string;
}): Promise<PersonalizedTool[]> {
  const weekStart = getWeekStart();
  const supabase = await createSupabaseServerClient();

  const [moodLogs, journalEntries, sessionSummaries, panicEpisodes, accountMemory, mentalProfile] = await Promise.all([
    getToolMoodLogs(userId),
    getToolJournalEntries(userId),
    getToolSessionSummaries(userId),
    getToolPanicEpisodes(userId),
    getToolAccountMemory(userId),
    getToolMentalProfile(userId)
  ]);

  const thinkingProfile = generateThinkingProfile({
    moodLogs,
    journalEntries,
    sessionSummaries,
    panicEpisodes,
    accountMemory
  });

  const recommendations = buildRecommendations({
    moodLogs,
    journalEntries,
    sessionSummaries,
    panicEpisodes,
    accountMemory,
    mentalProfile,
    thinkingProfile,
    weekStart
  });

  if (!supabase || userId === "demo-user") {
    return recommendations;
  }

  const { data: existing, error: existingError } = await supabase
    .from("tool_recommendations")
    .select("*")
    .eq("user_id", userId)
    .eq("week_start", weekStart)
    .order("rank", { ascending: true });

  if (!existingError && existing && existing.length === TOOL_LIBRARY.length) {
    return mergeRecommendationRows(existing);
  }

  const payload = recommendations.map((tool, index) => ({
    user_id: userId,
    week_start: weekStart,
    tool_id: tool.id,
    tier: tool.tier,
    rank: index + 1,
    relevance_label: tool.relevanceLabel,
    why_recommended: tool.whyRecommended,
    trigger_label: tool.tag,
    score: tool.score
  }));

  const { error } = await supabase.from("tool_recommendations").upsert(payload, {
    onConflict: "user_id,week_start,tool_id"
  });

  if (error) {
    return recommendations;
  }

  return recommendations;
}

export async function getSavedTools({
  userId
}: {
  userId: string;
}): Promise<SavedTool[]> {
  const supabase = await createSupabaseServerClient();
  if (!supabase || userId === "demo-user") {
    return [];
  }

  const { data, error } = await supabase
    .from("saved_tools")
    .select("tool_id,saved_at")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    toolId: row.tool_id,
    savedAt: row.saved_at
  }));
}

export function getToolsByTier(tools: PersonalizedTool[], tier: ToolTier) {
  return tools.filter((tool) => tool.tier === tier);
}

export function hasTierAccess(subscription: Subscription, tier: ToolTier) {
  if (tier === "free") return true;
  if (tier === "pro") return subscription.plan === "pro" || subscription.plan === "premium";
  return subscription.plan === "premium";
}

export function getToolDefinition(toolId: string) {
  return TOOL_LIBRARY.find((tool) => tool.id === toolId) ?? null;
}

function mergeRecommendationRows(rows: Array<Record<string, unknown>>) {
  return rows
    .map((row) => {
      const definition = getToolDefinition(String(row.tool_id));
      if (!definition) return null;

      return {
        id: definition.id,
        title: definition.title,
        tier: definition.tier,
        tag: String(row.trigger_label ?? definition.tag),
        estimatedTime: definition.estimatedTime,
        description: definition.description,
        relevanceLabel: String(row.relevance_label ?? definition.defaultReason.label),
        whyRecommended: String(row.why_recommended ?? definition.defaultReason.text),
        steps: definition.steps,
        weekStart: String(row.week_start),
        score: Number(row.score ?? 0)
      } satisfies PersonalizedTool;
    })
    .filter(Boolean) as PersonalizedTool[];
}

function buildRecommendations({
  moodLogs,
  journalEntries,
  sessionSummaries,
  panicEpisodes,
  accountMemory,
  mentalProfile,
  thinkingProfile,
  weekStart
}: {
  moodLogs: MoodLog[];
  journalEntries: JournalEntry[];
  sessionSummaries: SessionSummary[];
  panicEpisodes: PanicEpisode[];
  accountMemory: AccountMemory | null;
  mentalProfile: MentalProfile | null;
  thinkingProfile: ReturnType<typeof generateThinkingProfile>;
  weekStart: string;
}) {
  const signals = deriveToolSignals({
    moodLogs,
    journalEntries,
    sessionSummaries,
    panicEpisodes,
    accountMemory,
    mentalProfile,
    thinkingProfile
  });

  return TOOL_LIBRARY.map((tool) => {
    const rankedSignals = Object.entries(tool.weights)
      .map(([key, weight]) => ({
        key: key as ToolSignalKey,
        weight: weight ?? 0,
        value: signals[key as ToolSignalKey]
      }))
      .filter((item) => item.value)
      .sort((a, b) => b.weight - a.weight);

    const topSignal = rankedSignals[0]?.key;
    const topReason = topSignal ? tool.reasons[topSignal] : null;
    const score = rankedSignals.reduce((sum, item) => sum + item.weight, 0) + weekHash(tool.id, weekStart);

    return {
      id: tool.id,
      title: tool.title,
      tier: tool.tier,
      tag: tool.tag,
      estimatedTime: tool.estimatedTime,
      description: tool.description,
      relevanceLabel: topReason?.label ?? tool.defaultReason.label,
      whyRecommended: topReason?.text ?? tool.defaultReason.text,
      steps: tool.steps,
      weekStart,
      score
    } satisfies PersonalizedTool;
  }).sort((a, b) => {
    if (a.tier === b.tier) return b.score - a.score;
    const order = { free: 0, pro: 1, premium: 2 };
    return order[a.tier] - order[b.tier];
  });
}

function deriveToolSignals({
  moodLogs,
  journalEntries,
  sessionSummaries,
  panicEpisodes,
  accountMemory,
  mentalProfile,
  thinkingProfile
}: {
  moodLogs: MoodLog[];
  journalEntries: JournalEntry[];
  sessionSummaries: SessionSummary[];
  panicEpisodes: PanicEpisode[];
  accountMemory: AccountMemory | null;
  mentalProfile: MentalProfile | null;
  thinkingProfile: ReturnType<typeof generateThinkingProfile>;
}) {
  const combinedText = [
    ...journalEntries.map((entry) => entry.textContent),
    ...sessionSummaries.map((summary) => summary.mainIssue),
    ...sessionSummaries.map((summary) => summary.summaryText),
    ...sessionSummaries.flatMap((summary) => summary.possibleTriggers),
    ...(accountMemory?.commonTriggers ?? []),
    ...(accountMemory?.recurringIssues ?? []),
    ...(mentalProfile?.bringsYouHere ?? []),
    ...(mentalProfile?.mainChallenges ?? []),
    ...(mentalProfile?.triggers ?? []),
    ...thinkingProfile.traits,
    thinkingProfile.stressSignature,
    thinkingProfile.emotionalHabits,
    thinkingProfile.recoveryProfile
  ].join(" ");

  const avgAnxiety = average(moodLogs.map((log) => log.anxietyLevel));
  const avgStress = average(moodLogs.map((log) => log.stress));
  const avgMood = average(moodLogs.map((log) => log.mood));
  const avgSleep = average(moodLogs.map((log) => log.sleepQuality));

  const highAnxietyDays = moodLogs.filter((log) => log.anxietyLevel >= 7).length;
  const poorSleepNights = moodLogs.filter((log) => log.sleepQuality < 6).length;
  const highStressLowEnergyDays = moodLogs.filter((log) => log.stress >= 7 && log.energy <= 5).length;
  const lateLogs = moodLogs.filter((log) => getHour(log.createdAt) >= 18).length + panicEpisodes.filter((episode) => getHour(episode.createdAt) >= 18).length;
  const sundaySignals = [...journalEntries.map((entry) => entry.textContent), ...moodLogs.map((log) => log.notes ?? "")].filter((text) => /sunday|monday|week ahead/i.test(text)).length;
  const totalSignals = moodLogs.length + journalEntries.length + sessionSummaries.length + panicEpisodes.length;

  return {
    lowData: totalSignals < 8,
    highAnxiety: avgAnxiety >= 6 || highAnxietyDays >= 2,
    highStress: avgStress >= 6 || highStressLowEnergyDays >= 2,
    lowMood: avgMood > 0 && avgMood <= 5.5,
    poorSleep: avgSleep > 0 && avgSleep < 6.2 || poorSleepNights >= 2,
    eveningStress: lateLogs >= 2,
    overthinking: /(overthink|what-if|mind reading|catastroph|uncertainty|replay|interpretation loop)/i.test(combinedText),
    workStress: /(work|meeting|boss|deadline|performance|career|job|burnout)/i.test(combinedText),
    relationshipStress: /(relationship|partner|text|mixed signals|conflict|attachment|ex\b)/i.test(combinedText),
    socialStress: /(social|people|friend|awkward|conversation|group|what they meant)/i.test(combinedText),
    panicPattern: panicEpisodes.length > 0 || /(panic|pressure in my chest|racing heart|can't breathe)/i.test(combinedText),
    burnoutPattern: highStressLowEnergyDays >= 2 || /(burnout|drained|depleted|exhausted|relentless)/i.test(combinedText),
    bodilyStress: /(tight|chest|body|tense|jaw|shoulders|stomach|held in the body)/i.test(combinedText),
    internalProcessing: /(internally|internally first|quietly|before sharing|process emotions internally|inwardly)/i.test(combinedText),
    rejectionSensitivity: /(rejection|disappointed|distance|replied late|left on read|feedback ambiguity)/i.test(combinedText),
    shameSensitivity: /(ashamed|shame|not enough|self-criticism|critic|embarrassed|guilt)/i.test(combinedText),
    decisionFatigue: /(decision|quit|stay|leave|should i|which path|too many options)/i.test(combinedText),
    sundayStress: sundaySignals >= 1
  };
}

async function getToolMoodLogs(userId: string) {
  if (userId === "demo-user") return demoMoodLogs;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoMoodLogs;

  const { data } = await supabase
    .from("mood_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data ?? []).map((row) => ({
    id: row.id,
    mood: row.mood,
    anxietyLevel: row.anxiety_level,
    energy: row.energy,
    stress: row.stress,
    sleepQuality: row.sleep_quality,
    notes: row.notes,
    createdAt: row.created_at
  }));
}

async function getToolJournalEntries(userId: string) {
  if (userId === "demo-user") return demoJournalEntries;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoJournalEntries;

  const { data } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => ({
    id: row.id,
    textContent: row.text_content,
    voiceUrl: row.voice_url,
    emotionalAnalysis: row.emotional_analysis_json,
    createdAt: row.created_at
  }));
}

async function getToolSessionSummaries(userId: string) {
  if (userId === "demo-user") return demoSessionSummaries;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoSessionSummaries;

  const { data } = await supabase
    .from("session_summaries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  return (data ?? []).map((row) => ({
    id: row.id,
    conversationId: row.conversation_id,
    mainIssue: row.main_issue,
    emotionalState: row.emotional_state,
    possibleTriggers: row.possible_triggers ?? [],
    suggestedFocusArea: row.suggested_focus_area ?? "",
    emotionalThemes: row.emotional_themes ?? [],
    recurringIssues: row.recurring_issues ?? [],
    suggestedNextSteps: row.suggested_next_steps ?? [],
    summaryText: row.summary_text,
    createdAt: row.created_at
  }));
}

async function getToolPanicEpisodes(userId: string) {
  if (userId === "demo-user") return demoPanicEpisodes;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoPanicEpisodes;

  const { data } = await supabase
    .from("panic_episodes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  return (data ?? []).map((row) => ({
    id: row.id,
    trigger: row.trigger,
    location: row.location,
    recoveryTime: row.recovery_time,
    checkIn: row.check_in,
    createdAt: row.created_at
  }));
}

async function getToolAccountMemory(userId: string) {
  if (userId === "demo-user") return demoAccountMemory;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoAccountMemory;

  const { data } = await supabase.from("account_memory").select("*").eq("user_id", userId).maybeSingle();
  if (!data) return null;

  return {
    userId: data.user_id,
    displayName: data.display_name ?? "",
    bringsYouHere: data.brings_you_here ?? [],
    therapistStyle: data.therapist_style ?? "Practical Coach",
    goals: data.goals ?? [],
    emotionalThemes: data.emotional_themes ?? [],
    recurringIssues: data.recurring_issues ?? [],
    commonTriggers: data.common_triggers ?? [],
    memorySummary: data.memory_summary ?? "",
    lastSessionSummary: data.last_session_summary ?? "",
    lastDetectedEmotion: data.last_detected_emotion ?? null,
    lastMood: data.last_mood ?? null,
    lastAnxietyLevel: data.last_anxiety_level ?? null,
    lastStressLevel: data.last_stress_level ?? null,
    lastSleepQuality: data.last_sleep_quality ?? null,
    updatedAt: data.updated_at
  };
}

async function getToolMentalProfile(userId: string) {
  if (userId === "demo-user") return demoMentalProfile;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return demoMentalProfile;

  const { data } = await supabase
    .from("mental_profiles")
    .select("brings_you_here,current_mood,therapist_style,main_challenges,stress_level,sleep_quality,triggers,coping_methods,goals,therapy_experience")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;

  return {
    bringsYouHere: data.brings_you_here ?? [],
    currentMood: data.current_mood ?? 5,
    therapistStyle: data.therapist_style ?? "Practical Coach",
    mainChallenges: data.main_challenges ?? [],
    stressLevel: data.stress_level ?? 5,
    sleepQuality: data.sleep_quality ?? 5,
    triggers: data.triggers ?? [],
    copingMethods: data.coping_methods ?? [],
    goals: data.goals ?? [],
    therapyExperience: data.therapy_experience ?? ""
  };
}

function getWeekStart(date = new Date()) {
  const normalized = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = normalized.getUTCDay();
  const diff = (day + 6) % 7;
  normalized.setUTCDate(normalized.getUTCDate() - diff);
  return normalized.toISOString().slice(0, 10);
}

function getHour(value: string) {
  return new Date(value).getHours();
}

function weekHash(input: string, weekStart: string) {
  const combined = `${input}-${weekStart}`;
  let hash = 0;
  for (let index = 0; index < combined.length; index += 1) {
    hash = (hash * 31 + combined.charCodeAt(index)) % 997;
  }
  return hash / 10000;
}
