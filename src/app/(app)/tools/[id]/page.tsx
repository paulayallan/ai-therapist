import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ToolRunner } from "@/components/tool-runner";
import { getEffectiveSubscriptionPlan } from "@/lib/billing";
import { getSavedTools, getSubscription } from "@/lib/data";
import { getTool } from "@/lib/tools";
import type { ToolTier } from "@/lib/types";

const TIERS: Record<string, ToolTier[]> = {
  free: ["free"],
  pro: ["free", "pro"],
  premium: ["free", "pro", "premium"],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const tool = getTool(id);
  return tool ? { title: tool.title, description: tool.blurb } : { title: "Tool" };
}

export default async function ToolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tool = getTool(id);
  if (!tool) notFound();

  const [subscription, saved] = await Promise.all([getSubscription(), getSavedTools()]);
  const allowed = TIERS[getEffectiveSubscriptionPlan(subscription)] ?? ["free"];

  // Gating is enforced here, on the server, not only by hiding the link.
  if (!allowed.includes(tool.tier)) redirect(`/upgrade?tool=${tool.id}`);

  return (
    <div className="stack max-w-xl">
      <Link href="/tools" className="text-sm text-muted underline underline-offset-4 hover:text-ink">
        All tools
      </Link>

      <header className="mb-8 mt-5">
        <p className="label">{tool.tag}</p>
        <h1 className="mt-1.5 font-serif text-2xl leading-snug text-ink sm:text-3xl">
          {tool.title}
        </h1>
        <p className="mt-2.5 leading-relaxed text-muted">{tool.blurb}</p>
      </header>

      <ToolRunner tool={tool} initiallySaved={saved.some((row) => row.tool_id === tool.id)} />
    </div>
  );
}
