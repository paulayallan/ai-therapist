import { JournalClient } from "@/components/journal-client";
import { SectionHeading } from "@/components/section-heading";
import { getCurrentUser, getJournalEntries } from "@/lib/data";

export default async function JournalPage() {
  const user = await getCurrentUser();
  const entries = await getJournalEntries(user?.id ?? "demo-user");

  return (
    <div>
      <SectionHeading
        eyebrow="Journal"
        title="Capture thoughts and analyze emotional themes"
        description="Use written or voice-supported journaling to surface triggers, emotional tone, and thinking patterns over time."
      />
      <JournalClient entries={entries} />
    </div>
  );
}
