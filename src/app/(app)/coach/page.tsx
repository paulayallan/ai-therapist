import { CoachClient } from "@/components/coach-client";
import { SectionHeading } from "@/components/section-heading";

export default function CoachPage() {
  return (
    <div>
      <SectionHeading
        eyebrow="Free Support"
        title="24/7 mental support for the moments that hit now"
        description="This is the free layer: immediate help for anxiety, stress, spirals, and emotional regulation with structured psychological guidance."
      />
      <CoachClient />
    </div>
  );
}
