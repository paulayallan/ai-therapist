"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";
import {
  DELIVERY_OPTIONS,
  LANGUAGES,
  MODALITIES,
  MONTHLY_FEE_AUD,
  REGISTRATION_TYPES,
  SPECIALTIES,
  STATES,
  registrationBodyFor,
} from "@/lib/therapists";

const FIELD =
  "w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink placeholder:text-faint focus:border-sage";

function Chips({
  legend,
  hint,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  hint?: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[0.95rem] font-medium text-ink">{legend}</legend>
      {hint ? <p className="mt-1 text-sm leading-relaxed text-muted">{hint}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const on = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(option)}
              className={
                on
                  ? "rounded-full border border-sage bg-sage-soft px-3.5 py-2 text-sm font-medium text-sage-deep"
                  : "rounded-full border border-line px-3.5 py-2 text-sm text-muted transition-colors hover:border-sage hover:text-ink"
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function TherapistApplyForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [practiceName, setPracticeName] = useState("");
  const [practiceUrl, setPracticeUrl] = useState("");
  // `noUncheckedIndexedAccess` is on, so an index into a readonly array is
  // possibly-undefined even when the array is a literal. The fallbacks are
  // never reached; they exist so the compiler does not have to take it on
  // faith.
  const [registrationType, setRegistrationType] = useState(
    REGISTRATION_TYPES[0]?.value ?? "psychologist",
  );
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [modalities, setModalities] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [delivery, setDelivery] = useState<string[]>(["telehealth"]);
  const [state, setState] = useState<string>(STATES[0] ?? "NSW");
  const [bio, setBio] = useState("");
  const [declared, setDeclared] = useState(false);

  const chosen = REGISTRATION_TYPES.find((entry) => entry.value === registrationType);
  const body = registrationBodyFor(registrationType);

  function toggle(list: string[], setList: (next: string[]) => void, value: string) {
    setList(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);

    try {
      const response = await fetch("/api/therapists/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          contactEmail,
          phone,
          practiceName,
          practiceUrl,
          registrationType,
          registrationNumber,
          specialties,
          modalities,
          languages,
          delivery,
          state,
          bio,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "That did not save.");
      router.push("/therapists/dashboard");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That did not save.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-10">
      <section className="space-y-4">
        <h2 className="font-serif text-xl text-ink">You</h2>

        <div>
          <label htmlFor="full-name" className="text-[0.95rem] font-medium text-ink">
            Full name
          </label>
          <p className="mb-2 mt-1 text-sm text-muted">
            Exactly as it appears on the register, or we will not find you.
          </p>
          <input
            id="full-name"
            required
            maxLength={120}
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className={FIELD}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="contact-email" className="text-[0.95rem] font-medium text-ink">
              Contact email
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
          <div>
            <label htmlFor="phone" className="text-[0.95rem] font-medium text-ink">
              Phone <span className="font-normal text-faint">optional</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={`${FIELD} mt-2`}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="practice-name" className="text-[0.95rem] font-medium text-ink">
              Practice <span className="font-normal text-faint">optional</span>
            </label>
            <input
              id="practice-name"
              value={practiceName}
              onChange={(event) => setPracticeName(event.target.value)}
              className={`${FIELD} mt-2`}
            />
          </div>
          <div>
            <label htmlFor="practice-url" className="text-[0.95rem] font-medium text-ink">
              Website <span className="font-normal text-faint">optional</span>
            </label>
            <input
              id="practice-url"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={practiceUrl}
              onChange={(event) => setPracticeUrl(event.target.value)}
              className={`${FIELD} mt-2`}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-ink">Registration</h2>
        <p className="text-sm leading-relaxed text-muted">
          Checked by a person against the public register before you are listed, including whether
          any conditions or undertakings are recorded.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="registration-type" className="text-[0.95rem] font-medium text-ink">
              What you hold
            </label>
            <select
              id="registration-type"
              value={registrationType}
              onChange={(event) => setRegistrationType(event.target.value)}
              className={`${FIELD} mt-2`}
            >
              {REGISTRATION_TYPES.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </select>
            {chosen ? <p className="mt-2 text-sm text-muted">{chosen.hint}</p> : null}
          </div>
          <div>
            <label htmlFor="registration-number" className="text-[0.95rem] font-medium text-ink">
              {body} number
            </label>
            <input
              id="registration-number"
              required
              value={registrationNumber}
              onChange={(event) => setRegistrationNumber(event.target.value)}
              placeholder={body === "AHPRA" ? "PSY0001234567" : "Membership number"}
              className={`${FIELD} mt-2`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="state" className="text-[0.95rem] font-medium text-ink">
            Where you practise
          </label>
          <select
            id="state"
            value={state}
            onChange={(event) => setState(event.target.value)}
            className={`${FIELD} mt-2 sm:max-w-[12rem]`}
          >
            {STATES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="space-y-7">
        <h2 className="font-serif text-xl text-ink">Your work</h2>

        <Chips
          legend="How you see people"
          options={DELIVERY_OPTIONS.map((entry) => entry.label)}
          selected={delivery.map(
            (value) => DELIVERY_OPTIONS.find((entry) => entry.value === value)?.label ?? value,
          )}
          onToggle={(label) => {
            const value = DELIVERY_OPTIONS.find((entry) => entry.label === label)?.value ?? label;
            toggle(delivery, setDelivery, value);
          }}
        />

        <Chips
          legend="Languages you can work in"
          hint="This is one of the few things people filter on, and it matters more than anything else on this page."
          options={LANGUAGES}
          selected={languages}
          onToggle={(value) => toggle(languages, setLanguages, value)}
        />

        <Chips
          legend="What you work with"
          options={SPECIALTIES}
          selected={specialties}
          onToggle={(value) => toggle(specialties, setSpecialties, value)}
        />

        <Chips
          legend="How you work"
          options={MODALITIES}
          selected={modalities}
          onToggle={(value) => toggle(modalities, setModalities, value)}
        />

        <div>
          <label htmlFor="bio" className="text-[0.95rem] font-medium text-ink">
            A few lines about how you work <span className="font-normal text-faint">optional</span>
          </label>
          <p className="mb-2 mt-1 text-sm leading-relaxed text-muted">
            Shown to someone deciding whether to accept your offer. Keep it plain — no claims about
            outcomes or success rates, which the National Law does not allow for regulated health
            services.
          </p>
          <textarea
            id="bio"
            rows={5}
            maxLength={1200}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className={`${FIELD} resize-none`}
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-line pt-8">
        <label className="flex gap-3 text-[0.95rem] leading-relaxed text-ink">
          <input
            type="checkbox"
            required
            checked={declared}
            onChange={(event) => setDeclared(event.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[color:var(--sage,#7d9b76)]"
          />
          <span>
            I hold the registration above, it is current, and I will tell Mentara if that changes or
            if conditions are placed on it. I hold professional indemnity insurance. I understand
            Mentara introduces clients and is not responsible for the care I provide.
          </span>
        </label>

        {error ? <Notice tone="alert">{error}</Notice> : null}

        <Notice>
          Applying is free. You are not charged while your registration is being checked, and
          nothing is listed until it has been. The listing fee is ${MONTHLY_FEE_AUD} a month after
          that.
        </Notice>

        <Button type="submit" size="lg" disabled={busy || !declared}>
          {busy ? "Sending…" : "Send application"}
        </Button>
      </section>
    </form>
  );
}
