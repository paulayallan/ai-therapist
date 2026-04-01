import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const saveToolSchema = z.object({
  toolId: z.string().min(1),
  saved: z.boolean()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const payload = saveToolSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json({ error: "Invalid tool save request." }, { status: 400 });
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

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan,status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscription?.plan !== "premium" || !["active", "trialing"].includes(subscription?.status ?? "inactive")) {
    return NextResponse.json({ error: "Saving tools is available on Premium." }, { status: 403 });
  }

  if (payload.data.saved) {
    const { error } = await supabase.from("saved_tools").upsert(
      {
        user_id: user.id,
        tool_id: payload.data.toolId
      },
      { onConflict: "user_id,tool_id" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    const { error } = await supabase
      .from("saved_tools")
      .delete()
      .eq("user_id", user.id)
      .eq("tool_id", payload.data.toolId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}
