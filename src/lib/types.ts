export type MentalProfile = {
  mainChallenges: string[];
  stressLevel: number;
  sleepQuality: number;
  triggers: string[];
  copingMethods: string[];
  goals: string[];
  therapyExperience: string;
};

export type MoodLog = {
  id: string;
  mood: number;
  anxietyLevel: number;
  energy: number;
  stress: number;
  sleepQuality: number;
  notes: string | null;
  createdAt: string;
};

export type JournalEntry = {
  id: string;
  textContent: string;
  voiceUrl: string | null;
  emotionalAnalysis: {
    emotionalThemes: string[];
    triggers: string[];
    distortions: string[];
    tone: string;
    summary: string;
  } | null;
  createdAt: string;
};

export type Insight = {
  id: string;
  insightType: string;
  description: string;
  generatedAt: string;
};

export type StructuredCoachResponse = {
  emotion_validation: string;
  thinking_pattern: string;
  reframe: string;
  exercise: string;
  reflection_question: string;
  risk_level: "low" | "medium" | "high";
  show_crisis_resources: boolean;
};
