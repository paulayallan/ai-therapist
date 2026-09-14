"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";

/**
 * Asking to be checked again, when registration has lapsed.
 *
 * Registration renews every year and the app correctly stops showing requests
 * to anyone whose verification has gone stale. Until now it told them to send
 * their current details and gave them nowhere to send them — a dead end with a
 * monthly invoice attached.
 *
 * This does not re-verify anything. It puts them back in the queue for a
 * person to open the register again, which is the only thing that should ever
 * make someone verified.
 */
export function TherapistReverify({ registrationBody }: { registrationBody: string }) {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const response = await fetch("/api/therapists/reverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: number, note }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "That did not send.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That did not send.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 border-t border-line pt-5">
      <div>
        <label htmlFor="reverify-number" className="text-[0.95rem] font-medium text-ink">
          Current {registrationBody} number
        </label>
        <p className="mb-2 mt-1 text-sm leading-relaxed text-muted">
          Someone will open the public register and check it, same as the first time. Your listing
          pauses until they have.
        </p>
        <input
          id="reverify-number"
          required
          maxLength={40}
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          className="w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink focus:border-sage"
        />
      </div>

      <div>
        <label htmlFor="reverify-note" className="text-[0.95rem] font-medium text-ink">
          Anything we should know <span className="font-normal text-faint">optional</span>
        </label>
        <input
          id="reverify-note"
          maxLength={600}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          className="mt-2 w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink focus:border-sage"
        />
      </div>

      {error ? <Notice tone="alert">{error}</Notice> : null}

      <Button type="submit" disabled={busy || !number.trim()}>
        {busy ? "Sending…" : "Ask to be checked again"}
      </Button>
    </form>
  );
}
