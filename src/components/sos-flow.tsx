"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { BreathGuide } from "@/components/breath-guide";
import { Button } from "@/components/ui/button";
import { CrisisCard } from "@/components/crisis-card";
import { getTool } from "@/lib/tools";
import {
  PANIC_LOCATIONS,
  PANIC_TRIGGERS,
  type PanicCheckIn,
  type PanicLocation,
  type PanicRecovery,
  type PanicTrigger,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Stage = "arrive" | "breathe" | "ground" | "settle" | "log" | "closed";

const GROUNDING = getTool("five-senses");
const BREATH = getTool("physiological-sigh");

/** Elapsed time is measured, not asked. A guess at the end is worse data. */
function recoveryBucket(startedAt: number): PanicRecovery {
  const minutes = (Date.now() - startedAt) / 60_000;
  if (minutes < 5) return "1-5 minutes";
  if (minutes < 10) return "5-10 minutes";
  if (minutes < 20) return "10-20 minutes";
  return "20+ minutes";
}

/**
 * The rescue flow. Rules it follows: one thing on screen at a time, nothing
 * that needs a decision while activated, and an exit at every stage. Logging
 * comes last, once the person is already steadier — never before.
 *
 * Public: nobody should meet a sign-in wall mid-panic. Signed out, everything
 * works except the logging.
 */
export function SosFlow({ signedIn }: { signedIn: boolean }) {
  const [stage, setStage] = useState<Stage>("arrive");
  const [checkIn, setCheckIn] = useState<PanicCheckIn | null>(null);
  const [trigger, setTrigger] = useState<PanicTrigger | null>(null);
  const [location, setLocation] = useState<PanicLocation | null>(null);
  const [showResources, setShowResources] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logged, setLogged] = useState(false);
  const startedAt = useRef(Date.now());

  async function save() {
    if (!trigger || !location || !checkIn) {
      setStage("closed");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/panic-episode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trigger,
          location,
          recoveryTime: recoveryBucket(startedAt.current),
          checkIn,
        }),
      });
      if (response.ok) setLogged(true);
    } catch {
      // Silent. A failed log must never become one more thing to deal with.
    } finally {
      setSaving(false);
      setStage("closed");
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {stage === "arrive" ? (
        <section className="animate-fade-up text-center">
          <h1 className="font-serif text-3xl leading-tight text-ink">
            You&rsquo;re here. That&rsquo;s the hard part.
          </h1>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
            Nothing needs deciding right now. We&rsquo;ll slow the body first, then look around the
            room. It takes about three minutes.
          </p>

          <Button size="lg" className="mt-8 w-full" onClick={() => setStage("breathe")}>
            Start
          </Button>
          <button
            type="button"
            onClick={() => setShowResources((value) => !value)}
            className="mt-5 text-sm text-muted underline underline-offset-4 hover:text-ink"
          >
            I need a person, not an exercise
          </button>
          {showResources ? <CrisisCard className="mt-4 text-left" /> : null}
        </section>
      ) : null}

      {stage === "breathe" && BREATH?.breath ? (
        <section className="animate-fade-up">
          <header className="mb-6 text-center">
            <p className="label">Step one</p>
            <h1 className="mt-1.5 font-serif text-2xl text-ink">Let the out-breath be longer</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Two breaths in, one slow breath out. Follow the circle if it helps, ignore it if it
              doesn&rsquo;t.
            </p>
          </header>

          <BreathGuide pattern={BREATH.breath} />

          <div className="mt-8 flex gap-2">
            <Button variant="ghost" onClick={() => setStage("arrive")}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => setStage("ground")}>
              Next
            </Button>
          </div>
        </section>
      ) : null}

      {stage === "ground" && GROUNDING ? (
        <section className="animate-fade-up">
          <header className="mb-6 text-center">
            <p className="label">Step two</p>
            <h1 className="mt-1.5 font-serif text-2xl text-ink">Come back into the room</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Out loud or in your head. Take your time on each one.
            </p>
          </header>

          <ol className="space-y-2">
            {GROUNDING.steps.map((step) => (
              <li
                key={step}
                className="rounded-xl border border-line bg-surface px-4 py-4 text-center text-[0.95rem] text-ink"
              >
                {step}
              </li>
            ))}
          </ol>

          <div className="mt-8 flex gap-2">
            <Button variant="ghost" onClick={() => setStage("breathe")}>
              Back
            </Button>
            <Button className="flex-1" onClick={() => setStage("settle")}>
              Done
            </Button>
          </div>
        </section>
      ) : null}

      {stage === "settle" ? (
        <section className="animate-fade-up text-center">
          <h1 className="font-serif text-2xl text-ink">Where is it now?</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            It does not have to be gone. Partly down is the realistic outcome.
          </p>

          <div className="mt-6 flex gap-2">
            {(
              [
                { value: "calmer", label: "Calmer than it was" },
                { value: "still-anxious", label: "Still anxious" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setCheckIn(option.value)}
                aria-pressed={checkIn === option.value}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-4 text-sm transition-colors",
                  checkIn === option.value
                    ? "border-sage bg-sage-soft font-medium text-sage-deep"
                    : "border-line bg-raised text-muted hover:border-sage/40",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {checkIn === "still-anxious" ? (
            <div className="mt-6 text-left">
              <p className="mb-3 text-sm leading-relaxed text-muted">
                If it is holding at this level, that is worth taking seriously rather than pushing
                through alone.
              </p>
              <CrisisCard />
            </div>
          ) : null}

          <div className="mt-8 flex gap-2">
            <Button variant="ghost" onClick={() => setStage("closed")}>
              I&rsquo;m done
            </Button>
            <Button
              className="flex-1"
              disabled={!checkIn}
              onClick={() => setStage(signedIn ? "log" : "closed")}
            >
              {signedIn ? "Note what set it off" : "Finish"}
            </Button>
          </div>
        </section>
      ) : null}

      {stage === "log" ? (
        <section className="animate-fade-up">
          <header className="mb-5 text-center">
            <h1 className="font-serif text-2xl text-ink">What was around it?</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Only if you can. This is what makes the pattern visible later.
            </p>
          </header>

          <p className="label mb-2">What set it off</p>
          <div className="flex flex-wrap gap-1.5">
            {PANIC_TRIGGERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTrigger(trigger === option ? null : option)}
                aria-pressed={trigger === option}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm transition-colors",
                  trigger === option
                    ? "border-sage bg-sage-soft text-sage-deep"
                    : "border-line bg-raised text-muted hover:border-sage/40",
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <p className="label mb-2 mt-5">Where you were</p>
          <div className="flex flex-wrap gap-1.5">
            {PANIC_LOCATIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLocation(location === option ? null : option)}
                aria-pressed={location === option}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-sm transition-colors",
                  location === option
                    ? "border-sage bg-sage-soft text-sage-deep"
                    : "border-line bg-raised text-muted hover:border-sage/40",
                )}
              >
                {option}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-faint">
            How long it took is measured from when you opened this, so you don&rsquo;t have to
            estimate it.
          </p>

          <div className="mt-7 flex gap-2">
            <Button variant="ghost" onClick={() => setStage("closed")}>
              Skip
            </Button>
            <Button
              className="flex-1"
              disabled={saving || !trigger || !location}
              onClick={() => void save()}
            >
              {saving ? "Saving…" : "Save and close"}
            </Button>
          </div>
        </section>
      ) : null}

      {stage === "closed" ? (
        <section className="animate-fade-up text-center">
          <h1 className="font-serif text-2xl text-ink">That&rsquo;s enough for now.</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Getting through it counts, whatever it looked like. Be unremarkable for a while —
            water, a window, something dull.
          </p>
          {signedIn ? (
            <p className="mt-4 text-xs text-faint">
              {logged
                ? "Logged. It will show up in your patterns."
                : "Not logged — that's fine. Nothing was recorded about this one."}
            </p>
          ) : null}

          <div className="mt-7 flex flex-wrap justify-center gap-2">
            <Link href={signedIn ? "/dashboard" : "/"}>
              <Button variant="secondary">{signedIn ? "Back to today" : "Back"}</Button>
            </Link>
            <Link href="/tools">
              <Button variant="ghost">Something else</Button>
            </Link>
          </div>

          <div className="mt-8 text-left">
            <CrisisCard tone="quiet" />
          </div>
        </section>
      ) : null}
    </div>
  );
}
