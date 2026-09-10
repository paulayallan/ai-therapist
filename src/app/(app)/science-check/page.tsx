import type { Metadata } from "next";
import { ScienceCheckClient } from "@/components/science-check-client";
import { getProfile } from "@/lib/data";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Science check",
  description: "What is actually happening in your body during anxiety and panic.",
};

export default async function ScienceCheckPage() {
  const user = await getSessionUser();
  const profile = user ? await getProfile(user.id) : null;

  return (
    <div className="stack space-y-6">
      <header>
        <h1 className="font-serif text-2xl text-ink sm:text-3xl">Science check</h1>
        <p className="mt-2 max-w-prose leading-relaxed text-muted">
          What is actually happening in your body, explained properly. Knowing the mechanism tends
          to help more than being told not to worry — and it holds up better at 3am.
        </p>
      </header>

      <ScienceCheckClient aiConsent={Boolean(profile?.ai_data_consent_granted)} />

      <p className="text-xs leading-relaxed text-faint">
        These describe common mechanisms. They are not a diagnosis, and they cannot tell you what is
        causing your symptoms. Anxiety explains a lot of physical sensations, but it does not rule
        anything out — where a symptom could have a physical cause, get it checked once properly.
      </p>
    </div>
  );
}
