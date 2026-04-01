import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowRight, Brain, HeartHandshake, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden rounded-[40px] border border-pine/10 bg-white/70 px-6 py-10 shadow-glow backdrop-blur md:px-10 md:py-16">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,_rgba(124,162,147,0.4),_transparent_55%)] lg:block" />
      <div className="relative grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-4 text-xs uppercase tracking-[0.24em] text-pine/70">Free Support. Paid Psychology OS.</p>
          <h1 className="max-w-3xl font-display text-5xl leading-tight text-ink md:text-6xl">
            24/7 mental support on the surface. Deep life analysis underneath.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-pine/80">
            Mentara starts as an easy, anonymous support tool for anxiety, stress, and burnout, then grows into a
            personal psychology operating system for decisions, relationships, pattern discovery, and life strategy.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth">
              <Button>
                Start free support
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">Explore the OS</Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Feature icon={Brain} title="Free AI Support" copy="Anxiety help, journaling, mood check-ins, and SOS support." />
            <Feature icon={HeartHandshake} title="Pattern Memory" copy="Recurring triggers, relationship loops, and emotional signatures." />
            <Feature icon={ShieldCheck} title="Decision Intelligence" copy="Life strategy, social coaching, and burnout analysis." />
          </div>
        </div>
        <Card className="bg-pine text-white">
          <p className="text-sm uppercase tracking-[0.24em] text-white/60">Product Model</p>
          <ol className="mt-6 space-y-5">
            <li>
              <p className="font-display text-2xl">1. Free support layer</p>
              <p className="mt-1 text-sm text-white/75">Immediate help for anxiety, overthinking, panic, and emotional regulation.</p>
            </li>
            <li>
              <p className="font-display text-2xl">2. Insight engine</p>
              <p className="mt-1 text-sm text-white/75">Mood, journal, and chat history become pattern recognition over time.</p>
            </li>
            <li>
              <p className="font-display text-2xl">3. Paid psychology OS</p>
              <p className="mt-1 text-sm text-white/75">Decision coaching, relationship decoding, life planning, and burnout strategy.</p>
            </li>
          </ol>
        </Card>
      </div>
    </section>
  );
}

function Feature({
  icon: Icon,
  title,
  copy
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  copy: string;
}) {
  return (
    <div className="rounded-[24px] bg-sand/80 p-4">
      <Icon className="h-5 w-5 text-pine" />
      <p className="mt-3 font-medium text-ink">{title}</p>
      <p className="mt-1 text-sm text-pine/70">{copy}</p>
    </div>
  );
}
