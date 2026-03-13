"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type SliderKey = "mood" | "anxietyLevel" | "energy" | "stress" | "sleepQuality";

const sliderLabels: Array<{ key: SliderKey; label: string }> = [
  { key: "mood", label: "Mood" },
  { key: "anxietyLevel", label: "Anxiety" },
  { key: "energy", label: "Energy" },
  { key: "stress", label: "Stress" },
  { key: "sleepQuality", label: "Sleep" }
];

export function MoodLogger() {
  const [values, setValues] = useState({
    mood: 6,
    anxietyLevel: 5,
    energy: 6,
    stress: 5,
    sleepQuality: 6
  });
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function updateValue(key: SliderKey, value: number) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function submitMood(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const response = await fetch("/api/mood", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, notes })
    });

    setSaving(false);
    setMessage(response.ok ? "Mood saved." : "Could not save mood log.");
  }

  return (
    <Card>
      <p className="font-display text-2xl text-ink">Daily mood log</p>
      <p className="mt-2 text-sm text-pine/70">Capture a quick snapshot to support trend tracking and pattern analysis.</p>
      <form className="mt-5 space-y-4" onSubmit={submitMood}>
        {sliderLabels.map(({ key, label }) => (
          <label key={key} className="block">
            <div className="mb-2 flex justify-between text-sm text-ink">
              <span>{label}</span>
              <span className="text-pine">{values[key]}</span>
            </div>
            <input
              className="w-full"
              type="range"
              min={1}
              max={10}
              value={values[key]}
              onChange={(event) => updateValue(key, Number(event.target.value))}
            />
          </label>
        ))}
        <textarea
          className="min-h-24 w-full rounded-2xl border border-pine/15 bg-sand/70 px-4 py-3 outline-none focus:border-pine"
          placeholder="Anything important about today?"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        {message ? <p className="text-sm text-pine">{message}</p> : null}
        <Button disabled={saving}>{saving ? "Saving..." : "Save mood log"}</Button>
      </form>
    </Card>
  );
}
