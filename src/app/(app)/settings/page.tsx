import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { CrisisCard } from "@/components/crisis-card";
import { DisclaimerNote } from "@/components/disclaimer";
import { AiConsentToggle, DangerZone } from "@/components/settings-controls";
import { SignOutButton } from "@/components/sign-out-button";
import { Card, SectionHeading } from "@/components/ui/card";
import { PLAN_LABEL, getEffectiveSubscriptionPlan, starterTrialDaysLeft } from "@/lib/billing";
import { getMentalProfile, getProfile, getSubscription } from "@/lib/data";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/auth");

  const [profile, subscription, mental] = await Promise.all([
    getProfile(user.id),
    getSubscription(),
    getMentalProfile(),
  ]);

  const plan = getEffectiveSubscriptionPlan(subscription);
  const trialDaysLeft = starterTrialDaysLeft(subscription);

  return (
    <div className="stack space-y-4">
      <header className="mb-2">
        <h1 className="font-serif text-2xl text-ink sm:text-3xl">Settings</h1>
        <p className="mt-2 text-sm text-muted">Signed in as {user.email}</p>
      </header>

      <Card>
        <SectionHeading title="Your plan" />
        <p className="text-[0.95rem] text-ink">
          {PLAN_LABEL[plan]}
          {trialDaysLeft !== null ? (
            <span className="text-muted">
              {" "}
              — trial, {trialDaysLeft} {trialDaysLeft === 1 ? "day" : "days"} left
            </span>
          ) : null}
        </p>
        <Link
          href="/upgrade"
          className="mt-3 inline-block text-sm text-sage-deep underline underline-offset-4"
        >
          {plan === "premium" ? "See what's included" : "Compare plans"}
        </Link>
      </Card>

      <AiConsentToggle granted={Boolean(profile?.ai_data_consent_granted)} />

      {mental ? (
        <Card>
          <SectionHeading
            title="How it talks to you"
            hint="Set during onboarding. It shapes the tone of support chat and reflections."
          />
          <p className="text-[0.95rem] text-ink">{mental.therapist_style}</p>
          {mental.brings_you_here.length > 0 ? (
            <div className="mt-4">
              <p className="label mb-2">What you said brings you here</p>
              <div className="flex flex-wrap gap-1.5">
                {mental.brings_you_here.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-sage-soft px-3 py-1 text-xs text-sage-deep"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      ) : null}

      <CrisisCard tone="quiet" />

      <DangerZone />

      <Card>
        <SectionHeading title="Session" />
        <SignOutButton />
      </Card>

      <div className="px-1 pb-4 pt-2">
        <DisclaimerNote />
        <nav className="mt-3 flex gap-4 text-sm text-muted">
          <Link href="/privacy" className="hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <Link href="/sos" className="hover:text-ink">
            Crisis support
          </Link>
        </nav>
      </div>
    </div>
  );
}
