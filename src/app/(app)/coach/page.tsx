import { CoachClient } from "@/components/coach-client";
import { SectionHeading } from "@/components/section-heading";

export default function CoachPage() {
  return (
    <div>
      <SectionHeading
        eyebrow="CBT Coach"
        title="Structured support for anxious thinking"
        description="This coach responds with validation, likely thought patterns, reframes, practical coping steps, and reflection questions."
      />
      <CoachClient />
    </div>
  );
}
