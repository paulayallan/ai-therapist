"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";
import {
  STATUS_LABEL,
  nextRegistrationExpiry,
  registrationLabel,
  type Therapist,
} from "@/lib/therapists";

const REGISTER_LINKS: Record<string, { label: string; href: string }> = {
  AHPRA: { label: "AHPRA register", href: "https://www.ahpra.gov.au/registration/registers-of-practitioners.aspx" },
  ACA: { label: "ACA register", href: "https://www.theaca.net.au/find-a-counsellor.php" },
  PACFA: { label: "PACFA register", href: "https://www.pacfa.org.au/portal/Find-a-Therapist" },
};

/**
 * The verification queue.
 *
 * The point of this screen is that a person opens the register in another tab
 * and looks. Everything here exists to make that quick: the number is
 * copyable, the register is one click away, and the two fields that matter —
 * conditions and the re-check date — are right next to the button.
 */
export function AdminTherapistQueue({ therapists }: { therapists: Therapist[] }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(therapists[0]?.id ?? null);
  const [conditions, setConditions] = useState("");
  const [reason, setReason] = useState("");
  const [expiresOn, setExpiresOn] = useState(nextRegistrationExpiry());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function decide(therapistId: string, decision: "verify" | "reject" | "suspend" | "reinstate") {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/admin/therapists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ therapistId, decision, conditions, reason, expiresOn }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "That did not save.");
      setConditions("");
      setReason("");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That did not save.");
    } finally {
      setBusy(false);
    }
  }

  if (therapists.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-5 py-12 text-center">
        <p className="font-serif text-lg text-ink">Nobody waiting</p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Applications appear here as they come in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <Notice tone="alert">{error}</Notice> : null}

      {therapists.map((therapist) => {
        const open = openId === therapist.id;
        const register = REGISTER_LINKS[therapist.registration_body];

        return (
          <div key={therapist.id} className="card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenId(open ? null : therapist.id)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 p-5 text-left"
            >
              <span>
                <span className="block font-medium text-ink">{therapist.full_name}</span>
                <span className="mt-0.5 block text-sm text-muted">
                  {registrationLabel(therapist.registration_type)} · {therapist.state}
                </span>
              </span>
              <span
                className={
                  therapist.status === "verified"
                    ? "shrink-0 rounded-full bg-sage-soft px-2.5 py-1 text-xs font-medium text-sage-deep"
                    : therapist.status === "pending"
                      ? "shrink-0 rounded-full border border-line px-2.5 py-1 text-xs text-muted"
                      : "shrink-0 rounded-full bg-clay-soft px-2.5 py-1 text-xs font-medium text-clay"
                }
              >
                {STATUS_LABEL[therapist.status]}
              </span>
            </button>

            {open ? (
              <div className="border-t border-line p-5">
                <dl className="space-y-2.5 text-[0.95rem]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">{therapist.registration_body} number</dt>
                    <dd className="select-all font-mono text-sm text-ink">
                      {therapist.registration_number}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Email</dt>
                    <dd className="select-all text-ink">{therapist.contact_email}</dd>
                  </div>
                  {therapist.practice_url ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Website</dt>
                      <dd>
                        <a
                          href={therapist.practice_url}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="text-sage-deep underline underline-offset-4"
                        >
                          {therapist.practice_name ?? therapist.practice_url}
                        </a>
                      </dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Languages</dt>
                    <dd className="text-right text-ink">{therapist.languages.join(", ") || "—"}</dd>
                  </div>
                </dl>

                {register ? (
                  <a
                    href={register.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-4 inline-flex h-10 items-center rounded-lg border border-line px-4 text-sm text-ink transition-colors hover:border-sage hover:text-sage-deep"
                  >
                    Open the {register.label} →
                  </a>
                ) : null}

                <div className="mt-5 space-y-4 border-t border-line pt-5">
                  <div>
                    <label
                      htmlFor={`conditions-${therapist.id}`}
                      className="text-[0.95rem] font-medium text-ink"
                    >
                      Conditions or undertakings on the register
                    </label>
                    <p className="mb-2 mt-1 text-sm leading-relaxed text-muted">
                      Leave empty if there are none. If there are, write what they say — a
                      restriction on who someone may treat is the reason this field exists.
                    </p>
                    <textarea
                      id={`conditions-${therapist.id}`}
                      rows={2}
                      maxLength={600}
                      value={conditions}
                      onChange={(event) => setConditions(event.target.value)}
                      className="w-full resize-none rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink focus:border-sage"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`expires-${therapist.id}`}
                      className="text-[0.95rem] font-medium text-ink"
                    >
                      Re-check due
                    </label>
                    <p className="mb-2 mt-1 text-sm text-muted">
                      Defaults to the next 30 November, when most National Board registrations
                      renew.
                    </p>
                    <input
                      id={`expires-${therapist.id}`}
                      type="date"
                      value={expiresOn}
                      onChange={(event) => setExpiresOn(event.target.value)}
                      className="rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink focus:border-sage"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`reason-${therapist.id}`}
                      className="text-[0.95rem] font-medium text-ink"
                    >
                      Reason <span className="font-normal text-faint">if declining or suspending</span>
                    </label>
                    <input
                      id={`reason-${therapist.id}`}
                      maxLength={600}
                      value={reason}
                      onChange={(event) => setReason(event.target.value)}
                      className="mt-2 w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink focus:border-sage"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {therapist.status !== "verified" ? (
                      <Button disabled={busy} onClick={() => void decide(therapist.id, "verify")}>
                        Verified — list them
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        disabled={busy}
                        onClick={() => void decide(therapist.id, "suspend")}
                      >
                        Suspend
                      </Button>
                    )}
                    {therapist.status === "pending" ? (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void decide(therapist.id, "reject")}
                      >
                        Decline
                      </Button>
                    ) : null}
                    {therapist.status === "suspended" || therapist.status === "rejected" ? (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => void decide(therapist.id, "reinstate")}
                      >
                        Put back in the queue
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
