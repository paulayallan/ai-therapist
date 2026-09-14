import Link from "next/link";
import type { Metadata } from "next";
import { MONTHLY_FEE_AUD, REGISTRATION_TYPES } from "@/lib/therapists";

export const metadata: Metadata = {
  title: "For practitioners",
  description:
    "Take referrals from Mentara. Verified registration, a flat monthly listing fee, and clients who have already said what they need.",
};

/**
 * The practitioner-facing front door, on the web and outside the app.
 *
 * Practitioners never touch the iOS app — the same shape as a rideshare, where
 * drivers do not sign up inside the rider app. It keeps the listing fee out of
 * Apple's billing entirely, and it keeps the consumer app about one thing.
 */
export default function TherapistsLandingPage() {
  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-12 sm:py-20">
      <p className="label mb-2">Mentara for practitioners</p>
      <h1 className="font-serif text-3xl leading-tight text-ink sm:text-4xl">
        Clients who have already said what they need
      </h1>
      <p className="mt-4 max-w-prose text-[1.02rem] leading-relaxed text-muted">
        Mentara is a self-guided app for anxiety. Some of the people using it reach a point where an
        app is not the right help, and they ask for a person. This is where those requests go.
      </p>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-ink">How it works</h2>
        <ol className="mt-4 space-y-4">
          {[
            [
              "You apply and we check the register",
              "A person opens the public register and confirms your registration number, your registration type, and whether any conditions or undertakings are recorded against it. Usually a day or two.",
            ],
            [
              "You see requests that match you",
              "Someone describes what is going on, the language they would rather work in, whether they want telehealth or a room, and how they intend to pay. You see the ones that fit what you do.",
            ],
            [
              "You offer to take it, and they choose",
              "If they pick you, their contact details are released to you and to nobody else. From that point it is yours: your practice, your intake, your notes, your billing. Mentara steps out.",
            ],
          ].map(([title, body], index) => (
            <li key={title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sage-soft font-medium text-sm text-sage-deep"
              >
                {index + 1}
              </span>
              <div>
                <p className="font-medium text-ink">{title}</p>
                <p className="mt-1 text-[0.95rem] leading-relaxed text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/*
        * Price and the two calls to action below are data-web-only. Apple
        * Guideline 3.1.1 covers "buttons, external links, or other calls to
        * action" pointing at a purchasing mechanism outside in-app purchase,
        * and this is both the price and the button. The links into this page
        * are already hidden inside the app; this is the second lock, for the
        * case where someone arrives by a deep link or a typed URL.
        */}
      <section data-web-only className="mt-10 rounded-2xl border border-line bg-surface p-6">
        <h2 className="font-serif text-xl text-ink">What it costs</h2>
        <p className="mt-2 text-[2rem] font-medium leading-none text-ink">
          ${MONTHLY_FEE_AUD}
          <span className="ml-1.5 align-middle text-base font-normal text-muted">a month</span>
        </p>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
          Flat. No commission on sessions, no per-referral fee, and Mentara never handles money
          between you and a client. Stop any time. Applying is free, and you are not charged while
          your registration is being checked.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-serif text-xl text-ink">Who can join</h2>
        <ul className="mt-4 space-y-2.5">
          {REGISTRATION_TYPES.map((entry) => (
            <li key={entry.value} className="flex gap-3 text-[0.95rem] leading-relaxed">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sage" />
              <span>
                <span className="text-ink">{entry.label}</span>
                <span className="text-muted"> — {entry.hint}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 max-w-prose text-sm leading-relaxed text-muted">
          Registration is re-checked each year. We do not publish reviews, ratings or testimonials
          of practitioners — the National Law prohibits testimonials for regulated health services,
          and we would rather not build something we would have to take down.
        </p>
      </section>

      <div data-web-only className="mt-10 flex flex-wrap items-center gap-4">
        <Link
          href="/therapists/apply"
          className="inline-flex h-12 items-center rounded-xl bg-sage px-6 font-medium text-white transition-colors hover:bg-sage-deep"
        >
          Apply to be listed
        </Link>
        <Link
          href="/auth?as=practitioner&next=/therapists/dashboard"
          className="text-sm text-muted underline underline-offset-4 hover:text-ink"
        >
          Already applied — sign in
        </Link>
      </div>

      <p className="mt-12 max-w-prose border-t border-line pt-6 text-sm leading-relaxed text-muted">
        Mentara is an introduction service. It is not a provider of psychological services, it does
        not supervise or direct clinical work, and nothing in a referral is clinical advice. Care of
        the client is yours from the moment they choose you. See the{" "}
        <Link href="/terms" className="underline underline-offset-4">
          terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-4">
          privacy notice
        </Link>
        .
      </p>
    </main>
  );
}
