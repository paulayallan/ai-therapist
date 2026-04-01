import type { ReactNode } from "react";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { Card } from "@/components/ui/card";

export function LegalPage({
  eyebrow,
  title,
  description,
  lastUpdated,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#edf5f2_0%,_#f6f0e8_100%)] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="text-sm text-pine/70 transition hover:text-pine">
            Back to home
          </Link>
          <p className="text-xs uppercase tracking-[0.24em] text-pine/55">Last updated {lastUpdated}</p>
        </div>

        <SectionHeading eyebrow={eyebrow} title={title} description={description} />

        <div className="space-y-4">{children}</div>
      </div>
    </main>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card className="space-y-3">
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-pine/78">{children}</div>
    </Card>
  );
}
