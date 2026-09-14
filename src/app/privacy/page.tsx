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
      "No card numbers. Paid plans are handled by Apple or by our payment provider, and Mentara never sees or keeps your card details — only whether a plan is active and when it renews.",
      "No location, contacts, microphone or camera access.",
      "No advertising identifiers, and no third-party analytics or tracking pixels.",
    ],
  },
  {
    heading: "If you subscribe",
    body: [
      "Paying is optional. The free plan, the SOS flow, the tools and journalling all work without it.",
      "A purchase on iPhone or iPad goes through Apple. A purchase on the web goes through our payment provider, who handles the card. Either way they tell us one thing: which plan you are on and until when.",
      "Your subscription is joined to your account by your account ID and nothing else — never by anything you have written here.",
      "What appears on your bank statement and on receipts is 'Mentara'. It does not describe what the app is for.",
    ],
  },
  {
    heading: "Who can see it",
    body: [
      "You. Every table enforces row-level security in the database, which means a query can only ever return rows belonging to the account that made it.",
      "Nothing you write is sold, or used to train any model. Your journal, your check-ins and anything you say in Support chat are never shown to another person using Mentara.",
      "There is one exception, and it only happens if you start it: asking to be matched with a practitioner. That is described below.",
    ],
  },
  {
    heading: "If you ask to be matched with a practitioner",
    body: [
      "Nothing in this section happens unless you fill in the Find help form yourself. If you never do, no practitioner ever sees anything about you.",
      "What practitioners can see: the areas you chose, the note you wrote, the language you asked for, whether you want video or a room, your state, and how you expect to pay. Only practitioners whose registration has been verified, who are currently listed, and who match what you asked for.",
      "What they cannot see: your name or your email, until you have read their offers and chosen one of them. At that moment those two things go to that practitioner and to nobody else.",
      "What is never included: your journal, your check-ins, your Support chat, your SOS logs, your patterns. A practitioner sees the form you filled in and nothing else from the app.",
      "If the note you write trips the crisis screen, the request is held and no practitioner sees it at all. You are shown crisis lines instead.",
      "Once you have chosen someone, what happens next is between you and them, on their systems. Mentara is an introduction service, not a provider of care, and does not see or hold anything about the sessions themselves.",
      "You can withdraw a request at any time before you choose someone, and nothing further is sent.",
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
