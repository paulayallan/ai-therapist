"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Asking for a reset link.
 *
 * The app shipped without this, which meant anyone who forgot their password
 * lost their journal permanently — there was no route back into an account at
 * all. That is the worst possible failure for a place people write private
 * things.
 *
 * The confirmation is deliberately the same whether or not the address has an
 * account. Saying "no account with that email" turns this form into a way to
 * check who uses a mental health app, which is not a question anyone should be
 * able to ask.
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: sendError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        // Through the existing callback, which swaps the code for a session
        // and then lands them on the page where they choose a new password.
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset`,
      });
      // A rate-limit or transport failure is worth showing. An unknown address
      // is not an error and Supabase does not report it as one.
      if (sendError) throw sendError;
      setSent(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That did not send. Try again shortly.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="leading-relaxed text-ink">
          If there is an account for that address, a link is on its way. It works once and expires
          after an hour.
        </p>
        <p className="text-sm leading-relaxed text-muted">
          Nothing arriving? Check spam, and make sure the address is the one you signed up with.
        </p>
        <Link
          href="/auth"
          className="inline-block text-sm text-sage-deep underline underline-offset-4"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="reset-email" className="text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="reset-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink focus:border-sage"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Sending…" : "Send me a reset link"}
      </Button>

      <Link
        href="/auth"
        className="block text-center text-sm text-muted underline underline-offset-4 hover:text-ink"
      >
        Back to sign in
      </Link>
    </form>
  );
}
