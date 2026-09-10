"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, Notice } from "@/components/ui/card";
import { CrisisCard } from "@/components/crisis-card";
import { clientLocalDate } from "@/lib/date";
import { SCIENCE_TAGS, SCIENCE_TOPICS, type ScienceTopic } from "@/lib/science";
import { cn } from "@/lib/utils";

type Answer = {
  title: string;
  explanation: string;
  takeaway: string;
  caveat: string;
};

export function ScienceCheckClient({ aiConsent }: { aiConsent: boolean }) {
  const [open, setOpen] = useState<ScienceTopic | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crisis, setCrisis] = useState(false);

  const shown = tag ? SCIENCE_TOPICS.filter((topic) => topic.tag === tag) : SCIENCE_TOPICS;

  async function ask() {
    const text = question.trim();
    if (!text) return;
    setBusy(true);
    setError(null);
    setCrisis(false);
    setAnswer(null);
    try {
      const response = await fetch("/api/science-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, localDate: clientLocalDate() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setCrisis(Boolean(payload?.crisis));
        throw new Error(payload?.error ?? "That didn't work.");
      }
      setAnswer(payload.answer);
      setOpen(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  if (open) {
    return (
      <article className="animate-fade-up">
        <button
          type="button"
          onClick={() => setOpen(null)}
          className="text-sm text-muted underline underline-offset-4 hover:text-ink"
        >
          &larr; All questions
        </button>

        <h2 className="mt-5 font-serif text-2xl leading-snug text-ink">{open.question}</h2>

        <div className="mt-5 space-y-4">
          {open.explanation.map((paragraph) => (
            <p key={paragraph.slice(0, 40)} className="leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-sage/25 bg-sage-soft p-5">
          <p className="label mb-1.5 text-sage-deep">The short version</p>
          <p className="leading-relaxed text-ink">{open.takeaway}</p>
        </div>

        <div className="mt-4 rounded-2xl border border-line bg-surface p-5">
          <p className="label mb-1.5">What this doesn&rsquo;t cover</p>
          <p className="text-sm leading-relaxed text-muted">{open.caveat}</p>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-6">
      {answer ? (
        <article className="animate-fade-up card p-5">
          <p className="label mb-1.5">Your question</p>
          <h2 className="font-serif text-xl leading-snug text-ink">{answer.title}</h2>
          <div className="mt-4 space-y-3">
            {answer.explanation.split(/\n{2,}/).map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="leading-relaxed text-muted">
                {paragraph}
              </p>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-sage/25 bg-sage-soft p-4">
            <p className="label mb-1 text-sage-deep">The short version</p>
            <p className="leading-relaxed text-ink">{answer.takeaway}</p>
          </div>
          {answer.caveat ? (
            <p className="mt-4 border-t border-line pt-3 text-sm leading-relaxed text-muted">
              {answer.caveat}
            </p>
          ) : null}
          <Button variant="secondary" className="mt-5" onClick={() => setAnswer(null)}>
            Ask something else
          </Button>
        </article>
      ) : null}

      <Card>
        <label htmlFor="science-q" className="text-sm font-medium text-ink">
          Ask your own
        </label>
        <p className="mt-0.5 text-xs text-faint">
          What is happening in your body, explained rather than reassured away.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            id="science-q"
            value={question}
            maxLength={300}
            disabled={!aiConsent}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void ask();
            }}
            placeholder="Why do my hands go cold when I'm nervous?"
            className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink placeholder:text-faint focus:border-sage disabled:opacity-50"
          />
          <Button disabled={!question.trim() || busy || !aiConsent} onClick={() => void ask()}>
            {busy ? "Looking…" : "Ask"}
          </Button>
        </div>

        {!aiConsent ? (
          <p className="mt-3 text-xs leading-relaxed text-faint">
            Your own questions need AI turned on in{" "}
            <Link href="/settings" className="underline underline-offset-4">
              settings
            </Link>
            . The eight below work either way.
          </p>
        ) : null}

        {error ? (
          <div className="mt-3 space-y-3">
            <Notice tone="alert">{error}</Notice>
            {crisis ? <CrisisCard /> : null}
          </div>
        ) : null}
      </Card>

      <div>
        <div className="mb-4 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setTag(null)}
            className={cn(
              "rounded-full border px-3.5 py-2 text-sm transition-colors",
              tag === null
                ? "border-sage bg-sage-soft text-sage-deep"
                : "border-line bg-raised text-muted hover:border-sage/40",
            )}
          >
            Everything
          </button>
          {SCIENCE_TAGS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTag(item)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-sm transition-colors",
                tag === item
                  ? "border-sage bg-sage-soft text-sage-deep"
                  : "border-line bg-raised text-muted hover:border-sage/40",
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <ul className="grid gap-2.5 sm:grid-cols-2">
          {shown.map((topic) => (
            <li key={topic.id}>
              <button
                type="button"
                onClick={() => setOpen(topic)}
                className="flex h-full w-full flex-col rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-sage"
              >
                <h3 className="font-medium leading-snug text-ink">{topic.question}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{topic.takeaway}</p>
                <p className="mt-3 text-xs text-faint">{topic.tag}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
