"use client";

import { useMemo, useState } from "react";
import { Bookmark, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { PersonalizedTool, SavedTool, SubscriptionPlan, ToolTier } from "@/lib/types";
import { cn } from "@/lib/utils";

type ToolsLibraryProps = {
  plan: SubscriptionPlan;
  weeklyTools: PersonalizedTool[];
  savedTools: SavedTool[];
};

const sectionCopy: Record<Exclude<ToolTier, never>, { title: string; description: string }> = {
  free: {
    title: "Your weekly essentials",
    description: "The five tools your system is surfacing first based on how stress, anxiety, sleep, and reflection have been moving recently."
  },
  pro: {
    title: "Deeper support tools",
    description: "More layered practices for the patterns that tend to build underneath the obvious symptom."
  },
  premium: {
    title: "Premium regulation library",
    description: "Higher-personalization resets chosen for the exact ways pressure, panic, recovery, and interpretation seem to show up for you."
  }
};

export function ToolsLibrary({ plan, weeklyTools, savedTools }: ToolsLibraryProps) {
  const [activeToolId, setActiveToolId] = useState<string | null>(weeklyTools[0]?.id ?? null);
  const [savedToolIds, setSavedToolIds] = useState<string[]>(savedTools.map((tool) => tool.toolId));
  const [upsellMessage, setUpsellMessage] = useState<string | null>(null);
  const [savingToolId, setSavingToolId] = useState<string | null>(null);

  const sections = useMemo(
    () => ({
      free: weeklyTools.filter((tool) => tool.tier === "free"),
      pro: weeklyTools.filter((tool) => tool.tier === "pro"),
      premium: weeklyTools.filter((tool) => tool.tier === "premium")
    }),
    [weeklyTools]
  );

  const savedRecommendations = useMemo(
    () => weeklyTools.filter((tool) => savedToolIds.includes(tool.id)),
    [savedToolIds, weeklyTools]
  );

  const activeTool = weeklyTools.find((tool) => tool.id === activeToolId) ?? weeklyTools[0] ?? null;

  async function handleSaveTool(tool: PersonalizedTool) {
    if (plan !== "premium") {
      setUpsellMessage("Saving tools is part of Premium, so your regulation library stays with you as the weekly set refreshes.");
      return;
    }

    setUpsellMessage(null);
    setSavingToolId(tool.id);
    const shouldSave = !savedToolIds.includes(tool.id);

    const result = await fetch("/api/tools/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toolId: tool.id,
        saved: shouldSave
      })
    });

    setSavingToolId(null);

    if (!result.ok) {
      const data = await result.json().catch(() => null);
      setUpsellMessage(data?.error ?? "The tool could not be saved right now.");
      return;
    }

    setSavedToolIds((current) => (shouldSave ? [...current, tool.id] : current.filter((item) => item !== tool.id)));
  }

  return (
    <div className="space-y-6">
      <Card className="bg-sand/70">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="font-display text-2xl text-ink">Regulation tools</p>
            <p className="mt-2 max-w-2xl text-sm text-pine/72">
              Personalized practices for calming and re-centering. Your weekly set refreshes automatically as recent signals change.
            </p>
          </div>
          <div className="rounded-[22px] bg-white/80 px-4 py-3 text-sm text-pine/72">
            This week&apos;s set is reading from mood, journaling, support, SOS, sleep, and the way your profile has been taking shape.
          </div>
        </div>
      </Card>

      {activeTool ? (
        <Card className="bg-pine text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">Tool in focus</p>
              <p className="mt-3 font-display text-3xl">{activeTool.title}</p>
              <p className="mt-3 max-w-2xl text-sm text-white/82">{activeTool.description}</p>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/70">{activeTool.estimatedTime}</div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_300px]">
            <div className="rounded-[24px] bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-white/65">{activeTool.relevanceLabel}</p>
              <p className="mt-3 text-sm text-white/88">{activeTool.whyRecommended}</p>
              <div className="mt-5 space-y-3">
                {activeTool.steps.map((step, index) => (
                  <div key={step} className="flex gap-3 text-sm text-white/86">
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/12 text-xs">{index + 1}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[24px] bg-white/10 p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-white/60">Why it surfaced now</p>
              <p className="mt-3 text-sm text-white/82">
                Your system is trying to match the kind of support that fits this week&apos;s stress signature, not just the loudest symptom.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => handleSaveTool(activeTool)} disabled={savingToolId === activeTool.id}>
                  {savedToolIds.includes(activeTool.id) ? "Remove from saved" : "Save tool"}
                </Button>
                <Button variant="ghost" className="border border-white/20 text-white hover:bg-white/10" onClick={() => setUpsellMessage(null)}>
                  Keep exploring
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      {upsellMessage ? (
        <Card className="bg-[linear-gradient(180deg,rgba(255,251,245,0.98),rgba(247,239,224,0.92))]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="font-display text-2xl text-ink">Save tools with Premium</p>
              <p className="mt-2 max-w-2xl text-sm text-pine/72">{upsellMessage}</p>
            </div>
            <Link href="/upgrade">
              <Button className="bg-ink text-white hover:bg-ink/90">Unlock Premium</Button>
            </Link>
          </div>
        </Card>
      ) : null}

      <ToolsSection
        title={sectionCopy.free.title}
        description={sectionCopy.free.description}
        tools={sections.free}
        plan={plan}
        savedToolIds={savedToolIds}
        onStartTool={setActiveToolId}
        onSaveTool={handleSaveTool}
        savingToolId={savingToolId}
      />
      <ToolsSection
        title={sectionCopy.pro.title}
        description={sectionCopy.pro.description}
        tools={sections.pro}
        plan={plan}
        savedToolIds={savedToolIds}
        onStartTool={setActiveToolId}
        onSaveTool={handleSaveTool}
        savingToolId={savingToolId}
      />
      <ToolsSection
        title={sectionCopy.premium.title}
        description={sectionCopy.premium.description}
        tools={sections.premium}
        plan={plan}
        savedToolIds={savedToolIds}
        onStartTool={setActiveToolId}
        onSaveTool={handleSaveTool}
        savingToolId={savingToolId}
      />

      {plan === "premium" ? (
        <div className="space-y-4">
          <div>
            <p className="font-display text-2xl text-ink">Saved tools</p>
            <p className="mt-2 text-sm text-pine/72">Saved to your personal regulation library. These stay with your account even when the weekly set refreshes.</p>
          </div>
          {savedRecommendations.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {savedRecommendations.map((tool) => (
                <ToolCard
                  key={`saved-${tool.id}`}
                  tool={tool}
                  locked={false}
                  plan={plan}
                  isSaved
                  onStartTool={setActiveToolId}
                  onSaveTool={handleSaveTool}
                  savingToolId={savingToolId}
                />
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-sm text-pine/72">
                Your saved regulation library is still empty. Save any tool that feels especially effective and it will stay available here.
              </p>
            </Card>
          )}
        </div>
      ) : null}
    </div>
  );
}

function ToolsSection({
  title,
  description,
  tools,
  plan,
  savedToolIds,
  onStartTool,
  onSaveTool,
  savingToolId
}: {
  title: string;
  description: string;
  tools: PersonalizedTool[];
  plan: SubscriptionPlan;
  savedToolIds: string[];
  onStartTool: (toolId: string) => void;
  onSaveTool: (tool: PersonalizedTool) => void;
  savingToolId: string | null;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="font-display text-2xl text-ink">{title}</p>
        <p className="mt-2 max-w-2xl text-sm text-pine/72">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {tools.map((tool) => (
          <ToolCard
            key={tool.id}
            tool={tool}
            locked={!canAccessTier(plan, tool.tier)}
            plan={plan}
            isSaved={savedToolIds.includes(tool.id)}
            onStartTool={onStartTool}
            onSaveTool={onSaveTool}
            savingToolId={savingToolId}
          />
        ))}
      </div>
    </div>
  );
}

function ToolCard({
  tool,
  locked,
  plan,
  isSaved,
  onStartTool,
  onSaveTool,
  savingToolId
}: {
  tool: PersonalizedTool;
  locked: boolean;
  plan: SubscriptionPlan;
  isSaved: boolean;
  onStartTool: (toolId: string) => void;
  onSaveTool: (tool: PersonalizedTool) => void;
  savingToolId: string | null;
}) {
  const label = tool.tier === "pro" ? "Pro tool" : tool.tier === "premium" ? "Premium tool" : null;

  return (
    <Card className="relative overflow-hidden">
      <div className={cn("space-y-4 transition", locked && "pointer-events-none blur-[2px] opacity-45")}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-display text-2xl text-ink">{tool.title}</p>
            <p className="mt-2 text-sm text-pine/72">{tool.description}</p>
          </div>
          <div className="rounded-full bg-mist px-3 py-1 text-xs uppercase tracking-[0.2em] text-pine">{tool.estimatedTime}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-sand px-3 py-1 text-xs uppercase tracking-[0.18em] text-pine/70">{tool.tag}</span>
          <span className="rounded-full bg-mist px-3 py-1 text-xs uppercase tracking-[0.18em] text-pine/70">{tool.relevanceLabel}</span>
        </div>
        <p className="text-sm text-pine/74">{tool.whyRecommended}</p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => onStartTool(tool.id)}>Start tool</Button>
          <Button
            variant="ghost"
            className="border border-pine/10"
            onClick={() => onSaveTool(tool)}
            disabled={savingToolId === tool.id}
          >
            <Bookmark className="mr-2 h-4 w-4" />
            {isSaved ? "Saved" : "Save tool"}
          </Button>
        </div>
      </div>

      {locked ? (
        <div className="absolute inset-0 flex flex-col justify-between rounded-[28px] bg-white/55 p-6 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 text-pine">
            <Lock className="h-4 w-4" />
            <span className="text-xs uppercase tracking-[0.22em]">{label}</span>
          </div>
          <div>
            <p className="max-w-xs text-sm text-pine/75">
              {tool.tier === "pro"
                ? "Unlock Pro to add deeper support tools chosen for the patterns sitting underneath the obvious symptom."
                : "Unlock Premium to access the most personalized regulation tools and keep favorites in your private library."}
            </p>
            <Link href="/upgrade" className="mt-4 inline-block">
              <Button className={tool.tier === "premium" ? "bg-ink text-white hover:bg-ink/90" : ""}>
                {tool.tier === "pro" ? "Unlock Pro" : "Unlock Premium"}
              </Button>
            </Link>
          </div>
        </div>
      ) : null}

      {plan === "premium" && isSaved && !locked ? (
        <div className="absolute right-6 top-6 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.18em] text-pine shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Saved
        </div>
      ) : null}
    </Card>
  );
}

function canAccessTier(plan: SubscriptionPlan, tier: ToolTier) {
  if (tier === "free") return true;
  if (tier === "pro") return plan === "pro" || plan === "premium";
  return plan === "premium";
}
