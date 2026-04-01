"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { ArrowRight, Bot, Brain, Crown, HeartPulse, Lock, MoonStar, Sparkles } from "lucide-react";
import type { AITwinProfile, AITwinSession, JournalEntry, MoodLog, PanicEpisode, SessionSummary, SubscriptionPlan } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { generateThinkingProfile } from "@/lib/thinking-profile";

export function AITwinExperience({
  plan,
  profile,
  sessions,
  moodLogs,
  journalEntries,
  sessionSummaries,
  panicEpisodes
}: {
  plan: SubscriptionPlan;
  profile: AITwinProfile | null;
  sessions: AITwinSession[];
  moodLogs: MoodLog[];
  journalEntries: JournalEntry[];
  sessionSummaries: SessionSummary[];
  panicEpisodes: PanicEpisode[];
}) {
  const hasAccess = plan === "premium";

  return (
    <div className="space-y-6">
      {hasAccess ? (
        <AITwinClient
          initialProfile={profile}
          initialSessions={sessions}
          moodLogs={moodLogs}
          journalEntries={journalEntries}
          sessionSummaries={sessionSummaries}
          panicEpisodes={panicEpisodes}
        />
      ) : (
        <AITwinPaywall />
      )}
    </div>
  );
}

function AITwinClient({
  initialProfile,
  initialSessions,
  moodLogs,
  journalEntries,
  sessionSummaries,
  panicEpisodes
}: {
  initialProfile: AITwinProfile | null;
  initialSessions: AITwinSession[];
  moodLogs: MoodLog[];
  journalEntries: JournalEntry[];
  sessionSummaries: SessionSummary[];
  panicEpisodes: PanicEpisode[];
}) {
  const [profile, setProfile] = useState<AITwinProfile | null>(initialProfile);
  const [sessions, setSessions] = useState<AITwinSession[]>(initialSessions);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<string | null>(null);
  const twinView = buildTwinView({ profile, moodLogs, journalEntries, sessionSummaries, panicEpisodes });
  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!input.trim() || !twinView.canAskTwin) return;

    setLoading(true);
    setError(null);

    const result = await fetch("/api/twin/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: input })
    });
    const data = await result.json().catch(() => null);

    setLoading(false);

    if (!result.ok || !data) {
      setError(data?.error ?? "The twin is unavailable right now.");
      return;
    }

    setProfile(data.profile);
    setSessions((current) => [data.session, ...current].slice(0, 8));
    setInput("");
  }

  return (
    <div className="space-y-6">
      <Card className="bg-pine text-white">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <Bot className="h-5 w-5" />
              <p className="font-display text-3xl">Your twin has started building a model of how you think, react, and recover.</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/85">
              {twinView.heroCopy}
            </p>
          </div>
          <div className="min-w-[240px] rounded-[24px] border border-white/15 bg-white/10 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-white/70">Twin learning progress</p>
            <div className="mt-3 flex items-end gap-3">
              <p className="font-display text-5xl">{twinView.progress}%</p>
              <p className="pb-2 text-sm text-white/70">{twinView.progressLabel}</p>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-sand transition-all" style={{ width: `${twinView.progress}%` }} />
            </div>
            <div className="mt-4 space-y-2 text-sm text-white/80">
              {twinView.sources.map((source) => (
                <div key={source.label} className="flex items-center justify-between gap-3">
                  <span>{source.label}</span>
                  <span className="text-white/65">{source.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
        <Card>
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-pine" />
            <div>
              <p className="font-display text-3xl text-ink">What your twin currently understands</p>
              <p className="mt-2 text-sm text-pine/70">
                These are the patterns your twin is beginning to notice across your entries, support sessions, and body-state signals.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {twinView.understandingCards.map((card) => (
              <div key={card.title} className="rounded-[24px] border border-pine/10 bg-sand/55 p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-ink">{card.title}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-pine/70">
                    {card.label}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-7 text-ink">{card.value}</p>
                <p className="mt-3 text-xs text-pine/55">{card.basis}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 text-pine" />
            <div>
              <p className="font-display text-3xl text-ink">Twin predictions</p>
              <p className="mt-2 text-sm text-pine/70">
                These are forward-looking reads based on the patterns your twin has enough recent signal to notice so far.
              </p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {twinView.predictions.map((prediction) => (
              <div key={prediction.text} className="rounded-[24px] border border-pine/10 bg-mist/60 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-pine/70">
                    {prediction.label}
                  </span>
                  <span className="text-xs text-pine/55">{prediction.basis}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-ink">{prediction.text}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <Card>
          <p className="font-display text-3xl text-ink">Ask your twin</p>
          <p className="mt-3 text-sm text-pine/70">
            The twin answers from your own patterns, not generic advice. It should feel like a calm read based on how you tend to think, react, and recover over time.
          </p>

          <div className="mt-5 rounded-[24px] bg-mist/60 p-5">
            <p className="text-xs uppercase tracking-[0.24em] text-pine/60">Current twin read</p>
            <p className="mt-3 text-sm leading-7 text-ink">{twinView.profileSummary}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {twinView.examplePrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  if (twinView.canAskTwin) {
                    setInput(prompt);
                  } else {
                    setPreviewPrompt(prompt);
                  }
                }}
                className="rounded-full border border-pine/10 bg-sand/65 px-4 py-2 text-sm text-pine/80 transition hover:bg-sand"
              >
                {prompt}
              </button>
            ))}
          </div>

          {!twinView.canAskTwin ? (
            <div className="mt-5 rounded-[24px] border border-pine/10 bg-sand/45 p-5">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-pine" />
                <p className="font-medium text-ink">Your twin is still building enough signal to answer with confidence.</p>
              </div>
              <p className="mt-3 text-sm leading-7 text-pine/75">
                {previewPrompt
                  ? `Preview question: “${previewPrompt}” A few more check-ins, journals, or support sessions will give your twin enough context to answer from what it has seen about you.`
                  : "You can preview the questions your twin will eventually answer. A little more signal will make the response feel much more specific to you."}
              </p>
            </div>
          ) : null}

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <textarea
              className="min-h-32 w-full rounded-[24px] border border-pine/15 bg-sand/70 px-4 py-4 outline-none focus:border-pine disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="How do I usually react when I feel uncertain? What tends to trigger my overthinking? What pattern do I repeat in relationships?"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={!twinView.canAskTwin}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={loading || !twinView.canAskTwin}>{loading ? "Consulting your twin..." : "Ask my twin"}</Button>
              <p className="text-xs text-pine/60">
                {twinView.canAskTwin ? "Premium feature. Personalized responses only." : "Your twin is still learning from recent data sources."}
              </p>
            </div>
            {error ? <p className="text-sm text-coral">{error}</p> : null}
          </form>

          <div className="mt-6 space-y-3">
            {sessions.length ? (
              sessions.map((session) => (
                <div key={session.id} className="rounded-[22px] bg-sand/65 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-pine/55">You asked</p>
                  <p className="mt-2 text-sm text-ink">{session.question}</p>
                  <p className="mt-4 text-xs uppercase tracking-[0.24em] text-pine/55">Your twin</p>
                  <p className="mt-2 text-sm leading-7 text-pine/80">{session.response}</p>
                  <p className="mt-3 text-xs text-pine/50">{formatDate(session.createdAt)}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[22px] bg-sand/65 p-4 text-sm text-pine/70">
                Once you ask the first question, your twin will start building a private record of the patterns it keeps reflecting back to you.
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <PatternCard
            icon={<HeartPulse className="h-4 w-4 text-pine" />}
            title="Emotional tendencies"
            items={profile?.emotionalTendencies ?? twinView.fallbackPatterns.emotionalTendencies}
          />
          <PatternCard
            icon={<Brain className="h-4 w-4 text-pine" />}
            title="Thinking patterns"
            items={profile?.thinkingPatterns ?? twinView.fallbackPatterns.thinkingPatterns}
          />
          <PatternCard
            icon={<Sparkles className="h-4 w-4 text-pine" />}
            title="Common triggers"
            items={profile?.commonTriggers ?? twinView.fallbackPatterns.commonTriggers}
          />
          <PatternCard
            icon={<MoonStar className="h-4 w-4 text-pine" />}
            title="Behavioral habits"
            items={profile?.behavioralHabits ?? twinView.fallbackPatterns.behavioralHabits}
          />
        </div>
      </div>
    </div>
  );
}

function PatternCard({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  return (
    <Card>
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-medium text-ink">{title}</p>
      </div>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="rounded-[18px] bg-sand/70 px-4 py-3 text-sm text-pine/80">
            {item}
          </div>
        ))}
      </div>
    </Card>
  );
}

function AITwinPaywall() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="bg-pine text-white">
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5" />
          <p className="font-display text-3xl">My AI Twin</p>
        </div>
        <p className="mt-4 max-w-2xl text-sm text-white/85">
          This is the premium memory layer. It studies mood, journaling, support sessions, anxiety spikes, and sleep patterns to answer from the way you personally seem to think and react.
        </p>
        <div className="mt-6 space-y-3">
          <div className="rounded-[22px] bg-white/10 p-4 text-sm text-white/85">
            <p className="font-medium text-white">Psychological profile</p>
            <p className="mt-2">Emotional tendencies, thinking patterns, common triggers, and behavioral habits that feel specific to you.</p>
          </div>
          <div className="rounded-[22px] bg-white/10 p-4 text-sm text-white/85">
            <p className="font-medium text-white">Personalized answers</p>
            <p className="mt-2">The twin speaks from your own data: “Based on what we’ve seen about you…”</p>
          </div>
          <div className="rounded-[22px] bg-white/10 p-4 text-sm text-white/85">
            <p className="font-medium text-white">Long-range personalization</p>
            <p className="mt-2">This is where the product begins to feel like it is quietly learning how your mind works over time.</p>
          </div>
        </div>
        <a className="mt-6 inline-block" href="/upgrade">
          <Button variant="secondary">Upgrade to Premium</Button>
        </a>
      </Card>

      <div className="space-y-4">
        <Card>
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-pine" />
            <div>
              <p className="font-medium text-ink">Why it is premium</p>
              <p className="mt-2 text-sm text-pine/70">
                My AI Twin uses long-range memory and deeper personalization. It is less about momentary coping and more about understanding how your own patterns tend to unfold.
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <p className="font-medium text-ink">Best questions for the twin</p>
          <div className="mt-3 space-y-2 text-sm text-pine/70">
            <p>How do I usually react when I feel abandoned?</p>
            <p>What pattern do I repeat when work gets uncertain?</p>
            <p>What tends to trigger my overthinking?</p>
            <p>How do I usually behave when I start losing emotional control?</p>
            <p>What makes my anxiety worse at night?</p>
            <p>How do I tend to handle conflict when I care about the person?</p>
            <p>What does my twin think I avoid when I feel overwhelmed?</p>
            <p>What usually helps me recover faster after a hard day?</p>
            <p>What emotional pattern keeps repeating in my relationships?</p>
            <p>When do I start carrying too much for other people?</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

function buildTwinView({
  profile,
  moodLogs,
  journalEntries,
  sessionSummaries,
  panicEpisodes
}: {
  profile: AITwinProfile | null;
  moodLogs: MoodLog[];
  journalEntries: JournalEntry[];
  sessionSummaries: SessionSummary[];
  panicEpisodes: PanicEpisode[];
}) {
  const moodCount = moodLogs.length;
  const journalCount = journalEntries.length;
  const supportCount = sessionSummaries.length;
  const panicCount = panicEpisodes.length;
  const sleepCount = moodLogs.filter((log) => typeof log.sleepQuality === "number").length;
  const sourceCaps = [
    Math.min(1, moodCount / 6),
    Math.min(1, journalCount / 4),
    Math.min(1, supportCount / 3),
    Math.min(1, panicCount / 2),
    Math.min(1, sleepCount / 6)
  ];
  const progress = Math.max(12, Math.round((sourceCaps.reduce((sum, value) => sum + value, 0) / sourceCaps.length) * 100));
  const canAskTwin = Boolean(profile);
  const avgStress = average(moodLogs.map((log) => log.stress));
  const avgSleep = average(moodLogs.map((log) => log.sleepQuality));
  const eveningStress = moodLogs.filter((log) => new Date(log.createdAt).getHours() >= 18 && log.stress >= 6).length;
  const reflectiveTone = journalEntries.filter((entry) => /reflective|processing|concerned/i.test(entry.emotionalAnalysis?.tone ?? "")).length;
  const workThemes = countMatches(
    [
      ...sessionSummaries.map((summary) => summary.mainIssue),
      ...journalEntries.map((entry) => entry.textContent),
      ...sessionSummaries.flatMap((summary) => summary.possibleTriggers)
    ],
    /(work|meeting|performance|boss|deadline|career)/i
  );
  const conflictThemes = countMatches(
    [
      ...sessionSummaries.map((summary) => summary.mainIssue),
      ...journalEntries.map((entry) => entry.textContent)
    ],
    /(conflict|argument|relationship|text|partner|people)/i
  );

  const understandingCards = [
    {
      title: "Thinking style",
      value:
        profile?.thinkingPatterns[0]
          ? `Your twin sees a mind that leans toward ${profile.thinkingPatterns[0].toLowerCase()} when pressure rises.`
          : reflectiveTone >= 2
            ? "Reflective and analytical. You seem to process what you feel internally before turning it into action."
            : "Reflective and still taking shape. Your twin is beginning to see how you make sense of stress before you name it out loud.",
      label: profile ? "Medium confidence" : "Early read",
      basis: profile
        ? `Built from ${journalCount} journal entries, ${supportCount} support sessions, and ${moodCount} mood logs.`
        : `Still learning from ${journalCount} journal entries and ${supportCount} support sessions.`
    },
    {
      title: "Stress signature",
      value:
        workThemes >= 2
          ? "Work pressure appears to be one of the earliest places your nervous system starts tightening."
          : eveningStress >= 2
            ? "Stress may collect later in the day, especially after mentally crowded or socially demanding hours."
            : "Your stress signature is still forming, but uncertainty and internal pressure may be early drivers.",
      label: workThemes >= 2 || eveningStress >= 2 ? "Medium confidence" : "Still learning",
      basis: workThemes >= 2
        ? "Based on recurring work-related language in support sessions and journals."
        : "Based on recent mood timing and support-session themes."
    },
    {
      title: "Emotional habits",
      value:
        profile?.emotionalTendencies[0]
          ? profile.emotionalTendencies[0]
          : reflectiveTone >= 2
            ? "You may understand your emotions before fully feeling them, which can make distress look quieter from the outside."
            : "Internal processing before sharing may be part of how you regulate when things feel heavy.",
      label: profile ? "Medium confidence" : "Early read",
      basis: reflectiveTone >= 2
        ? "Based on journaling tone and how emotions are described after the moment."
        : "Based on early journaling and support-session wording."
    },
    {
      title: "Recovery profile",
      value:
        avgSleep > 0 && avgSleep < 6
          ? "Sleep inconsistency may be making it harder for your system to settle quickly after high-stress days."
          : panicEpisodes.some((episode) => episode.checkIn === "calmer")
            ? "Grounding and time appear to help your system come down once activation is named and contained."
            : "Journaling and slower reflection may already be acting like recovery tools, even before the twin has enough panic data.",
      label: panicEpisodes.length >= 2 || sleepCount >= 4 ? "Medium confidence" : "Still learning",
      basis:
        panicEpisodes.length >= 2
          ? "Based on SOS recovery check-ins and sleep-linked mood patterns."
          : "Based on mood logs, sleep entries, and how quickly support themes settle."
    }
  ];

  const predictions = [
    {
      text:
        eveningStress >= 2
          ? "You may be more vulnerable to stress in the evening after work-heavy days."
          : "As more check-ins come in, your twin may confirm whether stress gathers later in the day rather than in the moment.",
      label: eveningStress >= 2 ? "Higher confidence with more data" : "Early prediction",
      basis: "Drawn from time-of-day stress patterns in recent mood logs."
    },
    {
      text:
        journalCount >= 2
          ? "Journaling twice a week may reduce next-day anxiety by helping you process pressure before it compounds."
          : "Journaling may become one of the clearest signals for what helps you regulate after demanding days.",
      label: journalCount >= 2 ? "Early prediction" : "Early prediction",
      basis: "Based on journaling frequency and emotional tone across recent entries."
    },
    {
      text:
        avgSleep > 0 && avgSleep < 6
          ? "Sleep inconsistency may be one of your strongest mood disruptors."
          : "Your twin is watching whether sleep stability becomes a stronger predictor of anxious days.",
      label: sleepCount >= 4 ? "Higher confidence with more data" : "Early prediction",
      basis: "Based on sleep quality across your check-ins."
    }
  ];

  const profileSummary =
    profile?.profileSummary ||
    "Based on what we have seen so far, your twin is beginning to map where stress tends to build, how you process it internally, and what helps your system come back down.";

  const heroCopy = canAskTwin
    ? "It is now using your logs, journals, support sessions, and recovery signals to form a working picture of your stress profile, thinking habits, and emotional recovery patterns."
    : "The model is already picking up early reads from your logs and writing. A few more check-ins, support sessions, and regulation moments will make the twin significantly sharper.";

  return {
    canAskTwin,
    progress,
    progressLabel: progress >= 75 ? "well trained" : progress >= 45 ? "building depth" : "early model",
    sources: [
      { label: "Mood logs", value: `${moodCount} logged` },
      { label: "Journal entries", value: `${journalCount} captured` },
      { label: "Support sessions", value: `${supportCount} summarized` },
      { label: "SOS check-ins", value: `${panicCount} recorded` },
      { label: "Sleep data", value: `${sleepCount} nights tracked` }
    ],
    heroCopy,
    profileSummary,
    understandingCards,
    predictions,
    examplePrompts: [
      "How do I usually react to pressure?",
      "What patterns do you notice in my stress?",
      "What tends to calm me down fastest?",
      "How do I handle conflict?"
    ],
    fallbackPatterns: {
      emotionalTendencies: profile?.emotionalTendencies ?? [
        "Stress seems to rise quietly before it becomes obvious.",
        "You may carry pressure internally before saying you are overwhelmed."
      ],
      thinkingPatterns: profile?.thinkingPatterns ?? [
        "You appear to process things reflectively before reacting outwardly.",
        conflictThemes >= 2 ? "Conflict may trigger over-analysis and delayed emotional clarity." : "Uncertainty may trigger fast interpretation loops."
      ],
      commonTriggers: profile?.commonTriggers ?? [
        workThemes >= 2 ? "work pressure" : "uncertainty",
        conflictThemes >= 2 ? "relationship tension" : "high-pressure days"
      ],
      behavioralHabits: profile?.behavioralHabits ?? [
        journalCount >= 2 ? "Writing may already be one of your recovery tools." : "Recovery habits are still taking shape.",
        avgStress >= 6 ? "Your body may keep carrying stress after the event is over." : "You seem to come down once pressure becomes more concrete."
      ]
    }
  };
}

function countMatches(values: string[], regex: RegExp) {
  return values.filter((value) => regex.test(value)).length;
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
