import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS = [
  {
    heading: "What is stored",
    body: [
      "Your email address, used only to sign you in.",
      "Your check-ins, journal entries, SOS logs, tool sessions and generated insights.",
      "Your settings: display name, focus areas, tone, crisis region, and whether AI reflections are on.",
    ],
  },
  {
    heading: "What is not stored",
    body: [
      "No payment details — there is nothing to pay for.",
      "No location, contacts, microphone or camera access.",
      "No advertising identifiers, and no third-party analytics or tracking pixels.",
    ],
  },
  {
    heading: "Who can see it",
    body: [
      "You. Every table enforces row-level security in the database, which means a query can only ever return rows belonging to the account that made it.",
      "Nothing you write is shared with other users, sold, or used to train any model.",
    ],
  },
  {
    heading: "When AI is involved",
    body: [
      "Only if you switch it on. With AI reflections enabled, the text of a journal entry is sent to OpenAI to generate a response, and a numerical summary of your check-ins is sent to describe patterns.",
      "Text that trips the crisis screen is never sent to any model, whatever your setting. The app shows you crisis resources instead.",
      "With AI reflections off, nothing you write leaves the database.",
    ],
  },
  {
    heading: "Leaving",
    body: [
      "Download everything as a JSON file from settings, at any time, without asking.",
      "Deleting your account removes every row and the login itself. It is immediate and cannot be reversed.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main id="main" className="stack py-12">
      <Link href="/" className="text-sm text-muted underline underline-offset-4 hover:text-ink">
        Mentara
      </Link>

      <h1 className="mt-6 font-serif text-3xl text-ink">Privacy</h1>
      <p className="mt-3 leading-relaxed text-muted">
        The short version: it is your writing, it stays yours, and you can take it or delete it
        whenever you want.
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="font-serif text-xl text-ink">{section.heading}</h2>
            <ul className="mt-2.5 space-y-2">
              {section.body.map((line) => (
                <li key={line} className="leading-relaxed text-muted">
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-10 border-t border-line pt-6 text-sm text-faint">
        This page describes how the application is built. Before launching publicly, have it
        reviewed against the privacy law that applies where your users are — in Australia, the
        Privacy Act and the Australian Privacy Principles.
      </p>
    </main>
  );
}
