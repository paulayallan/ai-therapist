"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChipGroup, ChoiceRow } from "@/components/choice-row";
import { Button } from "@/components/ui/button";
import { THERAPIST_STYLES, type SymptomFrequency, type TherapistStyle } from "@/lib/types";
import { cn } from "@/lib/utils";

const STEPS = ["name", "here", "challenges", "levels", "style", "consent"] as const;
type Step = (typeof STEPS)[number];

const HERE_FOR = [
  "Anxiety", "Panic attacks", "Overthinking", "Stress", "Low mood", "Sleep",
  "Work pressure", "Relationships", "Self-criticism", "Health worry", "Burnout",
];

const CHALLENGES = [
  "Racing thoughts", "Physical symptoms", "Avoiding things", "Trouble sleeping",
  "Snapping at people", "Feeling flat", "Can't switch off", "Second-guessing myself",
];

const TRIGGERS = [
  "Work", "Money", "Health", "Family", "Social situations", "Conflict",
  "Uncertainty", "Being alone", "News", "Mornings", "Late nights",
];

const COPING = [
  "Walking", "Music", "Talking to someone", "Breathing", "Writing",
  "Exercise", "Distraction", "Sleeping it off", "Nothing that works yet",
];

const GOALS = [
  "Fewer panic episodes", "Sleep better", "Overthink less", "Understand my triggers",
  "Be kinder to myself", "Handle work better", "Feel more like myself",
];

const FREQUENCY: { value: SymptomFrequency; label: string }[] = [
  { value: "occasionally", label: "Now and then" },
  { value: "few_times_week", label: "A few times a week" },
  { value: "most_days", label: "Most days" },
  { value: "every_day", label: "Every day" },
];

const SCALE_10 = [
  { value: 2, label: "Very low" },
  { value: 4, label: "Low" },
  { value: 6, label: "Middling" },
  { value: 8, label: "High" },
  { value: 10, label: "Very high" },
];

export function OnboardingForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("name");
  const [displayName, setDisplayName] = useState("");
  const [here, setHere] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [coping, setCoping] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [frequency, setFrequency] = useState<SymptomFrequency | null>(null);
  const [mood, setMood] = useState<number | null>(null);
  const [stress, setStress] = useState<number | null>(null);
  const [sleep, setSleep] = useState<number | null>(null);
  const [style, setStyle] = useState<TherapistStyle>("Calm Listener");
  const [consent, setConsent] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const index = STEPS.indexOf(step);
  const toggle = (list: string[], set: (next: string[]) => void) => (value: string) =>
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);

  function next() {
    const following = STEPS[index + 1];
    if (following) setStep(following);
  }
  function back() {
    const previous = STEPS[index - 1];
    if (previous) setStep(previous);
  }

  async function finish() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim() || null,
          bringsYouHere: here,
          currentMood: mood ?? 5,
          therapistStyle: style,
          mainChallenges: challenges,
          stressLevel: stress ?? 5,
          sleepQuality: sleep ?? 5,
          triggers,
          copingMethods: coping,
          goals,
          therapyExperience: "",
          symptomFrequency: frequency,
          aiConsent: consent ?? false,
        }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Could not save that.");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save that.");
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-8 flex gap-1.5" aria-hidden="true">
        {STEPS.map((item, position) => (
          <span
            key={item}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              position <= index ? "bg-sage" : "bg-line",
            )}
          />
        ))}
      </div>

      {step === "name" ? (
        <section className="animate-fade-up">
          <h1 className="font-serif text-2xl text-ink">What should this call you?</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            A first name, a nickname, or nothing at all. It only appears here.
          </p>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={60}
            placeholder="Optional"
            className="mt-5 w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink placeholder:text-faint focus:border-sage"
          />
        </section>
      ) : null}

      {step === "here" ? (
        <section className="animate-fade-up">
          <h1 className="font-serif text-2xl text-ink">What brings you here?</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Pick as many as fit. This shapes what the app puts in front of you.
          </p>
          <div className="mt-5">
            <ChipGroup legend="" options={HERE_FOR} values={here} onToggle={toggle(here, setHere)} />
          </div>
          <div className="mt-6">
            <ChoiceRow
              legend="How often does it show up?"
              options={FREQUENCY.map((f) => ({ value: f.value, label: f.label }))}
              value={frequency}
              onChange={setFrequency}
            />
          </div>
        </section>
      ) : null}

      {step === "challenges" ? (
        <section className="animate-fade-up space-y-6">
          <div>
            <h1 className="font-serif text-2xl text-ink">What does it actually look like?</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              The specifics matter more than the label.
            </p>
          </div>
          <ChipGroup
            legend="How it shows up"
            options={CHALLENGES}
            values={challenges}
            onToggle={toggle(challenges, setChallenges)}
          />
          <ChipGroup
            legend="What tends to set it off"
            options={TRIGGERS}
            values={triggers}
            onToggle={toggle(triggers, setTriggers)}
          />
          <ChipGroup
            legend="What already helps, even a bit"
            options={COPING}
            values={coping}
            onToggle={toggle(coping, setCoping)}
          />
        </section>
      ) : null}

      {step === "levels" ? (
        <section className="animate-fade-up space-y-6">
          <div>
            <h1 className="font-serif text-2xl text-ink">Where are things right now?</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              A starting point, so later weeks have something to compare against.
            </p>
          </div>
          <ChoiceRow legend="Mood lately" options={SCALE_10} value={mood} onChange={setMood} />
          <ChoiceRow legend="Stress lately" options={SCALE_10} value={stress} onChange={setStress} tone="clay" />
          <ChoiceRow legend="Sleep lately" options={SCALE_10} value={sleep} onChange={setSleep} />
          <ChipGroup
            legend="What would make a real difference?"
            options={GOALS}
            values={goals}
            onToggle={toggle(goals, setGoals)}
          />
        </section>
      ) : null}

      {step === "style" ? (
        <section className="animate-fade-up">
          <h1 className="font-serif text-2xl text-ink">How should it talk to you?</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            This changes the tone of support chat and written reflections. You can switch later.
          </p>
          <div className="mt-5 space-y-2">
            {THERAPIST_STYLES.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={style === option.id}
                onClick={() => setStyle(option.id)}
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-colors",
                  style === option.id
                    ? "border-sage bg-sage-soft"
                    : "border-line bg-raised hover:border-sage/40",
                )}
              >
                <p className="font-medium text-ink">{option.id}</p>
                <p className="mt-0.5 text-sm text-muted">{option.blurb}</p>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === "consent" ? (
        <section className="animate-fade-up">
          <h1 className="font-serif text-2xl text-ink">One decision about AI</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Mentara can send what you write to OpenAI, to reply in support chat and to reflect on
            journal entries. Everything else — SOS, tools, check-ins, journalling itself — works
            without it.
          </p>

          <div className="mt-5 space-y-2">
            <button
              type="button"
              aria-pressed={consent === true}
              onClick={() => setConsent(true)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-colors",
                consent === true ? "border-sage bg-sage-soft" : "border-line bg-raised hover:border-sage/40",
              )}
            >
              <p className="font-medium text-ink">Yes, turn AI support on</p>
              <p className="mt-0.5 text-sm text-muted">
                Support chat and written reflections work from day one.
              </p>
            </button>
            <button
              type="button"
              aria-pressed={consent === false}
              onClick={() => setConsent(false)}
              className={cn(
                "w-full rounded-xl border p-4 text-left transition-colors",
                consent === false ? "border-sage bg-sage-soft" : "border-line bg-raised hover:border-sage/40",
              )}
            >
              <p className="font-medium text-ink">Not for now</p>
              <p className="mt-0.5 text-sm text-muted">
                Nothing you write leaves the database. You can change this any time.
              </p>
            </button>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-faint">
            Either way: Mentara is not therapy and cannot diagnose anything. Text suggesting a crisis
            is never sent to an AI — the app shows you real crisis lines instead.
          </p>
        </section>
      ) : null}

      {error ? <p className="mt-4 text-sm text-clay">{error}</p> : null}

      <div className="mt-8 flex gap-2">
        {index > 0 ? (
          <Button variant="ghost" onClick={back}>
            Back
          </Button>
        ) : null}
        {step === "consent" ? (
          <Button className="flex-1" disabled={busy || consent === null} onClick={() => void finish()}>
            {busy ? "Setting up…" : "Start"}
          </Button>
        ) : (
          <Button className="flex-1" onClick={next}>
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
