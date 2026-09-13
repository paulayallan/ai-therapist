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
