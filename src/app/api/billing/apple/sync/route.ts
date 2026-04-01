import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SubscriptionPlan } from "@/lib/types";

type SyncPayload = {
  plan?: SubscriptionPlan;
  status?: "inactive" | "active" | "trialing" | "past_due";
  currentPeriodEnd?: string | null;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
};

const validPlans = new Set<SubscriptionPlan>(["free", "pro", "premium"]);
const validStatuses = new Set<NonNullable<SyncPayload["status"]>>(["inactive", "active", "trialing", "past_due"]);

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const admin = createSupabaseAdminClient();

  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  if (!admin) {
    return NextResponse.json({ error: "Apple billing sync needs SUPABASE_SERVICE_ROLE_KEY." }, { status: 503 });
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "You must be signed in to sync purchases." }, { status: 401 });
  }

  const payload = (await request.json()) as SyncPayload;
  const plan = payload.plan ?? "free";
  const status = payload.status ?? "inactive";

  if (!validPlans.has(plan) || !validStatuses.has(status)) {
    return NextResponse.json({ error: "Invalid Apple billing payload." }, { status: 400 });
  }

  // MVP sync so native purchases unlock the current user immediately.
  // Replace this with RevenueCat webhooks or server-side verification before handling production revenue.
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: user.id,
      plan,
      status,
      provider: plan === "free" ? null : "apple_iap",
      provider_customer_id: payload.providerCustomerId ?? null,
      provider_subscription_id: payload.providerSubscriptionId ?? null,
      current_period_end: payload.currentPeriodEnd ?? null,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "user_id"
    }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
