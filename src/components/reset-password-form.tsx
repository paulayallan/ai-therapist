"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Choosing a new password.
 *
 * Reached only after the emailed link has been exchanged for a session by
 * /auth/callback, so the person is already signed in by the time they get
 * here — updateUser is what actually sets the password.
 *
 * The session is checked on mount rather than assumed. Someone who opens this
 * URL directly, or whose link has expired, should be told to start again
 * instead of typing a new password into a form that cannot save it.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const [ready, setReady] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const supabase = createSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      if (!cancelled) setReady(Boolean(data.user));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);

    if (password !== confirm) {
      setError("Those two do not match.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.push("/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That did not save.");
      setBusy(false);
    }
  }

  if (ready === null) {
    return <p className="text-sm text-muted">One moment…</p>;
  }

  if (!ready) {
    return (
      <div className="space-y-4">
        <p className="leading-relaxed text-ink">
          This link has expired, or it has already been used. They only work once, and only for an
          hour.
        </p>
        <Link
          href="/auth/forgot"
          className="inline-block text-sm text-sage-deep underline underline-offset-4"
        >
          Send me a new one
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="new-password" className="text-sm font-medium text-ink">
          New password
        </label>
        <input
          id="new-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink focus:border-sage"
        />
        <p className="mt-1.5 text-xs text-faint">At least 8 characters.</p>
      </div>

      <div>
        <label htmlFor="confirm-password" className="text-sm font-medium text-ink">
          Again, to be sure
        </label>
        <input
          id="confirm-password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink focus:border-sage"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Saving…" : "Save and sign in"}
      </Button>
    </form>
  );
}
