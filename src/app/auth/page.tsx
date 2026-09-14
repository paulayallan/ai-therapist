import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { SignInForm } from "@/components/sign-in-form";
import { DisclaimerNote } from "@/components/disclaimer";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };

/**
 * One sign-in page for everybody.
 *
 * Practitioners use the same Supabase accounts as everyone else. A second auth
 * system would be a second thing to secure, a second password reset to get
 * right, and a second place for sessions to go wrong. What a practitioner
 * needs is not different plumbing but different framing: someone deciding
 * whether to put their AHPRA registration behind this should not be greeted by
 * an anxiety app's welcome copy.
 *
 * So `?as=practitioner` changes the words, and nothing else.
 */
export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ as?: string; next?: string }>;
}) {
  const params = await searchParams;
  const asPractitioner = params.as === "practitioner";

  if (isSupabaseConfigured) {
    const user = await getSessionUser();
    if (user) {
      // Already signed in: go where they were headed, and failing that, where
      // they belong. A practitioner dropped on /dashboard is pushed into
      // consumer onboarding and asked what brings them here — which is a
      // strange thing to ask a psychologist.
      if (params.next?.startsWith("/") && !params.next.startsWith("//")) {
        redirect(params.next);
      }
      const supabase = await createSupabaseServerClient();
      const { data: therapist } = await supabase
        .from("therapists")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      redirect(therapist ? "/therapists/dashboard" : "/dashboard");
    }
  }

  return (
    <main
      id="main"
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5 py-12"
    >
      <Link href="/" className="font-serif text-lg tracking-tight text-ink">
        Mentara
      </Link>

      {asPractitioner ? (
        <>
          <p className="label mb-2 mt-8">For practitioners</p>
          <h1 className="font-serif text-2xl text-ink">Sign in to your listing</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The same account you applied with. Referral requests, your registration status and your
            billing all sit behind it.
          </p>
        </>
      ) : (
        <>
          <h1 className="mt-8 font-serif text-2xl text-ink">Welcome back</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Your check-ins, journal and patterns are tied to this account.
          </p>
        </>
      )}

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

      {asPractitioner ? (
        // data-web-only: Apple Guideline 3.1.1 — this leads to the $30/month
        // listing. Hidden inside the app, untouched in every browser.
        <p data-web-only className="mt-8 text-sm leading-relaxed text-muted">
          Not listed yet?{" "}
          <Link href="/therapists" className="text-sage-deep underline underline-offset-4">
            How Mentara referrals work
          </Link>
        </p>
      ) : (
        <>
          <DisclaimerNote className="mt-8" />

          <p className="mt-4 text-xs text-faint">
            <Link href="/sos" className="underline underline-offset-4 hover:text-muted">
              Need help right now?
            </Link>{" "}
            You don&rsquo;t have to sign in for that.
          </p>
        </>
      )}
    </main>
  );
}
