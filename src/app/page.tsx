import Link from "next/link";
import { Compass, HeartPulse, NotebookPen } from "lucide-react";
import { LandingHero } from "@/components/landing-hero";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const pillars = [
  {
    icon: HeartPulse,
    title: "Free support layer",
    text: "24/7 help for anxiety, panic, stress, overthinking, and emotional spirals."
  },
  {
    icon: NotebookPen,
    title: "Pattern intelligence",
    text: "Voice or typed journaling becomes recurring trigger analysis, timing signals, and emotional patterns."
  },
  {
    icon: Compass,
    title: "Psychology OS",
    text: "Decision guidance, relationship decoding, life planning, and burnout optimization in one system."
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
              eyebrow="Positioning"
              title="Built like a support app first, then a life operating system"
              description="The app stays easy to use by separating immediate support from deeper long-term strategy."
            />
            <p className="text-sm leading-7 text-pine/75">
              The free experience gives users practical help now: support chat, mood check-ins, journaling, and SOS tools. The
              premium experience helps them think better over time through emotional pattern discovery, decision analysis,
              relationship coaching, and structured life planning.
            </p>
            <Link href="/auth" className="mt-6 inline-block">
              <Button>Enter the free layer</Button>
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

        <section className="mt-14 grid gap-6 lg:grid-cols-2">
          <Card className="bg-white/80">
            <SectionHeading
              eyebrow="Free"
              title="24/7 AI mental support"
              description="This is the growth engine and the easiest entry point."
            />
            <ul className="space-y-3 text-sm text-pine/75">
              <li>AI support for anxiety, stress, breakups, work burnout, and overthinking</li>
              <li>Text or voice journaling</li>
              <li>Mood check-ins and nervous-system regulation tools</li>
              <li>SOS panic support with crisis redirection when needed</li>
            </ul>
          </Card>
          <Card className="bg-pine text-white">
            <SectionHeading
              eyebrow="Pro"
              title="The AI life operating system"
              description="Where the subscription value sits."
            />
            <ul className="space-y-3 text-sm text-white/80">
              <li>Decision-making analysis for relationships, careers, and conflict</li>
              <li>Emotional pattern analysis from chats, journaling, and mood history</li>
              <li>Life strategy plans for work, habits, finances, and transitions</li>
              <li>Social intelligence coaching and burnout optimization</li>
            </ul>
          </Card>
        </section>

        <section className="mt-14">
          <SectionHeading
            eyebrow="Monetization"
            title="A simple free-to-paid ladder"
            description="Users start with anonymous support, then upgrade when the product begins understanding them deeply."
          />
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <p className="text-xs uppercase tracking-[0.24em] text-pine/60">Free</p>
              <p className="mt-3 font-display text-3xl text-ink">$0</p>
              <p className="mt-3 text-sm text-pine/75">Support chat, SOS mode, journaling, mood tracking, and basic insights.</p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-[0.24em] text-pine/60">Pro</p>
              <p className="mt-3 font-display text-3xl text-ink">$12-19/mo</p>
              <p className="mt-3 text-sm text-pine/75">
                Pattern memory, decision coaching, relationship decoding, life planning, and deeper insight generation.
              </p>
            </Card>
            <Card>
              <p className="text-xs uppercase tracking-[0.24em] text-pine/60">Premium</p>
              <p className="mt-3 font-display text-3xl text-ink">$19-29/mo</p>
              <p className="mt-3 text-sm text-pine/75">Voice-first conversations and a higher-retention personal psychology OS.</p>
            </Card>
          </div>
        </section>

        <footer className="mt-14 border-t border-pine/10 py-6">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-pine/68">
            <p>Mentara</p>
            <div className="flex flex-wrap gap-4">
              <Link href="/privacy" className="transition hover:text-pine">
                Privacy Policy
              </Link>
              <Link href="/terms" className="transition hover:text-pine">
                Terms & Conditions
              </Link>
              <Link href="/disclaimer" className="transition hover:text-pine">
                Disclaimer
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
