import { z } from "zod";

export const coachResponseSchema = z.object({
  emotion_validation: z.string(),
  thinking_pattern: z.string(),
  reframe: z.string(),
  exercise: z.string(),
  reflection_question: z.string(),
  risk_level: z.enum(["low", "medium", "high"]),
  show_crisis_resources: z.boolean()
});

export const journalAnalysisSchema = z.object({
  emotionalThemes: z.array(z.string()),
  triggers: z.array(z.string()),
  distortions: z.array(z.string()),
  tone: z.string(),
  summary: z.string()
});

export const insightSchema = z.object({
  insight_type: z.enum(["trigger", "distortion", "progress", "timing"]),
  description: z.string()
});

export const insightBatchSchema = z.object({
  insights: z.array(insightSchema)
});
