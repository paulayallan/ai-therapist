import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const onboardingSchema = z.object({
  mainChallenges: z.array(z.string()).min(1),
  stressLevel: z.number().min(1).max(10),
  sleepQuality: z.number().min(1).max(10),
  triggers: z.array(z.string()),
  copingMethods: z.array(z.string()),
  goals: z.array(z.string()),
  therapyExperience: z.string()
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

  const { error } = await supabase.from("mental_profiles").upsert({
    user_id: user.id,
    main_challenges: payload.data.mainChallenges,
    stress_level: payload.data.stressLevel,
    sleep_quality: payload.data.sleepQuality,
    triggers: payload.data.triggers,
    coping_methods: payload.data.copingMethods,
    goals: payload.data.goals,
    therapy_experience: payload.data.therapyExperience
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
