"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";
import type { SubscriptionPlan } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Outcomes before quotas. The live app's paywall led with message counts,
 * which sells the ceiling rather than the thing. Limits are still shown — in
 * plain numbers, underneath — because hiding them until someone hits one is
 * how you lose their trust rather than their money.
 */
const PLANS: {
  id: SubscriptionPlan;
  name: string;
  pitch: string;
  outcomes: string[];
  limits: string[];
}[] = [
  {
    id: "free",
    name: "Free",
    pitch: "The parts you need at 3am, for as long as you use Mentara.",
    outcomes: [
      "The SOS flow, always, without signing in",
      "Five core regulation tools",
      "Journalling and daily check-ins",
      "A basic weekly snapshot",
    ],
    limits: ["5 support messages a day", "3 journal reflections a day", "3 check-ins a day"],
  },
  {
    id: "pro",
    name: "Pro",
    pitch: "For when you want to know why it keeps happening, not just get through it.",
    outcomes: [
      "Trigger and pattern analysis across months",
      "Weekly mind reports",
      "Mirror insights — your own patterns, reflected back",
      "Voice journalling",
      "Ten more tools, including sleep and work-pressure work",
    ],
    limits: [
      "200 support messages a month",
      "100 journal reflections a month",
      "Unlimited check-ins",
      "30 minutes of voice a month",
    ],
  },
  {
    id: "premium",
    name: "Premium",
    pitch: "For the long view — and a Twin that remembers what you have already worked through.",
    outcomes: [
      "Your Twin, built from your own patterns",
      "Deeper memory across months",
      "Decision and reaction simulations",
      "Long-range pattern modelling",
      "The full tool library",
    ],
    limits: [
      "800 support messages a month",
      "300 journal reflections a month",
      "80 Twin questions a month",
      "180 minutes of voice a month",
    ],
  },
];

export function UpgradePlans({
  currentPlan,
  trialDaysLeft,
}: {
  currentPlan: SubscriptionPlan;
  trialDaysLeft: number | null;
}) {
  const [isApple, setIsApple] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    // Apple requires in-app purchase inside the native app, so the web button
    // must not pretend to be a checkout there.
    setIsApple(/iPad|iPhone|iPod/.test(navigator.userAgent));
  }, []);

  async function checkout(plan: "pro" | "premium") {
    setBusy(plan);
    setError(null);
    try {
      const response = await fetch(`/api/billing/checkout?plan=${plan}`, { redirect: "follow" });
      if (response.redirected) {
        window.location.href = response.url;
        return;
      }
      const payload = await response.json();
      setError(payload?.error ?? "Checkout is unavailable right now.");
    } catch {
      setError("Checkout is unavailable right now.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {trialDaysLeft !== null ? (
        <Notice tone="warm">
          You are on the starter trial — everything below is unlocked for another {trialDaysLeft}{" "}
          {trialDaysLeft === 1 ? "day" : "days"}. Nothing charges automatically when it ends.
        </Notice>
      ) : null}

      {error ? <Notice tone="alert">{error}</Notice> : null}

      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => {
          const current = plan.id === currentPlan;
          return (
            <section
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border p-5",
                current ? "border-sage bg-sage-soft" : "border-line bg-surface",
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <h2 className="font-serif text-xl text-ink">{plan.name}</h2>
                {current ? (
                  <span className="rounded-full bg-sage px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-white">
                    Current
                  </span>
                ) : null}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{plan.pitch}</p>

              <ul className="mt-4 flex-1 space-y-2">
                {plan.outcomes.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-relaxed text-ink">
                    <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-sage" />
                    {item}
                  </li>
                ))}
              </ul>

              <details className="mt-4 border-t border-line pt-3">
                <summary className="cursor-pointer text-xs text-faint">The limits</summary>
                <ul className="mt-2 space-y-1">
                  {plan.limits.map((limit) => (
                    <li key={limit} className="text-xs text-muted">
                      {limit}
                    </li>
                  ))}
                </ul>
              </details>

              {plan.id !== "free" && !current ? (
                <div className="mt-4">
                  {isApple ? (
                    <p className="text-xs leading-relaxed text-muted">
                      On iPhone and iPad, subscribing happens through the App Store inside the
                      Mentara app.
                    </p>
                  ) : (
                    <Button
                      className="w-full"
                      disabled={busy !== null}
                      onClick={() => void checkout(plan.id as "pro" | "premium")}
                    >
                      {busy === plan.id ? "Opening…" : `Get ${plan.name}`}
                    </Button>
                  )}
                </div>
              ) : null}
            </section>
          );
        })}
      </div>

      <p className="text-xs leading-relaxed text-faint">
        Paying changes how much depth you get, never whether the app will help in a crisis. The SOS
        flow and crisis resources are free and always will be.
      </p>
    </div>
  );
}
