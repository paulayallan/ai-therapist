import Link from "next/link";
import type { AdminState } from "@/lib/admin";

/**
 * What an admin screen shows when it will not let you in.
 *
 * Three different problems used to look identical — a blank 404 — which meant
 * the only way to find out why was to guess. This says which one it is, in
 * words, with the fix.
 */
export function AdminGate({ state, next }: { state: AdminState; next: string }) {
  if (state.state === "ok") return null;

  return (
    <main id="main" className="mx-auto max-w-lg space-y-5 px-5 py-16">
      <p className="label">Admin</p>
      <h1 className="font-serif text-2xl leading-snug text-ink">
        {state.state === "anonymous"
          ? "You are not signed in"
          : state.state === "unconfigured"
            ? "No admin list is set"
            : "That account is not an admin"}
      </h1>

      {state.state === "anonymous" ? (
        <>
          <p className="leading-relaxed text-muted">
            This page needs a signed-in account that is on the admin list. Your session has ended,
            or you signed out.
          </p>
          <Link
            href={`/auth?next=${encodeURIComponent(next)}`}
            className="inline-flex h-11 items-center rounded-xl bg-sage px-5 font-medium text-white hover:bg-sage-deep"
          >
            Sign in
          </Link>
        </>
      ) : null}

      {state.state === "not-admin" ? (
        <>
          <p className="leading-relaxed text-muted">
            You are signed in as{" "}
            <span className="select-all font-medium text-ink">{state.email}</span>, which is not on
            the admin list.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Either sign in with an address that is on the list, or add this one to{" "}
            <code className="font-mono text-xs">ADMIN_EMAILS</code> in Vercel — comma separated,
            no spaces — and deploy again. Changing that variable does nothing until a new
            deployment.
          </p>
        </>
      ) : null}

      {state.state === "unconfigured" ? (
        <>
          <p className="leading-relaxed text-muted">
            <code className="font-mono text-xs">ADMIN_EMAILS</code> is empty or missing in this
            environment, so nobody can be an admin — including you.
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Set it in Vercel to{" "}
            <span className="select-all font-medium text-ink">{state.email}</span> and deploy
            again.
          </p>
        </>
      ) : null}

      <p className="border-t border-line pt-5 text-sm text-muted">
        <Link href="/dashboard" className="text-sage-deep underline underline-offset-4">
          Back to the app
        </Link>
      </p>
    </main>
  );
}
