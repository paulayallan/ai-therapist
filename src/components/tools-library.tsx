import { Card } from "@/components/ui/card";

const tools = [
  {
    title: "Long exhale breathing",
    duration: "2 min",
    when: "Racing heart, panic, spiraling",
    instructions: "Inhale for 4, exhale for 6. Keep the exhale soft and slightly longer."
  },
  {
    title: "5-4-3-2-1 grounding",
    duration: "3 min",
    when: "Feeling detached or overwhelmed",
    instructions: "Name five things you see, four you feel, three you hear, two you smell, and one you taste."
  },
  {
    title: "Body scan reset",
    duration: "4 min",
    when: "Stress held in the body",
    instructions: "Move attention from forehead to feet, releasing tension section by section."
  },
  {
    title: "Thought check",
    duration: "2 min",
    when: "Overthinking, catastrophic predictions",
    instructions: "Ask: what is the thought, what is the evidence, and what is a more balanced view?"
  }
];

export function ToolsLibrary() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {tools.map((tool) => (
        <Card key={tool.title}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-display text-2xl text-ink">{tool.title}</p>
              <p className="mt-1 text-sm text-pine/60">{tool.duration}</p>
            </div>
            <span className="rounded-full bg-mist px-3 py-1 text-xs uppercase tracking-[0.2em] text-pine">{tool.when}</span>
          </div>
          <p className="mt-4 text-sm text-pine/75">{tool.instructions}</p>
        </Card>
      ))}
    </div>
  );
}
