import { getEffectiveSubscriptionPlan } from "@/lib/billing";
import type { Subscription, SubscriptionPlan } from "@/lib/types";

/**
 * Tier limits, unchanged from the live app. Do not adjust these casually —
 * people are paying against them.
 */

export type UsageFeature =
  | "support_chat"
  | "journal_analysis"
  | "mood_checkin"
  | "insights_generation"
  | "twin_question"
  | "voice_transcription_minutes";

type LimitPeriod = "day" | "week" | "month";

export type LimitRule =
  | { kind: "locked"; upgradeTarget: "pro" | "premium" }
  | { kind: "metered"; limit: number; period: LimitPeriod };

type FeatureLimitMap = Partial<Record<UsageFeature, LimitRule>>;

const PLAN_LIMITS: Record<SubscriptionPlan, FeatureLimitMap> = {
  free: {
    support_chat: { kind: "metered", limit: 5, period: "day" },
    journal_analysis: { kind: "metered", limit: 3, period: "day" },
    mood_checkin: { kind: "metered", limit: 3, period: "day" },
    insights_generation: { kind: "metered", limit: 2, period: "day" },
    twin_question: { kind: "locked", upgradeTarget: "premium" },
    voice_transcription_minutes: { kind: "locked", upgradeTarget: "pro" },
  },
  pro: {
    support_chat: { kind: "metered", limit: 200, period: "month" },
    journal_analysis: { kind: "metered", limit: 100, period: "month" },
    insights_generation: { kind: "metered", limit: 60, period: "month" },
    twin_question: { kind: "locked", upgradeTarget: "premium" },
    voice_transcription_minutes: { kind: "metered", limit: 30, period: "month" },
    // mood_checkin intentionally absent: unlimited on Pro.
  },
  premium: {
    support_chat: { kind: "metered", limit: 800, period: "month" },
    journal_analysis: { kind: "metered", limit: 300, period: "month" },
    insights_generation: { kind: "metered", limit: 200, period: "month" },
    twin_question: { kind: "metered", limit: 80, period: "month" },
    voice_transcription_minutes: { kind: "metered", limit: 180, period: "month" },
  },
};

export const FEATURE_LABELS: Record<UsageFeature, string> = {
  support_chat: "Support chat",
  journal_analysis: "Journal reflection",
  mood_checkin: "Check-ins",
  insights_generation: "Insights",
  twin_question: "Your Twin",
  voice_transcription_minutes: "Voice",
};

export function ruleFor(
  subscription: Subscription | null | undefined,
  feature: UsageFeature,
): { plan: SubscriptionPlan; rule: LimitRule | null } {
  const plan = getEffectiveSubscriptionPlan(subscription);
  return { plan, rule: PLAN_LIMITS[plan][feature] ?? null };
}

/**
 * The period bucket a usage row is counted against. Derived from the user's
 * own local date so a "daily" limit resets at their midnight, not UTC's.
 */
export function periodKey(period: LimitPeriod, localDate: string): string {
  if (period === "day") return `d:${localDate}`;
  if (period === "month") return `m:${localDate.slice(0, 7)}`;

  // Week: ISO Monday-start, computed from the local date only.
  const date = new Date(`${localDate}T00:00:00Z`);
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day);
  return `w:${date.toISOString().slice(0, 10)}`;
}

export type UsageDecision = {
  allowed: boolean;
  plan: SubscriptionPlan;
  feature: UsageFeature;
  featureName: string;
  reason: "ok" | "locked" | "limit" | "unlimited";
  limit: number | null;
  used: number;
  remaining: number | null;
  upgradeTarget: "pro" | "premium" | null;
  message: string | null;
};

export function lockedDecision(
  feature: UsageFeature,
  plan: SubscriptionPlan,
  upgradeTarget: "pro" | "premium",
): UsageDecision {
  return {
    allowed: false,
    plan,
    feature,
    featureName: FEATURE_LABELS[feature],
    reason: "locked",
    limit: null,
    used: 0,
    remaining: 0,
    upgradeTarget,
    message: `${FEATURE_LABELS[feature]} is part of ${upgradeTarget === "pro" ? "Pro" : "Premium"}.`,
  };
}

export function unlimitedDecision(feature: UsageFeature, plan: SubscriptionPlan): UsageDecision {
  return {
    allowed: true,
    plan,
    feature,
    featureName: FEATURE_LABELS[feature],
    reason: "unlimited",
    limit: null,
    used: 0,
    remaining: null,
    upgradeTarget: null,
    message: null,
  };
}

/** Wording for a limit that has been reached. Plain, never scolding. */
export function limitMessage(feature: UsageFeature, rule: LimitRule): string {
  if (rule.kind === "locked") {
    return `${FEATURE_LABELS[feature]} is part of ${rule.upgradeTarget === "pro" ? "Pro" : "Premium"}.`;
  }
  const window = rule.period === "day" ? "today" : rule.period === "week" ? "this week" : "this month";
  return `You've used all ${rule.limit} of your ${FEATURE_LABELS[feature].toLowerCase()} ${window}.`;
}
