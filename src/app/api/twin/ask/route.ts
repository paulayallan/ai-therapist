import { NextResponse } from "next/server";
import { z } from "zod";
import { generateAITwinResponse } from "@/lib/ai-twin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { refreshAITwinProfileFromAccount } from "@/lib/ai-twin";

const twinRequestSchema = z.object({
  question: z.string().min(1).max(600)
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = twinRequestSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid question." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan,status")
    .eq("user_id", user.id)
    .maybeSingle();

  const hasAccess = subscription?.plan === "premium";
  if (!hasAccess) {
    return NextResponse.json({ error: "My AI Twin opens on Premium." }, { status: 403 });
  }

  const profile = await refreshAITwinProfileFromAccount({
    supabase,
    userId: user.id,
    forceRefresh: true
  });

  if (!profile) {
    return NextResponse.json(
      {
        error:
          "Your twin has started building a model of how you think, react, and recover. Add a few more mood logs, journal entries, or support sessions before it answers with confidence."
      },
      { status: 409 }
    );
  }

  const response = await generateAITwinResponse({
    question: payload.data.question,
    profile
  });

  const { data: inserted } = await supabase
    .from("ai_twin_sessions")
    .insert({
      user_id: user.id,
      question: payload.data.question,
      response
    })
    .select("id, question, response, created_at")
    .single();

  return NextResponse.json({
    profile,
    session: {
      id: inserted?.id ?? crypto.randomUUID(),
      question: inserted?.question ?? payload.data.question,
      response: inserted?.response ?? response,
      createdAt: inserted?.created_at ?? new Date().toISOString()
    }
  });
}
