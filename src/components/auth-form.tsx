"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      setError("Supabase is not configured yet. Add env vars to enable auth.");
      return;
    }

    const response =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (response.error) {
      setError(response.error.message);
      return;
    }

    if (mode === "signup" && !response.data.session) {
      setNotice("Account created. Check your email to confirm your sign-up, then log in.");
      setMode("login");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <Card className="mx-auto max-w-md">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.24em] text-pine/60">Secure Access</p>
        <h1 className="mt-2 font-display text-4xl text-ink">{mode === "signup" ? "Create account" : "Welcome back"}</h1>
        <p className="mt-2 text-sm text-pine/70">
          Build a private mental health support space with journaling, coaching, and progress tracking.
        </p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm text-ink">Email</span>
          <input
            className="w-full rounded-2xl border border-pine/15 bg-sand/70 px-4 py-3 outline-none ring-0 focus:border-pine"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-ink">Password</span>
          <input
            className="w-full rounded-2xl border border-pine/15 bg-sand/70 px-4 py-3 outline-none ring-0 focus:border-pine"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="text-sm text-coral">{error}</p> : null}
        {notice ? <p className="text-sm text-pine">{notice}</p> : null}
        <Button className="w-full" disabled={loading}>
          {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Log in"}
        </Button>
      </form>
      <button
        className="mt-5 text-sm text-pine"
        onClick={() => {
          setError(null);
          setNotice(null);
          setMode(mode === "signup" ? "login" : "signup");
        }}
        type="button"
      >
        {mode === "signup" ? "Already have an account? Log in" : "Need an account? Sign up"}
      </button>
    </Card>
  );
}
