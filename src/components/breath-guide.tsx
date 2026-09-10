"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { BreathPattern } from "@/lib/tools";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Phase = { key: "inhale" | "holdIn" | "exhale" | "holdOut"; label: string; seconds: number };

function buildPhases(pattern: BreathPattern): Phase[] {
  return (
    [
      { key: "inhale" as const, label: "Breathe in", seconds: pattern.inhale },
      { key: "holdIn" as const, label: "Hold", seconds: pattern.holdIn },
      { key: "exhale" as const, label: "Breathe out", seconds: pattern.exhale },
      { key: "holdOut" as const, label: "Rest", seconds: pattern.holdOut },
    ] satisfies Phase[]
  ).filter((phase) => phase.seconds > 0);
}

/**
 * A paced breathing circle: expands on the in-breath, contracts on the out.
 * One interval and one pure updater, so the label and the shape can never
 * drift apart.
 */
export function BreathGuide({
  pattern,
  onComplete,
}: {
  pattern: BreathPattern;
  onComplete?: () => void;
}) {
  const phases = useMemo(() => buildPhases(pattern), [pattern]);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState({
    cycle: 0,
    phaseIndex: 0,
    remaining: phases[0]?.seconds ?? 4,
    done: false,
  });
  const completedRef = useRef(false);

  const { cycle, phaseIndex, remaining, done } = tick;
  const phase = phases[phaseIndex] ?? phases[0];

  useEffect(() => {
    if (!running || phases.length === 0) return;

    const timer = window.setInterval(() => {
      setTick((current) => {
        if (current.remaining > 1) return { ...current, remaining: current.remaining - 1 };

        const nextIndex = (current.phaseIndex + 1) % phases.length;
        const nextCycle = nextIndex === 0 ? current.cycle + 1 : current.cycle;

        if (nextCycle >= pattern.cycles) {
          return { ...current, cycle: pattern.cycles, remaining: 0, done: true };
        }
        return {
          cycle: nextCycle,
          phaseIndex: nextIndex,
          remaining: phases[nextIndex]?.seconds ?? 4,
          done: false,
        };
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [running, phases, pattern.cycles]);

  useEffect(() => {
    if (!done) return;
    setRunning(false);
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete?.();
    }
  }, [done, onComplete]);

  function reset() {
    setRunning(false);
    setTick({ cycle: 0, phaseIndex: 0, remaining: phases[0]?.seconds ?? 4, done: false });
    completedRef.current = false;
  }

  const expanded = running && (phase?.key === "inhale" || phase?.key === "holdIn");
  const scale = running ? (expanded ? 1 : 0.62) : 0.82;
  const totalSeconds = phases.reduce((sum, item) => sum + item.seconds, 0) * pattern.cycles;

  return (
    <div className="flex flex-col items-center">
      <div className="relative grid h-56 w-56 place-items-center">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-sage-soft transition-transform ease-in-out"
          style={{
            transform: `scale(${scale})`,
            transitionDuration: `${(running ? (phase?.seconds ?? 1) : 1) * 1000}ms`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full border border-sage/25"
        />
        <div className="relative text-center">
          <p
            aria-live="polite"
            className={cn(
              "font-serif text-xl text-sage-deep transition-opacity",
              !running && !done && "opacity-60",
            )}
          >
            {done ? "Finished" : running ? phase?.label : "Ready"}
          </p>
          {running ? (
            <p className="mt-1 text-3xl font-light tabular-nums text-sage-deep">{remaining}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted">
            {running
              ? `Round ${Math.min(cycle + 1, pattern.cycles)} of ${pattern.cycles}`
              : done
                ? ""
                : `${pattern.cycles} rounds · about ${Math.max(1, Math.round(totalSeconds / 60))} min`}
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {done ? (
          <Button variant="secondary" onClick={reset}>
            Go again
          </Button>
        ) : (
          <>
            <Button onClick={() => setRunning((value) => !value)}>
              {running ? "Pause" : cycle > 0 || phaseIndex > 0 ? "Resume" : "Start"}
            </Button>
            {cycle > 0 || phaseIndex > 0 ? (
              <Button variant="ghost" onClick={reset}>
                Reset
              </Button>
            ) : null}
          </>
        )}
      </div>

      <p className="mt-4 max-w-xs text-center text-xs leading-relaxed text-faint">
        If the pacing feels wrong, ignore it and breathe at your own rate. Forcing the breath works
        against the point.
      </p>
    </div>
  );
}
