"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, SectionHeading } from "@/components/ui/card";

export function AiConsentToggle({ granted }: { granted: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(granted);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function change(next: boolean) {
    setBusy(true);
    setError(null);
    setValue(next);
    try {
      const response = await fetch("/api/settings/ai-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ granted: next }),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setValue(!next);
      setError("Could not change that. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionHeading
        title="AI support"
        hint="Whether what you write is sent to OpenAI for a reply or a reflection."
      />
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={value}
          disabled={busy}
          onChange={(event) => void change(event.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[rgb(var(--sage))]"
        />
        <span className="text-sm leading-relaxed text-muted">
          Send my messages and journal entries to OpenAI so support chat can reply and entries get a
          written reflection. With this off, everything else still works — SOS, tools, check-ins and
          journalling — and nothing you write leaves the database. Text that suggests a crisis is
          never sent, either way.
        </span>
      </label>
      {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
    </Card>
  );
}

export function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Could not delete the account.");
      router.push("/");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete the account.");
      setBusy(false);
    }
  }

  return (
    <Card>
      <SectionHeading title="Your data" hint="It is yours. Take it with you or remove it entirely." />

      <div className="flex flex-wrap gap-2">
        <a href="/api/account/export" download>
          <Button variant="secondary">Download everything</Button>
        </a>
        {!open ? (
          <Button variant="ghost" onClick={() => setOpen(true)}>
            Delete my account
          </Button>
        ) : null}
      </div>

      {open ? (
        <div className="mt-5 rounded-xl border border-clay/25 bg-clay-soft p-4">
          <p className="text-sm leading-relaxed text-ink">
            This removes your check-ins, journal entries, SOS logs, conversations, insights and
            login. It cannot be undone. Download your data first if you want it.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            If you have a paid subscription, cancel it in the App Store as well — deleting here does
            not cancel an Apple subscription.
          </p>
          <label htmlFor="confirm-delete" className="mt-4 block text-sm font-medium text-ink">
            Type DELETE to confirm
          </label>
          <input
            id="confirm-delete"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            className="mt-1.5 w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink focus:border-clay"
          />
          {error ? <p className="mt-3 text-sm text-clay">{error}</p> : null}
          <div className="mt-4 flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" disabled={confirm !== "DELETE" || busy} onClick={() => void remove()}>
              {busy ? "Deleting…" : "Delete permanently"}
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
