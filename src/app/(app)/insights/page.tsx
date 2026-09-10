import Link from "next/link";
import type { Metadata } from "next";
import { PatternsView } from "@/components/patterns-view";
import { SectionHeading } from "@/components/ui/card";
import { getCheckIns, getInsights, getJournalEntries, getPanicEpisodes } from "@/lib/data";
import { formatRelative } from "@/lib/date";

export const metadata: Metadata = { title: "Patterns" };

export default async function InsightsPage() {
  const [checkIns, panicEpisodes, journal, insights] = await Promise.all([
    getCheckIns(45),
    getPanicEpisodes(60),
    getJournalEntries(40),
    getInsights(6),
  ]);

  return (
    <div className="stack space-y-8">
      <header>
        <h1 className="font-serif text-2xl text-ink sm:text-3xl">Patterns</h1>
        <p className="mt-2 leading-relaxed text-muted">
          What four weeks of your own entries actually show. Nothing here is a conclusion about you.
        </p>
      </header>

      <PatternsView checkIns={checkIns} panicEpisodes={panicEpisodes} journal={journal} />

      {insights.length > 0 ? (
        <section>
          <SectionHeading title="What stands out" hint="Written up from your own numbers." />
          <ul className="space-y-3">
            {insights.map((insight) => (
              <li key={insight.id} className="card p-5">
                {insight.category ? (
                  <span className="inline-block rounded-full bg-sage-soft px-2.5 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wide text-sage-deep">
                    {insight.category}
                  </span>
                ) : null}
                <h3 className="mt-2.5 font-serif text-lg leading-snug text-ink">
                  {insight.title ?? insight.insight_type}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">
                  {insight.full_insight ?? insight.description}
                </p>
                {insight.evidence_basis ? (
                  <p className="mt-3 border-t border-line pt-3 text-[0.7rem] tabular-nums text-faint">
                    {insight.evidence_basis}
                  </p>
                ) : null}
                <p className="mt-2 text-[0.7rem] text-faint">
                  {formatRelative(insight.generated_at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="text-xs leading-relaxed text-faint">
        These describe what your own entries contain. They are not assessments, and a pattern in
        four weeks of data is a hint rather than a fact. If something here worries you, it is worth
        raising with a real clinician — the{" "}
        <Link href="/settings" className="underline underline-offset-4">
          settings page
        </Link>{" "}
        has crisis lines for your region.
      </p>
    </div>
  );
}
