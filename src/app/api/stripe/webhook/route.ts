import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSubscription, mapSubscriptionStatus, verifyWebhook } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StripeEvent = {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
};

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function periodEnd(value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000).toISOString()
    : null;
}

/**
 * Stripe telling us a practitioner's listing changed.
 *
 * Called by Stripe's servers, so there is no session — the signature on the raw
 * body is the only thing establishing that this is real, and it is checked
 * before anything is parsed. An unsigned request that could flip
 * subscription_status would let anyone list themselves as a paid practitioner,
 * which is to say put themselves in front of people in distress.
 *
 * Always answers 200 once the signature holds. Stripe retries non-2xx for days,
 * and an event we cannot act on — one for a therapist row that no longer
 * exists, say — is not going to succeed on the fortieth attempt either.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const event = verifyWebhook(raw, request.headers.get("stripe-signature")) as StripeEvent | null;

  if (!event) {
    return NextResponse.json({ ok: false, error: "Bad signature." }, { status: 400 });
  }

  const object = event.data?.object ?? {};

  try {
    const supabase = createSupabaseAdminClient();

    // The id travels out through checkout metadata and comes back here, so a
    // payment lands on the row it was started from rather than one matched by
    // email, which practitioners change.
    let therapistId =
      str(object.client_reference_id) ??
      str((object.metadata as Record<string, unknown> | undefined)?.therapist_id);

    let customerId = str(object.customer);
    let subscriptionId = str(object.subscription) ?? (event.type.startsWith("customer.subscription.") ? str(object.id) : null);
    let status = str(object.status);
    let endsAt = periodEnd(object.current_period_end);

    // checkout.session.completed carries almost nothing about the subscription
    // itself, so fetch the real thing rather than guessing from the session.
    if (event.type === "checkout.session.completed" && subscriptionId) {
      const subscription = await getSubscription(subscriptionId);
      status = subscription.status;
      endsAt = periodEnd(subscription.current_period_end);
      customerId = customerId ?? subscription.customer;
      therapistId = therapistId ?? str(subscription.metadata?.therapist_id);
    }

    if (event.type === "invoice.payment_failed") {
      status = "past_due";
      subscriptionId = str(object.subscription) ?? subscriptionId;
    }

    // Fall back to the customer id when the event carries no reference — a card
    // update made in the billing portal, for instance.
    if (!therapistId && customerId) {
      const { data } = await supabase
        .from("therapists")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      therapistId = str(data?.id);
    }

    if (!therapistId || !status) {
      return NextResponse.json({ ok: true, ignored: event.type });
    }

    const patch: Record<string, unknown> = {
      subscription_status: mapSubscriptionStatus(status),
      subscription_period_end: endsAt,
    };
    if (customerId) patch.stripe_customer_id = customerId;
    if (subscriptionId) patch.stripe_subscription_id = subscriptionId;

    await supabase.from("therapists").update(patch).eq("id", therapistId);

    return NextResponse.json({ ok: true });
  } catch {
    // The signature was valid, so this is our problem, not Stripe's. Swallowing
    // it keeps Stripe from retrying a request that will fail identically.
    return NextResponse.json({ ok: true, handled: false });
  }
}
