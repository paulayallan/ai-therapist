"use client";

import { useEffect, useState } from "react";
import { ALL_REGIONS, crisisResources, regionFromTimeZone, regionLabel } from "@/lib/safety";
import type { CrisisRegion } from "@/lib/types";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "mentara-crisis-region";

/**
 * Rendered by the app, never by a model. It appears whenever the safety screen
 * fires, and is reachable from settings and /sos regardless.
 *
 * The region is detected from the browser's timezone so the first number a
 * person sees is one they can actually call, and can be overridden — the
 * override is stored on the device, which is enough for a number to dial.
 */
/**
 * The quieter form, used when the *model* thought it saw risk rather than the
 * safety screen catching something definite.
 *
 * The full card must keep its weight, and it only keeps it if it stays rare.
 * Put it under every slightly low message and people learn to scroll past it —
 * and then it is not there when it is the thing that matters. So a model's
 * hunch gets one line, always openable, never in the way.
 */
export function CrisisHint({ className }: { className?: string }) {
  return (
    <details className={cn("group", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs text-clay/85 transition-colors hover:text-clay [&::-webkit-details-marker]:hidden">
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="transition-transform group-open:rotate-90"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
        If this is more than a hard moment
      </summary>
      <div className="mt-3">
        <CrisisCard tone="quiet" />
      </div>
    </details>
  );
}

export function CrisisCard({
  tone = "alert",
  className,
  allowRegionChange = true,
}: {
  tone?: "alert" | "quiet";
  className?: string;
  allowRegionChange?: boolean;
}) {
  const [region, setRegion] = useState<CrisisRegion>("AU");
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // Private browsing. Detection below still works.
    }
    if (stored && (ALL_REGIONS as string[]).includes(stored)) {
      setRegion(stored as CrisisRegion);
      return;
    }
    setRegion(regionFromTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone));
  }, []);

  function choose(next: CrisisRegion) {
    setRegion(next);
    setPicking(false);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Choice just won't persist.
    }
  }

  const resources = crisisResources(region);

  return (
    <section
      aria-labelledby="crisis-heading"
      className={cn(
        "rounded-2xl border p-5",
        tone === "alert" ? "border-clay/30 bg-clay-soft" : "border-line bg-surface",
        className,
      )}
    >
      <h2
        id="crisis-heading"
        className={cn("font-serif text-lg", tone === "alert" ? "text-clay" : "text-ink")}
      >
        If this is more than a hard moment
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Mentara cannot help with a crisis, and it should not try. These lines are staffed by people
        who can.
      </p>

      <ul className="mt-4 space-y-2.5">
        {resources.lines.map((line) => (
          <li key={line.name} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
            <span className={cn("font-medium", line.emergency ? "text-ink" : "text-ink")}>
              {line.name}
            </span>
            <span
              className={cn(
                "font-semibold tabular-nums",
                tone === "alert" ? "text-clay" : "text-sage-deep",
              )}
            >
              {line.contact}
            </span>
            {line.note ? <span className="text-xs text-faint">{line.note}</span> : null}
          </li>
        ))}
      </ul>

      <div className="mt-4 border-t border-line/70 pt-3">
        {picking ? (
          <div className="flex flex-wrap gap-1.5">
            {ALL_REGIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => choose(option)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs transition-colors",
                  option === region
                    ? "border-sage bg-sage-soft text-sage-deep"
                    : "border-line bg-raised text-muted hover:border-sage/50",
                )}
              >
                {regionLabel(option)}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs leading-relaxed text-faint">
            Showing lines for {resources.label}.{" "}
            {allowRegionChange ? (
              <button
                type="button"
                onClick={() => setPicking(true)}
                className="underline underline-offset-4 hover:text-muted"
              >
                Somewhere else?
              </button>
            ) : null}
          </p>
        )}
      </div>
    </section>
  );
}
