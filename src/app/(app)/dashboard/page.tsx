import Link from "next/link";
import type { Metadata } from "next";
import { CheckInForm } from "@/components/check-in-form";
import { DisclaimerNote } from "@/components/disclaimer";
import { ToolSuggestions } from "@/components/tool-suggestions";
import { TrialCard } from "@/components/trial-card";
import { Card, SectionHeading } from "@/components/ui/card";
import { getEffectiveSubscriptionPlan, starterTrialDaysLeft } from "@/lib/billing";
import {
  getCheckIns,
  getHomeworkLists,
  getJournalEntries,
  getMoodLogs,
  getPanicEpisodes,
  getProfile,
  getSubscription,
} from "@/lib/data";
import { formatRelative } from "@/lib/date";
import { deriveSignals } from "@/lib/signals";
import { recommendTools } from "@/lib/tools";
import { getSessionUser } from "@/lib/supabase/server";
import type { ToolTier } from "@/lib/types";

export const metadata: Metadata = { title: "Today" };

const TIERS: Record<string, ToolTier[]> = {
  free: ["free"],
  pro: ["free", "pro"],
  premium: ["free", "pro", "premium"],
};

export default async function DashboardPage() {
  const user = await getSessionUser();
  const [profile, subscription, checkIns, panicEpisodes, journal, moodLogs, homework] =
    await Promise.all([
      user ? getProfile(user.id) : null,
      getSubscription(),
      getCheckIns(45),
      getPanicEpisodes(30),
      getJournalEntries(12),
      getMoodLogs(30),
      getHomeworkLists(),
    ]);

  const openHomework = homework.filter((list) => list.status === "active");

  const plan = getEffectiveSubscriptionPlan(subscription);
  const trialDaysLeft = starterTrialDaysLeft(subscription);

  const signals = deriveSignals({ checkIns, panicEpisodes, journal, moodLogs });
  const suggestions = recommendTools(signals, {
    allowedTiers: TIERS[plan] ?? ["free"],
    limit: 3,
  });

  const name = profile?.display_name?.trim();
  const hasCheckedInToday = checkIns.some(
    (row) => row.local_date === new Date().toISOString().slice(0, 10),
  );

  return (
    <div className="stack space-y-5">
      <header>
        <h1 className="font-serif text-2xl text-ink sm:text-3xl">
          {name ? `Hello, ${name}.` : "Hello."}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {hasCheckedInToday
            ? "Today is logged. Nothing else is required of you."
            : "Whenever you're ready."}
        </p>
      </header>

      <Link
        href="/sos"
        className="flex items-center gap-4 rounded-2xl border border-clay/25 bg-clay-soft p-5 transition-colors hover:border-clay/50"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-clay/12 text-clay">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" aria-hidden="true">
            <path
              d="M12 3.5c2.5 3 5.5 5 5.5 8.8a5.5 5.5 0 0 1-11 0C6.5 8.5 9.5 6.5 12 3.5Z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span>
          <span className="block font-medium text-clay">Something&rsquo;s happening right now</span>
          <span className="mt-0.5 block text-sm text-muted">
            Three minutes, one step at a time. No typing.
          </span>
        </span>
      </Link>

      {trialDaysLeft !== null ? <TrialCard daysLeft={trialDaysLeft} /> : null}

      <Card>
        <SectionHeading
          eyebrow="Check in"
          title="How is today going?"
          hint="Thirty seconds. This is what makes your patterns worth anything."
        />
        <CheckInForm recent={checkIns} />
      </Card>

      <Card>
        <SectionHeading
          eyebrow="For you"
          title="Worth a few minutes"
          hint={
            suggestions.some((item) => item.reason.label !== "In the library")
              ? "Chosen from what you've logged recently."
              : "Check in a few times and these start matching what's actually going on."
          }
        />
        <ToolSuggestions suggestions={suggestions} />
      </Card>

      {openHomework.length > 0 ? (
        <Card>
          <SectionHeading
            eyebrow="Homework"
            title={openHomework[0]?.title ?? "What you're working on"}
            hint="One small step, whenever you get to it."
          />
          <ul className="space-y-2">
            {(openHomework[0]?.items ?? [])
              .filter((item) => item.status === "pending")
              .slice(0, 3)
              .map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-line bg-raised px-4 py-3 text-sm leading-relaxed text-muted"
                >
                  {item.text}
                </li>
              ))}
          </ul>
          <Link
            href="/homework"
            className="mt-3 inline-block text-sm text-sage-deep underline underline-offset-4"
          >
            Open homework
          </Link>
        </Card>
      ) : null}

      <Card>
        <SectionHeading
          eyebrow="Talk it through"
          title="Support chat"
          hint="For when writing alone isn't enough and you want something back."
        />
        <Link href="/chat" className="text-sm text-sage-deep underline underline-offset-4">
          Open support chat
        </Link>
      </Card>

      {plan === "premium" ? (
        <Card>
          <SectionHeading
            eyebrow="Your Twin"
            title="Ask something of the version that's read it all"
            hint="Built from your own entries, so it already knows the pattern."
          />
          <Link href="/twin" className="text-sm text-sage-deep underline underline-offset-4">
            Open your Twin
          </Link>
        </Card>
      ) : null}

      <Card>
        <SectionHeading
          eyebrow="Science check"
          title="What's actually happening in your body"
          hint="Why your chest goes tight, why panic peaks and falls, why one bad night ruins a day."
        />
        <Link href="/science-check" className="text-sm text-sage-deep underline underline-offset-4">
          Have a look
        </Link>
      </Card>

      <Card>
        <SectionHeading
          eyebrow="Journal"
          title="Anything you want to put down?"
          hint="Nobody reads it. That is the point of it."
        />
        {journal.length === 0 ? (
          <Link href="/journal" className="text-sm text-sage-deep underline underline-offset-4">
            Write the first entry
          </Link>
        ) : (
          <>
            <ul className="space-y-2">
              {journal.slice(0, 2).map((entry) => (
                <li key={entry.id} className="rounded-xl border border-line bg-raised px-4 py-3">
                  <p className="line-clamp-2 text-sm leading-relaxed text-muted">
                    {entry.text_content}
                  </p>
                  <p className="mt-1.5 text-xs text-faint">{formatRelative(entry.created_at)}</p>
                </li>
              ))}
            </ul>
            <Link
              href="/journal"
              className="mt-3 inline-block text-sm text-sage-deep underline underline-offset-4"
            >
              Open the journal
            </Link>
          </>
        )}
      </Card>

      <DisclaimerNote className="px-1" />
    </div>
  );
}
