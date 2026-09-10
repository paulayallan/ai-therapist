"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";
import { CrisisCard, CrisisHint } from "@/components/crisis-card";
import { clientLocalDate } from "@/lib/date";
import type { ChatMessage, StructuredCoachResponse } from "@/lib/types";

type Bubble = {
  id: string;
  role: "user" | "assistant";
  content: string;
  structured?: StructuredCoachResponse | null;
  crisis?: boolean;
  /** "screen" — the safety screen fired. "model" — the model's own hunch. */
  crisisLevel?: "screen" | "model";
};

const OPENERS = [
  "I keep overthinking something that happened today",
  "My chest feels tight and I'm not sure why",
  "I can't sleep and my head won't stop",
  "I snapped at someone and I feel awful",
];

export function ChatClient({
  initialMessages,
  conversationId: initialConversationId,
  remaining,
  aiConsent,
}: {
  initialMessages: ChatMessage[];
  conversationId: string | null;
  remaining: number | null;
  aiConsent: boolean;
}) {
  const [messages, setMessages] = useState<Bubble[]>(
    initialMessages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        structured: m.structured_json,
      })),
  );
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limited, setLimited] = useState<string | null>(null);
  const [left, setLeft] = useState(remaining);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;

    setDraft("");
    setError(null);
    setLimited(null);
    setMessages((current) => [
      ...current,
      { id: `local-${Date.now()}`, role: "user", content: message },
    ]);
    setBusy(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, conversationId, localDate: clientLocalDate() }),
      });
      const payload = await response.json();

      if (response.status === 429) {
        setLimited(payload?.error ?? "You've reached your limit for now.");
        return;
      }
      if (!response.ok) throw new Error(payload?.error ?? "That didn't send.");

      if (payload.conversationId) setConversationId(payload.conversationId);
      if (typeof payload.remaining === "number") setLeft(payload.remaining);

      setMessages((current) => [
        ...current,
        {
          id: payload.messageId ?? `reply-${Date.now()}`,
          role: "assistant",
          content: payload.reply,
          structured: payload.structured ?? null,
          crisis: Boolean(payload.crisis),
          crisisLevel: payload.crisisLevel === "screen" ? "screen" : "model",
        },
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That didn't send.");
    } finally {
      setBusy(false);
    }
  }

  const empty = messages.length === 0;

  return (
    <div className="flex min-h-[70vh] flex-col">
      <div className="flex-1 space-y-4">
        {empty ? (
          <div className="py-6">
            <h1 className="font-serif text-2xl leading-snug text-ink">
              What&rsquo;s going on right now?
            </h1>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
              However you want to put it. There&rsquo;s no right way to start, and nothing here is
              read by another person.
            </p>
            <div className="mt-6 space-y-2">
              {OPENERS.map((opener) => (
                <button
                  key={opener}
                  type="button"
                  onClick={() => void send(opener)}
                  className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-left text-sm text-muted transition-colors hover:border-sage hover:text-ink"
                >
                  {opener}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {messages.map((bubble) =>
          bubble.role === "user" ? (
            <div key={bubble.id} className="pt-2">
              <p className="ml-auto max-w-[80%] whitespace-pre-wrap rounded-2xl bg-sage-soft px-4 py-2.5 text-[0.95rem] leading-relaxed text-ink">
                {bubble.content}
              </p>
            </div>
          ) : (
            /*
             * The reply is set as prose, not as a bubble. A box around it makes
             * it look like a notification; without one it reads like something
             * written to you, which is closer to what it is.
             */
            <div key={bubble.id} className="pb-2 pt-1">
              <div className="max-w-prose space-y-3 whitespace-pre-wrap text-[1.02rem] leading-[1.75] text-ink">
                {bubble.content}
              </div>

              {bubble.structured ? <StructuredExtras structured={bubble.structured} /> : null}

              {bubble.crisis ? (
                <div className="mt-4">
                  {bubble.crisisLevel === "screen" ? <CrisisCard /> : <CrisisHint />}
                </div>
              ) : null}
            </div>
          ),
        )}

        {busy ? (
          <div className="py-2">
            <span className="sr-only">Thinking</span>
            <span className="flex gap-1.5" aria-hidden="true">
              {[0, 1, 2].map((index) => (
                <span
                  key={index}
                  className="h-1.5 w-1.5 animate-pulse rounded-full bg-faint"
                  style={{ animationDelay: `${index * 160}ms` }}
                />
              ))}
            </span>
          </div>
        ) : null}

        <div ref={endRef} />
      </div>

      <div className="sticky bottom-0 -mx-5 mt-6 border-t border-line bg-paper/95 px-5 pb-4 pt-3 backdrop-blur-md">
        {error ? <p className="mb-2 text-sm text-clay">{error}</p> : null}
        {limited ? (
          <Notice tone="alert">
            {limited}{" "}
            <Link href="/upgrade" className="underline underline-offset-4">
              See what changes on Pro
            </Link>
            . SOS, tools and journalling are unaffected.
          </Notice>
        ) : null}
        {!aiConsent ? (
          <Notice>
            Support chat needs AI turned on.{" "}
            <Link href="/settings" className="text-sage-deep underline underline-offset-4">
              Turn it on in settings
            </Link>
            .
          </Notice>
        ) : null}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
          className="mt-2 flex items-end gap-2"
        >
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(draft);
              }
            }}
            rows={1}
            maxLength={4000}
            disabled={!aiConsent}
            placeholder="Say what's happening…"
            className="max-h-40 min-h-[3rem] flex-1 resize-none rounded-2xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink placeholder:text-faint focus:border-sage disabled:opacity-50"
          />
          <Button type="submit" disabled={!draft.trim() || busy || !aiConsent}>
            Send
          </Button>
        </form>

        <p className="mt-2 text-[0.7rem] leading-relaxed text-faint">
          Not therapy, and not monitored by a person.
          {typeof left === "number" ? ` ${left} messages left today.` : ""}
        </p>
      </div>
    </div>
  );
}

/**
 * The structured half of a coach reply.
 *
 * Three stacked cards of equal weight turn a reply into a form and bury the
 * one sentence that mattered. So: the question sits under the reply as a quiet
 * line of its own, and everything else is folded away behind one line of text
 * the person can open if they want it. Nothing is lost; it just stops shouting.
 */
function StructuredExtras({ structured }: { structured: StructuredCoachResponse }) {
  const items = [
    structured.thinkingPattern ? { label: "A pattern", body: structured.thinkingPattern } : null,
    structured.reframe ? { label: "Another reading", body: structured.reframe } : null,
    structured.exercise ? { label: "Worth trying", body: structured.exercise } : null,
  ].filter(Boolean) as { label: string; body: string }[];

  if (items.length === 0 && !structured.reflectionQuestion) return null;

  return (
    <div className="mt-4 max-w-prose space-y-3.5">
      {structured.reflectionQuestion ? (
        <p className="border-l-2 border-sage/35 pl-4 font-serif text-[1.05rem] leading-snug text-ink">
          {structured.reflectionQuestion}
        </p>
      ) : null}

      {items.length > 0 ? (
        <details className="group">
          <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs text-faint transition-colors hover:text-muted [&::-webkit-details-marker]:hidden">
            <svg
              viewBox="0 0 24 24"
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="transition-transform group-open:rotate-90"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
            {items.length === 1 ? "One thing I noticed" : `${items.length} things I noticed`}
          </summary>

          <dl className="mt-3 space-y-3 border-l border-line pl-4">
            {items.map((item) => (
              <div key={item.label}>
                <dt className="label">{item.label}</dt>
                <dd className="mt-1 text-[0.9rem] leading-relaxed text-muted">{item.body}</dd>
              </div>
            ))}
          </dl>
        </details>
      ) : null}
    </div>
  );
}
