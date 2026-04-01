"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { Lock, Mic2 } from "lucide-react";
import type { StrategyResponse, StrategySession, SubscriptionPlan } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CrisisBanner } from "@/components/crisis-banner";

const modes = [
  {
    id: "decision",
    title: "Decision Lab",
    prompt: "Should I quit my job, text this person back, or leave my city?"
  },
  {
    id: "social",
    title: "Social Decoder",
    prompt: "Paste a message and ask what the tone, subtext, or likely intention is."
  },
  {
    id: "life",
    title: "Life Strategy",
    prompt: "Describe a transition you want and get a realistic path forward."
  },
  {
    id: "burnout",
    title: "Burnout OS",
    prompt: "Describe your work pattern, sleep, and stress so the system can suggest a reset."
  }
] as const;

export function StrategyClient() {
  const [mode, setMode] = useState<(typeof modes)[number]["id"]>("decision");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<StrategyResponse | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    const result = await fetch("/api/strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, message: input })
    });
    const data = await result.json().catch(() => null);
    setLoading(false);

    if (result.ok && data) {
      setResponse(data);
    }
  }

  const selectedMode = modes.find((item) => item.id === mode)!;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card>
        <div className="flex flex-wrap gap-2">
          {modes.map((item) => (
            <button
              key={item.id}
              className={`rounded-full px-4 py-2 text-sm transition ${mode === item.id ? "bg-pine text-white" : "bg-sand text-ink"}`}
              type="button"
              onClick={() => setMode(item.id)}
            >
              {item.title}
            </button>
          ))}
        </div>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <textarea
            className="min-h-36 w-full rounded-[24px] border border-pine/15 bg-sand/70 px-4 py-4 outline-none focus:border-pine"
            placeholder={selectedMode.prompt}
            value={input}
            onChange={(event) => setInput(event.target.value)}
          />
          <Button disabled={loading}>{loading ? "Analyzing..." : "Run strategy analysis"}</Button>
        </form>

        {response ? (
          <div className="mt-6 space-y-4 rounded-[28px] bg-mist/60 p-5">
            <div>
              <p className="font-medium text-ink">Situation summary</p>
              <p className="mt-2 text-sm text-pine/75">{response.situation_summary}</p>
            </div>
            <div>
              <p className="font-medium text-ink">Emotional dynamic</p>
              <p className="mt-2 text-sm text-pine/75">{response.emotional_dynamic}</p>
            </div>
            <div>
              <p className="font-medium text-ink">Key pattern</p>
              <p className="mt-2 text-sm text-pine/75">{response.key_pattern}</p>
            </div>
            <div>
              <p className="font-medium text-ink">Decision options</p>
              <div className="mt-3 grid gap-3">
                {response.options.map((option) => (
                  <div key={option.title} className="rounded-[22px] bg-white/70 p-4 text-sm">
                    <p className="font-medium text-ink">{option.title}</p>
                    <p className="mt-2 text-pine/75">Upside: {option.upside}</p>
                    <p className="mt-1 text-pine/75">Risk: {option.risk}</p>
                    <p className="mt-1 text-pine/75">Best if: {option.recommended_if}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="font-medium text-ink">Honest take</p>
              <p className="mt-2 text-sm text-pine/75">{response.honest_take}</p>
            </div>
            <div>
              <p className="font-medium text-ink">Next best step</p>
              <p className="mt-2 text-sm text-pine/75">{response.next_best_step}</p>
            </div>
            {response.show_crisis_resources ? <CrisisBanner /> : null}
          </div>
        ) : null}
      </Card>

      <div className="space-y-4">
        <Card className="bg-pine text-white">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5" />
            <p className="font-display text-2xl">Paid layer concept</p>
          </div>
          <p className="mt-3 text-sm text-white/80">
            This is the addictive layer: decision analysis, relationship decoding, life planning, and burnout optimization.
          </p>
          <div className="mt-4 rounded-[20px] bg-white/10 p-4 text-sm text-white/85">
            Free gets the user relief and weekly pattern snapshots. Pro is where the app starts feeling like it understands their whole life.
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <Mic2 className="h-5 w-5 text-pine" />
            <div>
              <p className="font-medium text-ink">Voice AI premium tier</p>
              <p className="mt-2 text-sm text-pine/70">
                Add voice conversations later for the highest retention tier and the strongest subscription hook.
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <p className="font-medium text-ink">Product principle</p>
          <p className="mt-2 text-sm text-pine/70">
            Keep the free layer simple and the paid layer sharp. Support now. Pattern recognition over time. Strategy when life gets complicated.
          </p>
        </Card>
      </div>
    </div>
  );
}

export function StrategyExperience({
  plan,
  sessions
}: {
  plan: SubscriptionPlan;
  sessions: StrategySession[];
}) {
  const hasAccess = plan === "pro" || plan === "premium";

  return (
    <div className="space-y-6">
      {hasAccess ? <StrategyClient /> : <StrategyPaywall />}
      <Card>
        <p className="font-display text-2xl text-ink">Strategy history</p>
        <div className="mt-4 space-y-3">
          {sessions.length ? (
            sessions.map((session) => (
              <div key={session.id} className="rounded-[22px] bg-sand/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-pine/60">{session.mode}</p>
                  <p className="text-sm text-pine/60">{formatDate(session.createdAt)}</p>
                </div>
                <p className="mt-2 text-sm text-ink">{session.prompt}</p>
                <p className="mt-2 text-sm text-pine/75">{session.response.honest_take}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-pine/70">No strategy sessions yet.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function StrategyPaywall() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="bg-pine text-white">
        <div className="flex items-center gap-3">
          <Lock className="h-5 w-5" />
          <p className="font-display text-3xl">Unlock the psychology OS</p>
        </div>
        <p className="mt-4 max-w-2xl text-sm text-white/80">
          Strategy is where the product becomes sticky: decision-making, relationship decoding, burnout analysis, and life
          planning tied to your emotional patterns over time.
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div className="rounded-[22px] bg-white/10 p-4 text-sm text-white/80">
            <p className="font-medium text-white">Decision Lab</p>
            <p className="mt-2">Should I quit, text back, leave, stay, or confront? Get options and an honest take.</p>
          </div>
          <div className="rounded-[22px] bg-white/10 p-4 text-sm text-white/80">
            <p className="font-medium text-white">Social Decoder</p>
            <p className="mt-2">Analyze tone, subtext, mixed signals, and what a message probably means.</p>
          </div>
          <div className="rounded-[22px] bg-white/10 p-4 text-sm text-white/80">
            <p className="font-medium text-white">Life Strategy</p>
            <p className="mt-2">Turn vague goals into 3- or 6-month transition plans.</p>
          </div>
          <div className="rounded-[22px] bg-white/10 p-4 text-sm text-white/80">
            <p className="font-medium text-white">Burnout OS</p>
            <p className="mt-2">Combine work stress, sleep, and energy into a realistic recovery plan.</p>
          </div>
        </div>
        <a className="mt-6 inline-block" href="/upgrade">
          <Button variant="secondary">Upgrade to Pro</Button>
        </a>
      </Card>
      <div className="space-y-4">
        <Card>
          <p className="font-medium text-ink">What stays free</p>
          <p className="mt-2 text-sm text-pine/70">
            Support chat, journaling, mood tracking, SOS mode, and weekly insight snapshots stay free.
          </p>
        </Card>
        <Card>
          <p className="font-medium text-ink">What unlocks</p>
          <p className="mt-2 text-sm text-pine/70">
            Deep pattern analysis, pattern memory, strategy history, decision analysis, social coaching, and burnout planning.
          </p>
          <a className="mt-4 inline-block" href="/upgrade">
            <Button variant="secondary">See plans</Button>
          </a>
        </Card>
      </div>
    </div>
  );
}
