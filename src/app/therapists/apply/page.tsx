import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { TherapistApplyForm } from "@/components/therapist-apply-form";
import { createSupabaseServerClient, getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Apply to be listed" };

export default async function TherapistApplyPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth?as=practitioner&next=/therapists/apply");

  // One application per account. Anyone who already has one belongs on the
  // dashboard, where the state of it lives.
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase
    .from("therapists")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) redirect("/therapists/dashboard");

  return (
    <main id="main" className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <Link
        href="/therapists"
        className="text-sm text-muted underline underline-offset-4 hover:text-ink"
      >
        Mentara for practitioners
      </Link>
      <h1 className="mt-4 font-serif text-3xl leading-tight text-ink">Apply to be listed</h1>
      <p className="mt-3 max-w-prose leading-relaxed text-muted">
        Ten minutes, and then a person checks your registration against the public register. Usually
        a day or two. Your dashboard shows where it has got to, either way.
      </p>

      <div className="mt-10">
        <TherapistApplyForm />
      </div>
    </main>
  );
}
