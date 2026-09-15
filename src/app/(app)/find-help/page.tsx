import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Card, Notice, SectionHeading } from "@/components/ui/card";
import { CrisisCard } from "@/components/crisis-card";
import { FindHelpForm } from "@/components/find-help-form";
import { ReferralOffers, type OfferView } from "@/components/referral-offers";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";
import { FindHelpElsewhere } from "@/components/find-help-elsewhere";
import { REFERRALS_OPEN, STATUS_COPY, type ReferralRequest } from "@/lib/referrals";
import { registrationLabel, type Therapist } from "@/lib/therapists";

export const metadata: Metadata = { title: "Find help" };

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-AU", { day: "numeric", month: "long" });
}

/**
 * Asking for a person instead of an app.
 *
 * Free on every plan, and it always will be. Charging someone to be told where
 * to find help would be the worst thing this app could do.
 */
export default async function FindHelpPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth?next=/find-help");

  const supabase = await createSupabaseServerClient();

  const [{ data: requestRow }, { data: memory }] = await Promise.all([
    supabase
      .from("referral_requests")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // No user filter, matching lib/data.ts: row-level security already limits
    // this to the caller's own row, and adding a column name here that the
    // table may not use would break the query rather than tighten it.
    supabase.from("account_memory").select("display_name").maybeSingle(),
  ]);

  const current = requestRow as ReferralRequest | null;
  const live = current && ["open", "matched", "held"].includes(current.status);

  if (current && live) {
    /*
     * While matching is off there is nobody to send anything to, so the
     * standard "your request is with practitioners" screen would be a lie
     * told to the one person who asked for help. Say what is true and give
     * them the routes that work today instead.
     */
    /*
     * If matching is ever switched off, someone with a request already in
     * flight must not be left reading "we will email you" from a system that
     * has stopped. Tell them plainly and show the routes that work instead.
     */
    const copy =
      !REFERRALS_OPEN && (current.status === "open" || current.status === "held")
        ? {
            title: "We are not able to answer this one",
            body:
              "Your request is here and nothing was sent to anyone. We are not matching people "
              + "at the moment, so rather than let you wait on an email that is not coming, "
              + "below is what works today. You can withdraw this whenever you want.",
          }
        : STATUS_COPY[current.status];

    /*
     * Offers, with the practitioner attached. Row-level security lets someone
     * read a therapist row only when that therapist has offered on one of
     * their own requests — so this join is safe under the caller's own
     * session, with no service role anywhere near it.
     */
    let offers: OfferView[] = [];
    let accepted: OfferView | null = null;

    if (current.status !== "held") {
      const { data: offerRows } = await supabase
        .from("referral_offers")
        .select("id, message, status, therapist_id")
        .eq("request_id", current.id)
        .in("status", ["offered", "accepted"])
        .order("created_at", { ascending: true });

      const therapistIds = (offerRows ?? []).map((row) => row.therapist_id as string);

      const { data: therapistRows } = therapistIds.length
        ? await supabase.from("therapists").select("*").in("id", therapistIds)
        : { data: [] as unknown[] };

      const byId = new Map(
        ((therapistRows ?? []) as Therapist[]).map((row) => [row.id, row] as const),
      );

      const views: { view: OfferView; status: string }[] = [];
      for (const row of offerRows ?? []) {
        const therapist = byId.get(row.therapist_id as string);
        if (!therapist) continue;
        views.push({
          status: row.status as string,
          view: {
            id: row.id as string,
            message: (row.message as string | null) ?? null,
            therapist: {
              full_name: therapist.full_name,
              registration_label: registrationLabel(therapist.registration_type),
              registration_body: therapist.registration_body,
              practice_name: therapist.practice_name,
              practice_url: therapist.practice_url,
              state: therapist.state,
              languages: therapist.languages,
              modalities: therapist.modalities,
              bio: therapist.bio,
              // Only released once they have been chosen. Before that, an
              // email address would let someone bypass the whole flow.
              contact_email: row.status === "accepted" ? therapist.contact_email : null,
            },
          },
        });
      }

      accepted = views.find((entry) => entry.status === "accepted")?.view ?? null;
      offers = accepted ? [] : views.map((entry) => entry.view);
    }

    return (
      <div className="stack space-y-6">
        <header>
          <p className="label mb-2">Find help</p>
          <h1 className="font-serif text-2xl leading-snug text-ink sm:text-3xl">{copy.title}</h1>
          <p className="mt-3 max-w-prose leading-relaxed text-muted">{copy.body}</p>
        </header>

        {current.status === "held" ? <CrisisCard /> : null}

        <ReferralOffers requestId={current.id} offers={offers} accepted={accepted} />

        {!REFERRALS_OPEN && (current.status === "open" || current.status === "held") ? (
          <FindHelpElsewhere country={current.country ?? "AU"} reason="paused" />
        ) : null}

        <Card>
          <SectionHeading eyebrow="What you sent" title="Your request" />
          <dl className="space-y-3 text-[0.95rem]">
            <div>
              <dt className="label mb-1">Asked about</dt>
              <dd className="text-ink">{current.concern_areas.join(", ")}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Language</dt>
              <dd className="text-ink">{current.preferred_language ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Where</dt>
              <dd className="text-ink">{current.state ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Sent</dt>
              <dd className="text-ink">{formatDate(current.created_at)}</dd>
            </div>
          </dl>
        </Card>

        <p className="max-w-prose text-sm leading-relaxed text-muted">
          Nothing here is urgent care. If tonight is worse than that, the{" "}
          <Link href="/sos" className="text-sage-deep underline underline-offset-4">
            rescue flow
          </Link>{" "}
          works straight away and without waiting for anyone.
        </p>
      </div>
    );
  }

  return (
    <div className="stack space-y-8">
      <header>
        <p className="label mb-2">Find help</p>
        <h1 className="font-serif text-2xl leading-snug text-ink sm:text-3xl">
          Talk to an actual person
        </h1>
        <p className="mt-3 max-w-prose leading-relaxed text-muted">
          {REFERRALS_OPEN
            ? "There is a point where an app is the wrong help, and asking for a human is the sensible thing rather than the last resort. Tell us what you are looking for and we will email you — a person here reads every one of these."
            : "There is a point where an app is the wrong help, and asking for a human is the sensible thing rather than the last resort. Mentara cannot introduce you to one at the moment — so here is how to find someone properly, which is what you actually need."}
        </p>
      </header>

      {REFERRALS_OPEN ? (
        <>
      <Notice>
        Nobody is introduced to you without having had their registration checked by a person
        against the public register first. Free, on every plan — and it stays that way.
      </Notice>

      <Card>
        <SectionHeading
          eyebrow="Before you start"
          title="What this is, and what it is not"
          hint="Worth knowing in advance, so nothing here surprises you later."
        />
        <ul className="space-y-3 text-[0.95rem] leading-relaxed text-muted">
          {[
            "This is an introduction, not an appointment. Expect a few days by email, not the same night. If tonight is the problem, the rescue flow and the crisis numbers work now.",
            "A person at Mentara reads what you write — that is how the match is made, not by an algorithm. Nothing is passed to a practitioner until we have asked you.",
            "Your journal, check-ins and anything you have said in Support chat are never shared. Only this form is.",
            "You can withdraw at any point, and you never have to accept anyone.",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-sage" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </Card>
        </>
      ) : null}

      <FindHelpForm
        defaultName={memory?.display_name ?? ""}
        defaultEmail={user.email ?? ""}
      />
    </div>
  );
}
