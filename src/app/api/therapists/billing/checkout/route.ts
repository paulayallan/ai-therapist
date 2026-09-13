import { jsonError, jsonOk, requireUser } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createCheckoutSession, createPortalSession, isStripeConfigured } from "@/lib/stripe";
import { canReceiveReferrals, registrationHasLapsed, type Therapist } from "@/lib/therapists";

function appUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/**
 * Starts or manages a practitioner's listing subscription.
 *
 * Verification comes first and is not negotiable: an unverified practitioner
 * cannot pay their way onto the list. Taking money from someone we have not
 * checked would also mean refunding them when we do.
 */
export async function POST() {
  const { user, response } = await requireUser();
  if (!user) return response;

  if (!isStripeConfigured()) {
    return jsonError("Billing is not switched on yet.", 503);
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("therapists")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const therapist = data as Therapist | null;
  if (!therapist) return jsonError("No practitioner account on this login.", 404);

  if (therapist.status !== "verified") {
    return jsonError(
      therapist.status === "pending"
        ? "Your registration is still being checked. Nothing to pay until it is."
        : "This account cannot take referrals.",
      403,
    );
  }

  if (registrationHasLapsed(therapist)) {
    return jsonError("Your registration needs re-checking before the listing can restart.", 403);
  }

  const returnUrl = `${appUrl()}/therapists/dashboard`;

  try {
    // Already a customer with a live subscription: they want to change a card
    // or cancel, not buy a second one. Stripe's portal does both, properly.
    if (therapist.stripe_customer_id && canReceiveReferrals(therapist)) {
      const portal = await createPortalSession({
        customerId: therapist.stripe_customer_id,
        returnUrl,
      });
      return jsonOk({ url: portal.url, kind: "portal" });
    }

    const session = await createCheckoutSession({
      therapistId: therapist.id,
      email: therapist.contact_email,
      customerId: therapist.stripe_customer_id,
      successUrl: `${returnUrl}?listing=started`,
      cancelUrl: returnUrl,
    });

    if (!session.url) return jsonError("Stripe did not return a checkout link.", 502);
    return jsonOk({ url: session.url, kind: "checkout" });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Billing is unavailable right now.";
    return jsonError(message, 502);
  }
}
