import Link from "next/link";
import type { Metadata } from "next";
import { SosFlow } from "@/components/sos-flow";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Right now",
  description: "A short guided sequence for a panic episode or an anxiety spike.",
};

/**
 * Public on purpose. Nobody should meet a login screen in the middle of a
 * panic episode. Signed out, everything works except the logging.
 */
export default async function SosPage() {
  const user = isSupabaseConfigured ? await getSessionUser() : null;

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex h-16 w-full max-w-5xl items-center px-5">
        <Link href="/" className="font-serif text-lg tracking-tight text-ink">
          Mentara
        </Link>
        <Link
          href={user ? "/dashboard" : "/"}
          className="ml-auto text-sm text-muted underline underline-offset-4 hover:text-ink"
        >
          Leave
        </Link>
      </header>

      <main id="main" className="px-5 pb-24 pt-6">
        <SosFlow signedIn={Boolean(user)} />
      </main>
    </div>
  );
}
