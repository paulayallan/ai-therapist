import { NextResponse } from "next/server";
import { z } from "zod";
import { coachResponseSchema } from "@/lib/ai/schemas";
import { coachSystemPrompt } from "@/lib/ai/prompts";
import { upsertAccountMemory } from "@/lib/memory";
import { getOpenAIClient } from "@/lib/openai";
import { createSessionSummaryForConversation } from "@/lib/session-memory";
import { detectCrisisLanguage, detectPanicLanguage } from "@/lib/safety";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { detectEmotionalState } from "@/lib/emotions";
import { getOpenAIErrorMessage } from "@/lib/openai-errors";
import { buildPersonalizationSnapshot } from "@/lib/personalization";
import { refreshAITwinProfileFromAccount } from "@/lib/ai-twin";

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
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const highRisk = payload.data.crisisFlag || detectCrisisLanguage(payload.data.message);
  const panicSignal = detectPanicLanguage(payload.data.message);
  const detectedEmotion = detectEmotionalState(payload.data.message);
  const client = getOpenAIClient();

  if (highRisk) {
    return NextResponse.json({
      natural_response: "Pause here and treat this as an emergency moment, not a normal support session.",
      emotion_validation: "If you're in immediate danger please contact local emergency services or a crisis hotline.",
      thinking_pattern: "This needs real-world support, not a normal coaching response.",
      reframe: "You do not have to carry this alone right now.",
      exercise: "Put the device down and contact emergency services, 988, or a trusted person immediately.",
      reflection_question: "Who can you contact in the next five minutes?",
      detected_emotion: "overwhelmed",
      risk_level: "high",
      show_crisis_resources: true,
      crisis_interrupt: true,
      conversationId: payload.data.conversationId ?? null
    });
  }

  if (!client) {
    return NextResponse.json({
      natural_response: panicSignal
        ? "I am here with you. You are not doing this wrong, and this wave can pass.\n\nPut both feet on the floor and press them down for 10 seconds.\nNow breathe in for 4, out for 6, five times.\nName 3 things you can see around you right now."
        : "I hear how heavy this feels right now. Let’s take one small step so your body and mind do not have to carry everything at once.",
      emotion_validation: panicSignal ? "Your nervous system is in alarm mode right now, and that can feel intense." : "What you are feeling makes sense in this moment.",
      thinking_pattern: panicSignal
        ? "This sounds like an acute stress surge where your body is signaling danger very loudly."
        : "This may include trying to predict the worst-case outcome as if it is certain.",
      reframe: panicSignal
        ? "This feels scary, but feeling panicked is not the same as being in danger."
        : "A painful moment can be real without defining the whole future.",
      exercise: panicSignal
        ? "Grounding reset: feet down, unclench jaw, drop shoulders, then do 5 rounds of 4-in / 6-out breathing."
        : "Take five slow breaths with a longer exhale than inhale, then drink water and relax your shoulders.",
      reflection_question: panicSignal
        ? "What is one sign, right now, that you are physically safe in this moment?"
        : "What is one next step that would make the next hour 5% easier?",
      detected_emotion: detectedEmotion,
      risk_level: panicSignal ? "medium" : "low",
      show_crisis_resources: false,
      conversationId: payload.data.conversationId ?? null
    });
  }

  const supabase = await createSupabaseServerClient();
  let userName = "the user";
  let memoryPrompt = "";
  let therapistStyle = "Practical Coach";
  let currentMood = 5;
  let conversationId = payload.data.conversationId ?? null;
  let accountMemoryTriggers: string[] = [];
  let accountMemorySummary = "";

  if (supabase) {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    let generatedSummary: Awaited<ReturnType<typeof createSessionSummaryForConversation>> | null = null;

    if (user) {
      const snapshot = await buildPersonalizationSnapshot(user);
      userName = snapshot.userName;
      therapistStyle = snapshot.therapistStyle;
      currentMood = snapshot.currentMood;
      accountMemoryTriggers = snapshot.commonTriggers;
      accountMemorySummary = snapshot.memorySummary;
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
    ? "Panic signal detected. Prioritize co-regulation first: short reassurance, short breathing/grounding step, then one gentle question."
    : "";

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${coachSystemPrompt}

${memoryPrompt}
- detected_emotion: ${detectedEmotion}
${styleInstruction}
${panicInstruction}
${toolInstruction}`
        },
        { role: "user", content: payload.data.message }
      ]
    });

    const content = completion.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: "Empty model response." }, { status: 502 });
    }

    const parsed = coachResponseSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid structured response." }, { status: 502 });
    }

    parsed.data.natural_response = addPersonalLead({
      baseResponse: parsed.data.natural_response,
      userName,
      detectedEmotion: parsed.data.detected_emotion,
      commonTriggers: accountMemoryTriggers,
      memorySummary: accountMemorySummary,
      conversationId
    });

    if (supabase) {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      let generatedSummary: Awaited<ReturnType<typeof createSessionSummaryForConversation>> | null = null;

      if (user) {
        if (conversationId) {
          await supabase.from("messages").insert([
            {
              conversation_id: conversationId,
              role: "user",
              content: payload.data.message,
              emotional_state: detectedEmotion,
              structured_json: { tool: payload.data.tool ?? null }
            },
            {
              conversation_id: conversationId,
              role: "assistant",
              content: parsed.data.natural_response,
              emotional_state: parsed.data.detected_emotion,
              structured_json: parsed.data
            }
          ]);
        }

        await upsertAccountMemory(supabase, user.id, {
          displayName: userName,
          lastDetectedEmotion: detectedEmotion,
          memorySnippet: parsed.data.natural_response
        });

        if (conversationId) {
          try {
            generatedSummary = await createSessionSummaryForConversation({
              supabase,
              userId: user.id,
              conversationId,
              displayName: userName,
              fallbackEmotion: parsed.data.detected_emotion,
              commonTriggers: accountMemoryTriggers
            });
          } catch {
            // Keep the support response flowing even if summary generation fails.
          }
        }

        await refreshAITwinProfileFromAccount({
          supabase,
          userId: user.id
        }).catch(() => null);

        return NextResponse.json({
          ...parsed.data,
          conversationId,
          sessionSummary: generatedSummary
            ? {
                main_issue: generatedSummary.main_issue,
                emotional_state: generatedSummary.emotional_state,
                possible_triggers: generatedSummary.possible_triggers ?? [],
                suggested_focus_area: generatedSummary.suggested_focus_area ?? "",
                suggested_next_steps: generatedSummary.suggested_next_steps ?? []
              }
            : null
        });
      }
    }

    return NextResponse.json({
      ...parsed.data,
      conversationId
    });
  } catch (error) {
    return NextResponse.json(
      { error: getOpenAIErrorMessage(error, "I could not generate a response right now. Try again in a moment.") },
      { status: 502 }
    );
  }
}

function addPersonalLead({
  baseResponse,
  userName,
  detectedEmotion,
  commonTriggers,
  memorySummary,
  conversationId
}: {
  baseResponse: string;
  userName: string;
  detectedEmotion: "calm" | "anxious" | "sad" | "angry" | "overwhelmed";
  commonTriggers: string[];
  memorySummary: string;
  conversationId: string | null;
}) {
  if (!baseResponse.trim()) return baseResponse;

  const normalized = baseResponse.toLowerCase();
  if (
    normalized.includes("i remember") ||
    normalized.includes("you've shared") ||
    normalized.includes("you have shared")
  ) {
    return baseResponse;
  }

  const firstName = userName && userName !== "the user" ? `${userName}, ` : "";
  const mainTrigger = commonTriggers.find((item) => item.trim().length > 0);
  const seed = `${conversationId ?? "new"}:${baseResponse}:${mainTrigger ?? ""}:${memorySummary}`;
  const opening = emotionOpening(detectedEmotion, seed);

  if (mainTrigger) {
    const triggerLine = pickVariant(
      [
        `I remember ${mainTrigger.toLowerCase()} has been a trigger for you.`,
        `${mainTrigger} has shown up as a pressure point for you before.`,
        `I remember this pattern often spikes around ${mainTrigger.toLowerCase()}.`
      ],
      `${seed}:trigger`
    );
    return `${firstName}${opening} ${triggerLine} ${baseResponse}`.trim();
  }

  if (memorySummary.trim()) {
    const memoryLine = pickVariant(
      [
        "I remember this has been weighing on you.",
        "I remember this is not new for you, and it makes sense it feels heavy.",
        "I remember this theme has been hard on your system lately."
      ],
      `${seed}:memory`
    );
    return `${firstName}${opening} ${memoryLine} ${baseResponse}`.trim();
  }

  return `${firstName}${opening} ${baseResponse}`.trim();
}

function emotionOpening(detectedEmotion: "calm" | "anxious" | "sad" | "angry" | "overwhelmed", seed: string) {
  if (detectedEmotion === "anxious") {
    return pickVariant(
      [
        "I can feel how activated this is for you right now.",
        "I can hear the anxiety in this moment.",
        "This sounds really keyed-up and intense right now."
      ],
      `${seed}:anxious`
    );
  }
  if (detectedEmotion === "overwhelmed") {
    return pickVariant(
      [
        "I can feel how much is landing on you all at once.",
        "This sounds like too much hitting at the same time.",
        "I can hear how overloaded your system feels right now."
      ],
      `${seed}:overwhelmed`
    );
  }
  if (detectedEmotion === "sad") {
    return pickVariant(
      [
        "I can feel how heavy this feels right now.",
        "I can hear the sadness in what you wrote.",
        "This sounds painful and exhausting to hold."
      ],
      `${seed}:sad`
    );
  }
  if (detectedEmotion === "angry") {
    return pickVariant(
      [
        "I can feel the intensity in what you are carrying.",
        "I can hear how frustrated and charged this feels.",
        "This sounds sharp, raw, and really frustrating."
      ],
      `${seed}:angry`
    );
  }
  return pickVariant(["I am with you right now.", "I am here with you.", "You do not have to hold this alone right now."], `${seed}:calm`);
}

function pickVariant(options: string[], seed: string) {
  const hash = stableHash(seed);
  return options[Math.abs(hash) % options.length];
}

function stableHash(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
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
