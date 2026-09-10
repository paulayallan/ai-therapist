"use client";

import { useState } from "react";
import Link from "next/link";
import type { Tool } from "@/lib/tools";
import { BreathGuide } from "@/components/breath-guide";
import { Button } from "@/components/ui/button";
import { clientLocalDate } from "@/lib/date";
import { cn } from "@/lib/utils";

export function ToolRunner({
  tool,
  initiallySaved,
}: {
  tool: Tool;
  initiallySaved: boolean;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [saved, setSaved] = useState(initiallySaved);

  const last = stepIndex >= tool.steps.length - 1;

  async function toggleSaved() {
    const next = !saved;
    setSaved(next);
    try {
      await fetch("/api/tools/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: tool.id, saved: next }),
      });
    } catch {
      setSaved(!next);
    }
  }

  async function finish() {
    setDone(true);
    try {
      // Recording that a tool was used feeds the patterns page. It is
      // best-effort: the session itself was the point.
      await fetch("/api/activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityType: "tool_completed",
          localDate: clientLocalDate(),
          reference: tool.id,
        }),
      });
    } catch {
      // Ignored on purpose.
    }
  }

  if (done) {
    return (
      <div className="animate-fade-up text-center">
        <p className="font-serif text-2xl text-ink">Done.</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Give it a minute before deciding whether it worked. The shift is usually smaller and
          slower than we expect it to be.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/tools">
            <Button variant="secondary">Back to tools</Button>
          </Link>
          <Link href="/journal">
            <Button variant="ghost">Write about it</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {tool.breath ? (
        <div className="mb-8">
          <BreathGuide pattern={tool.breath} />
        </div>
      ) : null}

      <ol className="space-y-2.5">
        {tool.steps.map((step, index) => {
          const active = index === stepIndex;
          const passed = index < stepIndex;
          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className={cn(
                "flex gap-3 rounded-xl border px-4 py-3.5 transition-colors",
                active && "border-sage bg-sage-soft",
                passed && "border-line bg-surface opacity-55",
                !active && !passed && "border-line bg-surface",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold",
                  active ? "bg-sage text-white" : "bg-line/60 text-faint",
                )}
              >
                {passed ? "✓" : index + 1}
              </span>
              <p className={cn("text-[0.95rem] leading-relaxed", active ? "text-ink" : "text-muted")}>
                {step}
              </p>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex items-center gap-2">
        {stepIndex > 0 ? (
          <Button variant="ghost" onClick={() => setStepIndex((index) => index - 1)}>
            Back
          </Button>
        ) : null}
        <Button
          className="flex-1"
          onClick={() => (last ? void finish() : setStepIndex((index) => index + 1))}
        >
          {last ? "I'm finished" : "Next step"}
        </Button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-faint">
          Step {stepIndex + 1} of {tool.steps.length} · about {tool.minutes} min
        </p>
        <button
          type="button"
          onClick={() => void toggleSaved()}
          className={cn(
            "text-xs underline underline-offset-4 transition-colors",
            saved ? "text-sage-deep" : "text-faint hover:text-muted",
          )}
        >
          {saved ? "Saved to your list" : "Save this one"}
        </button>
      </div>
    </div>
  );
}
