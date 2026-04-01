import { AccountDeleteCard } from "@/components/account-delete-card";
import { SectionHeading } from "@/components/section-heading";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Settings"
        title="Account settings"
        description="Manage your Mentara account and privacy controls."
      />

      <Card>
        <p className="font-display text-2xl text-ink">Data and privacy</p>
        <p className="mt-2 text-sm text-pine/70">
          You can request permanent deletion of your account directly from this page. This action cannot be undone.
        </p>
        <p className="mt-2 text-sm font-medium text-ink">Delete account and data</p>
      </Card>

      <AccountDeleteCard />
    </div>
  );
}
