import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const feedbackSchema = z.object({
  insightId: z.string().uuid(),
  feedback: z.enum(["very-accurate", "somewhat-accurate", "not-really"])
});

export async function POST(request: Request) {
  const body = await request.json();
  const payload = feedbackSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid mirror insight feedback." }, { status: 400 });
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

  const { error } = await supabase
    .from("mirror_insights")
    .update({ feedback: payload.data.feedback })
    .eq("id", payload.data.insightId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
