import { InsightsList } from "@/components/insights-list";
import { MirrorInsights } from "@/components/mirror-insights";
import { SectionHeading } from "@/components/section-heading";
import { ThinkingProfileCard } from "@/components/thinking-profile-panel";
import { WeeklyInsights } from "@/components/weekly-insights";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ensureWeeklyMirrorInsights, getAccountMemory, getCurrentUser, getInsights, getJournalEntries, getMoodLogs, getPanicEpisodes, getRecentSessionSummaries, getSubscription, hasProAccess } from "@/lib/data";
import { generateLearningProfile, generatePanicPatternMap, generatePatternInsights } from "@/lib/insight-engine";
import { generateThinkingProfile } from "@/lib/thinking-profile";

export default async function InsightsPage() {
  const user = await getCurrentUser();
  const userId = user?.id ?? "demo-user";
  const [insights, moodLogs, journalEntries, subscription, sessionSummaries, accountMemory, panicEpisodes, mirrorInsights] = await Promise.all([
    getInsights(userId),
    getMoodLogs(userId),
    getJournalEntries(userId),
    getSubscription(userId),
    getRecentSessionSummaries(userId),
    getAccountMemory(userId),
    getPanicEpisodes(userId),
    ensureWeeklyMirrorInsights(userId)
  ]);
  const proAccess = hasProAccess(subscription);
  const snapshotInsights = generatePatternInsights({
    moodLogs,
    journalEntries,
    sessionSummaries,
    accountMemory,
    panicEpisodes
  });
  const panicMap = generatePanicPatternMap({ panicEpisodes, moodLogs, sessionSummaries });
  const learningProfile = generateLearningProfile({
    moodLogs,
    journalEntries,
    sessionSummaries,
    accountMemory
  });
  const thinkingProfile = generateThinkingProfile({
    moodLogs,
    journalEntries,
    sessionSummaries,
    panicEpisodes,
    accountMemory
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Insights"
        title="What your recent patterns may be pointing to"
        description="This page reflects the patterns your system is starting to notice across journaling, mood shifts, support sessions, and recovery rhythm, without pretending to know more than the signal supports."
      />
      <ThinkingProfileCard profile={thinkingProfile} />
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-display text-2xl text-ink">Refresh the current read</p>
            <p className="mt-2 text-sm text-pine/70">
              {proAccess
                ? "Ask for a more precise read on timing, triggers, thinking habits, and recovery patterns based on your newest entries."
                : "Weekly reads stay open here. Deeper cross-history interpretation and stronger pattern memory open up on Pro."}
            </p>
          </div>
          {proAccess ? (
            <form action="/api/insights/generate" method="post">
              <Button type="submit">Generate insights</Button>
            </form>
          ) : (
            <a href="/upgrade">
              <Button>Unlock deep insights</Button>
            </a>
          )}
        </div>
      </Card>
      <Card>
        <p className="font-display text-2xl text-ink">Why this starts to feel personal</p>
        <p className="mt-2 text-sm text-pine/70">
          The most useful signal is rarely a number on its own. It is the moment your system notices a recurring pattern and reflects it back in language that feels recognizable.
        </p>
      </Card>
      <Card>
        <p className="font-display text-2xl text-ink">What the system is learning about you</p>
        <p className="mt-2 text-sm text-pine/70">
          These are early reads based on recent entries, sessions, and check-ins. They should sharpen as more of your real rhythm becomes visible.
        </p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {learningProfile.map((item) => (
          <Card key={item.title}>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm uppercase tracking-[0.2em] text-pine/55">{item.title}</p>
              <span className="rounded-full bg-mist px-2 py-1 text-[11px] text-pine/75">{item.confidence}</span>
            </div>
            <p className="mt-3 text-lg leading-8 text-ink">{item.value}</p>
            <p className="mt-3 text-sm text-pine/65">{item.basis}</p>
          </Card>
        ))}
      </div>
      <WeeklyInsights
        moodLogs={moodLogs}
        journalEntries={journalEntries}
        panicEpisodes={panicEpisodes}
        sessionSummaries={sessionSummaries}
        accountMemory={accountMemory}
      />
      <Card>
        <p className="font-display text-2xl text-ink">Reflection from your system</p>
        <p className="mt-2 text-sm text-pine/70">
          These reflections are meant to sound less like analytics and more like a careful observation based on what your recent entries seem to reveal.
        </p>
      </Card>
      <MirrorInsights insights={mirrorInsights} />
      <Card>
        <p className="font-display text-2xl text-ink">Panic pattern detection</p>
        <p className="mt-2 text-sm text-pine/70">
          The aim here is to make panic feel less random by showing where recent SOS moments may be connecting with time, sleep, stress, and recovery patterns.
        </p>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-pine/55">Most common trigger</p>
            <span className="rounded-full bg-mist px-2 py-1 text-[11px] text-pine/75">{panicMap.triggerConfidence}</span>
          </div>
          <p className="mt-3 font-display text-3xl text-ink">{panicMap.mostCommonTrigger}</p>
          <p className="mt-2 text-sm text-pine/70">{panicMap.triggerDetail}</p>
        </Card>
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-pine/55">Most common time</p>
            <span className="rounded-full bg-mist px-2 py-1 text-[11px] text-pine/75">{panicMap.timeConfidence}</span>
          </div>
          <p className="mt-3 font-display text-3xl text-ink">{panicMap.mostCommonTime}</p>
          <p className="mt-2 text-sm text-pine/70">{panicMap.timeDetail}</p>
        </Card>
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-pine/55">Environment</p>
            <span className="rounded-full bg-mist px-2 py-1 text-[11px] text-pine/75">{panicMap.locationConfidence}</span>
          </div>
          <p className="mt-3 font-display text-3xl text-ink">{panicMap.mostCommonLocation}</p>
          <p className="mt-2 text-sm text-pine/70">{panicMap.locationDetail}</p>
        </Card>
        <Card className="bg-pine text-white">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm uppercase tracking-[0.2em] text-white/55">Recovery tracker</p>
            <span className="rounded-full bg-white/15 px-2 py-1 text-[11px] text-white/80">{panicMap.recoveryConfidence}</span>
          </div>
          <p className="mt-3 font-display text-3xl">{panicMap.recoveryTrend ?? "Recovery pattern still emerging"}</p>
          <p className="mt-2 text-sm text-white/80">
            {panicMap.sleepStressCorrelation ?? "Recent signals are not strong enough yet to map recovery against sleep and stress with confidence."}
          </p>
        </Card>
      </div>
      {!proAccess ? (
        <Card className="bg-mist/70">
          <p className="font-display text-2xl text-ink">What stays free and what gets deeper on Pro</p>
          <p className="mt-3 text-sm text-pine/70">
            Free still gives you the weekly read: mood movement, early trigger signals, and recovery direction. Pro goes deeper into recurring themes, cross-history patterns, and what those patterns may be pointing to.
          </p>
        </Card>
      ) : null}
      <Card>
        <p className="font-display text-2xl text-ink">Weekly pattern signals</p>
        <p className="mt-2 text-sm text-pine/70">
          These are the weekly observations your system is noticing across mood timing, sleep shifts, journaling tone, panic recovery, and the loops that keep resurfacing in support.
        </p>
      </Card>
      <InsightsList insights={snapshotInsights} />
      {proAccess ? (
        <>
          <Card>
            <p className="font-display text-2xl text-ink">Deep analysis archive</p>
            <p className="mt-2 text-sm text-pine/70">
              Longer-range reads drawn from your history across moods, journals, support conversations, and repeated emotional themes.
            </p>
          </Card>
          <InsightsList insights={insights} />
        </>
      ) : null}
    </div>
  );
}
