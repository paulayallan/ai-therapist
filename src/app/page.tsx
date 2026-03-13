import Link from "next/link";
import { HeartPulse, NotebookPen, Sparkles } from "lucide-react";
import { LandingHero } from "@/components/landing-hero";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const pillars = [
  {
    icon: HeartPulse,
    title: "Regulate the nervous system",
    text: "Panic-support flows, breathing exercises, grounding, and body-based calming tools."
  },
  {
    icon: NotebookPen,
    title: "Build self-awareness",
    text: "Voice or typed journaling with emotional theme detection and reflective prompts."
  },
  {
    icon: Sparkles,
    title: "See patterns over time",
    text: "Mood trends, recurring triggers, thinking patterns, and improvement signals."
  }
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#edf5f2_0%,_#f6f0e8_100%)] px-4 py-6 md:px-8">
      <div className="mx-auto max-w-7xl">
        <LandingHero />

        <section className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionHeading
              eyebrow="Evidence-Based"
              title="Designed like a digital CBT companion"
              description="The product is structured around proven mental health techniques rather than casual open-ended chat."
            />
            <p className="text-sm leading-7 text-pine/75">
              AI Therapist uses cognitive restructuring, behavioral activation, grounding, journaling, and pattern awareness to
              help users respond to anxiety with more clarity. It is not a replacement for therapy, diagnosis, or crisis care.
            </p>
            <Link href="/auth" className="mt-6 inline-block">
              <Button>Create your account</Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <Card key={pillar.title}>
                  <Icon className="h-6 w-6 text-pine" />
                  <p className="mt-4 font-display text-2xl text-ink">{pillar.title}</p>
                  <p className="mt-3 text-sm text-pine/70">{pillar.text}</p>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
