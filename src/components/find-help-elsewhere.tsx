"use client";

import Link from "next/link";
import { Card, Notice, SectionHeading } from "@/components/ui/card";
import { countryName } from "@/lib/countries";

/**
 * What someone outside Australia gets instead of a form.
 *
 * The honest answer, not a waiting list. Every practitioner here is checked
 * against the AHPRA register, which does not cover anywhere else, so a request
 * from Madrid could never be answered — and a form that takes what someone
 * wrote on a hard night and returns silence is worse than no form at all.
 *
 * Nothing on this screen names a specific overseas register, because one that
 * has moved or been renamed is exactly the sort of dead end this is meant to
 * avoid. It points at Find a Helpline, which is maintained and checked by
 * people whose job that is, and at the two routes that work in most countries.
 */
export function FindHelpElsewhere({
  country,
  reason = "country",
}: {
  country: string;
  /**
   * Why there is no form. "country" means Mentara cannot check a register
   * where they are; "paused" means matching is switched off everywhere
   * because no practitioner is listed yet. Same routes either way — only the
   * explanation differs, and saying the wrong one to an Australian would read
   * as a brush-off.
   */
  reason?: "country" | "paused";
}) {
  const name = countryName(country);
  const isAustralia = country === "AU";

  return (
    <div className="space-y-6">
      {reason === "paused" ? (
        <Notice tone="warm">
          Mentara is not matching people with practitioners yet — there is nobody listed to send a
          request to, so rather than take your details and leave you waiting, here is what works
          today. This is the honest version, not a waiting list.
        </Notice>
      ) : (
        <Notice tone="warm">
          Mentara&rsquo;s own practitioners are in Australia only for now. Every one of them is
          checked against the Australian register, and that check does not exist anywhere else yet
          — so rather than take your details and leave you waiting, here is what actually works in{" "}
          {name}.
        </Notice>
      )}

      {isAustralia ? (
        <Card>
          <SectionHeading
            eyebrow="In Australia"
            title="The two things that get you seen"
            hint="Both work today, without waiting on anyone here."
          />
          <ol className="space-y-4">
            {[
              [
                "A Mental Health Treatment Plan from your GP",
                "Book a longer appointment and say it is what you want. The plan gives you Medicare-subsidised sessions with a psychologist, and the GP can point you at someone taking new people. This is the normal way in, and it is the cheapest.",
              ],
              [
                "Search the register yourself",
                "Every registered practitioner in Australia is listed publicly on the AHPRA register at ahpra.gov.au, and the Australian Psychological Society's Find a Psychologist service at psychology.org.au lets you filter by area and location. Registration is the thing that matters — it means trained, accountable and insured.",
              ],
            ].map(([title, body], index) => (
              <li key={title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sage-soft text-sm font-medium text-sage-deep"
                >
                  {index + 1}
                </span>
                <span>
                  <span className="block font-medium text-ink">{title}</span>
                  <span className="mt-1 block text-[0.95rem] leading-relaxed text-muted">
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      <Card>
        <SectionHeading
          eyebrow="Right now"
          title="If tonight is the problem"
          hint="Answered by people, around the clock, in most countries."
        />
        <a
          href="https://findahelpline.com"
          target="_blank"
          rel="noreferrer noopener"
          className="text-[1.05rem] text-sage-deep underline underline-offset-4"
        >
          findahelpline.com
        </a>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
          Verified crisis lines in over 130 countries, kept current by people who check them. Pick
          your country and it gives you the numbers that are answered where you are.
        </p>
      </Card>

      {/* Skipped for Australia — the card above says the same thing, but
        * specifically, with the register and the plan named. */}
      {isAustralia ? null : (
      <Card>
        <SectionHeading
          eyebrow="For something ongoing"
          title={`Finding someone registered in ${name}`}
          hint="Two routes that work almost everywhere."
        />
        <ol className="space-y-4">
          {[
            [
              "Ask a doctor",
              "A GP or family doctor can refer you, and in many countries that referral is what makes sessions affordable. It is also the fastest way in if you do not know where to start.",
            ],
            [
              "Check the register yourself",
              "Most countries have a psychology or counselling board that publishes a searchable list of who is registered. Registration is the thing that matters — it means someone has been trained, is accountable, and is insured. Search for your country's psychology board by name.",
            ],
          ].map(([title, body], index) => (
            <li key={title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sage-soft text-sm font-medium text-sage-deep"
              >
                {index + 1}
              </span>
              <span>
                <span className="block font-medium text-ink">{title}</span>
                <span className="mt-1 block text-[0.95rem] leading-relaxed text-muted">{body}</span>
              </span>
            </li>
          ))}
        </ol>
      </Card>
      )}

      <p className="max-w-prose text-sm leading-relaxed text-muted">
        Everything else in Mentara works wherever you are — the{" "}
        <Link href="/sos" className="text-sage-deep underline underline-offset-4">
          rescue flow
        </Link>{" "}
        carries crisis numbers for your region, and Support chat, journalling and the tools are not
        limited by country.
      </p>
    </div>
  );
}
