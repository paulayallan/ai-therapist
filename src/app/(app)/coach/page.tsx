import { CoachClient } from "@/components/coach-client";
import { SectionHeading } from "@/components/section-heading";

export default function CoachPage() {
  return (
    <div>
      <SectionHeading
        eyebrow="Free Support"
        title="24/7 mental support for the moments that hit now"
        description="Talk naturally, get calm support, and take one next step."
      />
      <CoachClient />
    </div>
  );
}
