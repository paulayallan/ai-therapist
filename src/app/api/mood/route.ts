import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertAccountMemory } from "@/lib/memory";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const moodSchema = z.object({
  mood: z.number().min(1).max(10),
  anxietyLevel: z.number().min(1).max(10),
  energy: z.number().min(1).max(10),
  stress: z.number().min(1).max(10),
  sleepQuality: z.number().min(1).max(10),
  notes: z.string().optional().default("")
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = moodSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid mood log." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ ok: true, demo: true });
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase.from("mood_logs").insert({
    user_id: user.id,
    mood: payload.data.mood,
    anxiety_level: payload.data.anxietyLevel,
    energy: payload.data.energy,
    stress: payload.data.stress,
    sleep_quality: payload.data.sleepQuality,
    notes: payload.data.notes
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await upsertAccountMemory(supabase, user.id, {
    displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || "user",
    lastMood: payload.data.mood,
    lastAnxietyLevel: payload.data.anxietyLevel,
    lastStressLevel: payload.data.stress,
    lastSleepQuality: payload.data.sleepQuality,
    memorySnippet: payload.data.notes || `Latest mood check-in: mood ${payload.data.mood}/10, anxiety ${payload.data.anxietyLevel}/10, stress ${payload.data.stress}/10.`
  });

  return NextResponse.json({ ok: true });
}
