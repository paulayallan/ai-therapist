"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";
import type { CustomerInfo, PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { Bot, Check, Crown, RefreshCcw, Sparkles } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPaidPlanLabel, resolveSubscriptionFromActiveEntitlements, revenueCatConfig } from "@/lib/billing";
import type { SubscriptionPlan } from "@/lib/types";

type UpgradePricingProps = {
  currentPlan: SubscriptionPlan;
  userId: string;
};

type PlanDefinition = {
  title: "Free" | "Pro" | "Premium";
  fallbackPrice: string;
  subtitle: string;
  features: string[];
  webHref: string;
  icon: typeof Sparkles;
  cardClassName: string;
  iconClassName: string;
  textClassName: string;
  bodyClassName: string;
  featureClassName: string;
  checkClassName: string;
  featured?: boolean;
  premium?: boolean;
  paidPlan?: "pro" | "premium";
};

const plans: PlanDefinition[] = [
  {
    title: "Free",
    fallbackPrice: "$0",
    subtitle: "For immediate support, regulation, and daily check-ins.",
    features: [
      "Unlimited support chat",
      "SOS mode",
      "Regulation tools",
      "Mood check-ins",
      "Sleep + anxiety tracking",
      "Journaling",
      "Basic weekly snapshot"
    ],
    webHref: "/coach",
    icon: Sparkles,
    cardClassName: "border-pine/10 bg-white/88",
    iconClassName: "text-pine",
    textClassName: "text-ink",
    bodyClassName: "text-pine/72",
    featureClassName: "text-pine/76",
    checkClassName: "text-pine"
  },
  {
    title: "Pro",
    fallbackPrice: "$14.99/mo",
    subtitle: "For deep insight into your patterns, triggers, and decisions.",
    features: [
      "Everything in Free",
      "Deep insights",
      "Mirror insights",
      "Trigger + pattern analysis",
      "Decision Lab",
      "Social Decoder",
      "Burnout OS",
      "Life Strategy",
      "Strategy history",
      "Weekly Mind Report"
    ],
    webHref: "/api/billing/checkout?plan=pro",
    icon: Crown,
    cardClassName: "border-pine bg-pine text-white shadow-[0_32px_90px_rgba(35,84,73,0.28)] lg:-translate-y-3",
    iconClassName: "text-white",
    textClassName: "text-white",
    bodyClassName: "text-white/82",
    featureClassName: "text-white/88",
    checkClassName: "text-white",
    featured: true,
    paidPlan: "pro"
  },
  {
    title: "Premium",
    fallbackPrice: "$24.99/mo",
    subtitle: "For your AI Twin, voice sessions, and advanced personalization.",
    features: [
      "Everything in Pro",
      "My AI Twin",
      "Voice AI sessions",
      "Deeper memory",
      "Reaction simulation",
      "Decision simulation",
      "Long-range pattern modeling",
      "Future trend projections",
      "Premium support"
    ],
    webHref: "/api/billing/checkout?plan=premium",
    icon: Bot,
    cardClassName: "border-amber-200/80 bg-[linear-gradient(180deg,rgba(255,251,245,0.98),rgba(247,239,224,0.92))]",
    iconClassName: "text-amber-700",
    textClassName: "text-ink",
    bodyClassName: "text-pine/72",
    featureClassName: "text-ink/82",
    checkClassName: "text-amber-700",
    premium: true,
    paidPlan: "premium"
  }
];

export function UpgradePricing({ currentPlan, userId }: UpgradePricingProps) {
  const [activePlan, setActivePlan] = useState<SubscriptionPlan>(currentPlan);
  const [isNativeIos, setIsNativeIos] = useState(false);
  const [isRevenueCatReady, setIsRevenueCatReady] = useState(false);
  const [packagesByPlan, setPackagesByPlan] = useState<Partial<Record<"pro" | "premium", PurchasesPackage>>>({});
  const [billingMessage, setBillingMessage] = useState<string | null>(null);
  const [pendingPlan, startTransition] = useTransition();
  const [pendingRestore, startRestoreTransition] = useTransition();

  useEffect(() => {
    let mounted = true;

    async function initializeAppleBilling() {
      const nativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

      if (!mounted) return;
      setIsNativeIos(nativeIos);

      if (!nativeIos || userId === "demo-user") {
        return;
      }

      if (!revenueCatConfig.appleApiKey) {
        setBillingMessage("Add your RevenueCat Apple API key to enable in-app purchases in the iPhone app.");
        return;
      }

      try {
        await Purchases.configure({
          apiKey: revenueCatConfig.appleApiKey,
          appUserID: userId
        });

        const [offeringsResult, customerInfoResult] = await Promise.all([
          Purchases.getOfferings(),
          Purchases.getCustomerInfo()
        ]);

        if (!mounted) return;

        const currentOffering = offeringsResult.current;
        const availablePackages = currentOffering?.availablePackages ?? [];

        setPackagesByPlan({
          pro: availablePackages.find((pkg) => pkg.identifier === revenueCatConfig.plans.pro.packageId),
          premium: availablePackages.find((pkg) => pkg.identifier === revenueCatConfig.plans.premium.packageId)
        });

        setIsRevenueCatReady(true);
        await syncCustomerInfo(customerInfoResult.customerInfo, setActivePlan, setBillingMessage);
      } catch (error) {
        if (!mounted) return;
        setBillingMessage(error instanceof Error ? error.message : "Apple billing could not be initialized.");
      }
    }

    void initializeAppleBilling();

    return () => {
      mounted = false;
    };
  }, [userId]);

  async function handleApplePurchase(plan: "pro" | "premium") {
    const purchasePackage = packagesByPlan[plan];

    if (!purchasePackage) {
      setBillingMessage(`Add the ${getPaidPlanLabel(plan)} package in RevenueCat before testing purchases.`);
      return;
    }

    startTransition(async () => {
      try {
        setBillingMessage(null);
        const result = await Purchases.purchasePackage({ aPackage: purchasePackage });
        await syncCustomerInfo(result.customerInfo, setActivePlan, setBillingMessage);
      } catch (error) {
        setBillingMessage(error instanceof Error ? error.message : "The purchase did not complete.");
      }
    });
  }

  async function handleRestorePurchases() {
    startRestoreTransition(async () => {
      try {
        setBillingMessage(null);
        const result = await Purchases.restorePurchases();
        await syncCustomerInfo(result.customerInfo, setActivePlan, setBillingMessage);
      } catch (error) {
        setBillingMessage(error instanceof Error ? error.message : "Could not restore purchases.");
      }
    });
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Upgrade"
        title="Choose how deeply the app gets to know you"
        description="Start with support. Upgrade for insight. Unlock your AI Twin with Premium."
      />
      <Card className="bg-sand/75">
        <p className="text-sm text-pine/75">
          Free is your immediate support layer. Pro turns your patterns into insight. Premium makes the product feel deeply personal with My AI Twin at the center.
        </p>
        {isNativeIos ? (
          <p className="mt-3 text-sm text-pine/75">
            The iPhone app now uses Apple In-App Purchase instead of an external checkout flow.
          </p>
        ) : null}
        {billingMessage ? <p className="mt-3 text-sm text-coral">{billingMessage}</p> : null}
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const ctaState = getPlanCtaState(activePlan, plan.title, isNativeIos);
          const nativePackage = plan.paidPlan ? packagesByPlan[plan.paidPlan] : null;
          const nativePrice = nativePackage?.product.priceString ?? plan.fallbackPrice;
          const nativeButtonDisabled =
            !!plan.paidPlan && (!isRevenueCatReady || !nativePackage || pendingPlan || userId === "demo-user");

          return (
            <Card key={plan.title} className={plan.cardClassName}>
              {plan.featured ? (
                <div className="mb-4 inline-flex rounded-full bg-white/14 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/80">
                  Main upgrade
                </div>
              ) : null}
              {plan.premium ? (
                <div className="mb-4 inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs uppercase tracking-[0.22em] text-amber-800">
                  My AI Twin
                </div>
              ) : null}
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${plan.iconClassName}`} />
                <p className={`font-display text-3xl ${plan.textClassName}`}>{plan.title}</p>
              </div>
              <p className={`mt-3 font-display text-4xl ${plan.textClassName}`}>{nativePrice}</p>
              <p className={`mt-3 text-sm ${plan.bodyClassName}`}>{plan.subtitle}</p>
              <div className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-sm">
                    <Check className={`h-4 w-4 ${plan.checkClassName}`} />
                    <span className={plan.featureClassName}>{feature}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 inline-block">
                {ctaState.mode === "native" && plan.paidPlan ? (
                  <Button
                    onClick={() => void handleApplePurchase(plan.paidPlan!)}
                    disabled={nativeButtonDisabled}
                    variant={plan.featured ? "secondary" : "primary"}
                    className={plan.premium ? "bg-ink text-white hover:bg-ink/90 disabled:opacity-60" : "disabled:opacity-60"}
                  >
                    {ctaState.label}
                  </Button>
                ) : ctaState.href ? (
                  <a href={ctaState.href}>
                    <Button
                      variant={plan.featured ? "secondary" : "primary"}
                      className={plan.premium ? "bg-ink text-white hover:bg-ink/90" : ""}
                    >
                      {ctaState.label}
                    </Button>
                  </a>
                ) : (
                  <Button
                    disabled
                    variant={plan.featured ? "secondary" : "primary"}
                    className={plan.premium ? "bg-ink text-white hover:bg-ink/90 disabled:opacity-100" : "disabled:opacity-100"}
                  >
                    {ctaState.label}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      {isNativeIos ? (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-2xl text-ink">Restore purchases</p>
              <p className="mt-2 text-sm text-pine/70">
                Use this after reinstalling the app or switching devices to recover your Apple subscription.
              </p>
            </div>
            <Button variant="ghost" onClick={() => void handleRestorePurchases()} disabled={pendingRestore || !isRevenueCatReady}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Restore
            </Button>
          </div>
        </Card>
      ) : null}
      <Card>
        <p className="font-display text-2xl text-ink">Product ladder</p>
        <p className="mt-2 text-sm text-pine/70">
          Free is for immediate support. Pro is for pattern understanding. Premium is for My AI Twin, voice sessions, and the most advanced personalization in the product.
        </p>
      </Card>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-pine/70">
        <Link href="/privacy" className="transition hover:text-pine">
          Privacy Policy
        </Link>
        <Link href="/terms" className="transition hover:text-pine">
          Terms & Conditions
        </Link>
        <Link href="/disclaimer" className="transition hover:text-pine">
          Disclaimer
        </Link>
      </div>
    </div>
  );
}

async function syncCustomerInfo(
  customerInfo: CustomerInfo,
  setActivePlan: (plan: SubscriptionPlan) => void,
  setBillingMessage: (message: string | null) => void
) {
  const activeEntitlements = Object.keys(customerInfo.entitlements.active);
  const subscription = resolveSubscriptionFromActiveEntitlements(activeEntitlements);

  setActivePlan(subscription.plan);

  const response = await fetch("/api/billing/apple/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: customerInfo.latestExpirationDate,
      providerCustomerId: customerInfo.originalAppUserId,
      providerSubscriptionId: customerInfo.activeSubscriptions[0] ?? null
    })
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setBillingMessage(payload?.error ?? "The purchase was completed, but the app could not unlock it yet.");
    return;
  }

  if (subscription.plan !== "free") {
    setBillingMessage(`${getPaidPlanLabel(subscription.plan)} is active on this account.`);
    return;
  }

  setBillingMessage(null);
}

function getPlanCtaState(currentPlan: SubscriptionPlan, cardTitle: string, isNativeIos: boolean) {
  if (currentPlan === "premium") {
    if (cardTitle === "Premium") {
      return { label: "Current plan", href: null, mode: "disabled" as const };
    }

    if (cardTitle === "Pro") {
      return { label: "Included in Premium", href: null, mode: "disabled" as const };
    }

    return { label: "Free included", href: "/coach", mode: "link" as const };
  }

  if (currentPlan === "pro") {
    if (cardTitle === "Pro") {
      return { label: "Current plan", href: null, mode: "disabled" as const };
    }

    if (cardTitle === "Premium") {
      return {
        label: "Unlock Premium",
        href: isNativeIos ? null : "/api/billing/checkout?plan=premium",
        mode: isNativeIos ? ("native" as const) : ("link" as const)
      };
    }

    return { label: "Free included", href: "/coach", mode: "link" as const };
  }

  if (cardTitle === "Free") {
    return { label: "Start free", href: "/coach", mode: "link" as const };
  }

  if (cardTitle === "Pro") {
    return {
      label: "Upgrade to Pro",
      href: isNativeIos ? null : "/api/billing/checkout?plan=pro",
      mode: isNativeIos ? ("native" as const) : ("link" as const)
    };
  }

  return {
    label: "Unlock Premium",
    href: isNativeIos ? null : "/api/billing/checkout?plan=premium",
    mode: isNativeIos ? ("native" as const) : ("link" as const)
  };
}
