"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CrisisBanner } from "@/components/crisis-banner";

const steps = [
  {
    title: "Orient to the room",
    duration: "60 sec",
    body: "Name 5 things you can see, 4 you can feel, 3 you can hear, 2 you can smell, and 1 you can taste."
  },
  {
    title: "Paced breathing",
    duration: "2 min",
    body: "Inhale for 4, exhale for 6. Let the exhale stay longer than the inhale. Keep your shoulders soft."
  },
  {
    title: "Release tension",
    duration: "90 sec",
    body: "Press your feet into the floor. Tighten your fists for 5 seconds, then slowly release. Relax your jaw."
  },
  {
    title: "Reality reminder",
    duration: "30 sec",
    body: "Panic feels intense, but it is temporary. These sensations are your nervous system trying to protect you, not proof of danger."
  }
];

export function SOSFlow() {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const done = index === steps.length - 1;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="bg-pine text-white">
        <p className="text-xs uppercase tracking-[0.24em] text-white/60">SOS Mode</p>
        <h1 className="mt-2 font-display text-4xl">Guided panic support</h1>
        <p className="mt-3 max-w-xl text-sm text-white/80">
          Move one step at a time. You do not need to solve everything right now. The goal is to help your body feel safer.
        </p>
        <div className="mt-8 rounded-[28px] bg-white/10 p-6">
          <div className="flex items-center justify-between">
            <p className="font-display text-2xl">{step.title}</p>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em]">{step.duration}</span>
          </div>
          <p className="mt-4 text-lg text-white/85">{step.body}</p>
          <div className="mt-6 flex gap-3">
            <Button variant="secondary" disabled={index === 0} onClick={() => setIndex((value) => value - 1)}>
              Back
            </Button>
            <Button onClick={() => setIndex((value) => (done ? value : value + 1))}>{done ? "Stay here" : "Next step"}</Button>
          </div>
        </div>
      </Card>
      <div className="space-y-4">
        <Card>
          <p className="font-medium text-ink">Quick reassurance</p>
          <p className="mt-2 text-sm text-pine/70">
            Panic symptoms can mimic danger, but they usually crest and pass. Slow exhalations and sensory grounding help the nervous system settle.
          </p>
        </Card>
        <CrisisBanner />
      </div>
    </div>
  );
}
