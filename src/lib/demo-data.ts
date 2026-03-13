import type { Insight, JournalEntry, MentalProfile, MoodLog } from "@/lib/types";

export const demoMentalProfile: MentalProfile = {
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
    description: "You often feel more anxious before meetings and at the start of the work week.",
    generatedAt: "2026-03-12T09:00:00.000Z"
  },
  {
    id: "i2",
    insightType: "distortion",
    description: "Recent writing shows recurring catastrophizing and mind-reading patterns.",
    generatedAt: "2026-03-12T09:00:00.000Z"
  },
  {
    id: "i3",
    insightType: "progress",
    description: "Your mood trend is improving on days when you log a calming routine and sleep above 6/10.",
    generatedAt: "2026-03-12T09:00:00.000Z"
  }
];
