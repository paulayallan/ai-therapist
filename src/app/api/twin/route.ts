import { z } from "zod";
import { jsonError, jsonOk, readBody, recordActivity, requireUser, reserveUsage } from "@/lib/api";
import { completeJson, isAiConfigured, logSchemaMiss, parseJson } from "@/lib/ai/client";
import { twinPrompt } from "@/lib/ai/prompts";
import { twinSchema } from "@/lib/ai/schemas";
import { subscriptionHasAccess } from "@/lib/billing";
import {
  getAccountMemory,
  getCheckIns,
  getJournalEntries,
  getMoodLogs,
  getPanicEpisodes,
  getProfile,
  getSessionSummaries,
  getSubscription,
  getTwinProfile,
  getTwinSessions,
} from "@/lib/data";
import { screenText } from "@/lib/safety";
import { deriveSignals } from "@/lib/signals";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { assessReadiness, buildProfileDraft, profileToBrief } from "@/lib/twin";

export const maxDuration = 60;

const askSchema = z.object({
  question: z.string().trim().min(2, "Ask it something.").max(1000),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * Builds or refreshes the Twin's profile from the person's own rows.
 * Deterministic — no model involved. The profile is what it knows, and it
 * should only ever know what they actually logged.
 */
export async function PUT() {
  const { user, response } = await requireUser();
  if (!user) return response;

  const subscription = await getSubscription();
  if (!subscriptionHasAccess(subscription, "premium")) {
    return jsonError("Your Twin is part of Premium.", 403, { upgradeTarget: "premium" });
  }

  const [profile, checkIns, journal, panicEpisodes, moodLogs, summaries] = await Promise.all([
    getProfile(user.id),
    getCheckIns(60),
    getJournalEntries(40),
    getPanicEpisodes(60),
    getMoodLogs(60),
    getSessionSummaries(10),
  ]);

  const signals = deriveSignals({ checkIns, panicEpisodes, journal, moodLogs });
  const readiness = assessReadiness({ checkIns, journal, panicEpisodes, signals });

  if (!readiness.ready) {
    return jsonError("There isn't enough here yet to build something honest.", 409, { readiness });
  }

  const draft = buildProfileDraft({
    signals,
    checkIns,
    journal,
    panicEpisodes,
    summaries,
    displayName: profile?.display_name ?? null,
  });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("ai_twin_profiles").upsert(
    { user_id: user.id, ...draft, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );

  if (error) return jsonError("Could not save that profile.", 500);
  return jsonOk({ profile: draft, readiness });
}

/** Ask the Twin something. */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, askSchema);
  if (!data) return badBody;

  const subscription = await getSubscription();
  if (!subscriptionHasAccess(subscription, "premium")) {
    return jsonError("Your Twin is part of Premium.", 403, { upgradeTarget: "premium" });
  }

  // Safety runs before anything else, exactly as it does in support chat.
  const screen = screenText(data.question);
  if (screen.blocksAi) {
    return jsonError(
      "I'm not going to answer that one. What you've written needs a person, not me — the lines below are staffed right now.",
      403,
      { crisis: true },
    );
  }

  const profile = await getProfile(user.id);
  if (!profile?.ai_data_consent_granted) {
    return jsonError("Your Twin needs AI turned on in settings.", 403, { needsConsent: true });
  }

  const twinProfile = await getTwinProfile();
  if (!twinProfile) {
    return jsonError("Build your Twin's profile first.", 409, { needsProfile: true });
  }

  const decision = await reserveUsage(user.id, "twin_question", data.localDate);
  if (!decision.allowed) {
    return jsonError(decision.message ?? "Limit reached.", 429, {
      upgradeTarget: decision.upgradeTarget,
    });
  }

  if (!isAiConfigured()) return jsonError("This is not configured on this deployment.", 503);

  const [memory, recent] = await Promise.all([getAccountMemory(), getTwinSessions(6)]);

  try {
    const raw = await completeJson({
      task: "twin_response",
      maxTokens: 700,
      messages: [
        {
          role: "system",
          content: `${twinPrompt(memory, recent.map((row) => row.question))}

What you know about them, from their own entries:
${profileToBrief(twinProfile)}

${
  recent.length
    ? `Your last few replies — do not repeat their shape or ideas:\n${recent
        .slice(0, 3)
        .map((row) => `- ${row.response.slice(0, 160)}`)
        .join("\n")}`
    : ""
}`,
        },
        { role: "user", content: data.question },
      ],
    });

    const parsed = twinSchema.safeParse(parseJson(raw));
    if (!parsed.success) {
      logSchemaMiss("twin_response", raw, parsed.error.issues);
      return jsonError("That answer didn't come back properly. Try again.", 502);
    }

    const supabase = await createSupabaseServerClient();
    const { data: saved } = await supabase
      .from("ai_twin_sessions")
      .insert({ user_id: user.id, question: data.question, response: parsed.data.response })
      .select("id, question, response, created_at")
      .single();

    await recordActivity(user.id, "twin_question", data.localDate, saved?.id ?? null);

    return jsonOk({ session: saved, remaining: decision.remaining });
  } catch {
    return jsonError("That didn't send. Try again in a moment.", 502);
  }
}
