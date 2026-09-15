"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Empty, Notice } from "@/components/ui/card";
import { DELIVERY_LABEL, FUNDING_LABEL } from "@/lib/referrals";

export type InboxRequest = {
  id: string;
  status: string;
  safety_level: string;
  concern_areas: string[];
  note: string | null;
  preferred_language: string | null;
  delivery_preference: string | null;
  state: string | null;
  country: string;
  funding: string | null;
  contact_name: string | null;
  contact_email: string | null;
  created_at: string;
};

function waiting(value: string): string {
  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

function overdue(value: string): boolean {
  return Date.now() - new Date(value).getTime() > 3 * 86_400_000;
}

/**
 * The referral inbox.
 *
 * /find-help promises a person will read this and email back. This screen is
 * that person. It deliberately does not send anything: the reply is an email
 * written by a human from their own address, and a Send button here would be a
 * button that does not send.
 *
 * Held requests come first and loudly. Those are the ones where the crisis
 * screen caught something in what they wrote — they were shown crisis numbers
 * at the time, and nothing was passed on, but they are still waiting to hear
 * from a person and they are the least able to wait.
 */
export function AdminReferralInbox({ requests }: { requests: InboxRequest[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function close(requestId: string) {
    if (busy) return;
    setError(null);
    setBusy(requestId);
    try {
      const response = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action: "close" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "That did not work.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That did not work.");
    } finally {
      setBusy(null);
    }
  }

  if (requests.length === 0) {
    return (
      <Empty
        title="Nothing waiting"
        body="No open requests. When someone asks for a person on the Find help page, they appear here — and they are expecting an email from you within a few days."
      />
    );
  }

  return (
    <div className="space-y-4">
      {error ? <Notice tone="alert">{error}</Notice> : null}

      {requests.map((request) => {
        const held = request.status === "held";
        const late = overdue(request.created_at);
        const subject = encodeURIComponent("About your Mentara request");

        return (
          <article
            key={request.id}
            className={`card p-5 ${held ? "border-2 border-clay/40" : ""}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                {held ? (
                  <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-clay">
                    Crisis screen caught this — read it first
                  </p>
                ) : null}
                <p className="font-medium text-ink">{request.concern_areas.join(" · ")}</p>
              </div>
              <span
                className={`shrink-0 text-sm ${late ? "font-medium text-clay" : "text-faint"}`}
              >
                {waiting(request.created_at)}
                {late ? " — overdue" : ""}
              </span>
            </div>

            <p className="mt-3 text-[0.95rem] text-ink">
              {request.contact_name ?? "—"}{" "}
              <a
                href={`mailto:${request.contact_email ?? ""}?subject=${subject}`}
                className="select-all text-sage-deep underline underline-offset-4"
              >
                {request.contact_email ?? "no email"}
              </a>
            </p>

            {request.note ? (
              <p className="mt-4 whitespace-pre-wrap border-l-2 border-sage/30 pl-4 text-[0.95rem] leading-relaxed text-muted">
                {request.note}
              </p>
            ) : (
              <p className="mt-4 text-sm italic text-faint">They did not write a note.</p>
            )}

            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Language</dt>
                <dd className="text-ink">{request.preferred_language ?? "—"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Format</dt>
                <dd className="text-ink">
                  {DELIVERY_LABEL[request.delivery_preference ?? ""] ?? "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Where</dt>
                <dd className="text-ink">
                  {request.state ?? "—"}
                  {request.country && request.country !== "AU" ? ` · ${request.country}` : ""}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted">Funding</dt>
                <dd className="text-right text-ink">{FUNDING_LABEL[request.funding ?? ""] ?? "—"}</dd>
              </div>
            </dl>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <Button
                variant="secondary"
                disabled={busy !== null}
                onClick={() => void close(request.id)}
              >
                {busy === request.id ? "Saving…" : "I have emailed them"}
              </Button>
              <p className="text-sm text-muted">
                Marks it closed here. It does not send anything — write the email yourself.
              </p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
