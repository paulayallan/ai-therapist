import type { Metadata } from "next";
import { HomeworkClient } from "@/components/homework-client";
import { getHomeworkLists } from "@/lib/data";

export const metadata: Metadata = { title: "Homework" };

export default async function HomeworkPage() {
  const lists = await getHomeworkLists();

  return (
    <div className="stack space-y-5">
      <header>
        <h1 className="font-serif text-2xl text-ink sm:text-3xl">Homework</h1>
        <p className="mt-2 max-w-prose leading-relaxed text-muted">
          Small follow-ups — one thing to try before the week is out. Not a to-do list for your
          whole life, and not something you can fall behind on.
        </p>
      </header>

      <HomeworkClient lists={lists} />

      <p className="text-xs leading-relaxed text-faint">
        Nothing here nags you and nothing goes overdue in red. If a step stops being the right one,
        &ldquo;letting this one go&rdquo; is a real answer — it is recorded as a decision, not a
        failure.
      </p>
    </div>
  );
}
