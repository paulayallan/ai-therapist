"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

export function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("error") === "link_expired" ? "That link has expired. Try again." : null,
  );
  const [notice, setNotice] = useState<string | null>(null);

  const next = params.get("next") ?? "/dashboard";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);

    try {
      const supabase = createSupabaseBrowserClient();

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (signUpError) throw signUpError;
        setNotice("Check your email to confirm the account, then sign in.");
        setMode("signin");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;

      router.push(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      router.refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "That did not work.";
      // Supabase returns the same message for a wrong password and an unknown
      // account. Do not make it more specific — that difference is a way to
      // discover whether someone has an account here.
      setError(/invalid login/i.test(message) ? "That email and password do not match." : message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-ink">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink focus:border-sage"
        />
      </div>

      <div>
        <label htmlFor="password" className="text-sm font-medium text-ink">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink focus:border-sage"
        />
        {mode === "signup" ? (
          <p className="mt-1.5 text-xs text-faint">At least 8 characters.</p>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-clay">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="text-sm text-sage-deep">
          {notice}
        </p>
      ) : null}

      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "One moment…" : mode === "signup" ? "Create account" : "Sign in"}
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signup" ? "signin" : "signup");
          setError(null);
          setNotice(null);
        }}
        className="w-full text-sm text-muted underline underline-offset-4 hover:text-ink"
      >
        {mode === "signup" ? "I already have an account" : "Create an account instead"}
      </button>

      {mode === "signup" ? (
        <p className="text-center text-xs leading-relaxed text-faint">
          New accounts start with 5 days of Premium. No card, and it does not renew into anything.
        </p>
      ) : null}
    </form>
  );
}
