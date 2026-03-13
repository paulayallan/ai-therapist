"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const challengeOptions = ["anxiety", "stress", "panic", "overthinking", "burnout", "emotional regulation"];
const goalOptions = ["calm mind", "reduce panic", "improve resilience", "sleep better", "feel more grounded"];

export function OnboardingForm() {
  const [mainChallenges, setMainChallenges] = useState<string[]>(["anxiety", "overthinking"]);
  const [stressLevel, setStressLevel] = useState(6);
  const [sleepQuality, setSleepQuality] = useState(5);
  const [triggers, setTriggers] = useState("work deadlines, uncertainty, conflict");
  const [copingMethods, setCopingMethods] = useState("walking, music, breathing");
  const [goals, setGoals] = useState<string[]>(["calm mind", "reduce panic"]);
  const [therapyExperience, setTherapyExperience] = useState("Some prior therapy");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function toggleValue(value: string, current: string[], setter: (values: string[]) => void) {
    setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mainChallenges,
        stressLevel,
        sleepQuality,
        triggers: triggers.split(",").map((item) => item.trim()).filter(Boolean),
        copingMethods: copingMethods.split(",").map((item) => item.trim()).filter(Boolean),
        goals,
        therapyExperience
      })
    });

    setSaving(false);

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setError(data?.error ?? "Unable to save your profile.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="max-w-3xl">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.24em] text-pine/60">Personalization</p>
        <h1 className="mt-2 font-display text-4xl text-ink">Build your mental health profile</h1>
        <p className="mt-2 text-sm text-pine/70">
          Your answers guide tone, exercises, and insight generation. This does not create a diagnosis.
        </p>
      </div>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-ink">Primary challenges</legend>
          <div className="flex flex-wrap gap-2">
            {challengeOptions.map((option) => (
              <Chip
                key={option}
                active={mainChallenges.includes(option)}
                onClick={() => toggleValue(option, mainChallenges, setMainChallenges)}
              >
                {option}
              </Chip>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 md:grid-cols-2">
          <SliderInput label="Current stress level" value={stressLevel} onChange={setStressLevel} />
          <SliderInput label="Sleep quality" value={sleepQuality} onChange={setSleepQuality} />
        </div>

        <TextInput
          label="Common triggers"
          value={triggers}
          onChange={setTriggers}
          placeholder="Comma-separated examples"
        />
        <TextInput
          label="Current coping habits"
          value={copingMethods}
          onChange={setCopingMethods}
          placeholder="Comma-separated examples"
        />

        <fieldset>
          <legend className="mb-3 text-sm font-medium text-ink">Goals</legend>
          <div className="flex flex-wrap gap-2">
            {goalOptions.map((option) => (
              <Chip key={option} active={goals.includes(option)} onClick={() => toggleValue(option, goals, setGoals)}>
                {option}
              </Chip>
            ))}
          </div>
        </fieldset>

        <TextInput
          label="Therapy experience"
          value={therapyExperience}
          onChange={setTherapyExperience}
          placeholder="Optional context for personalization"
        />

        {error ? <p className="text-sm text-coral">{error}</p> : null}
        <Button disabled={saving}>{saving ? "Saving..." : "Complete onboarding"}</Button>
      </form>
    </Card>
  );
}

function Chip({
  children,
  active,
  onClick
}: {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-full px-4 py-2 text-sm transition ${active ? "bg-pine text-white" : "bg-sand text-ink"}`}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SliderInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-[24px] bg-sand/70 p-4">
      <span className="text-sm text-ink">{label}</span>
      <div className="mt-3 flex items-center gap-3">
        <input className="w-full" type="range" min={1} max={10} value={value} onChange={(e) => onChange(Number(e.target.value))} />
        <span className="w-8 text-right text-sm text-pine">{value}</span>
      </div>
    </label>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-ink">{label}</span>
      <input
        className="w-full rounded-2xl border border-pine/15 bg-sand/70 px-4 py-3 outline-none focus:border-pine"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
