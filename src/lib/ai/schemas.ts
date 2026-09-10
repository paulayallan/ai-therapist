import { z } from "zod";
import { PANIC_LOCATIONS, PANIC_RECOVERY, PANIC_TRIGGERS } from "@/lib/types";

const short = z.string().trim().min(1).max(280);
const emotion = z.enum(["calm", "anxious", "sad", "angry", "overwhelmed"]);

/* ------------------------------------------------------- model responses */

export const coachResponseSchema = z.object({
  response: z.string().trim().min(1).max(1200),
  validation: z.string().trim().max(400).default(""),
  thinkingPattern: z.string().trim().max(300).nullable().default(null),
  reframe: z.string().trim().max(400).nullable().default(null),
  exercise: z.string().trim().max(400).nullable().default(null),
  reflectionQuestion: z.string().trim().max(300).nullable().default(null),
  detectedEmotion: emotion.default("calm"),
  riskLevel: z.enum(["none", "low", "moderate", "high"]).default("none"),
  crisisFlag: z.boolean().default(false),
});

export const journalAnalysisSchema = z.object({
  emotionalThemes: z.array(short).max(4).default([]),
  triggers: z.array(short).max(4).default([]),
  distortions: z.array(short).max(3).default([]),
  tone: z.string().trim().max(60).default(""),
  summary: z.string().trim().min(1).max(700),
});

export const insightItemSchema = z.object({
  insightType: z.enum(["trigger", "distortion", "progress", "timing", "correlation", "theme"]),
  title: z.string().trim().min(1).max(90),
  description: z.string().trim().min(1).max(700),
  evidenceBasis: z.string().trim().max(280).default(""),
});

export const insightsSchema = z.object({
  insights: z.array(insightItemSchema).min(1).max(5),
});

export const mirrorSchema = z.object({
  observations: z.array(z.string().trim().min(1).max(240)).min(1).max(3),
});

export const twinSchema = z.object({
  response: z.string().trim().min(1).max(1200),
});

export const scienceSchema = z.object({
  title: z.string().trim().min(1).max(120),
  explanation: z.string().trim().min(1).max(4000),
  takeaway: z.string().trim().min(1).max(400),
  caveat: z.string().trim().max(600).default(""),
});

export type CoachPayload = z.infer<typeof coachResponseSchema>;
export type JournalAnalysisPayload = z.infer<typeof journalAnalysisSchema>;
export type InsightItem = z.infer<typeof insightItemSchema>;
export type SciencePayload = z.infer<typeof scienceSchema>;

/* ---------------------------------------------------------- request bodies */

const localDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a YYYY-MM-DD date.");

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Write something first.").max(4000),
  conversationId: z.string().uuid().nullable().optional(),
  localDate,
});

export const journalCreateSchema = z.object({
  body: z.string().trim().min(1, "Write something first.").max(6000),
  localDate,
});

export const checkInSchema = z.object({
  localDate,
  mood: z.number().int().min(1).max(5),
  anxietyLevel: z.number().int().min(1).max(10),
  sleepQuality: z.enum(["very_poorly", "poorly", "okay", "well", "very_well"]),
  contributingFactors: z.array(z.string().trim().max(60)).max(12).default([]),
  otherFactor: z.string().trim().max(200).nullable().optional(),
  physicalSymptoms: z.array(z.string().trim().max(60)).max(12).default([]),
  notes: z.string().trim().max(500).nullable().optional(),
});

export const panicEpisodeSchema = z.object({
  trigger: z.enum(PANIC_TRIGGERS),
  location: z.enum(PANIC_LOCATIONS),
  recoveryTime: z.enum(PANIC_RECOVERY),
  checkIn: z.enum(["calmer", "still-anxious"]),
});

export const onboardingSchema = z.object({
  displayName: z.string().trim().max(60).nullable().optional(),
  bringsYouHere: z.array(z.string().trim().max(60)).max(10).default([]),
  currentMood: z.number().int().min(1).max(10),
  therapistStyle: z.enum([
    "Calm Listener",
    "Practical Coach",
    "Deep Psychologist",
    "Motivational Guide",
  ]),
  mainChallenges: z.array(z.string().trim().max(60)).max(10).default([]),
  stressLevel: z.number().int().min(1).max(10),
  sleepQuality: z.number().int().min(1).max(10),
  triggers: z.array(z.string().trim().max(60)).max(12).default([]),
  copingMethods: z.array(z.string().trim().max(60)).max(12).default([]),
  goals: z.array(z.string().trim().max(80)).max(10).default([]),
  therapyExperience: z.string().trim().max(200).default(""),
  symptomFrequency: z
    .enum(["occasionally", "few_times_week", "most_days", "every_day"])
    .nullable()
    .optional(),
  aiConsent: z.boolean(),
});

export const toolSaveSchema = z.object({
  toolId: z.string().trim().min(1).max(60),
  saved: z.boolean(),
});

export const consentSchema = z.object({ granted: z.boolean() });
