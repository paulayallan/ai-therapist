import { z } from "zod";

export const coachResponseSchema = z.object({
  natural_response: z.string(),
  emotion_validation: z.string(),
  thinking_pattern: z.string(),
  reframe: z.string(),
  exercise: z.string(),
  reflection_question: z.string(),
  detected_emotion: z.enum(["calm", "anxious", "sad", "angry", "overwhelmed"]),
  risk_level: z.enum(["low", "medium", "high"]),
  show_crisis_resources: z.boolean(),
  crisis_interrupt: z.boolean().optional()
});

export const journalAnalysisSchema = z.object({
  emotionalThemes: z.array(z.string()),
  triggers: z.array(z.string()),
  distortions: z.array(z.string()),
  tone: z.string(),
  summary: z.string()
});

export const insightSchema = z.object({
  insight_type: z.enum(["trigger", "distortion", "progress", "timing", "correlation", "starter", "theme"]),
  description: z.string()
});

export const insightBatchSchema = z.object({
  insights: z.array(insightSchema)
});

export const mirrorInsightSchema = z.object({
  observation: z.string().max(220)
});

export const mirrorInsightBatchSchema = z.object({
  insights: z.array(mirrorInsightSchema).min(1).max(3)
});

export const strategyResponseSchema = z.object({
  situation_summary: z.string(),
  emotional_dynamic: z.string(),
  key_pattern: z.string(),
  options: z.array(
    z.object({
      title: z.string(),
      upside: z.string(),
      risk: z.string(),
      recommended_if: z.string()
    })
  ),
  honest_take: z.string(),
  next_best_step: z.string(),
  risk_level: z.enum(["low", "medium", "high"]),
  show_crisis_resources: z.boolean()
});

export const sessionSummarySchema = z.object({
  main_issue: z.string(),
  emotional_state: z.enum(["calm", "anxious", "sad", "angry", "overwhelmed"]),
  possible_triggers: z.array(z.string()),
  suggested_focus_area: z.string(),
  emotional_themes: z.array(z.string()),
  recurring_issues: z.array(z.string()),
  suggested_next_steps: z.array(z.string()),
  summary_text: z.string()
});

export const aiTwinProfileSchema = z.object({
  emotional_tendencies: z.array(z.string()),
  thinking_patterns: z.array(z.string()),
  common_triggers: z.array(z.string()),
  behavioral_habits: z.array(z.string()),
  profile_summary: z.string()
});

export const aiTwinResponseSchema = z.object({
  response: z.string()
});
