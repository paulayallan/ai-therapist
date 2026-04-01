import { NextResponse } from "next/server";
import { z } from "zod";
import { strategySystemPrompt } from "@/lib/ai/prompts";
import { strategyResponseSchema } from "@/lib/ai/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOpenAIClient } from "@/lib/openai";
import { getOpenAIErrorMessage } from "@/lib/openai-errors";
import { detectCrisisLanguage } from "@/lib/safety";
import { buildPersonalizationSnapshot } from "@/lib/personalization";

const strategyRequestSchema = z.object({
  mode: z.enum(["decision", "social", "life", "burnout"]),
  message: z.string().min(1)
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = strategyRequestSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const client = getOpenAIClient();
  const highRisk = detectCrisisLanguage(payload.data.message);
  const supabase = await createSupabaseServerClient();
  let userId: string | null = null;
  let canPersist = false;
  let personalizationPrompt = "";

  if (supabase) {
    const { data: userData } = await supabase.auth.getUser();
    userId = userData.user?.id ?? null;

    if (userData.user && userId) {
      const snapshot = await buildPersonalizationSnapshot(userData.user);
      personalizationPrompt = `${snapshot.promptContext}

Use this context to make the strategic advice specific to the user's recurring patterns, blind spots, and goals.`;

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan,status")
        .eq("user_id", userId)
        .maybeSingle();

      canPersist = subscription?.plan === "pro" || subscription?.plan === "premium";
    }
  }

  if (!client) {
    const fallback = {
      situation_summary: "You are trying to make sense of a situation that feels emotionally loaded and hard to read clearly.",
      emotional_dynamic: "There is probably a mix of urgency, uncertainty, and a desire for relief.",
      key_pattern: "When a situation feels ambiguous, your mind may search for certainty too quickly.",
      options: [
        {
          title: "Pause before acting",
          upside: "You avoid making a move from pure emotional pressure.",
          risk: "It can feel uncomfortable if you want immediate relief.",
          recommended_if: "You are activated and not yet thinking clearly."
        },
        {
          title: "Take one reversible step",
          upside: "You learn something without overcommitting.",
          risk: "It may not solve the whole issue right away.",
          recommended_if: "You need momentum without locking yourself into a big choice."
        }
      ],
      honest_take: "The bigger risk is probably not making the wrong perfect decision. It is letting anxiety make the decision for you.",
      next_best_step: "Write down the one decision you actually need to make in the next 24 hours and ignore the rest for now.",
      risk_level: highRisk ? "high" : "low",
      show_crisis_resources: highRisk
    };

    if (supabase && userId && canPersist) {
      await supabase.from("strategy_sessions").insert({
        user_id: userId,
        mode: payload.data.mode,
        prompt: payload.data.message,
        response_json: fallback
      });
    }

    return NextResponse.json(fallback);
  }

  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: personalizationPrompt ? `${strategySystemPrompt}\n\n${personalizationPrompt}` : strategySystemPrompt
        },
        { role: "user", content: JSON.stringify(payload.data) }
      ]
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: "Empty model response." }, { status: 502 });
    }

    const parsed = strategyResponseSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid structured response." }, { status: 502 });
    }

    if (highRisk) {
      parsed.data.risk_level = "high";
      parsed.data.show_crisis_resources = true;
    }

    if (supabase && userId && canPersist) {
      await supabase.from("strategy_sessions").insert({
        user_id: userId,
        mode: payload.data.mode,
        prompt: payload.data.message,
        response_json: parsed.data
      });
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    return NextResponse.json(
      { error: getOpenAIErrorMessage(error, "Strategy analysis is unavailable right now. Try again in a moment.") },
      { status: 502 }
    );
  }
}
