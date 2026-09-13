import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Card, Empty, Notice, SectionHeading } from "@/components/ui/card";
import { TherapistBillingButton } from "@/components/therapist-billing-button";
import { TherapistRequests } from "@/components/therapist-requests";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { matches } from "@/lib/referral-matching";
import type {
  MatchedForPractitioner,
  ReferralRequest,
  RequestForPractitioner,
} from "@/lib/referrals";
import {
  MONTHLY_FEE_AUD,
  STATUS_LABEL,
  blockedReason,
  canReceiveReferrals,
  registrationLabel,
  type Therapist,
} from "@/lib/therapists";

export const metadata: Metadata = { title: "Practitioner dashboard" };

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function TherapistDashboardPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth?next=/therapists/dashboard");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("therapists")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const therapist = data as Therapist | null;

  if (!therapist) {
    return (
      <main id="main" className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
        <h1 className="font-serif text-3xl text-ink">Practitioner dashboard</h1>
        <div className="mt-8">
          <Empty
            title="No application on this account"
            body="If you applied with a different email, sign in with that one. Otherwise, start an application."
          />
        </div>
        <Link
          href="/therapists/apply"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-sage px-5 font-medium text-white hover:bg-sage-deep"
        >
          Apply to be listed
        </Link>
      </main>
    );
  }

  const live = canReceiveReferrals(therapist);
  const blocked = blockedReason(therapist);

  /*
   * Requests belong to the person who wrote them, and row-level security says
   * so — which is why this reads them with the service role and then filters
   * in code. Two things are load-bearing here: `matches()` decides what this
   * practitioner is allowed to see, and the objects handed to the component
   * are built field by field. Spreading the row would hand over contact
   * details to someone who has not been chosen yet.
   */
  let openRequests: RequestForPractitioner[] = [];
  let matchedRequests: MatchedForPractitioner[] = [];

  if (live) {
    const admin = createSupabaseAdminClient();

    const [{ data: openRows }, { data: myOffers }] = await Promise.all([
      admin
        .from("referral_requests")
        .select("*")
        .eq("status", "open")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true })
        .limit(100),
      admin.from("referral_offers").select("request_id, status").eq("therapist_id", therapist.id),
    ]);

    const alreadyOffered = new Set((myOffers ?? []).map((offer) => offer.request_id as string));

    openRequests = ((openRows ?? []) as ReferralRequest[])
      .filter((row) => !alreadyOffered.has(row.id))
      .filter((row) => matches(therapist, row).matches)
      .map((row) => ({
        id: row.id,
        concern_areas: row.concern_areas,
        note: row.note,
        preferred_language: row.preferred_language,
        delivery_preference: row.delivery_preference,
        state: row.state,
        funding: row.funding,
        created_at: row.created_at,
      }));

    const acceptedIds = (myOffers ?? [])
      .filter((offer) => offer.status === "accepted")
      .map((offer) => offer.request_id as string);

    if (acceptedIds.length > 0) {
      const { data: matchedRows } = await admin
        .from("referral_requests")
        .select("*")
        .in("id", acceptedIds)
        .eq("status", "matched");

      matchedRequests = ((matchedRows ?? []) as ReferralRequest[]).map((row) => ({
        id: row.id,
        concern_areas: row.concern_areas,
        note: row.note,
        preferred_language: row.preferred_language,
        delivery_preference: row.delivery_preference,
        state: row.state,
        funding: row.funding,
        created_at: row.created_at,
        contact_name: row.contact_name,
        contact_email: row.contact_email,
      }));
    }
  }

  return (
    <main id="main" className="mx-auto max-w-2xl space-y-6 px-5 py-12 sm:py-16">
      <header>
        <p className="label mb-2">Mentara for practitioners</p>
        <h1 className="font-serif text-3xl leading-tight text-ink">{therapist.full_name}</h1>
        <p className="mt-2 text-muted">{registrationLabel(therapist.registration_type)}</p>
      </header>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionHeading
            className="mb-0"
            eyebrow="Status"
            title={live ? "Receiving referrals" : STATUS_LABEL[therapist.status]}
          />
          <span
            aria-hidden="true"
            className={
              live
                ? "h-2.5 w-2.5 rounded-full bg-sage"
                : therapist.status === "rejected" || therapist.status === "suspended"
                  ? "h-2.5 w-2.5 rounded-full bg-clay"
                  : "h-2.5 w-2.5 rounded-full bg-faint"
            }
          />
        </div>

        {blocked ? (
          <div className="mt-4">
            <Notice tone={therapist.status === "pending" ? "quiet" : "alert"}>{blocked}</Notice>
          </div>
        ) : null}

        <dl className="mt-5 space-y-3 border-t border-line pt-5 text-[0.95rem]">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{therapist.registration_body} number</dt>
            <dd className="text-ink">{therapist.registration_number}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Verified</dt>
            <dd className="text-ink">{formatDate(therapist.registration_verified_at)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Re-check due</dt>
            <dd className="text-ink">{formatDate(therapist.registration_expires_on)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Listing</dt>
            <dd className="text-ink">
              {therapist.subscription_status === "active"
                ? `Active — $${MONTHLY_FEE_AUD}/month`
                : therapist.subscription_status === "past_due"
                  ? "Payment failed"
                  : therapist.subscription_status === "cancelled"
                    ? "Cancelled"
                    : "Not started"}
            </dd>
          </div>
        </dl>

        {therapist.registration_conditions ? (
          <div className="mt-5 border-t border-line pt-5">
            <p className="label mb-1.5">Recorded on the register</p>
            <p className="text-[0.95rem] leading-relaxed text-muted">
              {therapist.registration_conditions}
            </p>
          </div>
        ) : null}

        {/* Billing only appears once verification has passed. Nobody pays their
            way onto the list before a person has checked the register. */}
        {therapist.status === "verified" ? (
          <div className="mt-5 border-t border-line pt-5">
            <TherapistBillingButton live={live} />
          </div>
        ) : null}
      </Card>

      {live ? (
        <TherapistRequests open={openRequests} matched={matchedRequests} />
      ) : (
        <Card>
          <SectionHeading
            eyebrow="Referrals"
            title="Requests that match you"
            hint="People who have asked for a person rather than an app."
          />
          <Empty
            title="Not yet"
            body="Requests appear once your registration is verified and your listing is active."
          />
        </Card>
      )}

      <p className="max-w-prose text-sm leading-relaxed text-muted">
        Mentara introduces clients and steps back. Care of anyone who chooses you is yours, on your
        own systems, under your own insurance. If your registration changes or conditions are placed
        on it, tell us — continuing to take referrals after that is the one thing that would get an
        account removed without discussion.
      </p>
    </main>
  );
}
