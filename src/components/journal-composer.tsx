"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";
import { CrisisCard } from "@/components/crisis-card";
import { clientLocalDate } from "@/lib/date";
import type { EmotionalAnalysis } from "@/lib/types";

type Result = {
  analysis: EmotionalAnalysis | null;
  crisis: boolean;
  needsConsent: boolean;
  limited: string | null;
};

const PROMPTS = [
  "What is taking up the most room in your head right now?",
  "What happened, and what did you decide it meant?",
  "What would you tell a friend in the same position?",
  "What are you avoiding thinking about?",
  "What went better than you expected today?",
  "What do you keep replaying?",
];

export function JournalComposer({ aiConsent }: { aiConsent: boolean }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [prompt, setPrompt] = useState<string | null>(null);

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed) return;

    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed, localDate: clientLocalDate() }),
      });
      const payload = await response.json();
      if (!response.ok && response.status !== 429) {
        throw new Error(payload?.error ?? "Could not save that.");
      }

      setResult({
        analysis: payload.analysis ?? null,
        crisis: Boolean(payload.crisis),
        needsConsent: Boolean(payload.needsConsent),
        limited: response.status === 429 ? (payload?.error ?? null) : null,
      });
      setBody("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save that.");
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="animate-fade-up space-y-5">
        {result.crisis ? (
          <>
            <p className="text-[0.95rem] leading-relaxed text-ink">
              That&rsquo;s saved. Given what you wrote, it has been left uninterpreted — this is not
              a moment for a tool to offer a reframe.
            </p>
            <CrisisCard />
          </>
        ) : null}

        {!result.crisis && result.analysis ? (
          <article className="space-y-5">
            <div>
              <p className="label mb-1.5">What I heard</p>
              <p className="text-[0.95rem] leading-relaxed text-ink">{result.analysis.summary}</p>
            </div>

            {result.analysis.emotionalThemes.length > 0 ? (
              <div>
                <p className="label mb-2">Themes</p>
                <div className="flex flex-wrap gap-1.5">
                  {result.analysis.emotionalThemes.map((theme) => (
                    <span
                      key={theme}
                      className="rounded-full bg-sage-soft px-3 py-1 text-xs text-sage-deep"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {result.analysis.triggers.length > 0 ? (
              <div>
                <p className="label mb-1.5">What seemed to set it off</p>
                <p className="text-sm text-muted">{result.analysis.triggers.join(" · ")}</p>
              </div>
            ) : null}

            {result.analysis.distortions.length > 0 ? (
              <div className="rounded-xl border border-line bg-paper p-4">
                <p className="label mb-1.5">Patterns worth noticing</p>
                <ul className="space-y-1">
                  {result.analysis.distortions.map((item) => (
                    <li key={item} className="text-sm leading-relaxed text-ink">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </article>
        ) : null}

        {!result.crisis && !result.analysis && !result.needsConsent ? (
          <Notice>
            Saved. Reflection wasn&rsquo;t available just now, so this entry hasn&rsquo;t been
            interpreted — nothing is lost, and it still counts towards your patterns.
          </Notice>
        ) : null}

        {result.needsConsent ? (
          <Notice>
            Your entry is saved. Reflection is switched off — turn it on in{" "}
            <Link href="/settings" className="text-sage-deep underline underline-offset-4">
              settings
            </Link>{" "}
            if you want entries sent to the AI for a response.
          </Notice>
        ) : null}

        {result.limited ? (
          <Notice tone="alert">
            {result.limited}{" "}
            <Link href="/upgrade" className="underline underline-offset-4">
              See what changes on Pro
            </Link>
            . Your entry saved either way.
          </Notice>
        ) : null}

        <Button variant="secondary" onClick={() => setResult(null)}>
          Write another
        </Button>
      </div>
    );
  }

  return (
    <div>
      <label htmlFor="journal-body" className="sr-only">
        Journal entry
      </label>
      <textarea
        id="journal-body"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={9}
        maxLength={6000}
        placeholder={prompt ?? "However it comes out is fine. No one else reads this."}
        className="w-full resize-y rounded-2xl border border-line bg-raised p-4 text-[0.95rem] leading-relaxed text-ink placeholder:text-faint focus:border-sage"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)] ?? null)}
          className="text-xs text-faint underline underline-offset-4 hover:text-muted"
        >
          Give me a prompt
        </button>
        <span className="ml-auto text-xs tabular-nums text-faint">{body.length}/6000</span>
      </div>

      {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}

      <Button className="mt-4 w-full" disabled={!body.trim() || busy} onClick={() => void submit()}>
        {busy ? (aiConsent ? "Saving and reflecting…" : "Saving…") : "Save entry"}
      </Button>

      <p className="mt-3 text-xs leading-relaxed text-faint">
        {aiConsent
          ? "Entries are sent to OpenAI to generate a reflection. Turn this off in settings at any time."
          : "Reflection is off — entries are stored and never sent anywhere."}
      </p>
    </div>
  );
}
