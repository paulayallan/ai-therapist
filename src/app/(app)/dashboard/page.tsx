import Link from "next/link";
import { getCurrentUser, getInsights, getJournalEntries, getMentalProfile, getMoodLogs, buildDashboardSummary } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { MoodLogger } from "@/components/mood-logger";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const userId = user?.id ?? "demo-user";

  const [profile, moodLogs, journalEntries, insights] = await Promise.all([
    getMentalProfile(userId),
    getMoodLogs(userId),
    getJournalEntries(userId),
    getInsights(userId)
  ]);

  const summary = buildDashboardSummary(moodLogs, journalEntries);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Dashboard"
        title="A steadier place to check in"
        description="Track daily state, review patterns, and move into structured support tools."
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Average mood" value={`${summary.avgMood}/10`} />
        <StatCard label="Average anxiety" value={`${summary.avgAnxiety}/10`} />
        <StatCard label="Average sleep" value={`${summary.avgSleep}/10`} />
        <StatCard label="Journal entries" value={`${summary.journalCount}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-3xl text-ink">Quick actions</p>
                <p className="mt-2 text-sm text-pine/70">Choose the kind of support you need right now.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/coach"><Button>Open coach</Button></Link>
                <Link href="/sos"><Button variant="danger">SOS mode</Button></Link>
                <Link href="/journal"><Button variant="secondary">Journal</Button></Link>
              </div>
            </div>
          </Card>

          <MoodLogger />

          <Card>
            <p className="font-display text-2xl text-ink">Recent insights</p>
            <div className="mt-4 space-y-3">
              {insights.slice(0, 3).map((insight) => (
                <div key={insight.id} className="rounded-[22px] bg-sand/70 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-pine/60">{insight.insightType}</p>
                  <p className="mt-2 text-sm text-ink">{insight.description}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-pine text-white">
            <p className="font-display text-2xl">Profile snapshot</p>
            <p className="mt-3 text-sm text-white/80">Focus areas: {profile?.mainChallenges.join(", ") || "Not set yet"}</p>
            <p className="mt-2 text-sm text-white/80">Goals: {profile?.goals.join(", ") || "Not set yet"}</p>
            <p className="mt-2 text-sm text-white/80">Common triggers: {profile?.triggers.join(", ") || "Not set yet"}</p>
          </Card>

          <Card>
            <p className="font-display text-2xl text-ink">Recent mood logs</p>
            <div className="mt-4 space-y-3">
              {moodLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="rounded-[22px] bg-mist/60 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <p className="text-ink">Mood {log.mood}/10</p>
                    <p className="text-pine/60">{formatDate(log.createdAt)}</p>
                  </div>
                  <p className="mt-2 text-pine/75">Anxiety {log.anxietyLevel}/10, Stress {log.stress}/10</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <p className="font-display text-2xl text-ink">Journaling rhythm</p>
            <p className="mt-2 text-sm text-pine/70">
              {journalEntries.length ? `You have ${journalEntries.length} recent entries.` : "No journal entries yet."}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-sm text-pine/60">{label}</p>
      <p className="mt-3 font-display text-4xl text-ink">{value}</p>
    </Card>
  );
}
