import { SectionHeading } from "@/components/section-heading";
import { ThinkingProfileDetail } from "@/components/thinking-profile-panel";
import {
  getAccountMemory,
  getCurrentUser,
  getJournalEntries,
  getMoodLogs,
  getPanicEpisodes,
  getRecentSessionSummaries
} from "@/lib/data";
import { generateThinkingProfile } from "@/lib/thinking-profile";

export default async function ThinkingProfilePage() {
  const user = await getCurrentUser();
  const userId = user?.id ?? "demo-user";
  const [moodLogs, journalEntries, sessionSummaries, panicEpisodes, accountMemory] = await Promise.all([
    getMoodLogs(userId),
    getJournalEntries(userId),
    getRecentSessionSummaries(userId),
    getPanicEpisodes(userId),
    getAccountMemory(userId)
  ]);

  const profile = generateThinkingProfile({
    moodLogs,
    journalEntries,
    sessionSummaries,
    panicEpisodes,
    accountMemory
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Thinking Profile"
        title={profile.archetypeName}
        description="A premium identity read based on the way your system seems to think, carry stress, and recover over time."
      />
      <ThinkingProfileDetail profile={profile} expanded />
    </div>
  );
}
