import "server-only";

import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { ZodSchema } from "zod";
import { getSessionUser } from "@/lib/supabase/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSubscription } from "@/lib/data";
import {
  lockedDecision,
  periodKey,
  ruleFor,
  unlimitedDecision,
  limitMessage,
  FEATURE_LABELS,
  type UsageDecision,
  type UsageFeature,
} from "@/lib/usage-limits";

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function jsonOk<T extends Record<string, unknown>>(payload: T, status = 200) {
  return NextResponse.json({ ok: true, ...payload }, { status });
}

/** Discriminated so `if (!user) return response` narrows to a real response. */
type Guarded<K extends string, T> =
  | ({ [P in K]: T } & { response: null })
  | ({ [P in K]: null } & { response: NextResponse });

export async function requireUser(): Promise<Guarded<"user", User>> {
  try {
    const user = await getSessionUser();
    if (!user) return { user: null, response: jsonError("Not signed in.", 401) };
    return { user, response: null };
  } catch {
    return { user: null, response: jsonError("Authentication is not configured.", 503) };
  }
}

export async function readBody<T>(
  request: Request,
  schema: ZodSchema<T>,
): Promise<Guarded<"data", T>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return { data: null, response: jsonError("Expected a JSON body.") };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { data: null, response: jsonError(first?.message ?? "That input did not look right.", 422) };
  }
  return { data: parsed.data, response: null };
}

/**
 * Reserves one unit of a metered feature, atomically, via the database
 * function the live app already uses. The RPC increments only when the result
 * would stay within the limit, so two concurrent requests cannot both slip
 * past the last remaining unit.
 *
 * Fails open on an unexpected RPC error: a broken counter must never take
 * support away from someone who needs it. A hit limit still fails closed.
 */
export async function reserveUsage(
  userId: string,
  feature: UsageFeature,
  localDate: string,
  amount = 1,
): Promise<UsageDecision> {
  const subscription = await getSubscription();
  const { plan, rule } = ruleFor(subscription, feature);

  if (!rule) return unlimitedDecision(feature, plan);
  if (rule.kind === "locked") return lockedDecision(feature, plan, rule.upgradeTarget);

  const key = periodKey(rule.period, localDate);
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("reserve_usage_counter", {
    p_user_id: userId,
    p_feature_key: feature,
    p_period_key: key,
    p_amount: amount,
    p_limit: rule.limit,
  });

  if (error) {
    return {
      allowed: true,
      plan,
      feature,
      featureName: FEATURE_LABELS[feature],
      reason: "ok",
      limit: rule.limit,
      used: 0,
      remaining: null,
      upgradeTarget: null,
      message: null,
    };
  }

  const row = Array.isArray(data) ? data[0] : data;
  const used = Number(row?.used_count ?? 0);
  const allowed = Boolean(row?.allowed);

  return {
    allowed,
    plan,
    feature,
    featureName: FEATURE_LABELS[feature],
    reason: allowed ? "ok" : "limit",
    limit: rule.limit,
    used,
    remaining: Math.max(0, rule.limit - used),
    upgradeTarget: allowed ? null : plan === "free" ? "pro" : "premium",
    message: allowed ? null : limitMessage(feature, rule),
  };
}

/** Reads usage without consuming any. For showing "3 of 5 left". */
export async function peekUsage(
  feature: UsageFeature,
  localDate: string,
): Promise<UsageDecision> {
  const subscription = await getSubscription();
  const { plan, rule } = ruleFor(subscription, feature);

  if (!rule) return unlimitedDecision(feature, plan);
  if (rule.kind === "locked") return lockedDecision(feature, plan, rule.upgradeTarget);

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("usage_counters")
    .select("used_count")
    .eq("feature_key", feature)
    .eq("period_key", periodKey(rule.period, localDate))
    .maybeSingle();

  const used = Number(data?.used_count ?? 0);
  return {
    allowed: used < rule.limit,
    plan,
    feature,
    featureName: FEATURE_LABELS[feature],
    reason: used < rule.limit ? "ok" : "limit",
    limit: rule.limit,
    used,
    remaining: Math.max(0, rule.limit - used),
    upgradeTarget: used < rule.limit ? null : plan === "free" ? "pro" : "premium",
    message: used < rule.limit ? null : limitMessage(feature, rule),
  };
}

/** Records an activity event. Best-effort — never blocks the user's action. */
export async function recordActivity(
  userId: string,
  activityType: string,
  localDate: string,
  sourceId?: string | null,
) {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.from("user_activity_events").insert({
      user_id: userId,
      activity_type: activityType,
      source_id: sourceId ?? null,
      local_date: localDate,
    });
  } catch {
    // Analytics must never break a feature.
  }
}
