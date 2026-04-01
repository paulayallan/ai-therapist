import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertAccountMemory } from "@/lib/memory";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const panicEpisodeSchema = z.object({
  trigger: z.enum(["Work stress", "Social situation", "Relationship", "Overthinking", "Physical symptoms", "Unknown"]),
  location: z.enum(["Home", "Work", "Outside", "With people", "Alone"]),
  recoveryTime: z.enum(["1-5 minutes", "5-10 minutes", "10-20 minutes", "20+ minutes"]),
  checkIn: z.enum(["calmer", "still-anxious"])
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = panicEpisodeSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid panic episode data." }, { status: 400 });
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

  const { error } = await supabase.from("panic_episodes").insert({
    user_id: user.id,
    trigger: payload.data.trigger,
    location: payload.data.location,
    recovery_time: payload.data.recoveryTime,
    check_in: payload.data.checkIn
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await upsertAccountMemory(supabase, user.id, {
    displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || "user",
    commonTriggers: payload.data.trigger === "Unknown" ? [] : [payload.data.trigger],
    memorySnippet: `Panic episode: trigger ${payload.data.trigger}, location ${payload.data.location}, recovery ${payload.data.recoveryTime}, check-in ${payload.data.checkIn}.`
  });

  return NextResponse.json({ ok: true });
}
