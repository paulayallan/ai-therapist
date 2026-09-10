import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SignInForm } from "@/components/sign-in-form";
import { DisclaimerNote } from "@/components/disclaimer";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };

export default async function AuthPage() {
  if (isSupabaseConfigured) {
    const user = await getSessionUser();
    if (user) redirect("/dashboard");
  }

  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-12"
    >
      <Link href="/" className="font-serif text-lg tracking-tight text-ink">
        Mentara
      </Link>

      <h1 className="mt-8 font-serif text-2xl text-ink">Welcome back</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Your check-ins, journal and patterns are tied to this account.
      </p>

      <div className="mt-7">
        {isSupabaseConfigured ? (
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-surface" />}>
            <SignInForm />
          </Suspense>
        ) : (
          <div className="rounded-2xl border border-clay/25 bg-clay-soft p-5">
            <p className="font-medium text-clay">Authentication is not configured</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Set <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, then
              restart.
            </p>
          </div>
        )}
      </div>

      <DisclaimerNote className="mt-8" />

      <p className="mt-4 text-xs text-faint">
        <Link href="/sos" className="underline underline-offset-4 hover:text-muted">
          Need help right now?
        </Link>{" "}
        You don&rsquo;t have to sign in for that.
      </p>
    </main>
  );
}
