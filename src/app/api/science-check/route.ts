import { z } from "zod";
import { jsonError, jsonOk, readBody, recordActivity, requireUser, reserveUsage } from "@/lib/api";
import { completeJson, isAiConfigured, logSchemaMiss, parseJson } from "@/lib/ai/client";
import { SCIENCE_PROMPT } from "@/lib/ai/prompts";
import { scienceSchema } from "@/lib/ai/schemas";
import { getProfile } from "@/lib/data";
import { screenText } from "@/lib/safety";

export const maxDuration = 60;

const askSchema = z.object({
  question: z.string().trim().min(3, "Ask something first.").max(300),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * A free-text science question. The built-in topics cover the common ones and
 * need no key; this handles everything else.
 *
 * It is metered against insight generation rather than support chat — it is a
 * reference lookup, not a conversation, and someone shouldn't spend their
 * support messages understanding their own symptoms.
 */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, askSchema);
  if (!data) return badBody;

  // Someone asking "how many paracetamol would it take" is not a science
  // question, and must never be answered as one.
  const screen = screenText(data.question);
  if (screen.blocksAi) {
    return jsonError(
      "I'm not going to answer that as a question about mechanisms. If you're having a hard time right now, the crisis lines below are the right thing.",
      403,
      { crisis: true },
    );
  }

  const profile = await getProfile(user.id);
  if (!profile?.ai_data_consent_granted) {
    return jsonError("Asking your own question needs AI turned on in settings.", 403, {
      needsConsent: true,
    });
  }

  const decision = await reserveUsage(user.id, "insights_generation", data.localDate);
  if (!decision.allowed) {
    return jsonError(decision.message ?? "Limit reached.", 429, {
      upgradeTarget: decision.upgradeTarget,
    });
  }

  if (!isAiConfigured()) return jsonError("This is not configured on this deployment.", 503);

  try {
    const raw = await completeJson({
      task: "science",
      maxTokens: 1200,
      messages: [
        { role: "system", content: SCIENCE_PROMPT },
        { role: "user", content: data.question },
      ],
    });

    const parsed = scienceSchema.safeParse(parseJson(raw));
    if (!parsed.success) {
      logSchemaMiss("science", raw, parsed.error.issues);
      return jsonError("That answer didn't come back properly. Try rewording it.", 502);
    }

    await recordActivity(user.id, "science_check", data.localDate);
    return jsonOk({ answer: parsed.data, remaining: decision.remaining });
  } catch {
    return jsonError("That didn't work. Try again in a moment.", 502);
  }
}
