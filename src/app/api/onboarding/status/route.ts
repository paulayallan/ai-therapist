import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ completed: false, demo: true });
  }

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;

  if (!user) {
    return NextResponse.json({ completed: false }, { status: 401 });
  }

  const { data, error } = await supabase.from("mental_profiles").select("onboarding_completed").eq("user_id", user.id).maybeSingle();
  if (error) {
    return NextResponse.json({ completed: false, warning: "onboarding_column_missing" });
  }
  return NextResponse.json({ completed: Boolean(data?.onboarding_completed) });
}
