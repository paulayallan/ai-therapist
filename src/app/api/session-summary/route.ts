import { NextResponse } from "next/server";
import { z } from "zod";
import { getAccountMemory } from "@/lib/data";
import { createSessionSummaryForConversation } from "@/lib/session-memory";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  conversationId: z.string().uuid()
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = requestSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid conversation id." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is required for summaries." }, { status: 400 });
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const accountMemory = await getAccountMemory(user.id);

  try {
    const summary = await createSessionSummaryForConversation({
      supabase,
      userId: user.id,
      conversationId: payload.data.conversationId,
      displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || "user",
      fallbackEmotion: accountMemory?.lastDetectedEmotion ?? "anxious",
      commonTriggers: accountMemory?.commonTriggers
    });

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create session summary." }, { status: 500 });
  }
}
