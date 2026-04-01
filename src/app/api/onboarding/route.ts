import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertAccountMemory } from "@/lib/memory";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  bringsYouHere: z.array(z.string()).min(1),
  currentMood: z.number().min(1).max(10),
  therapistStyle: z.enum(["Calm Listener", "Practical Coach", "Deep Psychologist", "Motivational Guide"])
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = onboardingSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid onboarding data." }, { status: 400 });
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

  const { error } = await supabase.from("mental_profiles").upsert(
    {
      user_id: user.id,
      brings_you_here: payload.data.bringsYouHere,
      current_mood: payload.data.currentMood,
      therapist_style: payload.data.therapistStyle,
      main_challenges: payload.data.bringsYouHere.map((reason) => reason.toLowerCase())
    },
    {
      onConflict: "user_id"
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await upsertAccountMemory(supabase, user.id, {
    displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || "user",
    bringsYouHere: payload.data.bringsYouHere,
    therapistStyle: payload.data.therapistStyle
  });

  return NextResponse.json({ ok: true });
}
