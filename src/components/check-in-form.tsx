"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChipGroup, ChoiceRow } from "@/components/choice-row";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";
import { clientLocalDate } from "@/lib/date";
import type { DailyCheckIn, SleepQuality } from "@/lib/types";

const MOOD = [
  { value: 1, label: "Very low" },
  { value: 2, label: "Low" },
  { value: 3, label: "Okay" },
  { value: 4, label: "Good" },
  { value: 5, label: "Really good" },
];

/**
 * anxiety_level is 1–10 in the database. Five buttons is the right number to
 * tap daily, so each maps to an even step — existing 1–10 rows still display
 * and average correctly, and the column's constraint is untouched.
 */
const ANXIETY = [
  { value: 2, label: "Settled" },
  { value: 4, label: "Mild" },
  { value: 6, label: "Noticeable" },
  { value: 8, label: "High" },
  { value: 10, label: "Overwhelming" },
];

const SLEEP: { value: SleepQuality; label: string }[] = [
  { value: "very_poorly", label: "Awful" },
  { value: "poorly", label: "Poor" },
  { value: "okay", label: "Patchy" },
  { value: "well", label: "Decent" },
  { value: "very_well", label: "Rested" },
];

const FACTORS = [
  "Work", "Money", "Relationship", "Family", "Health", "Poor sleep",
  "Overthinking", "Social plans", "News", "Nothing obvious",
];

const SYMPTOMS = [
  "Tight chest", "Racing heart", "Stomach", "Headache", "Jaw or shoulders",
  "Restless", "Exhausted", "Shaky",
];

export function CheckInForm({ recent }: { recent: DailyCheckIn[] }) {
  const router = useRouter();
  const [today] = useState(() => clientLocalDate());
  const existing = recent.find((entry) => entry.local_date === today) ?? null;

  const [mood, setMood] = useState<number | null>(existing?.mood ?? null);
  const [anxiety, setAnxiety] = useState<number | null>(existing?.anxiety_level ?? null);
  const [sleep, setSleep] = useState<SleepQuality | null>(existing?.sleep_quality ?? null);
  const [factors, setFactors] = useState<string[]>(existing?.contributing_factors ?? []);
  const [symptoms, setSymptoms] = useState<string[]>(existing?.physical_symptoms ?? []);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [expanded, setExpanded] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(Boolean(existing));
  const [error, setError] = useState<string | null>(null);
  const [limit, setLimit] = useState<string | null>(null);

  const complete = mood !== null && anxiety !== null && sleep !== null;

  const toggle = (list: string[], set: (next: string[]) => void) => (value: string) => {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    setSaved(false);
  };

  async function submit() {
    if (!complete) return;
    setSaving(true);
    setError(null);
    setLimit(null);
    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          localDate: today,
          mood,
          anxietyLevel: anxiety,
          sleepQuality: sleep,
          contributingFactors: factors,
          physicalSymptoms: symptoms,
          notes: notes.trim() || null,
        }),
      });
      const payload = await response.json();

      if (response.status === 429) {
        setLimit(payload?.error ?? "You've reached today's check-in limit.");
        return;
      }
      if (!response.ok) throw new Error(payload?.error ?? "Could not save that.");

      setSaved(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save that.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <ChoiceRow legend="Mood" options={MOOD} value={mood} onChange={(v) => { setMood(v); setSaved(false); }} />
      <ChoiceRow
        legend="Anxiety"
        options={ANXIETY}
        value={anxiety}
        onChange={(v) => { setAnxiety(v); setSaved(false); }}
        tone="clay"
      />
      <ChoiceRow
        legend="Last night's sleep"
        options={SLEEP}
        value={sleep}
        onChange={(v) => { setSleep(v); setSaved(false); }}
      />

      {expanded ? (
        <div className="space-y-6 border-t border-line pt-5">
          <ChipGroup
            legend="What fed into it?"
            hint="Optional. This is what makes your patterns page worth reading."
            options={FACTORS}
            values={factors}
            onToggle={toggle(factors, setFactors)}
          />
          <ChipGroup
            legend="Anything in your body?"
            options={SYMPTOMS}
            values={symptoms}
            onToggle={toggle(symptoms, setSymptoms)}
          />
          <div>
            <label htmlFor="check-in-notes" className="text-sm font-medium text-ink">
              Anything worth noting?
            </label>
            <input
              id="check-in-notes"
              value={notes}
              maxLength={500}
              onChange={(event) => { setNotes(event.target.value); setSaved(false); }}
              placeholder="Slept badly, big meeting at 2"
              className="mt-2 w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink placeholder:text-faint focus:border-sage"
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-sm text-sage-deep underline underline-offset-4"
        >
          Add what fed into it
        </button>
      )}

      {error ? <p className="text-sm text-clay">{error}</p> : null}
      {limit ? (
        <Notice tone="alert">
          {limit}{" "}
          <Link href="/upgrade" className="underline underline-offset-4">
            See what changes on Pro
          </Link>
          .
        </Notice>
      ) : null}

      <div className="flex items-center gap-3">
        <Button onClick={() => void submit()} disabled={!complete || saving} className="flex-1">
          {saving ? "Saving…" : existing ? "Update today" : "Save check-in"}
        </Button>
        {saved && !saving ? (
          <span aria-live="polite" className="text-sm text-sage-deep">
            Saved
          </span>
        ) : null}
      </div>

      {!complete ? (
        <p className="text-xs text-faint">Mood, anxiety and sleep before you can save.</p>
      ) : null}
    </div>
  );
}
