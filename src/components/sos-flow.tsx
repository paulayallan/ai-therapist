"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PhoneCall, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type GroundingState = {
  see: string;
  feel: string;
  hear: string;
  smell: string;
  taste: string;
};

const TOTAL_SECONDS = 90;

const stepLabels = [
  "Breathing",
  "Grounding",
  "Reassurance",
  "Body reset",
  "Check-in"
] as const;

const crisisCalls = [
  { label: "US & Canada", number: "988", href: "tel:988" },
  { label: "UK & ROI", number: "116123", href: "tel:116123" },
  { label: "Australia", number: "131114", href: "tel:131114" }
];

const triggerOptions = ["Work stress", "Social situation", "Relationship", "Overthinking", "Physical symptoms", "Unknown"] as const;
const locationOptions = ["Home", "Work", "Outside", "With people", "Alone"] as const;
const recoveryOptions = ["1-5 minutes", "5-10 minutes", "10-20 minutes", "20+ minutes"] as const;

export function SOSFlow() {
  const [stepIndex, setStepIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);
  const [grounding, setGrounding] = useState<GroundingState>({
    see: "",
    feel: "",
    hear: "",
    smell: "",
    taste: ""
  });
  const [checkIn, setCheckIn] = useState<"calmer" | "still-anxious" | null>(null);
  const [trigger, setTrigger] = useState<(typeof triggerOptions)[number] | null>(null);
  const [location, setLocation] = useState<(typeof locationOptions)[number] | null>(null);
  const [recoveryTime, setRecoveryTime] = useState<(typeof recoveryOptions)[number] | null>(null);
  const [savingPattern, setSavingPattern] = useState(false);
  const [patternSaved, setPatternSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!timerRunning || remainingSeconds === 0) return;

    const interval = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timerRunning, remainingSeconds]);

  const progress = useMemo(() => ((TOTAL_SECONDS - remainingSeconds) / TOTAL_SECONDS) * 100, [remainingSeconds]);
  const breathPhase = Math.floor((TOTAL_SECONDS - remainingSeconds) / 4) % 2 === 0 ? "Inhale" : "Exhale";

  function resetTimer() {
    setRemainingSeconds(TOTAL_SECONDS);
    setTimerRunning(false);
  }

  function nextStep() {
    setStepIndex((current) => Math.min(current + 1, stepLabels.length - 1));
  }

  function previousStep() {
    setStepIndex((current) => Math.max(current - 1, 0));
  }

  async function savePanicEpisode() {
    if (!checkIn || !trigger || !location || !recoveryTime) return;

    setSavingPattern(true);
    setSaveError(null);
    const response = await fetch("/api/panic-episodes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        checkIn,
        trigger,
        location,
        recoveryTime
      })
    });

    const data = await response.json().catch(() => null);
    setSavingPattern(false);

    if (!response.ok) {
      setSaveError(data?.error ?? "Could not save this panic pattern right now.");
      return;
    }

    setPatternSaved(true);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-none bg-white/92 p-6 shadow-[0_30px_90px_rgba(26,52,46,0.08)] md:p-8">
          <p className="text-sm uppercase tracking-[0.32em] text-pine/55">SOS Mode</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-ink md:text-6xl">Guided panic support</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-pine/78 md:text-2xl md:leading-10">
            Stay with one small step at a time. You do not need to fix the whole moment. We are helping your body feel
            safer first.
          </p>

          <div className="mt-8 space-y-4 rounded-[32px] bg-sand/55 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-pine/55">90-second panic timer</p>
                <p className="mt-2 text-3xl font-semibold text-ink md:text-4xl">
                  {Math.floor(remainingSeconds / 60)}:{String(remainingSeconds % 60).padStart(2, "0")}
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={resetTimer}>
                  <TimerReset className="mr-2 h-4 w-4" />
                  Reset
                </Button>
                <Button onClick={() => setTimerRunning((value) => !value)}>{timerRunning ? "Pause" : "Start timer"}</Button>
              </div>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-pine transition-[width] duration-1000" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-5">
            {stepLabels.map((label, index) => (
              <div
                key={label}
                className={`rounded-full px-4 py-3 text-center text-sm font-medium ${
                  index === stepIndex ? "bg-pine text-white" : "bg-sand/60 text-pine/70"
                }`}
              >
                {index + 1}. {label}
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[36px] bg-white p-6 ring-1 ring-pine/10 md:p-8">
            {stepIndex === 0 && (
              <div className="space-y-6">
                <div className="flex items-center justify-center">
                  <div className="relative flex h-48 w-48 items-center justify-center rounded-full bg-pine/10 md:h-64 md:w-64">
                    <div
                      className={`absolute rounded-full bg-pine/20 transition-all duration-[4000ms] ${
                        breathPhase === "Inhale" ? "h-44 w-44 md:h-56 md:w-56" : "h-28 w-28 md:h-36 md:w-36"
                      }`}
                    />
                    <div className="relative text-center">
                      <p className="text-xs uppercase tracking-[0.3em] text-pine/55">Step 1</p>
                      <p className="mt-2 text-3xl font-semibold text-ink md:text-5xl">{breathPhase}</p>
                      <p className="mt-2 text-base text-pine/75 md:text-xl">In for 4, out for 6</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 text-center">
                  <p className="text-2xl font-semibold text-ink md:text-3xl">Let the exhale be longer than the inhale.</p>
                  <p className="mx-auto max-w-2xl text-lg leading-8 text-pine/78 md:text-xl">
                    If you can, loosen your jaw, drop your shoulders, and let your hands rest somewhere supported.
                  </p>
                </div>
              </div>
            )}

            {stepIndex === 1 && (
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-pine/55">Step 2</p>
                  <h2 className="mt-2 font-display text-4xl text-ink md:text-5xl">5-4-3-2-1 grounding</h2>
                  <p className="mt-3 max-w-3xl text-lg leading-8 text-pine/78 md:text-xl">
                    Name what is around you. Short words are enough. You are helping your brain re-orient to the room.
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    ["see", "5 things you can see"],
                    ["feel", "4 things you can feel"],
                    ["hear", "3 things you can hear"],
                    ["smell", "2 things you can smell"],
                    ["taste", "1 thing you can taste"]
                  ].map(([key, label]) => (
                    <label key={key} className="block">
                      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
                      <textarea
                        className="min-h-24 w-full rounded-[24px] border border-pine/10 bg-sand/55 px-4 py-3 text-base text-ink outline-none focus:border-pine"
                        value={grounding[key as keyof GroundingState]}
                        onChange={(event) =>
                          setGrounding((current) => ({ ...current, [key]: event.target.value }))
                        }
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {stepIndex === 2 && (
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.3em] text-pine/55">Step 3</p>
                <h2 className="font-display text-4xl text-ink md:text-5xl">What panic is doing right now</h2>
                <div className="space-y-4 rounded-[28px] bg-pine/6 p-5 md:p-6">
                  <p className="text-xl leading-9 text-ink md:text-2xl md:leading-10">
                    Panic can make chest pressure, dizziness, racing thoughts, or numbness feel dangerous. Those sensations are
                    intense, but they are not proof that something terrible is happening.
                  </p>
                  <p className="text-lg leading-8 text-pine/80 md:text-xl">
                    Your nervous system is firing hard. It usually peaks, then drops. This moment is about riding the wave,
                    not winning an argument with it.
                  </p>
                </div>
              </div>
            )}

            {stepIndex === 3 && (
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.3em] text-pine/55">Step 4</p>
                <h2 className="font-display text-4xl text-ink md:text-5xl">Body reset</h2>
                <div className="space-y-4 text-lg leading-8 text-pine/82 md:text-xl">
                  <p>Press both feet into the ground for 10 seconds, then release.</p>
                  <p>Unclench your hands and soften your tongue away from the roof of your mouth.</p>
                  <p>Roll your shoulders back once, then let them drop.</p>
                  <p>If you can, sip cool water or hold something cold for 15 seconds.</p>
                  <p>Say out loud: “This is anxiety. It feels strong, and it will pass.”</p>
                </div>
              </div>
            )}

            {stepIndex === 4 && (
              <div className="space-y-6">
                <p className="text-xs uppercase tracking-[0.3em] text-pine/55">Step 5</p>
                <h2 className="font-display text-4xl text-ink md:text-5xl">Check in with your body</h2>
                <p className="max-w-3xl text-lg leading-8 text-pine/78 md:text-xl">
                  You do not need to feel perfect. We are only checking whether the intensity shifted at all.
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setCheckIn("calmer")}
                    className={`rounded-[28px] border px-5 py-6 text-left transition ${
                      checkIn === "calmer" ? "border-pine bg-pine text-white" : "border-pine/10 bg-sand/45 text-ink"
                    }`}
                  >
                    <p className="text-2xl font-semibold">A bit calmer</p>
                    <p className={`mt-2 text-base ${checkIn === "calmer" ? "text-white/85" : "text-pine/72"}`}>
                      Keep the timer going, take another long exhale, and move slowly back into the room.
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckIn("still-anxious")}
                    className={`rounded-[28px] border px-5 py-6 text-left transition ${
                      checkIn === "still-anxious" ? "border-coral bg-coral text-white" : "border-pine/10 bg-sand/45 text-ink"
                    }`}
                  >
                    <p className="text-2xl font-semibold">Still very anxious</p>
                    <p className={`mt-2 text-base ${checkIn === "still-anxious" ? "text-white/85" : "text-pine/72"}`}>
                      Start the AI support chat or call a crisis line if you feel unsafe or alone with it.
                    </p>
                  </button>
                </div>
                <div className="space-y-5 rounded-[28px] bg-sand/55 p-5 md:p-6">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-pine/55">Panic map</p>
                    <p className="mt-2 text-lg leading-8 text-pine/78 md:text-xl">
                      Help the app learn what tends to sit behind your panic so it can surface real patterns later.
                    </p>
                  </div>
                  <div>
                    <p className="text-base font-medium text-ink">What triggered this panic?</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {triggerOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setTrigger(option)}
                          className={`rounded-full px-4 py-2 text-sm transition ${
                            trigger === option ? "bg-pine text-white" : "bg-white text-ink ring-1 ring-pine/10"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-medium text-ink">Where were you when it started?</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {locationOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setLocation(option)}
                          className={`rounded-full px-4 py-2 text-sm transition ${
                            location === option ? "bg-pine text-white" : "bg-white text-ink ring-1 ring-pine/10"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-base font-medium text-ink">How long did it take to feel calmer?</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {recoveryOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setRecoveryTime(option)}
                          className={`rounded-full px-4 py-2 text-sm transition ${
                            recoveryTime === option ? "bg-pine text-white" : "bg-white text-ink ring-1 ring-pine/10"
                          }`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      onClick={savePanicEpisode}
                      disabled={!checkIn || !trigger || !location || !recoveryTime || savingPattern || patternSaved}
                    >
                      {patternSaved ? "Saved to panic map" : savingPattern ? "Saving..." : "Save panic pattern"}
                    </Button>
                    {patternSaved ? <p className="text-sm text-pine/70">This will feed the Panic Pattern Detection section in Insights.</p> : null}
                    {saveError ? <p className="text-sm text-coral">{saveError}</p> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/coach"
                    className="inline-flex items-center justify-center rounded-full bg-pine px-5 py-3 text-base font-medium text-white transition hover:bg-ink"
                  >
                    Start AI support chat
                  </Link>
                  <Link
                    href="/tools"
                    className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-base font-medium text-ink ring-1 ring-pine/10 transition hover:bg-sand/60"
                  >
                    Open regulation tools
                  </Link>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="secondary" disabled={stepIndex === 0} onClick={previousStep}>
                Back
              </Button>
              <Button onClick={nextStep} disabled={stepIndex === stepLabels.length - 1}>
                {stepIndex === stepLabels.length - 2 ? "Go to check-in" : "Next step"}
              </Button>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="border-none bg-pine p-6 text-white">
            <p className="text-sm uppercase tracking-[0.26em] text-white/55">Call support now</p>
            <div className="mt-4 space-y-3">
              {crisisCalls.map((resource) => (
                <a
                  key={resource.label}
                  href={resource.href}
                  className="flex items-center justify-between rounded-[22px] bg-white/10 px-4 py-4 transition hover:bg-white/15"
                >
                  <div>
                    <p className="text-sm text-white/65">{resource.label}</p>
                    <p className="text-2xl font-semibold">{resource.number}</p>
                  </div>
                  <PhoneCall className="h-5 w-5 text-white/75" />
                </a>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-white/72">
              If there is immediate danger, call local emergency services now.
            </p>
          </Card>

          <Card className="border-none bg-white/92 p-6">
            <p className="text-sm uppercase tracking-[0.26em] text-pine/55">Low stimulation mode</p>
            <p className="mt-3 text-xl leading-9 text-ink">
              Short prompts. Large text. Fewer choices. One step at a time.
            </p>
          </Card>

          <Card className="border-none bg-white/92 p-6">
            <p className="text-sm uppercase tracking-[0.26em] text-pine/55">Need another layer?</p>
            <p className="mt-3 text-lg leading-8 text-pine/78">
              If panic is easing but you still want help untangling the thought loop, move straight into the AI support chat.
            </p>
            <Link
              href="/coach"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-pine px-5 py-3 text-base font-medium text-white transition hover:bg-ink"
            >
              Start AI support chat
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
