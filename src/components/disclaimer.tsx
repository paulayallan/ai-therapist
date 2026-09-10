import { NON_CLINICAL_DISCLAIMER } from "@/lib/safety";
import { cn } from "@/lib/utils";

export function DisclaimerNote({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-relaxed text-faint", className)}>
      {NON_CLINICAL_DISCLAIMER}
    </p>
  );
}
