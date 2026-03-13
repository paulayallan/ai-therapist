import { SectionHeading } from "@/components/section-heading";
import { ToolsLibrary } from "@/components/tools-library";

export default function ToolsPage() {
  return (
    <div>
      <SectionHeading
        eyebrow="Regulation Tools"
        title="Short practices for calming and re-centering"
        description="Use these tools when anxiety rises, overthinking loops begin, or your body feels activated."
      />
      <ToolsLibrary />
    </div>
  );
}
