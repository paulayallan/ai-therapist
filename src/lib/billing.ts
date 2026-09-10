import type { Subscription, SubscriptionPlan } from "@/lib/types";

/**
 * Ported from the live app so entitlement behaviour is unchanged. Two rules
 * matter and both are preserved exactly:
 *   - a legacy `platinum` entitlement resolves to Premium
 *   - an active starter trial grants Premium regardless of plan/status
 */

type RevenueCatPlanConfig = { entitlementId: string; packageId: string };

export const revenueCatConfig = {
  appleApiKey: process.env.NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY ?? "",
  offeringId: process.env.NEXT_PUBLIC_REVENUECAT_OFFERING_ID ?? "default",
  plans: {
    pro: {
      entitlementId: process.env.NEXT_PUBLIC_REVENUECAT_PRO_ENTITLEMENT_ID ?? "pro",
      packageId: process.env.NEXT_PUBLIC_REVENUECAT_PRO_PACKAGE_ID ?? "pro",
    },
    premium: {
      entitlementId: process.env.NEXT_PUBLIC_REVENUECAT_PREMIUM_ENTITLEMENT_ID ?? "premium",
      packageId: process.env.NEXT_PUBLIC_REVENUECAT_PREMIUM_PACKAGE_ID ?? "premium",
    },
  } satisfies Record<"pro" | "premium", RevenueCatPlanConfig>,
};

const PLAN_RANK: Record<SubscriptionPlan, number> = { free: 0, pro: 1, premium: 2 };

export function resolveSubscriptionFromActiveEntitlements(
  activeEntitlements: string[],
): Subscription {
  const legacyPlatinum = process.env.NEXT_PUBLIC_REVENUECAT_PLATINUM_ENTITLEMENT_ID ?? "platinum";

  if (
    activeEntitlements.includes(legacyPlatinum) ||
    activeEntitlements.includes(revenueCatConfig.plans.premium.entitlementId)
  ) {
    return { plan: "premium", status: "active", currentPeriodEnd: null };
  }
  if (activeEntitlements.includes(revenueCatConfig.plans.pro.entitlementId)) {
    return { plan: "pro", status: "active", currentPeriodEnd: null };
  }
  return { plan: "free", status: "inactive", currentPeriodEnd: null };
}

export function isStarterTrialActive(subscription: Subscription | null | undefined): boolean {
  if (!subscription?.starterTrialEndsAt) return false;
  const endsAt = new Date(subscription.starterTrialEndsAt).getTime();
  return Number.isFinite(endsAt) && endsAt > Date.now();
}

/** The plan the user actually gets right now, trial and expiry included. */
export function getEffectiveSubscriptionPlan(
  subscription: Subscription | null | undefined,
): SubscriptionPlan {
  if (!subscription) return "free";
  if (isStarterTrialActive(subscription)) return "premium";

  const paid = subscription.status === "active" || subscription.status === "trialing";
  if (!paid) return "free";

  if (subscription.currentPeriodEnd) {
    const endsAt = new Date(subscription.currentPeriodEnd).getTime();
    if (Number.isFinite(endsAt) && endsAt <= Date.now()) return "free";
  }

  return subscription.plan === "premium" || subscription.plan === "pro"
    ? subscription.plan
    : "free";
}

export function hasPlanAccess(
  plan: SubscriptionPlan,
  requiredPlan: Exclude<SubscriptionPlan, "free">,
): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[requiredPlan];
}

export function subscriptionHasAccess(
  subscription: Subscription | null | undefined,
  requiredPlan: Exclude<SubscriptionPlan, "free">,
): boolean {
  return hasPlanAccess(getEffectiveSubscriptionPlan(subscription), requiredPlan);
}

/** Whole days left in the starter trial, rounded up. Null when not on trial. */
export function starterTrialDaysLeft(subscription: Subscription | null | undefined): number | null {
  if (!isStarterTrialActive(subscription) || !subscription?.starterTrialEndsAt) return null;
  const ms = new Date(subscription.starterTrialEndsAt).getTime() - Date.now();
  return Math.max(1, Math.ceil(ms / 86_400_000));
}

export const PLAN_LABEL: Record<SubscriptionPlan, string> = {
  free: "Free",
  pro: "Pro",
  premium: "Premium",
};

/**
 * Web checkout, via a RevenueCat Web Purchase Link.
 *
 * The link is `https://pay.rev.cat/<token>/<appUserId>` — the person's id is a
 * PATH segment, not a query parameter, and RevenueCat returns 404 without it.
 * So `BILLING_PRO_URL` / `BILLING_PREMIUM_URL` hold only the bare token link
 * and this function completes it.
 *
 * The id must be the Supabase user id, the same value the native app passes to
 * `Purchases.logIn`. Use anything else and someone who subscribes on the web
 * becomes a second RevenueCat customer, their entitlement lands on an account
 * that isn't theirs, and the webhook has no way to tell.
 *
 * The live app had a bug where paid buttons bounced users back to /upgrade
 * instead of a checkout. That fix is preserved: a missing link is an explicit,
 * visible failure rather than a redirect loop.
 */
export function webCheckoutUrl(
  plan: "pro" | "premium",
  userId: string,
  email?: string | null,
): string | null {
  const base = plan === "pro" ? process.env.BILLING_PRO_URL : process.env.BILLING_PREMIUM_URL;
  if (!base || !base.startsWith("http") || !userId) return null;

  const trimmed = base.replace(/\/+$/, "");

  // Tolerate a link that already carries the id, in case someone pastes a
  // complete one into the environment variable.
  const url = trimmed.endsWith(`/${userId}`) ? trimmed : `${trimmed}/${encodeURIComponent(userId)}`;

  // Pre-fills the payment page and keeps the receipt going to the address they
  // actually signed up with.
  return email ? `${url}?email=${encodeURIComponent(email)}` : url;
}
