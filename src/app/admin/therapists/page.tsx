import Link from "next/link";
import type { Metadata } from "next";
import { AdminTherapistQueue } from "@/components/admin-therapist-queue";
import { AdminGate } from "@/components/admin-gate";
import { adminState } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Therapist } from "@/lib/therapists";

export const metadata: Metadata = { title: "Verification", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Refusals name their cause instead of showing a blank 404 — see adminState().
 */
export default async function AdminTherapistsPage() {
  const admin = await adminState();
  if (admin.state !== "ok") return <AdminGate state={admin} next="/admin/therapists" />;

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("therapists")
    .select("*")
    // Pending first — they are the ones waiting on a human.
    .order("status", { ascending: true })
    .order("created_at", { ascending: true });

  const therapists = (data ?? []) as Therapist[];
  const pending = therapists.filter((entry) => entry.status === "pending");
  const rest = therapists.filter((entry) => entry.status !== "pending");

  return (
    <main id="main" className="mx-auto max-w-2xl space-y-8 px-5 py-12 sm:py-16">
      <header>
        <p className="label mb-2">Admin</p>
        <h1 className="font-serif text-3xl leading-tight text-ink">Practitioner verification</h1>
        <p className="mt-3 max-w-prose leading-relaxed text-muted">
          Open the register in another tab and check the number, the name and whether anything is
          recorded against it. Nobody receives a referral until you have.
        </p>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          The{" "}
          <Link href="/admin/referrals" className="text-sage-deep underline underline-offset-4">
            referral inbox
          </Link>{" "}
          is the other half of this — people waiting on an email from you.
        </p>
      </header>

      <section>
        <h2 className="mb-3 font-serif text-xl text-ink">
          Waiting{pending.length ? ` · ${pending.length}` : ""}
        </h2>
        <AdminTherapistQueue therapists={pending} />
      </section>

      {rest.length ? (
        <section>
          <h2 className="mb-3 font-serif text-xl text-ink">Everyone else</h2>
          <AdminTherapistQueue therapists={rest} />
        </section>
      ) : null}
    </main>
  );
}
