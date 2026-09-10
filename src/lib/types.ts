/**
 * Domain types. Every shape here mirrors a real column in the live Supabase
 * schema (migrations 0001–0034). Where a field is optional in TypeScript it is
 * nullable in Postgres — nowhere is that guessed.
 */

/* ---------------------------------------------------------------- billing */

export type SubscriptionPlan = "free" | "pro" | "premium";
export type SubscriptionStatus = "inactive" | "active" | "trialing" | "past_due";

export type Subscription = {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currentPeriodEnd: string | null;
  starterTrialStartedAt?: string | null;
  starterTrialEndsAt?: string | null;
};

/* ---------------------------------------------------------------- profile */

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  ai_data_consent_granted: boolean;
  ai_data_consent_granted_at: string | null;
};

export type TherapistStyle =
  | "Calm Listener"
  | "Practical Coach"
  | "Deep Psychologist"
  | "Motivational Guide";

export const THERAPIST_STYLES: { id: TherapistStyle; blurb: string }[] = [
  { id: "Calm Listener", blurb: "Unhurried and warm. Reflects back before offering anything." },
  { id: "Practical Coach", blurb: "Direct and structured. Names the pattern, gives a next step." },
  { id: "Deep Psychologist", blurb: "Curious about the why underneath. Fewer answers, better questions." },
  { id: "Motivational Guide", blurb: "Encouraging and forward-leaning, without the cheerleading." },
];

/** mental_profiles */
export type MentalProfile = {
  brings_you_here: string[];
  current_mood: number;
  therapist_style: TherapistStyle;
  main_challenges: string[];
  stress_level: number;
  sleep_quality: number;
  triggers: string[];
  coping_methods: string[];
  goals: string[];
  therapy_experience: string;
  onboarding_completed: boolean;
};

export type SymptomFrequency = "occasionally" | "few_times_week" | "most_days" | "every_day";

/** user_support_preferences */
export type SupportPreferences = {
  support_topics: string[];
  symptom_frequency: SymptomFrequency | null;
  goals: string[];
  preferred_features: string[];
  onboarding_completed: boolean;
};

/* ------------------------------------------------------------ daily loop */

/** daily_check_ins — mood is 1–5, anxiety 1–10, sleep is a word */
export type SleepQuality = "very_poorly" | "poorly" | "okay" | "well" | "very_well";

export type DailyCheckIn = {
  id: string;
  mood: number;
  anxiety_level: number;
  sleep_quality: SleepQuality;
  contributing_factors: string[];
  other_factor: string | null;
  physical_symptoms: string[];
  notes: string | null;
  local_date: string;
  created_at: string;
};

/** mood_logs — every scale is 1–10 here, unlike daily_check_ins */
export type MoodLog = {
  id: string;
  mood: number;
  anxiety_level: number;
  energy: number;
  stress: number;
  sleep_quality: number;
  notes: string | null;
  created_at: string;
};

/** journal_entries */
export type EmotionalAnalysis = {
  emotionalThemes: string[];
  triggers: string[];
  distortions: string[];
  tone: string;
  summary: string;
};

export type JournalEntry = {
  id: string;
  text_content: string;
  voice_url: string | null;
  emotional_analysis_json: EmotionalAnalysis | null;
  created_at: string;
};

/** panic_episodes — every column is NOT NULL with a fixed value list */
export const PANIC_TRIGGERS = [
  "Work stress",
  "Social situation",
  "Relationship",
  "Overthinking",
  "Physical symptoms",
  "Unknown",
] as const;

export const PANIC_LOCATIONS = ["Home", "Work", "Outside", "With people", "Alone"] as const;

export const PANIC_RECOVERY = [
  "1-5 minutes",
  "5-10 minutes",
  "10-20 minutes",
  "20+ minutes",
] as const;

export type PanicTrigger = (typeof PANIC_TRIGGERS)[number];
export type PanicLocation = (typeof PANIC_LOCATIONS)[number];
export type PanicRecovery = (typeof PANIC_RECOVERY)[number];
export type PanicCheckIn = "calmer" | "still-anxious";

export type PanicEpisode = {
  id: string;
  trigger: PanicTrigger;
  location: PanicLocation;
  recovery_time: PanicRecovery;
  check_in: PanicCheckIn;
  created_at: string;
};

/* --------------------------------------------------------------- insights */

export type InsightType =
  | "trigger"
  | "distortion"
  | "progress"
  | "timing"
  | "correlation"
  | "starter"
  | "theme";

export type Insight = {
  id: string;
  insight_type: InsightType;
  description: string;
  title: string | null;
  full_insight: string | null;
  share_insight: string | null;
  category: string | null;
  evidence_basis: string | null;
  source: string | null;
  generated_at: string;
};

export type MirrorInsight = {
  id: string;
  observation: string;
  feedback: "very-accurate" | "somewhat-accurate" | "not-really" | null;
  saved: boolean;
  created_at: string;
};

/* ------------------------------------------------------------------ chat */

export type EmotionalState = "calm" | "anxious" | "sad" | "angry" | "overwhelmed";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  structured_json: StructuredCoachResponse | null;
  emotional_state: EmotionalState | null;
  created_at: string;
};

/** The shape the coach model must return. Validated before it reaches the UI. */
export type StructuredCoachResponse = {
  response: string;
  validation: string;
  thinkingPattern: string | null;
  reframe: string | null;
  exercise: string | null;
  reflectionQuestion: string | null;
  detectedEmotion: EmotionalState;
  riskLevel: "none" | "low" | "moderate" | "high";
  crisisFlag: boolean;
};

export type SessionSummary = {
  id: string;
  main_issue: string;
  emotional_state: EmotionalState;
  emotional_themes: string[];
  recurring_issues: string[];
  possible_triggers: string[];
  suggested_next_steps: string[];
  suggested_focus_area: string;
  summary_text: string;
  created_at: string;
};

/** account_memory — what the app remembers about someone between sessions */
export type AccountMemory = {
  display_name: string;
  brings_you_here: string[];
  therapist_style: TherapistStyle;
  goals: string[];
  emotional_themes: string[];
  recurring_issues: string[];
  common_triggers: string[];
  memory_snippets: string[];
  memory_summary: string;
  last_session_summary: string;
  last_detected_emotion: EmotionalState | null;
  last_mood: number | null;
  last_anxiety_level: number | null;
  last_stress_level: number | null;
  last_sleep_quality: number | null;
};

/* ----------------------------------------------------------------- tools */

export type ToolTier = SubscriptionPlan;

export type SavedTool = { tool_id: string; saved_at: string };

/* -------------------------------------------------------------- homework */

export type HomeworkList = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  source_type: "support" | "strategy" | "twin" | "manual";
  status: "active" | "completed" | "archived";
  created_at: string;
  items: HomeworkItem[];
};

/**
 * `status` and `completed` are separate columns and must stay in sync —
 * `status` is NOT NULL with a check constraint, and existing rows rely on it.
 * "not_completed" is a deliberate third state: a task consciously let go is
 * not the same as one still hanging over you.
 */
export type HomeworkItemStatus = "pending" | "completed" | "not_completed";

export type HomeworkItem = {
  id: string;
  text: string;
  completed: boolean;
  completed_at: string | null;
  user_comment: string | null;
  priority: "low" | "normal" | "high";
  item_order: number;
  status: HomeworkItemStatus;
};

/* ------------------------------------------------------------- crisis */

export type CrisisRegion = "AU" | "US" | "UK" | "NZ" | "CA" | "IE" | "INTL";
