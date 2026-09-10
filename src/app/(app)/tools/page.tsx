import Link from "next/link";
import type { Metadata } from "next";
import { ToolSuggestions } from "@/components/tool-suggestions";
import { SectionHeading } from "@/components/ui/card";
import { PLAN_LABEL, getEffectiveSubscriptionPlan } from "@/lib/billing";
import {
  getCheckIns,
  getJournalEntries,
  getMoodLogs,
  getPanicEpisodes,
  getSavedTools,
  getSubscription,
} from "@/lib/data";
import { deriveSignals } from "@/lib/signals";
import { TOOL_CATEGORIES, TOOLS, recommendTools } from "@/lib/tools";
import type { ToolTier } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tools",
  description: "Short, self-guided regulation exercises.",
};

const TIERS: Record<string, ToolTier[]> = {
  free: ["free"],
  pro: ["free", "pro"],
  premium: ["free", "pro", "premium"],
};

export default async function ToolsPage() {
  const [subscription, checkIns, panicEpisodes, journal, moodLogs, saved] = await Promise.all([
    getSubscription(),
    getCheckIns(45),
    getPanicEpisodes(30),
    getJournalEntries(12),
    getMoodLogs(30),
    getSavedTools(),
  ]);

  const plan = getEffectiveSubscriptionPlan(subscription);
  const allowed = TIERS[plan] ?? ["free"];
  const signals = deriveSignals({ checkIns, panicEpisodes, journal, moodLogs });
  const suggestions = recommendTools(signals, { allowedTiers: allowed, limit: 3 });
  const savedIds = new Set(saved.map((row) => row.tool_id));

  const hasSignal = Object.values(signals).some((value) => value > 0);

  return (
    <div className="stack space-y-8">
      <header>
        <h1 className="font-serif text-2xl text-ink sm:text-3xl">Tools</h1>
        <p className="mt-2 leading-relaxed text-muted">
          {TOOLS.length} short practices. Nothing takes longer than ten minutes, and none of it
          requires you to feel a particular way first.
        </p>
      </header>

      {hasSignal ? (
        <section>
          <SectionHeading
            eyebrow="For you"
            title="Closest to your last two weeks"
            hint="Chosen from your check-ins, SOS sessions and journal."
          />
          <ToolSuggestions suggestions={suggestions} />
        </section>
      ) : null}

      {savedIds.size > 0 ? (
        <section>
          <SectionHeading eyebrow="Saved" title="Your list" />
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {TOOLS.filter((tool) => savedIds.has(tool.id)).map((tool) => (
              <li key={tool.id}>
                <ToolCard tool={tool} locked={!allowed.includes(tool.tier)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {TOOL_CATEGORIES.map((category) => {
        const list = TOOLS.filter((tool) => tool.category === category.id);
        if (list.length === 0) return null;
        return (
          <section key={category.id}>
            <SectionHeading eyebrow={category.blurb} title={category.label} />
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {list.map((tool) => (
                <li key={tool.id}>
                  <ToolCard tool={tool} locked={!allowed.includes(tool.tier)} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ToolCard({ tool, locked }: { tool: (typeof TOOLS)[number]; locked: boolean }) {
  return (
    <Link
      href={locked ? "/upgrade" : `/tools/${tool.id}`}
      className={cn(
        "flex h-full flex-col rounded-2xl border bg-surface p-4 transition-colors",
        locked ? "border-line opacity-75 hover:border-sage/40" : "border-line hover:border-sage",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-ink">{tool.title}</h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-xs",
            locked ? "bg-line/60 text-faint" : "bg-sage-soft text-sage-deep",
          )}
        >
          {locked ? PLAN_LABEL[tool.tier] : `${tool.minutes} min`}
        </span>
      </div>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted">{tool.blurb}</p>
      <p className="mt-3 text-xs text-faint">{tool.tag}</p>
    </Link>
  );
}
