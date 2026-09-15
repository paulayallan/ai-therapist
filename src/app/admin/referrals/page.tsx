import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdminReferralInbox, type InboxRequest } from "@/components/admin-referral-inbox";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { REFERRALS_OPEN } from "@/lib/referrals";

export const metadata: Metadata = {
  title: "Referral inbox",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Where the promise on /find-help gets kept.
 *
 * That page tells people a person reads their request and emails them back.
 * This is the only place that reading can happen, so if this screen goes
 * unopened the promise is false — and the person who finds that out is someone
 * who asked for help and heard nothing.
 *
 * Not a 403 for non-admins, same as the verification queue: confirming an
 * admin screen lives at this URL is free reconnaissance.
 */
export default async function AdminReferralsPage() {
  const admin = await requireAdmin();
  if (!admin) notFound();

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("referral_requests")
    .select("*")
    .in("status", ["held", "open"])
    // Oldest first. The person who has waited longest is the one to answer.
    .order("created_at", { ascending: true });

  const all = (data ?? []) as InboxRequest[];
  // Held first regardless of age — the crisis screen caught something in what
  // they wrote, and they are the least able to wait their turn.
  const requests = [
    ...all.filter((entry) => entry.status === "held"),
    ...all.filter((entry) => entry.status !== "held"),
  ];

  return (
    <main id="main" className="mx-auto max-w-2xl space-y-8 px-5 py-12 sm:py-16">
      <header>
        <p className="label mb-2">Admin</p>
        <h1 className="font-serif text-3xl leading-tight text-ink">Referral inbox</h1>
        <p className="mt-3 max-w-prose leading-relaxed text-muted">
          Everyone here has been told a person will read this and email them back, usually within
          a few days. There is no automatic email and no practitioner queue — you are both. Reply
          from your own mail, then mark it done.
        </p>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          <Link href="/admin/therapists" className="text-sage-deep underline underline-offset-4">
            Practitioner verification
          </Link>{" "}
          is the other half of this.
        </p>
      </header>

      {!REFERRALS_OPEN ? (
        <p className="rounded-xl border border-line bg-surface p-4 text-sm leading-relaxed text-muted">
          Requests are switched off right now (<code className="font-mono">REFERRALS_OPEN</code> in{" "}
          <code className="font-mono">src/lib/referrals.ts</code>), so nothing new will arrive.
          Anything below came in before that and is still owed an answer.
        </p>
      ) : null}

      <AdminReferralInbox requests={requests} />
    </main>
  );
}
