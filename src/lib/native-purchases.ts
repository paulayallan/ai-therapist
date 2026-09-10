/**
 * In-app purchase, for the native shell only.
 *
 * Apple requires subscriptions bought inside the app to go through in-app
 * purchase (Guideline 3.1.1). This is that path. The web checkout link is
 * hidden whenever this one is available; showing both is a rejection.
 *
 * Everything here is dynamically imported. The RevenueCat plugin pulls in
 * native bridge code that has no business in a browser bundle, and the web
 * build must not carry it — mobile Safari is the majority of web traffic and
 * it should not download a purchase SDK it can never use.
 */

import type { SubscriptionPlan } from "@/lib/types";

type PaidPlan = Exclude<SubscriptionPlan, "free">;

export type PurchaseOutcome =
  | { status: "purchased"; plan: PaidPlan }
  | { status: "cancelled" }
  | { status: "unavailable"; reason: string };

/** True only inside the Capacitor shell — never in a browser, mobile included. */
export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const capacitor = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(capacitor?.isNativePlatform?.());
}

function entitlementFor(plan: PaidPlan): string {
  return plan === "premium"
    ? (process.env.NEXT_PUBLIC_REVENUECAT_PREMIUM_ENTITLEMENT_ID ?? "Premium")
    : (process.env.NEXT_PUBLIC_REVENUECAT_PRO_ENTITLEMENT_ID ?? "Pro");
}

function packageFor(plan: PaidPlan): string {
  return plan === "premium"
    ? (process.env.NEXT_PUBLIC_REVENUECAT_PREMIUM_PACKAGE_ID ?? "premium_monthly")
    : (process.env.NEXT_PUBLIC_REVENUECAT_PRO_PACKAGE_ID ?? "$rc_monthly");
}

let configuredFor: string | null = null;

/**
 * Identify this person to RevenueCat as their Supabase user id.
 *
 * This is the single most important line in the file. The same id is used by
 * the web purchase link and is what the webhook writes against. Let RevenueCat
 * generate an anonymous id instead and the purchase lands on a customer that
 * has no account behind it: the person pays, the webhook cannot match them to
 * anyone, and support has to unpick it by hand.
 */
async function configure(userId: string) {
  if (configuredFor === userId) return;

  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  const apiKey = process.env.NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY;
  if (!apiKey) throw new Error("RevenueCat is not configured for this build.");

  await Purchases.configure({ apiKey, appUserID: userId });
  configuredFor = userId;
}

/** What the store says this plan costs, in the person's own currency. */
export async function nativePrice(plan: PaidPlan, userId: string): Promise<string | null> {
  if (!isNativeApp()) return null;
  try {
    await configure(userId);
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const offerings = await Purchases.getOfferings();
    const match = offerings.current?.availablePackages.find(
      (item) => item.identifier === packageFor(plan),
    );
    return match?.product.priceString ?? null;
  } catch {
    // A missing price is cosmetic. Never let it block the purchase button.
    return null;
  }
}

export async function purchaseNative(plan: PaidPlan, userId: string): Promise<PurchaseOutcome> {
  if (!isNativeApp()) return { status: "unavailable", reason: "Not running in the app." };

  try {
    await configure(userId);
    const { Purchases } = await import("@revenuecat/purchases-capacitor");

    const offerings = await Purchases.getOfferings();
    const target = offerings.current?.availablePackages.find(
      (item) => item.identifier === packageFor(plan),
    );
    if (!target) {
      return { status: "unavailable", reason: "That plan is not available right now." };
    }

    const result = await Purchases.purchasePackage({ aPackage: target });
    const active = result.customerInfo.entitlements.active ?? {};

    // Compare case-insensitively, for the same reason the server does: the
    // live entitlements are `Pro` and `Premium`, and a casing mismatch would
    // silently leave someone who just paid on the free tier.
    const wanted = entitlementFor(plan).toLowerCase();
    const granted = Object.keys(active).some((id) => id.toLowerCase() === wanted);

    return granted
      ? { status: "purchased", plan }
      : { status: "unavailable", reason: "The purchase went through but did not unlock. Contact support." };
  } catch (cause) {
    const error = cause as { code?: string; message?: string; userCancelled?: boolean };
    if (error?.userCancelled || /cancel/i.test(error?.message ?? "")) {
      return { status: "cancelled" };
    }
    console.error("[mentara/iap] purchase failed:", cause);
    return { status: "unavailable", reason: "That didn't complete. Nothing has been charged." };
  }
}

/**
 * Apple requires a visible way to restore purchases — an app without one is
 * rejected. It also genuinely matters: someone who reinstalls, or signs in on
 * a new phone, would otherwise appear unsubscribed despite paying.
 */
export async function restoreNative(userId: string): Promise<PurchaseOutcome> {
  if (!isNativeApp()) return { status: "unavailable", reason: "Not running in the app." };
  try {
    await configure(userId);
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const { customerInfo } = await Purchases.restorePurchases();
    const active = Object.keys(customerInfo.entitlements.active ?? {}).map((id) =>
      id.toLowerCase(),
    );

    if (active.includes(entitlementFor("premium").toLowerCase())) {
      return { status: "purchased", plan: "premium" };
    }
    if (active.includes(entitlementFor("pro").toLowerCase())) {
      return { status: "purchased", plan: "pro" };
    }
    return { status: "unavailable", reason: "No previous subscription found on this Apple ID." };
  } catch (cause) {
    console.error("[mentara/iap] restore failed:", cause);
    return { status: "unavailable", reason: "Could not check for previous purchases." };
  }
}
