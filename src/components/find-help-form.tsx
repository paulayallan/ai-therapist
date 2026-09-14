"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";
import { FindHelpElsewhere } from "@/components/find-help-elsewhere";
import {
  CONCERN_AREAS,
  DELIVERY_CHOICES,
  FUNDING_CHOICES,
  REFERRAL_LANGUAGES,
  REFERRALS_OPEN,
} from "@/lib/referrals";
import { countryFromTimeZone, referralsAvailableIn, sortedCountries } from "@/lib/countries";
import { STATES } from "@/lib/therapists";

const FIELD =
  "w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink placeholder:text-faint focus:border-sage";

export function FindHelpForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [concernAreas, setConcernAreas] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<string>("English");
  const [deliveryPreference, setDeliveryPreference] = useState<string>("either");
  // Timezone is only a first guess, and the field is theirs to change. Anything
  // unrecognised starts on Australia rather than blank, because that is where
  // every practitioner currently is.
  const [country, setCountry] = useState<string>(() => {
    try {
      return countryFromTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone) ?? "AU";
    } catch {
      return "AU";
    }
  });
  const [state, setState] = useState<string>(STATES[0] ?? "NSW");
  const [funding, setFunding] = useState<string>("unsure");
  const [contactName, setContactName] = useState(defaultName);
  const [contactEmail, setContactEmail] = useState(defaultEmail);

  function toggleConcern(value: string) {
    setConcernAreas((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);

    try {
      const response = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concernAreas,
          note,
          preferredLanguage,
          deliveryPreference,
          country,
          state,
          funding,
          contactName,
          contactEmail,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "That did not send.");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That did not send.");
      setBusy(false);
    }
  }

  const countries = useMemo(() => sortedCountries(), []);
  /*
   * Two separate reasons there may be no form, and they are not the same
   * sentence to the person reading it. REFERRALS_OPEN is off while nobody is
   * listed; referralsAvailableIn is about whether a register exists that we
   * can check where they are.
   */
  const available = REFERRALS_OPEN && referralsAvailableIn(country);

  /*
   * The country question comes first and stands alone, because the answer
   * decides whether there is a form at all. Asking someone to fill in six
   * fields and then telling them there is nobody where they live would be
   * the rudest possible way to find out.
   */
  const countryField = (
    <div>
      <label htmlFor="country" className="text-[0.95rem] font-medium text-ink">
        What country are you in?
      </label>
      <select
        id="country"
        value={country}
        onChange={(event) => setCountry(event.target.value)}
        className={`${FIELD} mt-2 sm:max-w-sm`}
      >
        {countries.map((entry) => (
          <option key={entry.code} value={entry.code}>
            {entry.name}
          </option>
        ))}
      </select>
    </div>
  );

  if (!available) {
    return (
      <div className="space-y-8">
        {countryField}
        <FindHelpElsewhere
          country={country}
          reason={REFERRALS_OPEN ? "country" : "paused"}
        />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-9">
      {countryField}

      <fieldset>
        <legend className="font-serif text-lg text-ink">What would you want help with?</legend>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Pick as many as fit. None of this has to be exact.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {CONCERN_AREAS.map((area) => {
            const on = concernAreas.includes(area);
            return (
              <button
                key={area}
                type="button"
                aria-pressed={on}
                onClick={() => toggleConcern(area)}
                className={
                  on
                    ? "rounded-full border border-sage bg-sage-soft px-3.5 py-2 text-sm font-medium text-sage-deep"
                    : "rounded-full border border-line px-3.5 py-2 text-sm text-muted transition-colors hover:border-sage hover:text-ink"
                }
              >
                {area}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <label htmlFor="note" className="font-serif text-lg text-ink">
          Anything you want them to know
        </label>
        {/*
          * The consent is the act of writing it, so the form says plainly who
          * reads it. Nobody should discover afterwards that a stranger saw
          * this.
          */}
        <p className="mb-3 mt-1 max-w-prose text-sm leading-relaxed text-muted">
          Optional. Practitioners who match what you have asked for will read this, so write it
          knowing that. Your name and email are not shown to anyone until you pick someone.
        </p>
        <textarea
          id="note"
          rows={5}
          maxLength={1500}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="What has been going on, in your own words."
          className={`${FIELD} resize-none`}
        />
      </div>

      <fieldset>
        <legend className="font-serif text-lg text-ink">How would you rather meet?</legend>
        <div className="mt-3 space-y-2">
          {DELIVERY_CHOICES.map((choice) => (
            <label
              key={choice.value}
              className={
                deliveryPreference === choice.value
                  ? "flex cursor-pointer gap-3 rounded-xl border border-sage bg-sage-soft px-4 py-3"
                  : "flex cursor-pointer gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:border-sage"
              }
            >
              <input
                type="radio"
                name="delivery"
                value={choice.value}
                checked={deliveryPreference === choice.value}
                onChange={() => setDeliveryPreference(choice.value)}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <span>
                <span className="block text-[0.95rem] text-ink">{choice.label}</span>
                <span className="mt-0.5 block text-sm text-muted">{choice.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="language" className="text-[0.95rem] font-medium text-ink">
            Language you would rather work in
          </label>
          <select
            id="language"
            value={preferredLanguage}
            onChange={(event) => setPreferredLanguage(event.target.value)}
            className={`${FIELD} mt-2`}
          >
            {REFERRAL_LANGUAGES.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="state" className="text-[0.95rem] font-medium text-ink">
            State or territory
          </label>
          <select
            id="state"
            value={state}
            onChange={(event) => setState(event.target.value)}
            className={`${FIELD} mt-2`}
          >
            {STATES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="font-serif text-lg text-ink">How you expect to pay</legend>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          So nobody matches you with someone you cannot afford and then has to say so.
        </p>
        <div className="mt-3 space-y-2">
          {FUNDING_CHOICES.map((choice) => (
            <label
              key={choice.value}
              className={
                funding === choice.value
                  ? "flex cursor-pointer gap-3 rounded-xl border border-sage bg-sage-soft px-4 py-3"
                  : "flex cursor-pointer gap-3 rounded-xl border border-line px-4 py-3 transition-colors hover:border-sage"
              }
            >
              <input
                type="radio"
                name="funding"
                value={choice.value}
                checked={funding === choice.value}
                onChange={() => setFunding(choice.value)}
                className="mt-1 h-4 w-4 shrink-0"
              />
              <span>
                <span className="block text-[0.95rem] text-ink">{choice.label}</span>
                <span className="mt-0.5 block text-sm text-muted">{choice.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-4 border-t border-line pt-8">
        <p className="text-sm leading-relaxed text-muted">
          Released only to the practitioner you choose, and to nobody before that.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-name" className="text-[0.95rem] font-medium text-ink">
              What they should call you
            </label>
            <input
              id="contact-name"
              required
              maxLength={80}
              value={contactName}
              onChange={(event) => setContactName(event.target.value)}
              className={`${FIELD} mt-2`}
            />
          </div>
          <div>
            <label htmlFor="contact-email" className="text-[0.95rem] font-medium text-ink">
              Email to reach you on
            </label>
            <input
              id="contact-email"
              type="email"
              required
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              className={`${FIELD} mt-2`}
            />
          </div>
        </div>

        {error ? <Notice tone="alert">{error}</Notice> : null}

        <Button type="submit" size="lg" disabled={busy || concernAreas.length === 0}>
          {busy ? "Sending…" : "Send this to practitioners"}
        </Button>

        <p className="max-w-prose text-sm leading-relaxed text-muted">
          Mentara introduces you and then steps back. Whoever you choose works under their own
          registration and insurance, on their own systems. Mentara is not part of that care and
          does not see it.
        </p>
      </div>
    </form>
  );
}
