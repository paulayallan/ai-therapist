import { requireUser } from "@/lib/api";
import {
  getAccountMemory,
  getCheckIns,
  getInsights,
  getJournalEntries,
  getMentalProfile,
  getMirrorInsights,
  getMoodLogs,
  getPanicEpisodes,
  getProfile,
  getSavedTools,
  getSubscription,
  getSupportPreferences,
} from "@/lib/data";

/**
 * Everything the account holds, as one JSON file. A person should be able to
 * leave with their own writing without asking anyone.
 */
export async function GET() {
  const { user, response } = await requireUser();
  if (!user) return response;

  const [
    profile,
    mental,
    preferences,
    memory,
    subscription,
    checkIns,
    moodLogs,
    journal,
    panic,
    insights,
    mirror,
    savedTools,
  ] = await Promise.all([
    getProfile(user.id),
    getMentalProfile(),
    getSupportPreferences(),
    getAccountMemory(),
    getSubscription(),
    getCheckIns(3650),
    getMoodLogs(2000),
    getJournalEntries(2000),
    getPanicEpisodes(2000),
    getInsights(500),
    getMirrorInsights(500),
    getSavedTools(),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
    profile,
    mental_profile: mental,
    support_preferences: preferences,
    account_memory: memory,
    subscription,
    daily_check_ins: checkIns,
    mood_logs: moodLogs,
    journal_entries: journal,
    panic_episodes: panic,
    insights,
    mirror_insights: mirror,
    saved_tools: savedTools,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="mentara-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
