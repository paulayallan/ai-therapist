import type { AITwinProfile, AITwinSession, AccountMemory, Insight, JournalEntry, MentalProfile, MirrorInsight, MoodLog, PanicEpisode, SessionSummary, StrategySession, Subscription } from "@/lib/types";

export const demoMentalProfile: MentalProfile = {
  bringsYouHere: ["Anxiety", "Work"],
  currentMood: 6,
  therapistStyle: "Practical Coach",
  mainChallenges: ["anxiety", "overthinking"],
  stressLevel: 7,
  sleepQuality: 5,
  triggers: ["work deadlines", "uncertainty", "social situations"],
  copingMethods: ["walks", "music", "deep breathing"],
  goals: ["calm mind", "reduce panic", "build resilience"],
  therapyExperience: "Some prior CBT experience"
};

export const demoMoodLogs: MoodLog[] = [
  {
    id: "1",
    mood: 6,
    anxietyLevel: 7,
    energy: 5,
    stress: 8,
    sleepQuality: 4,
    notes: "Busy day before client presentation.",
    createdAt: "2026-03-09T08:00:00.000Z"
  },
  {
    id: "2",
    mood: 7,
    anxietyLevel: 5,
    energy: 7,
    stress: 6,
    sleepQuality: 6,
    notes: "Felt steadier after a workout.",
    createdAt: "2026-03-10T08:00:00.000Z"
  },
  {
    id: "3",
    mood: 8,
    anxietyLevel: 4,
    energy: 7,
    stress: 5,
    sleepQuality: 7,
    notes: "More grounded this morning.",
    createdAt: "2026-03-11T08:00:00.000Z"
  }
];

export const demoPanicEpisodes: PanicEpisode[] = [
  {
    id: "p1",
    trigger: "Work stress",
    location: "Home",
    recoveryTime: "10-20 minutes",
    checkIn: "still-anxious",
    createdAt: "2026-03-09T21:10:00.000Z"
  },
  {
    id: "p2",
    trigger: "Overthinking",
    location: "Alone",
    recoveryTime: "5-10 minutes",
    checkIn: "calmer",
    createdAt: "2026-03-11T22:30:00.000Z"
  },
  {
    id: "p3",
    trigger: "Work stress",
    location: "Home",
    recoveryTime: "5-10 minutes",
    checkIn: "calmer",
    createdAt: "2026-03-12T20:05:00.000Z"
  }
];

export const demoJournalEntries: JournalEntry[] = [
  {
    id: "j1",
    textContent: "I noticed I get tense every Sunday night thinking about work on Monday.",
    voiceUrl: null,
    emotionalAnalysis: {
      emotionalThemes: ["anticipatory anxiety", "pressure"],
      triggers: ["Sunday evening", "work meetings"],
      distortions: ["catastrophizing"],
      tone: "concerned but reflective",
      summary: "Work anticipation is a recurring trigger, especially before the week starts."
    },
    createdAt: "2026-03-09T10:00:00.000Z"
  },
  {
    id: "j2",
    textContent: "I assumed my manager was disappointed, but I did not actually have evidence for that.",
    voiceUrl: null,
    emotionalAnalysis: {
      emotionalThemes: ["self-doubt", "reappraisal"],
      triggers: ["feedback ambiguity"],
      distortions: ["mind reading"],
      tone: "self-aware",
      summary: "You are catching thought patterns faster and questioning assumptions."
    },
    createdAt: "2026-03-11T18:30:00.000Z"
  }
];

export const demoInsights: Insight[] = [
  {
    id: "i1",
    insightType: "trigger",
    category: "Stress pattern",
    description: "Recent entries suggest your stress tends to peak before work demands, especially when the pressure is still anticipatory rather than fully happening.",
    confidence: "High confidence",
    basis: "Based on 3 mood logs, 2 journal entries, and recent support summaries.",
    generatedAt: "2026-03-12T09:00:00.000Z"
  },
  {
    id: "i2",
    insightType: "distortion",
    category: "Cognitive habit",
    description: "Your journaling sounds more reflective than reactive, but it still slips into mind reading when feedback feels ambiguous.",
    confidence: "Medium confidence",
    basis: "Based on recent journal tone and cognitive distortion signals.",
    generatedAt: "2026-03-12T09:00:00.000Z"
  },
  {
    id: "i3",
    insightType: "progress",
    category: "Recovery signal",
    description: "Sleep above your lower range seems to soften anxiety, which suggests rest is acting less like a luxury and more like a stabilizer.",
    confidence: "Medium confidence",
    basis: "Based on recent sleep and anxiety movement.",
    generatedAt: "2026-03-12T09:00:00.000Z"
  }
];

export const demoMirrorInsights: MirrorInsight[] = [
  {
    id: "mi1",
    observation: "You often write about pressure to handle things well, but less about what you personally need.",
    feedback: "very-accurate",
    saved: true,
    createdAt: "2026-03-13T09:00:00.000Z"
  },
  {
    id: "mi2",
    observation: "Your stress seems to rise before work demands, then soften once the event has actually passed.",
    feedback: null,
    saved: false,
    createdAt: "2026-03-13T09:00:00.000Z"
  }
];

export const demoAITwinProfile: AITwinProfile = {
  userId: "demo-user",
  emotionalTendencies: ["Tension rises before work demands", "You internalize pressure quickly", "You calm down once uncertainty becomes concrete"],
  thinkingPatterns: ["what-if thinking", "mind reading under stress", "high self-pressure around performance"],
  commonTriggers: ["work meetings", "feedback ambiguity", "Sunday evening anticipation"],
  behavioralHabits: ["You reflect well after the fact", "You often keep going while tense", "Exercise seems to help your nervous system reset"],
  profileSummary:
    "Based on what we have seen, you tend to become most anxious before work-related uncertainty, especially when you feel pressure to perform or interpret ambiguous feedback. Your stress usually rises in anticipation, then settles once the event is over. You often process emotions reflectively after the moment, but you can downplay how activated you are while it is happening.",
  updatedAt: "2026-03-14T09:00:00.000Z"
};

export const demoAITwinSessions: AITwinSession[] = [
  {
    id: "twin-1",
    question: "How do I usually react when work feels uncertain?",
    response:
      "Based on what we've seen about you, uncertainty at work tends to trigger anticipatory tension before the event itself. You often imagine the risk first, then feel relief once the situation becomes concrete.",
    createdAt: "2026-03-14T09:30:00.000Z"
  }
];

export const demoSubscription: Subscription = {
  plan: "premium",
  status: "active",
  currentPeriodEnd: "2026-04-12T09:00:00.000Z"
};

export const demoStrategySessions: StrategySession[] = [
  {
    id: "s1",
    mode: "decision",
    prompt: "I want to leave hospitality and move into remote work, but I am scared of income instability.",
    response: {
      situation_summary: "You want a meaningful shift, but your nervous system is reading uncertainty as danger.",
      emotional_dynamic: "Ambition and fear are colliding. Part of you wants expansion, and part of you wants control.",
      key_pattern: "You may be waiting for a zero-risk transition before acting, which keeps the current situation in charge.",
      options: [
        {
          title: "Build a six-month runway first",
          upside: "Reduces panic and keeps the transition realistic.",
          risk: "Could become a delay tactic if you keep moving the goalpost.",
          recommended_if: "Financial safety is the main blocker."
        },
        {
          title: "Pilot remote work on the side",
          upside: "Lets you test fit before a full exit.",
          risk: "Energy may feel stretched in the short term.",
          recommended_if: "You need proof before making a clean jump."
        }
      ],
      honest_take: "You do not need total certainty. You need a transition structure strong enough to hold your anxiety.",
      next_best_step: "Define the minimum monthly income you need and build a transition plan backward from that number.",
      risk_level: "low",
      show_crisis_resources: false
    },
    createdAt: "2026-03-12T09:00:00.000Z"
  }
];

export const demoSessionSummaries: SessionSummary[] = [
  {
    id: "ss1",
    conversationId: "c1",
    mainIssue: "Anxiety about work meetings and performance pressure",
    emotionalState: "anxious",
    possibleTriggers: ["work pressure", "meetings"],
    suggestedFocusArea: "work anxiety regulation",
    emotionalThemes: ["performance anxiety", "anticipatory stress"],
    recurringIssues: ["work pressure", "Sunday-night spirals"],
    suggestedNextSteps: ["Use paced breathing before meetings", "Challenge mind-reading thoughts"],
    summaryText: "User often spirals before work meetings and wants more confidence under pressure.",
    createdAt: "2026-03-12T09:00:00.000Z"
  },
  {
    id: "ss2",
    conversationId: "c2",
    mainIssue: "Relationship ambiguity leading to overthinking",
    emotionalState: "overwhelmed",
    possibleTriggers: ["relationship uncertainty", "mixed signals"],
    suggestedFocusArea: "relationship clarity",
    emotionalThemes: ["uncertainty", "attachment anxiety"],
    recurringIssues: ["mixed signals", "texting ex-partners when stressed"],
    suggestedNextSteps: ["Pause before responding", "Ask what evidence is real versus imagined"],
    summaryText: "Relationship uncertainty triggers rumination and a strong need for clarity.",
    createdAt: "2026-03-13T09:00:00.000Z"
  }
];

export const demoAccountMemory: AccountMemory = {
  userId: "demo-user",
  displayName: "demo",
  bringsYouHere: ["Anxiety", "Work"],
  therapistStyle: "Practical Coach",
  goals: ["calm mind", "reduce panic", "build resilience"],
  emotionalThemes: ["anticipatory anxiety", "self-doubt", "uncertainty"],
  recurringIssues: ["work pressure", "Sunday-night spirals", "relationship ambiguity"],
  commonTriggers: ["work meetings", "Sunday evening", "feedback ambiguity"],
  memorySummary:
    "The user often gets anxious before work demands, overthinks ambiguous feedback, and wants more confidence and calm under pressure.",
  lastSessionSummary: "Relationship uncertainty triggers rumination and a strong need for clarity.",
  lastDetectedEmotion: "anxious",
  lastMood: 8,
  lastAnxietyLevel: 4,
  lastStressLevel: 5,
  lastSleepQuality: 7,
  updatedAt: "2026-03-13T09:00:00.000Z"
};
