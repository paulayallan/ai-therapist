import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { planFromActiveEntitlements } from "@/lib/billing";

/**
 * RevenueCat webhook receiver.
 *
 * This is how a purchase made on a phone becomes a row in `subscriptions`.
 * Nothing else in the app writes that table, so if this endpoint is missing
 * or wrong, people pay Apple and quietly lose access here. Treat it as
 * load-bearing.
 *
 * It runs with the service-role client because there is no user session on a
 * webhook — RevenueCat's servers call it, not a browser. That means RLS is
 * bypassed, which is exactly why the shared secret below is checked first and
 * why the user id is validated as a UUID before it is used.
 */

export const maxDuration = 20;
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const eventSchema = z.object({
  event: z.object({
    type: z.string(),
    app_user_id: z.string().optional(),
    original_app_user_id: z.string().optional(),
    entitlement_ids: z.array(z.string()).nullable().optional(),
    entitlement_id: z.string().nullable().optional(),
    product_id: z.string().nullable().optional(),
    store: z.string().nullable().optional(),
    expiration_at_ms: z.number().nullable().optional(),
    transaction_id: z.string().nullable().optional(),
    original_transaction_id: z.string().nullable().optional(),
  }),
});

/**
 * Event types that mean "this person no longer has the thing they paid for".
 *
 * CANCELLATION is deliberately NOT in this list. A cancellation in RevenueCat
 * means auto-renew was turned off, not that access ended — the person has paid
 * through to `expiration_at_ms` and taking it away early would be theft of
 * something they bought. EXPIRATION is the event that actually ends access.
 */
const ENDS_ACCESS = new Set(["EXPIRATION", "SUBSCRIPTION_PAUSED"]);

/** Their card failed but the grace period is still running. Access continues. */
const AT_RISK = new Set(["BILLING_ISSUE"]);

export async function POST(request: Request) {
  // 1. Shared secret. RevenueCat sends whatever you put in its Authorization
  //    header field. Without this, anyone who finds the URL can grant
  //    themselves Premium.
  //    REVENUECAT_WEBHOOK_AUTH is the name the old app used, so an existing
  //    Vercel value keeps working untouched.
  const secret = process.env.REVENUECAT_WEBHOOK_AUTH ?? process.env.REVENUECAT_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[mentara/revenuecat] REVENUECAT_WEBHOOK_AUTH is not set — refusing.");
    return NextResponse.json({ error: "Not configured." }, { status: 503 });
  }
  if (request.headers.get("authorization") !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed body." }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[mentara/revenuecat] unrecognised payload:", parsed.error.issues);
    // 200 on purpose: a shape we don't understand is our problem, not theirs,
    // and a non-2xx makes RevenueCat retry a payload that will never parse.
    return NextResponse.json({ received: true, handled: false });
  }

  const event = parsed.data.event;
  const userId = event.app_user_id ?? event.original_app_user_id ?? "";

  // Anonymous RevenueCat ids ($RCAnonymousID:…) belong to someone who never
  // signed in. There is no account to credit, so there is nothing to do.
  if (!UUID.test(userId)) {
    console.warn(`[mentara/revenuecat] ${event.type}: no usable user id ("${userId}").`);
    return NextResponse.json({ received: true, handled: false });
  }

  const entitlements = event.entitlement_ids ?? (event.entitlement_id ? [event.entitlement_id] : []);
  const ending = ENDS_ACCESS.has(event.type);
  const plan = ending ? "free" : planFromActiveEntitlements(entitlements);

  const status = ending
    ? "inactive"
    : AT_RISK.has(event.type)
      ? "past_due"
      : plan === "free"
        ? "inactive"
        : "active";

  const patch = {
    plan,
    status,
    provider: event.store ? event.store.toLowerCase() : "revenuecat",
    provider_customer_id: userId,
    provider_subscription_id: event.original_transaction_id ?? event.transaction_id ?? null,
    current_period_end: event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null,
    updated_at: new Date().toISOString(),
  };

  const supabase = createSupabaseAdminClient();

  // Update-then-insert rather than upsert: an upsert needs a unique constraint
  // on user_id, and this endpoint must not depend on one being present.
  const { data: existing, error: readError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    console.error("[mentara/revenuecat] could not read subscription:", readError);
    // 500 so RevenueCat retries — a dropped event costs someone their access.
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }

  const { error: writeError } = existing
    ? await supabase.from("subscriptions").update(patch).eq("id", existing.id)
    : await supabase.from("subscriptions").insert({ user_id: userId, ...patch });

  if (writeError) {
    console.error("[mentara/revenuecat] could not write subscription:", writeError);
    return NextResponse.json({ error: "Write failed." }, { status: 500 });
  }

  console.info(
    `[mentara/revenuecat] ${event.type} → ${userId} is ${plan}/${status}` +
      (patch.current_period_end ? ` until ${patch.current_period_end}` : ""),
  );

  return NextResponse.json({ received: true, handled: true, plan, status });
}

/** RevenueCat's dashboard pings the URL to check it exists before saving it. */
export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "revenuecat-webhook" });
}
