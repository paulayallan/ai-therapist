import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * A small Stripe client, written against their REST API directly.
 *
 * No SDK. Three endpoints are needed — create a checkout session, create a
 * billing portal session, read a subscription — and each is one form-encoded
 * POST. A dependency for that is a dependency to keep patched, a bundle to
 * ship, and one more thing that can fail a build at an awkward moment.
 *
 * This is the practitioner side only. Client subscriptions run through
 * RevenueCat because they have to go through Apple. The two never meet, and
 * nothing in this file should ever learn about the other one.
 */

const API = "https://api.stripe.com/v1";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRICE_ID);
}

function secretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
  return key;
}

/** Stripe takes form encoding, including for nested keys like metadata[x]. */
function encode(params: Record<string, string | undefined>): string {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) body.set(key, value);
  }
  return body.toString();
}

async function call<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    method: params ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      ...(params ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      // Without this, a retried request after a network blip can create a
      // second subscription for the same practitioner.
      "Idempotency-Key": crypto.randomUUID(),
    },
    ...(params ? { body: encode(params) } : {}),
  });

  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `Stripe returned ${response.status}.`);
  }
  return payload;
}

export type CheckoutSession = { id: string; url: string | null };
export type PortalSession = { url: string };

/**
 * A subscription checkout for one practitioner.
 *
 * `client_reference_id` carries our therapist id through Stripe and back out
 * in the webhook, which is how a payment finds its way to the right row
 * without trusting anything the browser sends back.
 */
export async function createCheckoutSession(options: {
  therapistId: string;
  email: string;
  customerId: string | null;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutSession> {
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) throw new Error("STRIPE_PRICE_ID is not set.");
  const tax = process.env.STRIPE_AUTOMATIC_TAX === "true";

  return call<CheckoutSession>("/checkout/sessions", {
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    client_reference_id: options.therapistId,
    "metadata[therapist_id]": options.therapistId,
    "subscription_data[metadata][therapist_id]": options.therapistId,
    ...(options.customerId
      ? { customer: options.customerId }
      : { customer_email: options.email, customer_creation: "always" }),
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    allow_promotion_codes: "true",
    billing_address_collection: "required",
    // Practitioners are businesses and will want a GST invoice. Off by default
    // because Stripe rejects the whole checkout if Stripe Tax has not been
    // switched on in the account, and a practitioner hitting that error would
    // have no idea why. Turn Stripe Tax on, then set STRIPE_AUTOMATIC_TAX=true.
    ...(tax
      ? {
          "automatic_tax[enabled]": "true",
          "tax_id_collection[enabled]": "true",
          "customer_update[address]": options.customerId ? "auto" : undefined,
        }
      : {}),
  });
}

/** Where a practitioner changes their card or cancels. Stripe hosts it. */
export async function createPortalSession(options: {
  customerId: string;
  returnUrl: string;
}): Promise<PortalSession> {
  return call<PortalSession>("/billing_portal/sessions", {
    customer: options.customerId,
    return_url: options.returnUrl,
  });
}

export type StripeSubscription = {
  id: string;
  status: string;
  current_period_end: number;
  customer: string;
  metadata?: Record<string, string>;
};

export async function getSubscription(id: string): Promise<StripeSubscription> {
  return call<StripeSubscription>(`/subscriptions/${id}`);
}

/**
 * Verifies the Stripe-Signature header against the raw request body.
 *
 * This is the whole security model of the webhook. Without it anyone who finds
 * the URL can mark any practitioner as paid, and a paid practitioner is one
 * who receives people in distress — so this is checked before the body is
 * parsed, let alone acted on.
 */
export function verifyWebhook(rawBody: string, header: string | null): unknown | null {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) return null;

  const parts = new Map(
    header.split(",").map((piece) => {
      const [key, ...rest] = piece.split("=");
      return [key?.trim() ?? "", rest.join("=").trim()] as const;
    }),
  );

  const timestamp = parts.get("t");
  const signature = parts.get("v1");
  if (!timestamp || !signature) return null;

  // Five minutes, Stripe's own default. Stops a captured request being replayed
  // days later.
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return null;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }
}

/**
 * Stripe's subscription statuses, mapped onto ours.
 *
 * `past_due` deliberately keeps a practitioner listed. A card that expired on a
 * Tuesday should not quietly drop them out of the pool while someone is waiting
 * for a reply; Stripe will retry, and if it ends up unpaid or cancelled the
 * status moves on its own.
 */
export function mapSubscriptionStatus(status: string): "active" | "past_due" | "cancelled" | "none" {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
      return "cancelled";
    default:
      return "none";
  }
}
