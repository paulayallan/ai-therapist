import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { NON_CLINICAL_DISCLAIMER } from "@/lib/safety";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSessionUser } from "@/lib/supabase/server";

const PILLARS = [
  {
    title: "A rescue flow, not a chat window",
    body: "When it hits, you get one instruction at a time: slow the breath, find the room, check where it landed. No typing, no decisions, no waiting on a model.",
  },
  {
    title: "Twenty short tools that stay put",
    body: "Breath, grounding, thought work, recovery, evening. Each one is three to eight minutes with a guided timer. The same tool is in the same place every time you look.",
  },
  {
    title: "Patterns from your own numbers",
    body: "Four scales a day, thirty seconds. Over weeks that becomes a real picture — which days are hard, what tends to sit alongside what. Calculated from your data, never guessed.",
  },
];

export default async function LandingPage() {
  if (isSupabaseConfigured) {
    const user = await getSessionUser();
    if (user) redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center px-5">
        <span className="font-serif text-lg tracking-tight text-ink">Mentara</span>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Link href="/auth">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      <main id="main">
        <section className="mx-auto w-full max-w-2xl px-5 pb-16 pt-12 sm:pt-20">
          <p className="label">A quieter place to check in</p>
          <h1 className="mt-4 font-serif text-[2.1rem] leading-[1.15] text-ink sm:text-5xl sm:leading-[1.1]">
            Anxiety is easier to handle when the next step is already decided.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">
            Mentara holds the small, practical things: what to do in the middle of a panic
            episode, a short tool when the day tips over, and an honest record of how the weeks
            are actually going.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth">
              <Button size="lg">Get started</Button>
            </Link>
            <Link href="/sos">
              <Button size="lg" variant="urgent">
                I need help now
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-sm text-faint">
            Free to use. No card. Your writing stays yours.
          </p>
        </section>

        <section className="border-y border-line bg-surface py-16">
          <div className="mx-auto w-full max-w-2xl px-5">
            <div className="space-y-10">
              {PILLARS.map((pillar) => (
                <article key={pillar.title}>
                  <h2 className="font-serif text-xl leading-snug text-ink">{pillar.title}</h2>
                  <p className="mt-2 leading-relaxed text-muted">{pillar.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-2xl px-5 py-16">
          <h2 className="font-serif text-xl text-ink">What this is not</h2>
          <p className="mt-3 leading-relaxed text-muted">
            It is not therapy, it does not diagnose, and it will not tell you what is wrong with
            you. Where a moment needs a person rather than a tool, Mentara says so and hands you
            real crisis numbers instead of a paragraph.
          </p>
          <p className="mt-3 leading-relaxed text-muted">
            AI is optional and off unless you turn it on. With it off, everything except written
            reflections still works.
          </p>
        </section>
      </main>

      <footer className="border-t border-line py-10">
        <div className="mx-auto w-full max-w-2xl px-5">
          <p className="text-xs leading-relaxed text-faint">{NON_CLINICAL_DISCLAIMER}</p>
          <nav className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/sos" className="hover:text-ink">
              Crisis support
            </Link>
          </nav>
          <p className="mt-6 text-xs text-faint">© {new Date().getFullYear()} Mentara</p>
        </div>
      </footer>
    </div>
  );
}
