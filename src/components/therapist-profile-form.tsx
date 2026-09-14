"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/card";
import { Chips, toggleIn } from "@/components/ui/chips";
import {
  DELIVERY_OPTIONS,
  LANGUAGES,
  MODALITIES,
  SPECIALTIES,
  STATES,
  type Therapist,
} from "@/lib/therapists";

const FIELD =
  "w-full rounded-xl border border-line bg-raised px-4 py-3 text-[0.95rem] text-ink placeholder:text-faint focus:border-sage";

/**
 * Editing a listing after it exists.
 *
 * Folded away behind a summary, because this is a screen a practitioner opens
 * twice a year and their referrals are what they came for. But it is not
 * optional: specialties, languages, delivery and state decide which requests
 * they are shown, so a listing nobody can edit is a queue that quietly drifts
 * away from the person it belongs to.
 */
export function TherapistProfileForm({ therapist }: { therapist: Therapist }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [fullName, setFullName] = useState(therapist.full_name);
  const [contactEmail, setContactEmail] = useState(therapist.contact_email);
  const [phone, setPhone] = useState(therapist.phone ?? "");
  const [practiceName, setPracticeName] = useState(therapist.practice_name ?? "");
  const [practiceUrl, setPracticeUrl] = useState(therapist.practice_url ?? "");
  const [specialties, setSpecialties] = useState<string[]>(therapist.specialties);
  const [modalities, setModalities] = useState<string[]>(therapist.modalities);
  const [languages, setLanguages] = useState<string[]>(therapist.languages);
  const [delivery, setDelivery] = useState<string[]>(therapist.delivery);
  const [state, setState] = useState<string>(therapist.state ?? STATES[0] ?? "NSW");
  const [bio, setBio] = useState(therapist.bio ?? "");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const response = await fetch("/api/therapists/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          contactEmail,
          phone,
          practiceName,
          practiceUrl,
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
      setSaved(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "That did not save.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="card overflow-hidden">
      <summary className="cursor-pointer list-none p-5 [&::-webkit-details-marker]:hidden">
        <span className="label mb-1 block">Your listing</span>
        <span className="block font-serif text-xl text-ink">Edit what you work with</span>
        <span className="mt-1.5 block text-sm leading-relaxed text-muted">
          Specialties, languages and format decide which requests you are shown. Keep them current
          and the queue stays right.
        </span>
      </summary>

      <form onSubmit={submit} className="space-y-7 border-t border-line p-5">
        <Chips
          legend="What you work with"
          options={SPECIALTIES}
          selected={specialties}
          onToggle={(value) => setSpecialties((c) => toggleIn(c, value))}
        />

        <Chips
          legend="Languages you can work in"
          hint="The one hard filter — a request in a language you do not speak is never shown to you."
          options={LANGUAGES}
          selected={languages}
          onToggle={(value) => setLanguages((c) => toggleIn(c, value))}
        />

        <Chips
          legend="How you work"
          options={MODALITIES}
          selected={modalities}
          onToggle={(value) => setModalities((c) => toggleIn(c, value))}
        />

        <Chips
          legend="How you see people"
          options={DELIVERY_OPTIONS.map((entry) => entry.label)}
          selected={delivery.map(
            (value) => DELIVERY_OPTIONS.find((entry) => entry.value === value)?.label ?? value,
          )}
          onToggle={(label) => {
            const value = DELIVERY_OPTIONS.find((entry) => entry.label === label)?.value ?? label;
            setDelivery((c) => toggleIn(c, value));
          }}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-state" className="text-[0.95rem] font-medium text-ink">
              Where you practise
            </label>
            <select
              id="profile-state"
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
          <div>
            <label htmlFor="profile-name" className="text-[0.95rem] font-medium text-ink">
              Full name
            </label>
            <input
              id="profile-name"
              required
              maxLength={120}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className={`${FIELD} mt-2`}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-email" className="text-[0.95rem] font-medium text-ink">
              Contact email
            </label>
            <input
              id="profile-email"
              type="email"
              required
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
              className={`${FIELD} mt-2`}
            />
          </div>
          <div>
            <label htmlFor="profile-phone" className="text-[0.95rem] font-medium text-ink">
              Phone <span className="font-normal text-faint">optional</span>
            </label>
            <input
              id="profile-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={`${FIELD} mt-2`}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="profile-practice" className="text-[0.95rem] font-medium text-ink">
              Practice <span className="font-normal text-faint">optional</span>
            </label>
            <input
              id="profile-practice"
              value={practiceName}
              onChange={(event) => setPracticeName(event.target.value)}
              className={`${FIELD} mt-2`}
            />
          </div>
          <div>
            <label htmlFor="profile-url" className="text-[0.95rem] font-medium text-ink">
              Website <span className="font-normal text-faint">optional</span>
            </label>
            <input
              id="profile-url"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={practiceUrl}
              onChange={(event) => setPracticeUrl(event.target.value)}
              className={`${FIELD} mt-2`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="profile-bio" className="text-[0.95rem] font-medium text-ink">
            A few lines about how you work
          </label>
          <p className="mb-2 mt-1 text-sm leading-relaxed text-muted">
            Shown to someone deciding whether to accept your offer. No claims about outcomes or
            success rates — the National Law does not allow them for regulated health services.
          </p>
          <textarea
            id="profile-bio"
            rows={5}
            maxLength={1200}
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            className={`${FIELD} resize-none`}
          />
        </div>

        {error ? <Notice tone="alert">{error}</Notice> : null}
        {saved && !error ? <Notice tone="warm">Saved.</Notice> : null}

        <p className="text-sm leading-relaxed text-muted">
          Your registration number and verification are not editable here — those only change when
          a person has checked the register again.
        </p>

        <Button type="submit" disabled={busy || languages.length === 0 || delivery.length === 0}>
          {busy ? "Saving…" : "Save listing"}
        </Button>
      </form>
    </details>
  );
}
