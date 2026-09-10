import type { Metadata } from "next";
import { TwinClient } from "@/components/twin-client";
import { peekUsage } from "@/lib/api";
import { subscriptionHasAccess } from "@/lib/billing";
import {
  getCheckIns,
  getJournalEntries,
  getMoodLogs,
  getPanicEpisodes,
  getProfile,
  getSubscription,
  getTwinProfile,
  getTwinSessions,
} from "@/lib/data";
import { deriveSignals } from "@/lib/signals";
import { getSessionUser } from "@/lib/supabase/server";
import { assessReadiness } from "@/lib/twin";

export const metadata: Metadata = { title: "Your Twin" };

export default async function TwinPage() {
  const user = await getSessionUser();
  const [profile, subscription, twinProfile, sessions, checkIns, journal, panicEpisodes, moodLogs] =
    await Promise.all([
      user ? getProfile(user.id) : null,
      getSubscription(),
      getTwinProfile(),
      getTwinSessions(20),
      getCheckIns(60),
      getJournalEntries(40),
      getPanicEpisodes(60),
      getMoodLogs(60),
    ]);

  const signals = deriveSignals({ checkIns, panicEpisodes, journal, moodLogs });
  const readiness = assessReadiness({ checkIns, journal, panicEpisodes, signals });
  const hasAccess = subscriptionHasAccess(subscription, "premium");
  const usage = await peekUsage("twin_question", new Date().toISOString().slice(0, 10));

  return (
    <div className="stack space-y-5">
      <header>
        <h1 className="font-serif text-2xl text-ink sm:text-3xl">Your Twin</h1>
        <p className="mt-2 max-w-prose leading-relaxed text-muted">
          Someone who has read everything you have written here and answers accordingly. Not a
          different personality — the same information you have, held all at once.
        </p>
      </header>

      <TwinClient
        profile={twinProfile}
        sessions={sessions}
        readiness={readiness}
        hasAccess={hasAccess}
        aiConsent={Boolean(profile?.ai_data_consent_granted)}
        remaining={usage.remaining}
      />

      <p className="text-xs leading-relaxed text-faint">
        Your Twin is built from your own entries and can only be as accurate as they are. It is not
        a clinician, it does not diagnose, and it will get things wrong — when it does, say so and
        it will not keep the same read.
      </p>
    </div>
  );
}
