"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Brain, Check, Copy, ExternalLink, Linkedin, Link2, Share2, Sparkles } from "lucide-react";
import type { ThinkingProfile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function ThinkingProfileCard({ profile }: { profile: ThinkingProfile }) {
  return (
    <Card className="overflow-hidden border-pine/15 bg-gradient-to-br from-[#19332e] via-[#21453d] to-[#142924] text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-sand/80">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.28em]">Thinking Profile</p>
          </div>
          <p className="mt-4 font-display text-4xl leading-tight">{profile.archetypeName}</p>
          <p className="mt-4 max-w-2xl text-base leading-8 text-white/85">{profile.summary}</p>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-2 text-xs uppercase tracking-[0.2em] text-white/80">
          {profile.confidence}
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {profile.traits.slice(0, 3).map((trait) => (
          <div key={trait} className="rounded-[22px] border border-white/10 bg-white/8 px-4 py-4 text-sm leading-7 text-white/85">
            {trait}
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href="/insights/thinking-profile">
          <Button variant="secondary">View full profile</Button>
        </Link>
        <ShareProfileButton profile={profile} />
      </div>

      <p className="mt-5 text-xs text-white/65">Mentara · Thinking Profile</p>
    </Card>
  );
}

export function ThinkingProfileDetail({
  profile,
  expanded = false,
  showHeroCard = true
}: {
  profile: ThinkingProfile;
  expanded?: boolean;
  showHeroCard?: boolean;
}) {
  return (
    <div className="space-y-6">
      {showHeroCard ? <ThinkingProfileCard profile={profile} /> : null}

      <div className={expanded ? "grid gap-6 lg:grid-cols-[1.1fr_0.9fr]" : "grid gap-6 lg:grid-cols-2"}>
        <Card>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-pine" />
            <p className="font-display text-2xl text-ink">What this profile is noticing</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InsightCard title="Thinking style" value={profile.thinkingStyle} />
            <InsightCard title="Stress signature" value={profile.stressSignature} />
            <InsightCard title="Emotional habits" value={profile.emotionalHabits} />
            <InsightCard title="Recovery profile" value={profile.recoveryProfile} />
          </div>
          <p className="mt-5 text-sm text-pine/65">{profile.learningNote}</p>
        </Card>

        <div className="space-y-6">
          <Card>
            <p className="font-display text-2xl text-ink">You tend to…</p>
            <div className="mt-4 space-y-3">
              {profile.traits.map((trait) => (
                <div key={trait} className="rounded-[20px] bg-sand/65 px-4 py-3 text-sm leading-7 text-pine/80">
                  {trait}
                </div>
              ))}
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <p className="font-display text-2xl text-ink">Strengths</p>
              <div className="mt-4 space-y-3">
                {profile.strengths.map((strength) => (
                  <div key={strength} className="rounded-[18px] bg-mist/55 px-4 py-3 text-sm text-pine/80">
                    {strength}
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <p className="font-display text-2xl text-ink">Watchouts</p>
              <div className="mt-4 space-y-3">
                {profile.watchouts.map((watchout) => (
                  <div key={watchout} className="rounded-[18px] bg-sand/70 px-4 py-3 text-sm text-pine/80">
                    {watchout}
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-ink">{profile.confidence}</p>
              <span className="text-xs uppercase tracking-[0.22em] text-pine/55">Thinking Profile</span>
            </div>
            <p className="mt-3 text-sm leading-7 text-pine/75">{profile.basis}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InsightCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-pine/10 bg-mist/40 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-pine/55">{title}</p>
      <p className="mt-3 text-sm leading-7 text-ink">{value}</p>
    </div>
  );
}

function ShareProfileButton({ profile }: { profile: ThinkingProfile }) {
  const [copiedMode, setCopiedMode] = useState<"text" | "link" | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const shareUrl = useMemo(() => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }

    return "/insights/thinking-profile";
  }, []);

  const shareText = useMemo(
    () =>
      [
        "My Mentara Thinking Profile",
        profile.archetypeName,
        profile.summary,
        "",
        ...profile.traits.slice(0, 3).map((trait) => `• ${trait}`),
        "",
        "Built with Mentara"
      ].join("\n"),
    [profile]
  );

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mentara Thinking Profile: ${profile.archetypeName}`,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch {
        // Fall back to menu below.
      }
    }

    setIsOpen((open) => !open);
  }

  async function copyText() {
    await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    setCopiedMode("text");
    setIsOpen(false);
    window.setTimeout(() => setCopiedMode(null), 1800);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedMode("link");
    setIsOpen(false);
    window.setTimeout(() => setCopiedMode(null), 1800);
  }

  return (
    <div className="relative">
      <Button variant="ghost" className="border border-white/15 text-white hover:bg-white/10" onClick={handleShare}>
        <Share2 className="mr-2 h-4 w-4" />
        {copiedMode === "text" ? "Copied text" : copiedMode === "link" ? "Copied link" : "Share profile"}
      </Button>
      {isOpen ? (
        <div className="absolute left-0 top-[calc(100%+12px)] z-20 w-72 rounded-[24px] border border-white/10 bg-[#17322d] p-3 shadow-2xl shadow-black/25 backdrop-blur">
          <p className="px-2 text-xs uppercase tracking-[0.22em] text-white/55">Share with Mentara</p>
          <div className="mt-3 grid gap-2">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-[18px] border border-white/10 px-4 py-3 text-sm text-white/90 transition hover:bg-white/6"
            >
              <span>Share on X</span>
              <ExternalLink className="h-4 w-4 text-white/65" />
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-[18px] border border-white/10 px-4 py-3 text-sm text-white/90 transition hover:bg-white/6"
            >
              <span>Share on LinkedIn</span>
              <Linkedin className="h-4 w-4 text-white/65" />
            </a>
            <button
              type="button"
              onClick={copyText}
              className="flex items-center justify-between rounded-[18px] border border-white/10 px-4 py-3 text-left text-sm text-white/90 transition hover:bg-white/6"
            >
              <span>Copy branded caption</span>
              {copiedMode === "text" ? <Check className="h-4 w-4 text-white/65" /> : <Copy className="h-4 w-4 text-white/65" />}
            </button>
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center justify-between rounded-[18px] border border-white/10 px-4 py-3 text-left text-sm text-white/90 transition hover:bg-white/6"
            >
              <span>Copy profile link</span>
              {copiedMode === "link" ? <Check className="h-4 w-4 text-white/65" /> : <Link2 className="h-4 w-4 text-white/65" />}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
