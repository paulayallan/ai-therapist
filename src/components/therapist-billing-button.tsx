"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";
import { isNativeApp } from "@/lib/native-purchases";
import { MONTHLY_FEE_AUD } from "@/lib/therapists";

/**
 * Sends a practitioner to Stripe.
 *
 * The server decides whether that is a checkout or the billing portal — a
 * practitioner who already pays wants to change a card, not buy a second
 * listing, and letting the client choose is how someone ends up with two
 * subscriptions. Navigation is a plain assignment rather than a fetch-redirect,
 * because Stripe is a different origin and a followed redirect would be blocked.
 *
 * This is the actual purchasing mechanism Apple's Guideline 3.1.1 is about, so
 * it is closed twice inside the app: `data-web-only` takes it off the screen
 * before first paint, and the runtime check below refuses to open Stripe even
 * if something ever puts it back. Two locks, because one of them is CSS.
 */
export function TherapistBillingButton({ live }: { live: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    if (busy) return;
    if (isNativeApp()) return;
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/therapists/billing/checkout", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload?.url) {
        throw new Error(payload?.error ?? "Could not open billing.");
      }
      window.location.href = payload.url as string;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open billing.");
      setBusy(false);
    }
  }

  return (
    <div data-web-only className="space-y-3">
      <Button onClick={() => void go()} disabled={busy} variant={live ? "secondary" : "primary"}>
        {busy ? "Opening…" : live ? "Manage billing" : `Start your listing — $${MONTHLY_FEE_AUD}/month`}
      </Button>
      {error ? <Notice tone="alert">{error}</Notice> : null}
      {!live ? (
        <p className="text-sm leading-relaxed text-muted">
          Card handled by Stripe — Mentara never sees it. Tax invoice each month, cancel any time.
        </p>
      ) : null}
    </div>
  );
}
