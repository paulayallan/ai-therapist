import { z } from "zod";
import { coachSystemPrompt } from "@/lib/ai/prompts";
import { upsertAccountMemory } from "@/lib/memory";
import { getOpenAIClient } from "@/lib/openai";
import { buildPersonalizationSnapshot } from "@/lib/personalization";
import { detectCrisisLanguage, detectPanicLanguage } from "@/lib/safety";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { detectEmotionalState } from "@/lib/emotions";

const requestSchema = z.object({
  message: z.string().min(1),
  crisisFlag: z.boolean().optional().default(false),
  conversationId: z.string().uuid().nullable().optional(),
  tool: z.enum(["breathing", "grounding", "reframing", "journal"]).nullable().optional(),
  styleMode: z.enum(["Supportive", "Direct", "Reflective"]).nullable().optional()
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = requestSchema.safeParse(body);

  if (!payload.success) {
    return new Response("Invalid request.", { status: 400 });
  }

  const highRisk = payload.data.crisisFlag || detectCrisisLanguage(payload.data.message);
  const panicSignal = detectPanicLanguage(payload.data.message);
  const detectedEmotion = detectEmotionalState(payload.data.message);
  const client = getOpenAIClient();

  if (highRisk) {
    return new Response(
      "You matter, and your safety comes first right now. If you might act on these thoughts, call emergency services now or reach out to a crisis line like 988 (US/Canada), Lifeline 13 11 14 (Australia), or Samaritans 116 123 (UK/ROI).",
      { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const supabase = await createSupabaseServerClient();
  let memoryPrompt = "";
  let therapistStyle = "Practical Coach";
  let conversationId = payload.data.conversationId ?? null;
  let userId: string | null = null;

  if (supabase) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (user) {
      userId = user.id;
      const snapshot = await buildPersonalizationSnapshot(user);
      therapistStyle = snapshot.therapistStyle;
      memoryPrompt = snapshot.promptContext;

      if (!conversationId) {
        const { data: conversation } = await supabase
          .from("conversations")
          .insert({
            user_id: user.id,
            title: payload.data.message.slice(0, 80)
          })
          .select("id")
          .single();

        conversationId = conversation?.id ?? null;
      }
    }
  }

  if (!client) {
    const fallback =
      panicSignal
        ? "Put both feet on the floor and press them down for 10 seconds. Breathe in for 4 and out for 6, five times. Name 3 things you can see right now."
        : "Let’s keep this simple: one small step now is enough. Take five slower breaths, relax your shoulders, and tell me the hardest part of this moment.";
    const text = fallback.trim();
    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "x-conversation-id": conversationId ?? ""
      }
    });
  }

  const toolInstruction =
    payload.data.tool === "breathing"
      ? "The user tapped Breathing Exercise. Prioritize a short, structured breathing intervention."
      : payload.data.tool === "grounding"
        ? "The user tapped Grounding Exercise. Prioritize a short sensory grounding intervention."
        : payload.data.tool === "reframing"
          ? "The user tapped Thought Reframing. Prioritize cognitive restructuring."
          : payload.data.tool === "journal"
            ? "The user tapped Journaling Prompt. Prioritize reflective prompts and self-awareness."
            : "";

  const styleInstruction = buildStyleInstruction(therapistStyle, payload.data.styleMode ?? null);
  const panicInstruction = panicSignal
    ? "Panic signal detected. Prioritize co-regulation first: one short reassurance, one short body-based action, one short orientation cue."
    : "";

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  (async () => {
    let assistantBody = "";

    try {
      const completion = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4.1",
        stream: true,
        messages: [
          {
            role: "system",
            content: `${coachSystemPrompt}

${memoryPrompt}
- detected_emotion: ${detectedEmotion}
${styleInstruction}
${panicInstruction}
${toolInstruction}

Return plain text only (no JSON, no markdown list markers).
- Keep to 2-4 short sentences.
- Sound human, warm, and practical.
- Do not use the user's name unless they asked you to.
- Do not repeat reassurance lines.
- End with one gentle next step or question.`
          },
          { role: "user", content: payload.data.message }
        ]
      });

      for await (const chunk of completion) {
        const token = chunk.choices[0]?.delta?.content;
        if (!token) continue;
        assistantBody += token;
        await writer.write(encoder.encode(token));
      }

      const finalAssistantMessage = assistantBody.trim();
      if (supabase && userId && conversationId) {
        await supabase.from("messages").insert([
          {
            conversation_id: conversationId,
            role: "user",
            content: payload.data.message,
            emotional_state: detectedEmotion,
            structured_json: { tool: payload.data.tool ?? null, styleMode: payload.data.styleMode ?? null }
          },
          {
            conversation_id: conversationId,
            role: "assistant",
            content: finalAssistantMessage,
            emotional_state: detectedEmotion,
            structured_json: { stream: true }
          }
        ]);

        await upsertAccountMemory(supabase, userId, {
          displayName: "Member",
          lastDetectedEmotion: detectedEmotion,
          memorySnippet: finalAssistantMessage
        });
      }
    } catch {
      await writer.write(encoder.encode(" I’m still here with you. I hit a temporary issue, but we can keep this simple and grounded together."));
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "x-conversation-id": conversationId ?? ""
    }
  });
}

function buildStyleInstruction(
  therapistStyle: "Calm Listener" | "Practical Coach" | "Deep Psychologist" | "Motivational Guide" | string,
  styleMode: "Supportive" | "Direct" | "Reflective" | null
) {
  const therapistStyleInstruction =
    therapistStyle === "Calm Listener"
      ? "Response style preference: Calm Listener. Use soft, validating language and slower pacing."
      : therapistStyle === "Deep Psychologist"
        ? "Response style preference: Deep Psychologist. Offer emotionally perceptive insights in plain language, not jargon."
        : therapistStyle === "Motivational Guide"
          ? "Response style preference: Motivational Guide. Keep warmth and momentum with one encouraging next action."
          : "Response style preference: Practical Coach. Keep it grounded, human, and action-oriented.";

  if (!styleMode) return therapistStyleInstruction;

  const modeInstruction =
    styleMode === "Supportive"
      ? "Selected response mode: Supportive. Lead with reassurance, warmth, and emotional safety."
      : styleMode === "Direct"
        ? "Selected response mode: Direct. Keep it concise, clear, and practical without sounding harsh."
        : "Selected response mode: Reflective. Go slightly deeper on patterns and meaning in plain language.";

  return `${therapistStyleInstruction}\n${modeInstruction}`;
}
