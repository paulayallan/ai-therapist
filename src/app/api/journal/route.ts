import { jsonError, jsonOk, readBody, recordActivity, requireUser, reserveUsage } from "@/lib/api";
import { journalAnalysisSchema, journalCreateSchema } from "@/lib/ai/schemas";
import { completeJson, isAiConfigured, logSchemaMiss, parseJson } from "@/lib/ai/client";
import { JOURNAL_PROMPT } from "@/lib/ai/prompts";
import { getProfile } from "@/lib/data";
import { screenText } from "@/lib/safety";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, journalCreateSchema);
  if (!data) return badBody;

  // The safety screen runs before anything else touches this text.
  const screen = screenText(data.body);

  const supabase = await createSupabaseServerClient();
  const { data: entry, error } = await supabase
    .from("journal_entries")
    .insert({ user_id: user.id, text_content: data.body })
    .select("id, text_content, voice_url, emotional_analysis_json, created_at")
    .single();

  if (error || !entry) return jsonError("Could not save that entry.", 500);

  await recordActivity(user.id, "journal_entry", data.localDate, entry.id);

  // Crisis and urgent-medical text is stored but never interpreted. The person
  // gets resources from the app, not a paragraph from a model.
  if (screen.blocksAi) {
    return jsonOk({ entry, analysis: null, crisis: true });
  }

  const profile = await getProfile(user.id);
  if (!profile?.ai_data_consent_granted) {
    return jsonOk({ entry, analysis: null, needsConsent: true });
  }

  const decision = await reserveUsage(user.id, "journal_analysis", data.localDate);
  if (!decision.allowed) {
    // The entry is already saved — only the reflection is limited.
    return jsonError(decision.message ?? "Limit reached.", 429, {
      entry,
      analysis: null,
      upgradeTarget: decision.upgradeTarget,
    });
  }

  if (!isAiConfigured()) return jsonOk({ entry, analysis: null });

  try {
    const raw = await completeJson({
      task: "journal",
      maxTokens: 700,
      messages: [
        { role: "system", content: JOURNAL_PROMPT },
        { role: "user", content: data.body },
      ],
    });

    const parsed = journalAnalysisSchema.safeParse(parseJson(raw));
    if (!parsed.success) {
      logSchemaMiss("journal", raw, parsed.error.issues);
      return jsonOk({ entry, analysis: null });
    }

    await supabase
      .from("journal_entries")
      .update({ emotional_analysis_json: parsed.data })
      .eq("id", entry.id);

    return jsonOk({ entry: { ...entry, emotional_analysis_json: parsed.data }, analysis: parsed.data });
  } catch {
    // The entry is safe; only the reflection failed. Say nothing alarming.
    return jsonOk({ entry, analysis: null });
  }
}

export async function DELETE(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return jsonError("Missing entry id.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("journal_entries").delete().eq("id", id);
  if (error) return jsonError("Could not delete that entry.", 500);

  return jsonOk({ deleted: id });
}
