"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, Notice, SectionHeading } from "@/components/ui/card";
import { CrisisCard } from "@/components/crisis-card";
import { clientLocalDate, formatRelative } from "@/lib/date";
import type { TwinProfileDraft, TwinReadiness } from "@/lib/twin";

type Session = { id: string; question: string; response: string; created_at: string };

const OPENERS = [
  "Why do I keep doing this?",
  "Is this as bad as it feels?",
  "What would you tell me if you were being honest?",
  "What am I not seeing here?",
];

export function TwinClient({
  profile: initialProfile,
  sessions: initialSessions,
  readiness,
  hasAccess,
  aiConsent,
  remaining,
}: {
  profile: TwinProfileDraft | null;
  sessions: Session[];
  readiness: TwinReadiness;
  hasAccess: boolean;
  aiConsent: boolean;
  remaining: number | null;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState(initialProfile);
  const [sessions, setSessions] = useState(initialSessions);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crisis, setCrisis] = useState(false);
  const [left, setLeft] = useState(remaining);

  /* ---------------------------------------------------------- gates */

  if (!hasAccess) {
    return (
      <Card>
        <SectionHeading
          title="Your Twin is part of Premium"
          hint="It reads your own entries and answers as someone who already knows the pattern."
        />
        <p className="text-sm leading-relaxed text-muted">
          It only works once there is something real to build from, which is why it sits behind the
          plan that assumes you have been using this a while.
        </p>
        <Link href="/upgrade" className="mt-4 inline-block">
          <Button>See what Premium includes</Button>
        </Link>
      </Card>
    );
  }

  if (!readiness.ready && !profile) {
    return (
      <Card>
        <SectionHeading
          title="Not enough to build on yet"
          hint="Your Twin is only worth having if it actually knows you."
        />
        <p className="text-sm leading-relaxed text-muted">
          It is built from your check-ins, journal entries and SOS sessions — not from a
          personality quiz. Right now there is not enough there for it to say anything true, and a
          Twin that guesses is worse than no Twin.
        </p>
        <ul className="mt-4 space-y-2">
          {readiness.missing.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-ink">
              <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-clay" />
              {item}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-faint">
          So far: {readiness.checkIns} check-ins, {readiness.journal} journal entries,{" "}
          {readiness.episodes} SOS sessions.
        </p>
      </Card>
    );
  }

  /* -------------------------------------------------------- actions */

  async function build() {
    setBuilding(true);
    setError(null);
    try {
      const response = await fetch("/api/twin", { method: "PUT" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Could not build that.");
      setProfile(payload.profile);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not build that.");
    } finally {
      setBuilding(false);
    }
  }

  async function ask(text: string) {
    const value = text.trim();
    if (!value || busy) return;
    setBusy(true);
    setError(null);
    setCrisis(false);
    setQuestion("");
    try {
      const response = await fetch("/api/twin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: value, localDate: clientLocalDate() }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setCrisis(Boolean(payload?.crisis));
        throw new Error(payload?.error ?? "That didn't work.");
      }
      setSessions((current) => [payload.session, ...current]);
      if (typeof payload.remaining === "number") setLeft(payload.remaining);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That didn't work.");
    } finally {
      setBusy(false);
    }
  }

  /* --------------------------------------------------------- render */

  return (
    <div className="space-y-5">
      {profile ? (
        <Card>
          <SectionHeading
            eyebrow="What it knows"
            title="Built from your own entries"
            hint="Nothing here was guessed. Every line comes from something you logged."
          />

          {profile.profile_summary ? (
            <p className="leading-relaxed text-ink">{profile.profile_summary}</p>
          ) : null}

          <div className="mt-5 space-y-4">
            <TraitList label="How you tend to run" items={profile.emotional_tendencies} />
            <TraitList label="Patterns that repeat" items={profile.thinking_patterns} />
            <TraitList label="What sets it off" items={profile.common_triggers} chips />
            <TraitList label="What you do with it" items={profile.behavioral_habits} />
          </div>

          <Button variant="ghost" size="sm" className="mt-4" disabled={building} onClick={() => void build()}>
            {building ? "Rebuilding…" : "Rebuild from my latest entries"}
          </Button>
        </Card>
      ) : (
        <Card>
          <SectionHeading
            title="Build your Twin"
            hint="It reads what you have logged and works out the pattern."
          />
          <Button disabled={building} onClick={() => void build()}>
            {building ? "Reading your entries…" : "Build it"}
          </Button>
          {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
        </Card>
      )}

      {profile ? (
        <Card>
          <SectionHeading eyebrow="Ask it" title="What do you want to know?" />

          {!aiConsent ? (
            <Notice>
              Your Twin needs AI turned on in{" "}
              <Link href="/settings" className="text-sage-deep underline underline-offset-4">
                settings
              </Link>
              .
            </Notice>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                <input
                  value={question}
                  maxLength={1000}
                  onChange={(event) => setQuestion(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void ask(question);
                  }}
                  placeholder="Ask it anything about you"
                  className="min-w-0 flex-1 rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink placeholder:text-faint focus:border-sage"
                />
                <Button disabled={!question.trim() || busy} onClick={() => void ask(question)}>
                  {busy ? "Thinking…" : "Ask"}
                </Button>
              </div>

              {sessions.length === 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {OPENERS.map((opener) => (
                    <button
                      key={opener}
                      type="button"
                      onClick={() => void ask(opener)}
                      className="rounded-full border border-line bg-raised px-3.5 py-2 text-sm text-muted transition-colors hover:border-sage hover:text-ink"
                    >
                      {opener}
                    </button>
                  ))}
                </div>
              ) : null}

              {typeof left === "number" ? (
                <p className="mt-3 text-xs text-faint">{left} questions left this month.</p>
              ) : null}
            </>
          )}

          {error ? (
            <div className="mt-3 space-y-3">
              <Notice tone="alert">{error}</Notice>
              {crisis ? <CrisisCard /> : null}
            </div>
          ) : null}
        </Card>
      ) : null}

      {sessions.map((session) => (
        <article key={session.id} className="card p-5">
          <p className="label mb-1.5">You asked</p>
          <p className="text-[0.95rem] leading-relaxed text-ink">{session.question}</p>
          <div className="mt-4 border-t border-line pt-4">
            <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink">
              {session.response}
            </p>
          </div>
          <p className="mt-3 text-xs text-faint">{formatRelative(session.created_at)}</p>
        </article>
      ))}
    </div>
  );
}

function TraitList({ label, items, chips }: { label: string; items: string[]; chips?: boolean }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="label mb-2">{label}</p>
      {chips ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span key={item} className="rounded-full bg-sage-soft px-3 py-1 text-xs text-sage-deep">
              {item}
            </span>
          ))}
        </div>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item} className="text-sm leading-relaxed text-muted">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
