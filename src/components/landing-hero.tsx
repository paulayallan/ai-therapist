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
          <p className="mb-4 text-xs uppercase tracking-[0.24em] text-pine/70">Science-Based Mental Health Support</p>
          <h1 className="max-w-3xl font-display text-5xl leading-tight text-ink md:text-6xl">
            A structured digital CBT coach for anxiety, panic, stress, and overthinking.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-pine/80">
            AI Therapist helps users reflect, regulate, and build healthier thinking patterns through evidence-based
            exercises, journaling, and personalized insights.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth">
              <Button>
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary">View demo dashboard</Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <Feature icon={Brain} title="CBT Guidance" copy="Structured reframes, grounding, and reflection prompts." />
            <Feature icon={HeartHandshake} title="SOS Support" copy="Guided panic support flow designed for real moments." />
            <Feature icon={ShieldCheck} title="Safety Layer" copy="Crisis detection and clear escalation resources." />
          </div>
        </div>
        <Card className="bg-pine text-white">
          <p className="text-sm uppercase tracking-[0.24em] text-white/60">How It Works</p>
          <ol className="mt-6 space-y-5">
            <li>
              <p className="font-display text-2xl">1. Understand your pattern</p>
              <p className="mt-1 text-sm text-white/75">Track triggers, stress, sleep, and recurring anxious thoughts.</p>
            </li>
            <li>
              <p className="font-display text-2xl">2. Respond with structure</p>
              <p className="mt-1 text-sm text-white/75">Use a CBT coach built for reframing, not casual AI conversation.</p>
            </li>
            <li>
              <p className="font-display text-2xl">3. Build steadier habits</p>
              <p className="mt-1 text-sm text-white/75">Journal, regulate your nervous system, and review progress signals.</p>
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
