import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { OnboardingForm } from "@/components/onboarding-form";
import { isOnboarded } from "@/lib/data";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Setting up" };

export default async function OnboardingPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth");
  if (await isOnboarded()) redirect("/dashboard");

  return (
    <main id="main" className="mx-auto w-full max-w-md px-5 py-12">
      <p className="font-serif text-lg tracking-tight text-ink">Mentara</p>
      <div className="mt-10">
        <OnboardingForm />
      </div>
    </main>
  );
}
