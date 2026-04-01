import type { Subscription, SubscriptionPlan } from "@/lib/types";

type RevenueCatPlanConfig = {
  entitlementId: string;
  packageId: string;
};

export const revenueCatConfig = {
  appleApiKey: process.env.NEXT_PUBLIC_REVENUECAT_APPLE_API_KEY ?? "",
  offeringId: process.env.NEXT_PUBLIC_REVENUECAT_OFFERING_ID ?? "default",
  plans: {
    pro: {
      entitlementId: process.env.NEXT_PUBLIC_REVENUECAT_PRO_ENTITLEMENT_ID ?? "pro",
      packageId: process.env.NEXT_PUBLIC_REVENUECAT_PRO_PACKAGE_ID ?? "pro"
    },
    premium: {
      entitlementId: process.env.NEXT_PUBLIC_REVENUECAT_PREMIUM_ENTITLEMENT_ID ?? "premium",
      packageId: process.env.NEXT_PUBLIC_REVENUECAT_PREMIUM_PACKAGE_ID ?? "premium"
    }
  } satisfies Record<"pro" | "premium", RevenueCatPlanConfig>
};

export function resolveSubscriptionFromActiveEntitlements(activeEntitlements: string[]): Subscription {
  if (activeEntitlements.includes(revenueCatConfig.plans.premium.entitlementId)) {
    return {
      plan: "premium",
      status: "active",
      currentPeriodEnd: null
    };
  }

  if (activeEntitlements.includes(revenueCatConfig.plans.pro.entitlementId)) {
    return {
      plan: "pro",
      status: "active",
      currentPeriodEnd: null
    };
  }

  return {
    plan: "free",
    status: "inactive",
    currentPeriodEnd: null
  };
}

export function getPaidPlanLabel(plan: SubscriptionPlan) {
  if (plan === "premium") return "Premium";
  if (plan === "pro") return "Pro";
  return "Free";
}
