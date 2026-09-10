import type { Metadata } from "next";
import { JournalComposer } from "@/components/journal-composer";
import { Card, Empty, SectionHeading } from "@/components/ui/card";
import { getJournalEntries, getProfile } from "@/lib/data";
import { formatRelative } from "@/lib/date";
import { getSessionUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Journal" };

export default async function JournalPage() {
  const user = await getSessionUser();
  const [profile, entries] = await Promise.all([
    user ? getProfile(user.id) : null,
    getJournalEntries(30),
  ]);

  return (
    <div className="stack space-y-5">
      <header>
        <h1 className="font-serif text-2xl text-ink sm:text-3xl">Journal</h1>
        <p className="mt-2 leading-relaxed text-muted">
          Write it badly. Getting it out of your head is most of the value.
        </p>
      </header>

      <Card>
        <JournalComposer aiConsent={Boolean(profile?.ai_data_consent_granted)} />
      </Card>

      <section>
        <SectionHeading title="Earlier" hint={`${entries.length} saved`} />
        {entries.length === 0 ? (
          <Empty
            title="Nothing here yet"
            body="Entries stay private to your account. You can download or delete all of them at any time from settings."
          />
        ) : (
          <ul className="space-y-2.5">
            {entries.map((entry) => (
              <li key={entry.id} className="card p-5">
                <p className="whitespace-pre-wrap text-[0.95rem] leading-relaxed text-ink">
                  {entry.text_content}
                </p>
                <p className="mt-3 text-xs text-faint">{formatRelative(entry.created_at)}</p>

                {entry.emotional_analysis_json ? (
                  <details className="mt-3 border-t border-line pt-3">
                    <summary className="cursor-pointer text-sm text-sage-deep">Reflection</summary>
                    <div className="mt-3 space-y-3">
                      <p className="text-sm leading-relaxed text-muted">
                        {entry.emotional_analysis_json.summary}
                      </p>
                      {entry.emotional_analysis_json.emotionalThemes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {entry.emotional_analysis_json.emotionalThemes.map((theme) => (
                            <span
                              key={theme}
                              className="rounded-full bg-sage-soft px-2.5 py-1 text-xs text-sage-deep"
                            >
                              {theme}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {entry.emotional_analysis_json.distortions.length > 0 ? (
                        <div>
                          <p className="label mb-1">Patterns worth noticing</p>
                          <p className="text-sm text-muted">
                            {entry.emotional_analysis_json.distortions.join(" · ")}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  </details>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
