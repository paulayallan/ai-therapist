"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";

export type OfferView = {
  id: string;
  message: string | null;
  therapist: {
    full_name: string;
    registration_label: string;
    registration_body: string;
    practice_name: string | null;
    practice_url: string | null;
    state: string | null;
    languages: string[];
    modalities: string[];
    bio: string | null;
    contact_email: string | null;
  };
};

/**
 * The offers someone has received, and choosing one.
 *
 * No ratings, no reviews, no "97% match". The National Law prohibits
 * testimonials for regulated health services, and a score would be a claim
 * about clinical quality that nobody here is in a position to make. What is
 * shown is what the practitioner holds, how they work, and what they wrote —
 * which is what a person would actually want to read anyway.
 */
export function ReferralOffers({
  requestId,
  offers,
  accepted,
}: {
  /** Needed to withdraw. Withdrawing is about the request, not about an
   * offer — and there may be no offers at all, which is exactly when someone
   * is most likely to want out. */
  requestId: string;
  offers: OfferView[];
  accepted: OfferView | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  async function accept(offerId: string) {
    await send({ action: "accept", offerId });
  }

  async function withdraw() {
    await send({ action: "withdraw", requestId });
  }

  async function send(body: Record<string, string>) {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/referrals/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "That did not work.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That did not work.");
      setBusy(false);
    }
  }

  if (accepted) {
    const { therapist } = accepted;
    return (
      <div className="card p-5 sm:p-6">
        <p className="label mb-2">You chose</p>
        <h2 className="font-serif text-xl text-ink">{therapist.full_name}</h2>
        <p className="mt-1 text-sm text-muted">
          {therapist.registration_label}
          {therapist.state ? ` · ${therapist.state}` : ""}
        </p>
        {therapist.practice_url ? (
          <a
            href={therapist.practice_url}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-block text-sm text-sage-deep underline underline-offset-4"
          >
            {therapist.practice_name ?? therapist.practice_url}
          </a>
        ) : null}
        {therapist.contact_email ? (
          <p className="mt-4 text-[0.95rem] text-ink">
            <span className="block text-sm text-muted">If you want to reach them first</span>
            <a
              href={`mailto:${therapist.contact_email}`}
              className="select-all text-sage-deep underline underline-offset-4"
            >
              {therapist.contact_email}
            </a>
          </p>
        ) : null}
        <p className="mt-5 border-t border-line pt-5 text-sm leading-relaxed text-muted">
          Your name and email have gone to them and to nobody else. They will be in touch. Anything
          from here happens between the two of you — Mentara is not part of it and does not see it.
        </p>
      </div>
    );
  }

  if (offers.length === 0) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-xl text-ink">
          {offers.length === 1 ? "One practitioner offered" : `${offers.length} practitioners offered`}
        </h2>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted">
          Read them and pick whoever sounds right. Choosing one sends them your name and email; the
          others are told it is taken. You do not have to pick anybody.
        </p>
      </div>

      {error ? <Notice tone="alert">{error}</Notice> : null}

      {offers.map((offer) => {
        const { therapist } = offer;
        const isConfirming = confirming === offer.id;
        return (
          <div key={offer.id} className="card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-serif text-lg text-ink">{therapist.full_name}</h3>
              <span className="rounded-full bg-sage-soft px-2.5 py-1 text-xs font-medium text-sage-deep">
                {therapist.registration_body} verified
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">
              {therapist.registration_label}
              {therapist.state ? ` · ${therapist.state}` : ""}
            </p>

            {offer.message ? (
              <p className="mt-4 whitespace-pre-wrap border-l-2 border-sage/30 pl-4 text-[0.95rem] leading-relaxed text-ink">
                {offer.message}
              </p>
            ) : null}

            {therapist.bio ? (
              <p className="mt-4 whitespace-pre-wrap text-[0.95rem] leading-relaxed text-muted">
                {therapist.bio}
              </p>
            ) : null}

            <dl className="mt-4 space-y-2 text-sm">
              {therapist.languages.length ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Languages</dt>
                  <dd className="text-right text-ink">{therapist.languages.join(", ")}</dd>
                </div>
              ) : null}
              {therapist.modalities.length ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">How they work</dt>
                  <dd className="text-right text-ink">{therapist.modalities.join(", ")}</dd>
                </div>
              ) : null}
            </dl>

            {isConfirming ? (
              <div className="mt-5 space-y-3 border-t border-line pt-5">
                <p className="text-[0.95rem] leading-relaxed text-ink">
                  This sends {therapist.full_name} your name and email, and closes the other offers.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={busy} onClick={() => void accept(offer.id)}>
                    {busy ? "Sending…" : "Yes, choose them"}
                  </Button>
                  <Button variant="ghost" disabled={busy} onClick={() => setConfirming(null)}>
                    Not yet
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-5">
                <Button variant="secondary" onClick={() => setConfirming(offer.id)}>
                  Choose {therapist.full_name.split(" ")[0]}
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <div className="border-t border-line pt-4">
        <Button
          variant="ghost"
          disabled={busy}
          onClick={() => void withdraw()}
        >
          Withdraw my request
        </Button>
        <p className="mt-1 text-sm text-muted">
          Nothing more is sent to anyone, and nobody is told why.
        </p>
      </div>
    </div>
  );
}
