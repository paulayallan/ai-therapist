import "server-only";

import { getSessionUser } from "@/lib/supabase/server";

/**
 * Who can verify a practitioner.
 *
 * Deliberately an environment variable rather than a column on `profiles`. A
 * boolean in the database is one bad RLS policy or one compromised session away
 * from someone granting themselves the power to approve practitioners, and the
 * whole safety story here rests on that approval meaning something. An env var
 * can only be changed by someone who can already deploy.
 */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = adminEmails();
  if (allowed.length === 0) return false;
  return allowed.includes(email.trim().toLowerCase());
}

export async function requireAdmin(): Promise<{ id: string; email: string } | null> {
  try {
    const user = await getSessionUser();
    if (!user?.email || !isAdminEmail(user.email)) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

export type AdminState =
  | { state: "ok"; id: string; email: string }
  /** No session at all — signed out, or the cookie expired. */
  | { state: "anonymous" }
  /** Signed in, but this address is not in ADMIN_EMAILS. */
  | { state: "not-admin"; email: string }
  /** ADMIN_EMAILS is empty or missing in this environment. */
  | { state: "unconfigured"; email: string };

/**
 * The same check, but it says which way it failed.
 *
 * `requireAdmin` returns null for three completely different problems — signed
 * out, wrong address, variable not set — and the pages turned all three into
 * one silent 404. That cost an afternoon of guessing: the answer was "you are
 * signed out", and nothing on screen could say so.
 *
 * The tradeoff is deliberate. A signed-in stranger who guesses this URL now
 * learns the route exists, which is a small loss. They still see no data, no
 * other address, and nothing about who the admins are — only their own email,
 * which they already know. Being unable to tell a locked-out owner why is the
 * more expensive failure.
 */
export async function adminState(): Promise<AdminState> {
  let email: string | null = null;
  let id: string | null = null;
  try {
    const user = await getSessionUser();
    email = user?.email ?? null;
    id = user?.id ?? null;
  } catch {
    return { state: "anonymous" };
  }

  if (!email || !id) return { state: "anonymous" };
  if (adminEmails().length === 0) return { state: "unconfigured", email };
  if (!isAdminEmail(email)) return { state: "not-admin", email };
  return { state: "ok", id, email };
}
