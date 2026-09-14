"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Notice } from "@/components/ui/card";

/**
 * Taking new clients, or not.
 *
 * The one switch a practitioner actually operates day to day. Everything else
 * on their dashboard is decided by someone else — whether they are verified,
 * whether the card went through, whether their registration is current. This
 * is theirs.
 */
export function TherapistAvailability({ accepting }: { accepting: boolean }) {
  const router = useRouter();
  const [on, setOn] = useState(accepting);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (busy) return;
    const next = !on;
    setError(null);
    setBusy(true);
    setOn(next); // Optimistic: a switch that lags feels broken.
    try {
      const response = await fetch("/api/therapists/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepting: next }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "That did not save.");
      router.refresh();
    } catch (cause) {
      setOn(!next);
      setError(cause instanceof Error ? cause.message : "That did not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={busy}
        onClick={() => void toggle()}
        className="flex w-full items-center justify-between gap-4 rounded-xl border border-line px-4 py-3 text-left transition-colors hover:border-sage disabled:opacity-60"
      >
        <span>
          <span className="block text-[0.95rem] font-medium text-ink">
            {on ? "Taking new clients" : "Not taking new clients"}
          </span>
          <span className="mt-0.5 block text-sm leading-relaxed text-muted">
            {on
              ? "Matching requests appear below. Turn this off when your book is full."
              : "You will not be shown any requests while this is off, and you are not charged any differently."}
          </span>
        </span>
        <span
          aria-hidden="true"
          className={
            on
              ? "relative h-6 w-11 shrink-0 rounded-full bg-sage transition-colors"
              : "relative h-6 w-11 shrink-0 rounded-full bg-line transition-colors"
          }
        >
          <span
            className={
              on
                ? "absolute left-[1.375rem] top-0.5 h-5 w-5 rounded-full bg-white transition-all"
                : "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-all"
            }
          />
        </span>
      </button>
      {error ? (
        <div className="mt-3">
          <Notice tone="alert">{error}</Notice>
        </div>
      ) : null}
    </div>
  );
}
