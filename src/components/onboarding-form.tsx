"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const bringYouHereOptions = ["Anxiety", "Stress", "Relationships", "Work", "Loneliness", "Just want to talk"] as const;
const therapistStyles = ["Calm Listener", "Practical Coach", "Deep Psychologist", "Motivational Guide"] as const;

export function OnboardingForm() {
  const [step, setStep] = useState(1);
  const [bringsYouHere, setBringsYouHere] = useState<string[]>(["Anxiety"]);
  const [currentMood, setCurrentMood] = useState(6);
  const [therapistStyle, setTherapistStyle] = useState<(typeof therapistStyles)[number]>("Practical Coach");
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggleReason(reason: string) {
    setBringsYouHere((current) => (current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason]));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bringsYouHere,
        currentMood,
        therapistStyle
      })
    });

    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Unable to save your onboarding.");
      return;
    }

    setCompleted(true);
    setTimeout(() => {
      router.push("/coach");
      router.refresh();
    }, 1000);
  }

  if (completed) {
    return (
      <Card className="max-w-3xl">
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <CheckCircle2 className="h-12 w-12 text-pine" />
          <h1 className="mt-5 font-display text-4xl text-ink">You’re set</h1>
          <p className="mt-3 max-w-xl text-sm text-pine/70">
            Your support style, current mood, and starting context have been saved. Opening your first support session now.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.24em] text-pine/60">Onboarding</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Set the tone before the first therapy session</h1>
        <p className="mt-2 text-sm text-pine/70">Three quick steps so the app knows what kind of support to give you.</p>
      </div>

      <div className="mb-8 flex gap-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className={`h-2 flex-1 rounded-full ${item <= step ? "bg-pine" : "bg-sand"}`} />
        ))}
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        {step === 1 ? (
          <div>
            <p className="font-display text-3xl text-ink">What brings you here today?</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {bringYouHereOptions.map((option) => (
                <button
                  key={option}
                  className={`rounded-full px-5 py-3 text-sm transition ${bringsYouHere.includes(option) ? "bg-pine text-white" : "bg-sand text-ink"}`}
                  type="button"
                  onClick={() => toggleReason(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <p className="font-display text-3xl text-ink">How are you feeling right now?</p>
            <div className="mt-6 rounded-[28px] bg-sand/70 p-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-pine/70">Low</span>
                <span className="font-display text-5xl text-ink">{currentMood}</span>
                <span className="text-sm text-pine/70">High</span>
              </div>
              <input
                className="mt-5 w-full"
                type="range"
                min={1}
                max={10}
                value={currentMood}
                onChange={(event) => setCurrentMood(Number(event.target.value))}
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <p className="font-display text-3xl text-ink">Choose therapist style</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {therapistStyles.map((style) => (
                <button
                  key={style}
                  className={`rounded-[24px] border p-5 text-left transition ${therapistStyle === style ? "border-pine bg-pine text-white" : "border-pine/10 bg-white text-ink"}`}
                  type="button"
                  onClick={() => setTherapistStyle(style)}
                >
                  <p className="font-medium">{style}</p>
                  <p className={`mt-2 text-sm ${therapistStyle === style ? "text-white/80" : "text-pine/70"}`}>
                    {style === "Calm Listener"
                      ? "Gentle, validating, and steady."
                      : style === "Practical Coach"
                        ? "Direct, structured, and action-oriented."
                        : style === "Deep Psychologist"
                          ? "Insightful, pattern-focused, and reflective."
                          : "Encouraging, energizing, and future-facing."}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-coral">{error}</p> : null}

        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" disabled={step === 1 || saving} onClick={() => setStep((current) => current - 1)}>
            Back
          </Button>
          {step < 3 ? (
            <Button type="button" disabled={(step === 1 && !bringsYouHere.length) || saving} onClick={() => setStep((current) => current + 1)}>
              Continue
            </Button>
          ) : (
            <Button disabled={saving}>{saving ? "Saving..." : "Start first session"}</Button>
          )}
        </div>
      </form>
    </Card>
  );
}
