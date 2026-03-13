import { getCrisisResources } from "@/lib/safety";
import { Card } from "@/components/ui/card";

export function CrisisBanner() {
  const resources = getCrisisResources();

  return (
    <Card className="border-coral/30 bg-coral/10">
      <p className="font-semibold text-ink">{resources.title}</p>
      <p className="mt-2 text-sm text-ink/80">{resources.description}</p>
      <ul className="mt-4 space-y-1 text-sm text-ink">
        {resources.resources.map((resource) => (
          <li key={resource}>{resource}</li>
        ))}
      </ul>
    </Card>
  );
}
