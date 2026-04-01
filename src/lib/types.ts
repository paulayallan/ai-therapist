export type MentalProfile = {
  bringsYouHere: string[];
  currentMood: number;
  therapistStyle: "Calm Listener" | "Practical Coach" | "Deep Psychologist" | "Motivational Guide";
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

export type PanicEpisode = {
  id: string;
  trigger: "Work stress" | "Social situation" | "Relationship" | "Overthinking" | "Physical symptoms" | "Unknown";
  location: "Home" | "Work" | "Outside" | "With people" | "Alone";
  recoveryTime: "1-5 minutes" | "5-10 minutes" | "10-20 minutes" | "20+ minutes";
  checkIn: "calmer" | "still-anxious";
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
  insightType: "trigger" | "distortion" | "progress" | "timing" | "correlation" | "starter" | "theme";
  category?: "Stress pattern" | "Sleep correlation" | "Emotional style" | "Cognitive habit" | "Recovery signal" | "Social trigger";
  description: string;
  confidence?: "Low confidence" | "Medium confidence" | "High confidence";
  basis?: string;
  generatedAt: string;
};

export type MirrorInsight = {
  id: string;
  observation: string;
  feedback: "very-accurate" | "somewhat-accurate" | "not-really" | null;
  saved: boolean;
  createdAt: string;
};

export type AITwinProfile = {
  userId: string;
  emotionalTendencies: string[];
  thinkingPatterns: string[];
  commonTriggers: string[];
  behavioralHabits: string[];
  profileSummary: string;
  updatedAt: string;
};

export type ThinkingProfile = {
  archetypeName: string;
  summary: string;
  traits: string[];
  strengths: string[];
  watchouts: string[];
  confidence: "Early read" | "Medium confidence" | "Strong signal";
  basis: string;
  thinkingStyle: string;
  stressSignature: string;
  emotionalHabits: string;
  recoveryProfile: string;
  learningNote: string;
};

export type ToolTier = "free" | "pro" | "premium";

export type PersonalizedTool = {
  id: string;
  title: string;
  tier: ToolTier;
  tag: string;
  estimatedTime: string;
  description: string;
  relevanceLabel: string;
  whyRecommended: string;
  steps: string[];
  weekStart: string;
  score: number;
};

export type SavedTool = {
  toolId: string;
  savedAt: string;
};

export type AITwinSession = {
  id: string;
  question: string;
  response: string;
  createdAt: string;
};

export type SubscriptionPlan = "free" | "pro" | "premium";

export type Subscription = {
  plan: SubscriptionPlan;
  status: "inactive" | "active" | "trialing" | "past_due";
  currentPeriodEnd: string | null;
};

export type StructuredCoachResponse = {
  natural_response: string;
  emotion_validation: string;
  thinking_pattern: string;
  reframe: string;
  exercise: string;
  reflection_question: string;
  detected_emotion: "calm" | "anxious" | "sad" | "angry" | "overwhelmed";
  risk_level: "low" | "medium" | "high";
  show_crisis_resources: boolean;
  crisis_interrupt?: boolean;
};

export type StrategyResponse = {
  situation_summary: string;
  emotional_dynamic: string;
  key_pattern: string;
  options: Array<{
    title: string;
    upside: string;
    risk: string;
    recommended_if: string;
  }>;
  honest_take: string;
  next_best_step: string;
  risk_level: "low" | "medium" | "high";
  show_crisis_resources: boolean;
};

export type StrategySession = {
  id: string;
  mode: "decision" | "social" | "life" | "burnout";
  prompt: string;
  response: StrategyResponse;
  createdAt: string;
};

export type SessionSummary = {
  id: string;
  conversationId: string;
  mainIssue: string;
  emotionalState: "calm" | "anxious" | "sad" | "angry" | "overwhelmed";
  possibleTriggers: string[];
  suggestedFocusArea: string;
  emotionalThemes: string[];
  recurringIssues: string[];
  suggestedNextSteps: string[];
  summaryText: string;
  createdAt: string;
};

export type AccountMemory = {
  userId: string;
  displayName: string;
  bringsYouHere: string[];
  therapistStyle: string;
  goals: string[];
  emotionalThemes: string[];
  recurringIssues: string[];
  commonTriggers: string[];
  memorySummary: string;
  lastSessionSummary: string;
  lastDetectedEmotion: "calm" | "anxious" | "sad" | "angry" | "overwhelmed" | null;
  lastMood: number | null;
  lastAnxietyLevel: number | null;
  lastStressLevel: number | null;
  lastSleepQuality: number | null;
  updatedAt: string;
};
