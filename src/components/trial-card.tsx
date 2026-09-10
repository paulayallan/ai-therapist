import Link from "next/link";

/**
 * The trial notice. Deliberately unpushy: it states what is happening and what
 * changes afterwards, without counting down at someone who came here because
 * they were anxious.
 */
export function TrialCard({ daysLeft }: { daysLeft: number }) {
  return (
    <section className="rounded-2xl border border-sage/25 bg-sage-soft p-5">
      <p className="label text-sage-deep">Your first week</p>
      <h2 className="mt-1.5 font-serif text-lg text-ink">
        {daysLeft} {daysLeft === 1 ? "day" : "days"} of Premium left
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Everything is unlocked while you find out whether this is useful. When it ends you keep the
        free layer — SOS, the core tools, journalling and check-ins — and nothing you have written
        goes anywhere.
      </p>
      <Link
        href="/upgrade"
        className="mt-3 inline-block text-sm text-sage-deep underline underline-offset-4"
      >
        What changes after
      </Link>
    </section>
  );
}
