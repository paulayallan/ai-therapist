"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Empty, Notice } from "@/components/ui/card";
import {
  DELIVERY_LABEL,
  FUNDING_LABEL,
  type MatchedForPractitioner,
  type RequestForPractitioner,
} from "@/lib/referrals";

function when(value: string): string {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function Facts({ request }: { request: RequestForPractitioner }) {
  return (
    <dl className="mt-4 space-y-2 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Language</dt>
        <dd className="text-ink">{request.preferred_language ?? "—"}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Format</dt>
        <dd className="text-ink">
          {DELIVERY_LABEL[request.delivery_preference ?? ""] ?? "—"}
          {request.state ? ` · ${request.state}` : ""}
        </dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-muted">Funding</dt>
        <dd className="text-right text-ink">{FUNDING_LABEL[request.funding ?? ""] ?? "—"}</dd>
      </div>
    </dl>
  );
}

/**
 * The requests a practitioner can take, and the people who chose them.
 *
 * No name, no email, no age, nothing identifying until someone picks them.
 * What they get is what the person asked for and what the person chose to
 * write — which is enough to decide whether you can help, and not enough to
 * decide anything else.
 */
export function TherapistRequests({
  open,
  matched,
}: {
  open: RequestForPractitioner[];
  matched: MatchedForPractitioner[];
}) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function offer(requestId: string) {
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/therapists/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, message }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "That did not send.");
      setMessage("");
      setOpenId(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That did not send.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {matched.length > 0 ? (
        <section>
          <h2 className="mb-3 font-serif text-xl text-ink">They chose you</h2>
          <div className="space-y-3">
            {matched.map((request) => (
              <div key={request.id} className="card p-5">
                <p className="label mb-2">Contact them from here</p>
                <p className="font-medium text-ink">{request.contact_name ?? "—"}</p>
                <a
                  href={`mailto:${request.contact_email ?? ""}`}
                  className="select-all text-sage-deep underline underline-offset-4"
                >
                  {request.contact_email ?? "—"}
                </a>
                {request.note ? (
                  <p className="mt-4 whitespace-pre-wrap border-l-2 border-sage/30 pl-4 text-[0.95rem] leading-relaxed text-muted">
                    {request.note}
                  </p>
                ) : null}
                <Facts request={request} />
                <p className="mt-4 border-t border-line pt-4 text-sm leading-relaxed text-muted">
                  From here this is yours — your intake, your notes, your insurance. Mentara has no
                  part in the care and does not see it.
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 font-serif text-xl text-ink">
          Requests you can take{open.length ? ` · ${open.length}` : ""}
        </h2>

        {error ? (
          <div className="mb-3">
            <Notice tone="alert">{error}</Notice>
          </div>
        ) : null}

        {open.length === 0 ? (
          <Empty
            title="Nothing waiting"
            body="Requests that match your languages, format and specialties appear here. There is no email alert yet, so this page is worth a look every day or two — the sooner someone hears back, the more use it is to them."
          />
        ) : (
          <div className="space-y-3">
            {open.map((request) => {
              const expanded = openId === request.id;
              return (
                <div key={request.id} className="card overflow-hidden">
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="font-medium text-ink">{request.concern_areas.join(" · ")}</p>
                      <span className="shrink-0 text-sm text-faint">{when(request.created_at)}</span>
                    </div>

                    {request.note ? (
                      <p className="mt-3 whitespace-pre-wrap border-l-2 border-line pl-4 text-[0.95rem] leading-relaxed text-muted">
                        {request.note}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm italic text-faint">They did not write a note.</p>
                    )}

                    <Facts request={request} />

                    {expanded ? (
                      <div className="mt-5 space-y-3 border-t border-line pt-5">
                        <label
                          htmlFor={`message-${request.id}`}
                          className="text-[0.95rem] font-medium text-ink"
                        >
                          What you would say to them
                        </label>
                        <p className="text-sm leading-relaxed text-muted">
                          They will read this alongside other offers and choose one. Plain and
                          specific beats polished — and no claims about outcomes.
                        </p>
                        <textarea
                          id={`message-${request.id}`}
                          rows={4}
                          maxLength={800}
                          value={message}
                          onChange={(event) => setMessage(event.target.value)}
                          className="w-full resize-none rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink focus:border-sage"
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button disabled={busy || !message.trim()} onClick={() => void offer(request.id)}>
                            {busy ? "Sending…" : "Send this offer"}
                          </Button>
                          <Button variant="ghost" disabled={busy} onClick={() => setOpenId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5">
                        <Button variant="secondary" onClick={() => setOpenId(request.id)}>
                          Offer to take this
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
