import { jsonError, jsonOk, readBody, recordActivity, requireUser, reserveUsage } from "@/lib/api";
import { chatRequestSchema, coachResponseSchema } from "@/lib/ai/schemas";
import { completeJson, isAiConfigured, logSchemaMiss, parseJson } from "@/lib/ai/client";
import { coachPrompt } from "@/lib/ai/prompts";
import { getAccountMemory, getMentalProfile, getProfile } from "@/lib/data";
import { screenText } from "@/lib/safety";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TherapistStyle } from "@/lib/types";

export const maxDuration = 60;

/** What the app says itself when text trips the safety screen. No model runs. */
const CRISIS_REPLY =
  "I'm going to stop here rather than keep talking, because what you've written needs a person, not an app. Please reach out to one of the lines below — they're staffed right now, and they will take you seriously.";

const MEDICAL_REPLY =
  "What you're describing could be a physical emergency, and that's outside what I can help with. Please contact emergency services or a doctor now. I'll still be here afterwards.";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, chatRequestSchema);
  if (!data) return badBody;

  const supabase = await createSupabaseServerClient();

  // A conversation row must exist before a message can hang off it.
  let conversationId = data.conversationId ?? null;
  if (!conversationId) {
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ user_id: user.id, title: data.message.slice(0, 60) })
      .select("id")
      .single();
    if (error || !created) return jsonError("Could not start that conversation.", 500);
    conversationId = created.id;
  }

  const screen = screenText(data.message);

  await supabase.from("messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: data.message,
  });

  /* ------------------------------------------------------------- safety */

  if (screen.blocksAi) {
    const reply = screen.level === "medical" ? MEDICAL_REPLY : CRISIS_REPLY;

    const { data: saved } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, role: "assistant", content: reply })
      .select("id")
      .single();

    return jsonOk({
      conversationId,
      messageId: saved?.id ?? null,
      reply,
      structured: null,
      crisis: true,
      crisisLevel: "screen",
    });
  }

  /* -------------------------------------------------------------- gates */

  const profile = await getProfile(user.id);
  if (!profile?.ai_data_consent_granted) {
    return jsonError("Support chat needs AI turned on in settings.", 403, { needsConsent: true });
  }

  const decision = await reserveUsage(user.id, "support_chat", data.localDate);
  if (!decision.allowed) {
    return jsonError(decision.message ?? "Limit reached.", 429, {
      conversationId,
      upgradeTarget: decision.upgradeTarget,
      limit: decision.limit,
    });
  }

  /* -------------------------------------------------------------- reply */

  if (!isAiConfigured()) {
    return jsonError("Support chat is not configured on this deployment.", 503, { conversationId });
  }

  const [memory, mental, history] = await Promise.all([
    getAccountMemory(),
    getMentalProfile(),
    supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(12),
  ]);

  const style: TherapistStyle =
    memory?.therapist_style ?? mental?.therapist_style ?? "Calm Listener";

  const priorTurns = (history.data ?? [])
    .reverse()
    .filter((row) => row.role === "user" || row.role === "assistant")
    .map((row) => ({ role: row.role as "user" | "assistant", content: row.content }));

  try {
    const raw = await completeJson({
      task: "coach",
      maxTokens: 900,
      messages: [{ role: "system", content: coachPrompt(style, memory) }, ...priorTurns],
    });

    const parsed = coachResponseSchema.safeParse(parseJson(raw));
    if (!parsed.success) {
      logSchemaMiss("coach", raw, parsed.error.issues);
      return jsonError("That reply didn't come back properly. Try sending it again.", 502, {
        conversationId,
      });
    }

    const structured = parsed.data;

    const { data: saved } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: "assistant",
        content: structured.response,
        structured_json: structured,
        emotional_state: structured.detectedEmotion,
      })
      .select("id")
      .single();

    // The model's own risk read is a second net, never the first. The screen
    // above already ran; this catches phrasing the patterns missed.
    const modelFlaggedCrisis = structured.crisisFlag || structured.riskLevel === "high";

    await supabase
      .from("account_memory")
      .update({
        last_detected_emotion: structured.detectedEmotion,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    await recordActivity(user.id, "support_chat", data.localDate, saved?.id ?? null);

    return jsonOk({
      conversationId,
      messageId: saved?.id ?? null,
      reply: structured.response,
      structured,
      crisis: modelFlaggedCrisis,
      crisisLevel: "model",
      remaining: decision.remaining,
    });
  } catch {
    return jsonError("That didn't send. Try again in a moment.", 502, { conversationId });
  }
}
