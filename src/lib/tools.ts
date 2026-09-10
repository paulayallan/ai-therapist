import type { ToolTier } from "@/lib/types";

/**
 * The regulation library, and the reasoning that decides which tools surface.
 *
 * The important idea, carried over from the live app: a recommendation always
 * says WHY, in terms of the person's own recent data. "Recommended for you"
 * with no reason is what makes an app feel algorithmic instead of personal.
 */

export type ToolCategory = "breath" | "grounding" | "thought" | "recovery" | "evening";

export const TOOL_CATEGORIES: { id: ToolCategory; label: string; blurb: string }[] = [
  { id: "breath", label: "Breath", blurb: "Slow the body down first" },
  { id: "grounding", label: "Grounding", blurb: "Come back to the present" },
  { id: "thought", label: "Thought work", blurb: "Loosen a stuck interpretation" },
  { id: "recovery", label: "Recovery", blurb: "After something hard" },
  { id: "evening", label: "Evening", blurb: "Close the day down" },
];

/** The signals derived from someone's own recent entries. All 0–10. */
export type ToolSignals = {
  panicPattern: number;
  highAnxiety: number;
  poorSleep: number;
  bodilyStress: number;
  overthinking: number;
  workStress: number;
  socialStress: number;
  lowMood: number;
  selfCriticism: number;
  relationshipStrain: number;
};

export type SignalKey = keyof ToolSignals;

export type BreathPattern = {
  inhale: number;
  holdIn: number;
  exhale: number;
  holdOut: number;
  cycles: number;
};

type Reason = { label: string; text: string };

export type Tool = {
  id: string;
  title: string;
  tier: ToolTier;
  category: ToolCategory;
  tag: string;
  minutes: number;
  blurb: string;
  steps: string[];
  weights: Partial<Record<SignalKey, number>>;
  reasons: Partial<Record<SignalKey, Reason>>;
  defaultReason: Reason;
  breath?: BreathPattern;
};

const GENERIC: Reason = {
  label: "In the library",
  text: "A steady option when you want something short and reliable.",
};

export const TOOLS: Tool[] = [
  /* ------------------------------------------------------------- free */
  {
    id: "physiological-sigh",
    title: "Physiological sigh",
    tier: "free",
    category: "breath",
    tag: "Fastest reset",
    minutes: 1,
    blurb: "Two breaths in, one long breath out. The quickest way to take the edge off.",
    steps: [
      "Breathe in through your nose.",
      "On top of that breath, sip in a little more air.",
      "Let it all out slowly through your mouth.",
      "Repeat three to five times.",
    ],
    weights: { panicPattern: 7, highAnxiety: 5, bodilyStress: 4 },
    reasons: {
      panicPattern: {
        label: "Based on your recent SOS sessions",
        text: "Your recent SOS check-ins suggest things escalate fast, and this is the shortest thing that helps at that speed.",
      },
      highAnxiety: {
        label: "Based on your anxiety ratings",
        text: "Anxiety has been rated high recently. This takes under a minute, which matters when nothing longer feels possible.",
      },
    },
    defaultReason: {
      label: "Worth knowing by heart",
      text: "Short enough to use anywhere, which is what makes it the one you actually reach for.",
    },
    breath: { inhale: 3, holdIn: 1, exhale: 7, holdOut: 0, cycles: 5 },
  },
  {
    id: "long-exhale",
    title: "Long exhale breathing",
    tier: "free",
    category: "breath",
    tag: "Anxiety spikes",
    minutes: 2,
    blurb: "A quick downshift when your chest feels tight and your system needs a slower rhythm.",
    steps: [
      "Sit or stand however you are — no special posture needed.",
      "Breathe in through your nose for a count of four.",
      "Let the breath out softly for a count of six.",
      "Keep the exhale easy rather than forceful.",
      "Eight rounds, then notice what changed.",
    ],
    weights: { highAnxiety: 6, panicPattern: 5, bodilyStress: 5 },
    reasons: {
      highAnxiety: {
        label: "Based on your anxiety ratings",
        text: "Your recent logs suggest your system may settle faster when the exhale gets longer than the inhale.",
      },
      bodilyStress: {
        label: "Held in the body",
        text: "Recent entries mention physical symptoms, which is where breath work tends to land first.",
      },
    },
    defaultReason: {
      label: "First-line tool",
      text: "A reliable starting point when your system needs a simple way back to centre.",
    },
    breath: { inhale: 4, holdIn: 0, exhale: 6, holdOut: 0, cycles: 8 },
  },
  {
    id: "five-senses",
    title: "5-4-3-2-1 grounding",
    tier: "free",
    category: "grounding",
    tag: "Overwhelm",
    minutes: 3,
    blurb: "A sensory reset when thoughts move too fast and attention needs something concrete.",
    steps: [
      "Name five things you can see.",
      "Name four things you can feel.",
      "Name three things you can hear.",
      "Name two things you can smell.",
      "Name one thing you can taste.",
    ],
    weights: { panicPattern: 6, overthinking: 5, highAnxiety: 4 },
    reasons: {
      panicPattern: {
        label: "Based on your recent SOS sessions",
        text: "Grounding can interrupt an escalation before it becomes a full episode, which your recent logs suggest is worth having ready.",
      },
      overthinking: {
        label: "Good for loops",
        text: "Useful when overthinking builds and attention needs something concrete to hold.",
      },
    },
    defaultReason: {
      label: "The dependable one",
      text: "A reset when your mind needs something sensory rather than something clever.",
    },
  },
  {
    id: "body-scan",
    title: "Body scan",
    tier: "free",
    category: "grounding",
    tag: "Body-held stress",
    minutes: 4,
    blurb: "For days when your mind seems fine but your body is still carrying the strain.",
    steps: [
      "Start at your forehead.",
      "Move slowly down: jaw, shoulders, chest, stomach, hips, legs.",
      "Notice where tension is held, without trying to fix it.",
      "Soften each area on the out-breath.",
      "Finish by noticing which part let go most easily.",
    ],
    weights: { bodilyStress: 7, poorSleep: 4, workStress: 4 },
    reasons: {
      bodilyStress: {
        label: "Held in the body",
        text: "Your recent check-ins list physical symptoms, which often ease more from noticing than from analysis.",
      },
      poorSleep: {
        label: "Based on your sleep ratings",
        text: "Sleep has been rated poorly lately, and unnoticed physical tension is one of the things that keeps it that way.",
      },
    },
    defaultReason: GENERIC,
  },
  {
    id: "thought-check",
    title: "Thought check",
    tier: "free",
    category: "thought",
    tag: "Overthinking loops",
    minutes: 3,
    blurb: "Catch mind-reading, catastrophising and certainty loops before they settle in.",
    steps: [
      "Write the thought down in plain words.",
      "What actually supports it?",
      "What weakens it, even slightly?",
      "Write one more balanced possibility — not a nicer one, a truer one.",
    ],
    weights: { overthinking: 7, highAnxiety: 4, selfCriticism: 4 },
    reasons: {
      overthinking: {
        label: "Based on your journal themes",
        text: "Overthinking keeps coming up in your recent entries. This is the shortest way to get a thought out of your head and onto something you can examine.",
      },
    },
    defaultReason: GENERIC,
  },

  /* -------------------------------------------------------------- pro */
  {
    id: "box-breathing",
    title: "Box breathing",
    tier: "pro",
    category: "breath",
    tag: "Steadying",
    minutes: 3,
    blurb: "An even, four-sided rhythm for when you need to steady yourself before something.",
    steps: [
      "Breathe in for four.",
      "Hold gently for four.",
      "Breathe out for four.",
      "Hold empty for four.",
      "Six rounds is usually enough to feel the shift.",
    ],
    weights: { highAnxiety: 5, workStress: 5, panicPattern: 3 },
    reasons: {
      workStress: {
        label: "Based on your logged triggers",
        text: "Work comes up often in your recent entries. This is the one to use in the ten minutes before something you are dreading.",
      },
    },
    defaultReason: GENERIC,
    breath: { inhale: 4, holdIn: 4, exhale: 4, holdOut: 4, cycles: 6 },
  },
  {
    id: "fact-vs-story",
    title: "Fact versus story",
    tier: "pro",
    category: "thought",
    tag: "Interpretation spikes",
    minutes: 4,
    blurb: "Separate what happened from what you have decided it means.",
    steps: [
      "Describe the event as a camera would have recorded it.",
      "Now write what you concluded from it.",
      "Underline every word in the second list that is an interpretation.",
      "Ask what else could explain the same facts.",
    ],
    weights: { overthinking: 6, relationshipStrain: 6, socialStress: 5 },
    reasons: {
      relationshipStrain: {
        label: "Based on your recent entries",
        text: "Relationship tension appears in what you have written lately, and this separates what was said from what it might have meant.",
      },
      socialStress: {
        label: "Based on your logged triggers",
        text: "Social situations show up in your recent triggers. This is the tool for the replay afterwards.",
      },
    },
    defaultReason: GENERIC,
  },
  {
    id: "workday-decompression",
    title: "Workday decompression",
    tier: "pro",
    category: "recovery",
    tag: "Work pressure",
    minutes: 5,
    blurb: "A transition so work stress stops following you into the rest of the day.",
    steps: [
      "Name the sharpest pressure from the day.",
      "Separate what is unresolved from what can wait.",
      "Loosen your shoulders and jaw.",
      "Choose one sentence that ends the workday in your head.",
    ],
    weights: { workStress: 8, poorSleep: 4, highAnxiety: 3 },
    reasons: {
      workStress: {
        label: "Based on your logged triggers",
        text: "Work is your most common trigger recently. This puts a deliberate edge on the day so it stops bleeding into the evening.",
      },
    },
    defaultReason: GENERIC,
  },
  {
    id: "sleep-wind-down",
    title: "Sleep wind-down",
    tier: "pro",
    category: "evening",
    tag: "Restless nights",
    minutes: 8,
    blurb: "A structured evening reset when tension is still active late in the day.",
    steps: [
      "Dim the room or your screen.",
      "Write down the unfinished thought that keeps returning.",
      "Six long exhales.",
      "Choose one sentence to revisit tomorrow instead of tonight.",
    ],
    weights: { poorSleep: 8, overthinking: 5, highAnxiety: 4 },
    reasons: {
      poorSleep: {
        label: "Based on your sleep ratings",
        text: "Sleep has been rated low across your recent check-ins. This is built for the nights when the thinking has not stopped yet.",
      },
    },
    defaultReason: GENERIC,
  },
  {
    id: "emotional-naming",
    title: "Emotional naming",
    tier: "pro",
    category: "thought",
    tag: "Internal processing",
    minutes: 4,
    blurb: "Turn vague internal tension into clearer language.",
    steps: [
      "Name the emotion that seems closest.",
      "Name what sits underneath it.",
      "Name what that emotion might be trying to protect.",
      "Write one honest sentence without softening it.",
    ],
    weights: { lowMood: 6, selfCriticism: 4, relationshipStrain: 4 },
    reasons: {
      lowMood: {
        label: "Based on your mood ratings",
        text: "Mood has been sitting low recently. Naming it precisely tends to help more than trying to lift it directly.",
      },
    },
    defaultReason: GENERIC,
  },

  /* ---------------------------------------------------------- premium */
  {
    id: "panic-interruption",
    title: "Panic interruption",
    tier: "premium",
    category: "recovery",
    tag: "Panic patterns",
    minutes: 6,
    blurb: "A fuller sequence for panic that arrives fast and lands physically.",
    steps: [
      "Name the first physical cue you noticed.",
      "One minute of long-exhale breathing.",
      "Shift to grounding with three sensory anchors.",
      "Choose one reassuring sentence you actually believe.",
      "Re-check your body after ninety seconds.",
    ],
    weights: { panicPattern: 9, bodilyStress: 5, highAnxiety: 4 },
    reasons: {
      panicPattern: {
        label: "Based on your SOS history",
        text: "You have logged several SOS sessions recently. This is the longer version, built around the cues you tend to notice first.",
      },
    },
    defaultReason: GENERIC,
  },
  {
    id: "self-criticism-interrupt",
    title: "Self-criticism interrupt",
    tier: "premium",
    category: "thought",
    tag: "Harsh inner voice",
    minutes: 5,
    blurb: "For when the criticism has become harsher than the situation warrants.",
    steps: [
      "Write the harshest sentence your mind is repeating.",
      "Ask what mistake or fear it is trying to contain.",
      "Write the same truth again, without the punishment.",
      "Choose one humane next step.",
    ],
    weights: { selfCriticism: 9, lowMood: 5, overthinking: 3 },
    reasons: {
      selfCriticism: {
        label: "Based on your journal themes",
        text: "Self-criticism runs through your recent entries. This works on the sentence itself rather than the situation behind it.",
      },
    },
    defaultReason: GENERIC,
  },
  {
    id: "post-conflict-reset",
    title: "Post-conflict reset",
    tier: "premium",
    category: "recovery",
    tag: "After hard conversations",
    minutes: 6,
    blurb: "For the after-effects of tense conversations, mixed signals or friction.",
    steps: [
      "Name which interaction is still echoing.",
      "Separate what happened from what you fear it means.",
      "Do one minute of long-exhale breathing.",
      "Decide whether the next step is pause, repair or boundary.",
    ],
    weights: { relationshipStrain: 8, socialStress: 6, highAnxiety: 3 },
    reasons: {
      relationshipStrain: {
        label: "Based on your recent entries",
        text: "Relationship tension is showing up in what you have written. This helps decide the next move rather than replaying the last one.",
      },
    },
    defaultReason: GENERIC,
  },
  {
    id: "social-replay-reset",
    title: "Social replay reset",
    tier: "premium",
    category: "recovery",
    tag: "Replaying conversations",
    minutes: 5,
    blurb: "For replaying tone and wording long after the moment has passed.",
    steps: [
      "Write the moment you keep replaying.",
      "Separate what you know from what you are inferring.",
      "Name the feeling underneath the replay.",
      "Decide whether you need closure, or whether the loop needs releasing.",
    ],
    weights: { socialStress: 8, overthinking: 7, selfCriticism: 4 },
    reasons: {
      socialStress: {
        label: "Based on your logged triggers",
        text: "Social situations keep appearing in your triggers. This is for the hours afterwards, not the moment itself.",
      },
    },
    defaultReason: GENERIC,
  },
  {
    id: "capacity-check",
    title: "Capacity check",
    tier: "premium",
    category: "recovery",
    tag: "Running on empty",
    minutes: 6,
    blurb: "For weeks when pressure, low recovery and responsibility are stacking up.",
    steps: [
      "Name what has felt relentless lately.",
      "Notice what is most depleted: body, focus, patience or hope.",
      "Remove one demand from the next 24 hours.",
      "Choose one act of recovery before sleep.",
    ],
    weights: { workStress: 7, lowMood: 6, poorSleep: 5 },
    reasons: {
      workStress: {
        label: "Based on your recent pattern",
        text: "Pressure, low mood and short sleep have been showing up together. That combination is worth treating as a capacity problem, not a motivation one.",
      },
    },
    defaultReason: GENERIC,
  },
  {
    id: "week-ahead-reset",
    title: "Week-ahead reset",
    tier: "premium",
    category: "evening",
    tag: "Anticipatory dread",
    minutes: 7,
    blurb: "For anxiety that starts before the pressure has even arrived.",
    steps: [
      "Name the week-ahead thought pulling hardest.",
      "Sort it into: real, possible, imagined.",
      "Write one first step for tomorrow.",
      "Close with a grounding cue.",
    ],
    weights: { highAnxiety: 6, workStress: 6, overthinking: 5 },
    reasons: {
      overthinking: {
        label: "Based on your journal themes",
        text: "Your entries suggest the anticipation is often heavier than the thing itself. This sorts which part is real.",
      },
    },
    defaultReason: GENERIC,
  },
  {
    id: "decision-clarity",
    title: "Decision clarity",
    tier: "premium",
    category: "thought",
    tag: "Too many variables",
    minutes: 6,
    blurb: "When too many possible outcomes make even a small decision feel heavy.",
    steps: [
      "Write the decision in one sentence.",
      "List the two most real fears attached to it.",
      "List the two most realistic next options.",
      "Choose the next smallest step, not the final answer.",
    ],
    weights: { overthinking: 8, workStress: 4, highAnxiety: 3 },
    reasons: {
      overthinking: {
        label: "Based on your journal themes",
        text: "Your entries circle decisions more than events. This shrinks the decision to the next step rather than the whole outcome.",
      },
    },
    defaultReason: GENERIC,
  },
  {
    id: "self-soothing",
    title: "Self-soothing sequence",
    tier: "premium",
    category: "evening",
    tag: "Needing comfort",
    minutes: 6,
    blurb: "For moments when your system needs comfort more than analysis.",
    steps: [
      "Name what feels most tender right now.",
      "Choose one sensory comfort cue — warmth, weight, texture, sound.",
      "Add one sentence of reassurance you can actually believe.",
      "Stay with the softer state for a full minute before moving.",
    ],
    weights: { lowMood: 8, selfCriticism: 5, panicPattern: 3 },
    reasons: {
      lowMood: {
        label: "Based on your mood ratings",
        text: "Mood has been low for several days. Some days the useful move is comfort rather than insight.",
      },
    },
    defaultReason: GENERIC,
  },
  {
    id: "three-good-enough",
    title: "Three good enough things",
    tier: "premium",
    category: "evening",
    tag: "Low mood",
    minutes: 3,
    blurb: "Not gratitude. Just three things that were tolerable, and why.",
    steps: [
      "Write three things from today that were fine or better.",
      "For each one, write why in four words or fewer.",
      "Notice whether any of them were about other people.",
      "Leave it there — no conclusion needed.",
    ],
    weights: { lowMood: 7, selfCriticism: 5 },
    reasons: {
      lowMood: {
        label: "Based on your mood ratings",
        text: "On a run of low days, three tolerable things is a more honest target than gratitude, and easier to actually do.",
      },
    },
    defaultReason: GENERIC,
  },
  {
    id: "quick-sensory-reset",
    title: "Quick sensory reset",
    tier: "premium",
    category: "grounding",
    tag: "Two minutes",
    minutes: 2,
    blurb: "Brief, physical, immediately usable — for when there is no time for anything longer.",
    steps: [
      "Put both feet flat on the floor.",
      "Name one sensation in your hands, jaw, chest and stomach.",
      "Loosen your jaw and drop your shoulders.",
      "Take one slower breath before you move on.",
    ],
    weights: { bodilyStress: 6, workStress: 5, highAnxiety: 4 },
    reasons: {
      bodilyStress: {
        label: "Held in the body",
        text: "Physical symptoms show up in your recent check-ins. This is the version that fits between two meetings.",
      },
    },
    defaultReason: GENERIC,
  },
];

export function getTool(id: string): Tool | undefined {
  return TOOLS.find((tool) => tool.id === id);
}

/** The three-step ladder the SOS flow walks through, in order. */
export const SOS_SEQUENCE = ["physiological-sigh", "five-senses", "long-exhale"] as const;

/* ------------------------------------------------------- recommendation */

export type PersonalisedTool = {
  tool: Tool;
  score: number;
  reason: Reason;
  /** True when the tool is above the person's plan. */
  locked: boolean;
};

export const EMPTY_SIGNALS: ToolSignals = {
  panicPattern: 0,
  highAnxiety: 0,
  poorSleep: 0,
  bodilyStress: 0,
  overthinking: 0,
  workStress: 0,
  socialStress: 0,
  lowMood: 0,
  selfCriticism: 0,
  relationshipStrain: 0,
};

/**
 * Ranks the library against someone's signals and explains each choice.
 *
 * Ordering is deterministic: equal scores keep library order, so the list does
 * not reshuffle between visits. A library that moves around feels unreliable,
 * and unreliable is the opposite of what this app is for.
 */
export function recommendTools(
  signals: ToolSignals,
  options: {
    allowedTiers: ToolTier[];
    limit?: number;
    includeLocked?: boolean;
    /**
     * How many locked tools may appear. Defaults to 1.
     *
     * Without this cap, a free user with a strong signal profile is shown a
     * screen of padlocks — the worst possible response to someone who is
     * struggling, and poor selling besides. One locked tool is an honest
     * "there is more here"; three is a wall.
     */
    maxLocked?: number;
  } = { allowedTiers: ["free"] },
): PersonalisedTool[] {
  const { allowedTiers, limit, includeLocked = true, maxLocked = 1 } = options;

  const scored = TOOLS.map((tool, index) => {
    let score = 0;
    let best: { key: SignalKey; value: number } | null = null;

    for (const [key, weight] of Object.entries(tool.weights) as [SignalKey, number][]) {
      const signal = signals[key] ?? 0;
      if (signal <= 0) continue;
      score += signal * weight;
      if (!best || signal * weight > best.value) best = { key, value: signal * weight };
    }

    const reason = (best && tool.reasons[best.key]) || tool.defaultReason;
    const locked = !allowedTiers.includes(tool.tier);

    return { tool, score, reason, locked, index };
  })
    .filter((entry) => includeLocked || !entry.locked)
    // Unlocked tools win ties, so someone is never told their best option is
    // one they cannot open.
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(a.locked) - Number(b.locked) ||
        a.tool.minutes - b.tool.minutes ||
        a.index - b.index,
    )
    .map(({ tool, score, reason, locked }) => ({ tool, score, reason, locked }));

  if (typeof limit !== "number") return scored;

  // Slots go to tools the person can actually open. Locked tools only fill
  // what is left over, capped at `maxLocked`, and always last — so a free
  // user never opens the app to a wall of padlocks, and an upgrade prompt
  // only appears once the useful options have run out.
  const unlocked = scored.filter((entry) => !entry.locked);
  const locked = scored.filter((entry) => entry.locked);

  const openTake = Math.min(unlocked.length, limit);
  const lockedTake = Math.min(maxLocked, locked.length, limit - openTake);

  return [...unlocked.slice(0, openTake), ...locked.slice(0, lockedTake)];
}
