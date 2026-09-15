/**
 * The client side of referrals — asking for a person.
 *
 * Shared between server and client, so no secrets and no data access. The
 * practitioner side lives in lib/therapists.ts; these two files describe the
 * same transaction from opposite ends and deliberately do not import each
 * other.
 */

export type ReferralStatus = "open" | "matched" | "closed" | "withdrawn" | "held";

export type ReferralRequest = {
  id: string;
  user_id: string;
  concern_areas: string[];
  note: string | null;
  preferred_language: string | null;
  delivery_preference: "telehealth" | "in_person" | "either" | null;
  state: string | null;
  /** ISO 3166-1 alpha-2. The column exists and defaults to AU; the type was
   * missing it, so nothing could read it back. */
  country: string;
  funding: "medicare_referral" | "private" | "unsure" | null;
  safety_level: string;
  status: ReferralStatus;
  contact_name: string | null;
  contact_email: string | null;
  matched_offer_id: string | null;
  created_at: string;
  expires_at: string;
};

/**
 * What someone picks from. Deliberately plain language rather than clinical
 * terms — this is a person describing their week, not filling in a referral
 * form for a doctor. The practitioner side maps these onto its own
 * specialties.
 */
export const CONCERN_AREAS = [
  "Anxiety",
  "Panic attacks",
  "Constant worry",
  "Low mood",
  "Stress and burnout",
  "Sleep",
  "Something that happened to me",
  "Grief",
  "Relationships",
  "Work",
  "Health worries",
  "Not sure yet",
] as const;

export const REFERRAL_LANGUAGES = [
  "English",
  "Mandarin",
  "Cantonese",
  "Arabic",
  "Vietnamese",
  "Spanish",
  "Portuguese",
  "Greek",
  "Italian",
  "Hindi",
  "Punjabi",
  "Korean",
  "Auslan",
] as const;

export const DELIVERY_CHOICES = [
  { value: "telehealth", label: "Video or phone", hint: "From home, usually easier to get sooner" },
  { value: "in_person", label: "In a room", hint: "Face to face, usually a longer wait" },
  { value: "either", label: "Either is fine", hint: "Widens who can take you on" },
] as const;

/**
 * How someone expects to pay. Not a means test — it exists so a practitioner
 * knows whether to expect a GP referral, and so nobody is matched with someone
 * they cannot afford and then has to say so.
 */
export const FUNDING_CHOICES = [
  {
    value: "medicare_referral",
    label: "I have, or can get, a Mental Health Care Plan",
    hint: "A GP writes one. It rebates part of each session.",
  },
  { value: "private", label: "Paying privately", hint: "No referral needed" },
  { value: "unsure", label: "I do not know yet", hint: "A practitioner can talk you through it" },
] as const;

/**
 * What a practitioner is allowed to see before they have been chosen.
 *
 * Deliberately a separate type rather than a subset of ReferralRequest, so
 * that adding a field to the request cannot silently start exposing it. If a
 * practitioner needs something new, it has to be added here on purpose.
 */
export type RequestForPractitioner = {
  id: string;
  concern_areas: string[];
  note: string | null;
  preferred_language: string | null;
  delivery_preference: "telehealth" | "in_person" | "either" | null;
  state: string | null;
  funding: "medicare_referral" | "private" | "unsure" | null;
  created_at: string;
};

/** The same, plus the two fields released when someone picks them. */
export type MatchedForPractitioner = RequestForPractitioner & {
  contact_name: string | null;
  contact_email: string | null;
};

export const FUNDING_LABEL: Record<string, string> = {
  medicare_referral: "Has or can get a Mental Health Care Plan",
  private: "Paying privately",
  unsure: "Not sure yet",
};

export const DELIVERY_LABEL: Record<string, string> = {
  telehealth: "Video or phone",
  in_person: "In a room",
  either: "Either",
};

/**
 * Whether Mentara is taking referral requests.
 *
 * This is on, and what it means has changed. There is still no marketplace —
 * no practitioner is listed, so nobody is going to "see your request and
 * offer". What happens instead is that a person at Mentara reads every
 * request and emails the address on it. Slower, and entirely honest, because
 * it is a promise one human can actually keep.
 *
 * That promise has a dependency, and it is not code: somebody has to open
 * /admin/referrals and read them. If that stops happening, turn this to false
 * — /find-help then shows the routes that work without us (the AHPRA
 * register, a GP mental health treatment plan, Find a Helpline) and takes
 * nothing it cannot answer. A form that collects what someone wrote on a hard
 * night and replies with silence is worse than no form.
 */
export const REFERRALS_OPEN = true;

export const STATUS_COPY: Record<ReferralStatus, { title: string; body: string }> = {
  open: {
    title: "We have your request",
    body:
      "A person here reads every one of these — it is not an automatic match. "
      + "We will email you at the address you gave us, usually within a few days, either with "
      + "someone we think fits or with an honest answer that we could not find one. "
      + "Nothing has been passed to anyone yet, and nothing will be without asking you first.",
  },
  matched: {
    title: "You have been matched",
    body: "Your details have gone to the practitioner you chose, and to nobody else. They will contact you directly from here.",
  },
  held: {
    title: "We have not sent this on yet",
    body:
      "Someone here will read it properly before anything else happens, and will email you. "
      + "But a referral takes days, and some of what you wrote sounds like it might not keep "
      + "that long — the numbers below are answered right now, around the clock, by people "
      + "trained for exactly this.",
  },
  closed: {
    title: "This request is closed",
    body: "You can start a new one whenever you want to.",
  },
  withdrawn: {
    title: "You withdrew this request",
    body: "Nothing was sent on. You can start a new one whenever you want to.",
  },
};
