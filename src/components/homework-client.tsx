"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, Empty, SectionHeading } from "@/components/ui/card";
import { formatRelative } from "@/lib/date";
import type { HomeworkItem, HomeworkItemStatus, HomeworkList } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Homework, framed as small follow-ups rather than assignments. The third
 * state — "let it go" — matters: a task consciously dropped should not sit
 * there looking like a failure.
 */
export function HomeworkClient({ lists }: { lists: HomeworkList[] }) {
  const router = useRouter();
  const [composing, setComposing] = useState(false);

  const active = lists.filter((list) => list.status === "active");
  const done = lists.filter((list) => list.status === "completed");

  return (
    <div className="space-y-5">
      {composing ? (
        <NewList onDone={() => { setComposing(false); router.refresh(); }} onCancel={() => setComposing(false)} />
      ) : (
        <Button onClick={() => setComposing(true)}>Add something to work on</Button>
      )}

      {active.length === 0 && done.length === 0 ? (
        <Empty
          title="Nothing on the list"
          body="Small follow-ups live here — one thing to try before the week is out, not a to-do list for your whole life."
        />
      ) : null}

      {active.map((list) => (
        <ListCard key={list.id} list={list} onChange={() => router.refresh()} />
      ))}

      {done.length > 0 ? (
        <section>
          <SectionHeading title="Finished" hint={`${done.length} done`} />
          <div className="space-y-3">
            {done.map((list) => (
              <ListCard key={list.id} list={list} onChange={() => router.refresh()} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ListCard({ list, onChange }: { list: HomeworkList; onChange: () => void }) {
  const [items, setItems] = useState(list.items);
  const [busy, setBusy] = useState(false);

  const settled = items.filter((item) => item.status !== "pending").length;

  async function setStatus(item: HomeworkItem, status: HomeworkItemStatus) {
    const next = status === item.status ? "pending" : status;
    setItems((current) =>
      current.map((row) =>
        row.id === item.id ? { ...row, status: next, completed: next === "completed" } : row,
      ),
    );
    try {
      await fetch("/api/homework", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, status: next }),
      });
    } catch {
      setItems(list.items);
    }
  }

  async function act(action: "complete" | "reopen" | "delete") {
    setBusy(true);
    try {
      await fetch("/api/homework", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listId: list.id, action }),
      });
      onChange();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className={cn(list.status === "completed" && "opacity-70")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-lg leading-snug text-ink">{list.title}</h3>
          {list.description ? (
            <p className="mt-1 text-sm leading-relaxed text-muted">{list.description}</p>
          ) : null}
          <p className="mt-1.5 text-xs text-faint">
            {list.source_type === "manual" ? "Added by you" : `From ${list.source_type}`} ·{" "}
            {formatRelative(list.created_at)}
            {list.due_date ? ` · due ${new Date(list.due_date).toLocaleDateString()}` : ""}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-sage-soft px-2.5 py-1 text-xs text-sage-deep">
          {settled}/{items.length}
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className={cn(
              "rounded-xl border px-4 py-3",
              item.status === "completed" && "border-sage/40 bg-sage-soft",
              item.status === "not_completed" && "border-line bg-surface opacity-60",
              item.status === "pending" && "border-line bg-raised",
            )}
          >
            <p
              className={cn(
                "text-sm leading-relaxed",
                item.status === "completed" ? "text-ink" : "text-muted",
                item.status === "not_completed" && "line-through",
              )}
            >
              {item.text}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => void setStatus(item, "completed")}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  item.status === "completed"
                    ? "border-sage bg-sage text-white"
                    : "border-line bg-raised text-muted hover:border-sage",
                )}
              >
                Did it
              </button>
              <button
                type="button"
                onClick={() => void setStatus(item, "not_completed")}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-colors",
                  item.status === "not_completed"
                    ? "border-faint bg-line/60 text-muted"
                    : "border-line bg-raised text-muted hover:border-faint",
                )}
              >
                Letting this one go
              </button>
              {item.priority === "high" ? (
                <span className="rounded-full bg-clay-soft px-3 py-1 text-xs text-clay">
                  The main one
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
        {list.status === "active" ? (
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void act("complete")}>
            Mark the whole thing done
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => void act("reopen")}>
            Reopen
          </Button>
        )}
        <Button size="sm" variant="ghost" disabled={busy} onClick={() => void act("delete")}>
          Remove
        </Button>
      </div>
    </Card>
  );
}

function NewList({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [steps, setSteps] = useState<string[]>([""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filled = steps.map((step) => step.trim()).filter(Boolean);

  async function save() {
    if (!title.trim() || filled.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          items: filled.map((text, index) => ({
            text,
            priority: index === 0 ? "high" : "normal",
          })),
        }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? "Could not save that.");
      }
      onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save that.");
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionHeading
        title="What are you working on?"
        hint="Two or three small steps. The first one is treated as the main one."
      />

      <label htmlFor="hw-title" className="text-sm font-medium text-ink">
        Call it something
      </label>
      <input
        id="hw-title"
        value={title}
        maxLength={120}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Getting through Thursday's presentation"
        className="mt-1.5 w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink placeholder:text-faint focus:border-sage"
      />

      <p className="label mb-2 mt-5">Steps</p>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <input
            key={index}
            value={step}
            maxLength={300}
            onChange={(event) =>
              setSteps((current) => current.map((row, i) => (i === index ? event.target.value : row)))
            }
            placeholder={index === 0 ? "The one that matters most" : "Something smaller"}
            className="w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink placeholder:text-faint focus:border-sage"
          />
        ))}
      </div>

      {steps.length < 8 ? (
        <button
          type="button"
          onClick={() => setSteps((current) => [...current, ""])}
          className="mt-2 text-sm text-sage-deep underline underline-offset-4"
        >
          Add another step
        </button>
      ) : null}

      {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}

      <div className="mt-5 flex gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="flex-1" disabled={busy || !title.trim() || filled.length === 0} onClick={() => void save()}>
          {busy ? "Saving…" : "Save"}
        </Button>
      </div>
    </Card>
  );
}
