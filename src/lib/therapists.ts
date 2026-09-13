/**
 * The practitioner side of referrals.
 *
 * Mentara introduces, it does not treat. A practitioner registers here, is
 * verified by a human against the public register, pays a flat monthly fee, and
 * in return sees referral requests they can offer to take. Everything after the
 * introduction — the sessions, the notes, the billing — happens on their own
 * system, which is precisely what keeps Mentara an introduction service rather
 * than a health service platform.
 *
 * This file is shared between client and server, so it holds no secrets and
 * does no data access.
 */

export type RegistrationBody = "AHPRA" | "ACA" | "PACFA";

export type TherapistStatus = "pending" | "verified" | "suspended" | "rejected";

export type TherapistSubscriptionStatus = "none" | "active" | "past_due" | "cancelled";

export type Therapist = {
  id: string;
  user_id: string;
  full_name: string;
  contact_email: string;
  phone: string | null;
  practice_name: string | null;
  practice_url: string | null;
  registration_body: RegistrationBody;
  registration_type: string;
  registration_number: string;
  registration_verified_at: string | null;
  registration_expires_on: string | null;
  registration_conditions: string | null;
  status: TherapistStatus;
  status_reason: string | null;
  specialties: string[];
  languages: string[];
  modalities: string[];
  delivery: string[];
  state: string | null;
  bio: string | null;
  accepting_clients: boolean;
  subscription_status: TherapistSubscriptionStatus;
  subscription_period_end: string | null;
  created_at: string;
};

/**
 * Psychologists and psychiatrists are registered health practitioners under the
 * National Law and appear on the AHPRA register. Counsellors and
 * psychotherapists are not registered by AHPRA at all — their equivalent is ACA
 * or PACFA membership. Collapsing these into one "therapist" field is how an
 * unregistered person ends up taking referrals from a mental-health app.
 */
export const REGISTRATION_TYPES: ReadonlyArray<{
  value: string;
  label: string;
  body: RegistrationBody;
  hint: string;
}> = [
  {
    value: "psychologist",
    label: "Psychologist",
    body: "AHPRA",
    hint: "General registration with the Psychology Board of Australia",
  },
  {
    value: "clinical_psychologist",
    label: "Clinical psychologist",
    body: "AHPRA",
    hint: "Area of practice endorsement in clinical psychology",
  },
  {
    value: "psychiatrist",
    label: "Psychiatrist",
    body: "AHPRA",
    hint: "Specialist registration with the Medical Board of Australia",
  },
  {
    value: "mental_health_social_worker",
    label: "Mental health social worker",
    body: "AHPRA",
    hint: "AASW accredited — enter your AASW membership number",
  },
  {
    value: "counsellor_aca",
    label: "Counsellor (ACA)",
    body: "ACA",
    hint: "Australian Counselling Association, level 2 or above",
  },
  {
    value: "psychotherapist_pacfa",
    label: "Psychotherapist (PACFA)",
    body: "PACFA",
    hint: "PACFA clinical registrant",
  },
];

export const SPECIALTIES = [
  "Anxiety",
  "Panic",
  "Health anxiety",
  "Social anxiety",
  "Depression",
  "Stress and burnout",
  "Trauma",
  "Grief",
  "Sleep",
  "Relationships",
  "Work and career",
  "Perinatal",
  "Young adults",
  "Neurodivergence",
] as const;

export const MODALITIES = [
  "CBT",
  "ACT",
  "Schema therapy",
  "EMDR",
  "Psychodynamic",
  "DBT-informed",
  "Person-centred",
  "Interpersonal therapy",
] as const;

export const LANGUAGES = [
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

export const STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

export const DELIVERY_OPTIONS = [
  { value: "telehealth", label: "Telehealth" },
  { value: "in_person", label: "In person" },
] as const;

/** What a practitioner pays to receive referral requests. Collected on the web. */
export const MONTHLY_FEE_AUD = 30;

export function registrationBodyFor(type: string): RegistrationBody {
  return REGISTRATION_TYPES.find((entry) => entry.value === type)?.body ?? "AHPRA";
}

export function registrationLabel(type: string): string {
  return REGISTRATION_TYPES.find((entry) => entry.value === type)?.label ?? type;
}

/**
 * Registration renews annually — 30 November for psychologists and most
 * National Boards. A "verified" badge that never expires becomes a claim nobody
 * has checked in three years, which is worse than no badge at all.
 */
export function nextRegistrationExpiry(from: Date = new Date()): string {
  const year = from.getUTCFullYear();
  const thisYear = Date.UTC(year, 10, 30); // month is zero-based: 10 = November
  const target = from.getTime() <= thisYear ? thisYear : Date.UTC(year + 1, 10, 30);
  return new Date(target).toISOString().slice(0, 10);
}

export function registrationHasLapsed(therapist: Pick<Therapist, "registration_expires_on">): boolean {
  if (!therapist.registration_expires_on) return true;
  return therapist.registration_expires_on < new Date().toISOString().slice(0, 10);
}

/**
 * The single gate that decides whether a practitioner sees referral requests.
 * Every one of these has to hold, and `past_due` is deliberately allowed: a
 * failed card should not silently drop someone out of the pool mid-week.
 */
export function canReceiveReferrals(therapist: Therapist): boolean {
  return (
    therapist.status === "verified" &&
    therapist.accepting_clients &&
    !registrationHasLapsed(therapist) &&
    (therapist.subscription_status === "active" || therapist.subscription_status === "past_due")
  );
}

/** Why they cannot, in words they can act on. Null when they can. */
export function blockedReason(therapist: Therapist): string | null {
  if (therapist.status === "pending") {
    return "Your registration is being checked against the public register. This usually takes a day or two.";
  }
  if (therapist.status === "rejected") {
    return therapist.status_reason ?? "This application was not accepted.";
  }
  if (therapist.status === "suspended") {
    return therapist.status_reason ?? "This account is suspended.";
  }
  if (registrationHasLapsed(therapist)) {
    return "Your registration needs re-checking. Send us your current registration details and we will verify it again.";
  }
  if (therapist.subscription_status === "none" || therapist.subscription_status === "cancelled") {
    return `Referrals need an active listing. It is $${MONTHLY_FEE_AUD} a month and you can stop any time.`;
  }
  if (!therapist.accepting_clients) {
    return "You are marked as not taking new clients. Turn that back on when you have capacity.";
  }
  return null;
}

export const STATUS_LABEL: Record<TherapistStatus, string> = {
  pending: "Awaiting verification",
  verified: "Verified",
  suspended: "Suspended",
  rejected: "Not accepted",
};
