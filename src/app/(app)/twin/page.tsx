import { SectionHeading } from "@/components/section-heading";
import { AITwinExperience } from "@/components/twin-client";
import { ThinkingProfileDetail } from "@/components/thinking-profile-panel";
import {
  getAITwinSessions,
  getAccountMemory,
  getCurrentUser,
  getJournalEntries,
  getMoodLogs,
  getOrCreateAITwinProfile,
  getPanicEpisodes,
  getRecentSessionSummaries,
  getSubscription
} from "@/lib/data";
import { generateThinkingProfile } from "@/lib/thinking-profile";

export default async function TwinPage() {
  const user = await getCurrentUser();
  const userId = user?.id ?? "demo-user";
  const [subscription, profile, sessions, moodLogs, journalEntries, sessionSummaries, panicEpisodes, accountMemory] = await Promise.all([
    getSubscription(userId),
    getOrCreateAITwinProfile(userId),
    getAITwinSessions(userId),
    getMoodLogs(userId),
    getJournalEntries(userId),
    getRecentSessionSummaries(userId),
    getPanicEpisodes(userId),
    getAccountMemory(userId)
  ]);
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
        eyebrow="Premium Memory Layer"
        title="My AI Twin"
        description="A personalized AI model built from your mood patterns, journaling, anxiety spikes, sleep, and support-session memory."
      />
      <AITwinExperience
        plan={subscription.plan}
        profile={profile}
        sessions={sessions}
        moodLogs={moodLogs}
        journalEntries={journalEntries}
        sessionSummaries={sessionSummaries}
        panicEpisodes={panicEpisodes}
      />
      {subscription.plan === "premium" ? <ThinkingProfileDetail profile={thinkingProfile} expanded /> : null}
    </div>
  );
}
