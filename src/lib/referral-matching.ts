import type { ReferralRequest } from "@/lib/referrals";
import { canReceiveReferrals, type Therapist } from "@/lib/therapists";

/**
 * Deciding which practitioner sees which request.
 *
 * The two sides use different words on purpose. A person writes "something
 * that happened to me"; a practitioner lists "Trauma". Making the person pick
 * from a clinical vocabulary would be asking them to diagnose themselves
 * before they are allowed to ask for help. So the translation happens here,
 * out of sight of both of them.
 *
 * The rules are deliberately generous. A queue that is too strict shows
 * practitioners nothing, and a practitioner who pays monthly and never sees a
 * request cancels — which leaves the people asking with nobody. Language is
 * the one hard filter, because it is the thing that actually stops a session
 * working.
 */

/** Client wording on the left, practitioner specialties on the right. */
const CONCERN_TO_SPECIALTY: Record<string, string[]> = {
  "Anxiety": ["Anxiety", "Social anxiety", "Health anxiety"],
  "Panic attacks": ["Panic", "Anxiety"],
  "Constant worry": ["Anxiety", "Stress and burnout"],
  "Low mood": ["Depression"],
  "Stress and burnout": ["Stress and burnout", "Work and career"],
  "Sleep": ["Sleep"],
  "Something that happened to me": ["Trauma"],
  "Grief": ["Grief"],
  "Relationships": ["Relationships"],
  "Work": ["Work and career", "Stress and burnout"],
  "Health worries": ["Health anxiety", "Anxiety"],
  // Someone who does not yet know what is wrong is exactly who should be
  // seeing a practitioner. Matching them to nobody would be perverse, so this
  // one matches everybody.
  "Not sure yet": [],
};

export function specialtiesFor(concernAreas: string[]): string[] {
  const out = new Set<string>();
  for (const area of concernAreas) {
    for (const specialty of CONCERN_TO_SPECIALTY[area] ?? []) out.add(specialty);
  }
  return [...out];
}

/** True when the request names nothing specific enough to filter on. */
export function isOpenEnded(concernAreas: string[]): boolean {
  return specialtiesFor(concernAreas).length === 0;
}

export type MatchResult = { matches: boolean; reason?: string };

/**
 * Whether one practitioner should see one request.
 *
 * Returns a reason when it does not match, because the same function decides
 * what a practitioner sees AND guards the route where they offer — and a
 * refusal that cannot say why is a support email waiting to happen.
 */
export function matches(therapist: Therapist, request: ReferralRequest): MatchResult {
  if (!canReceiveReferrals(therapist)) {
    return { matches: false, reason: "This account cannot take referrals right now." };
  }
  if (request.status !== "open") {
    return { matches: false, reason: "That request is no longer open." };
  }
  if (new Date(request.expires_at) < new Date()) {
    return { matches: false, reason: "That request has expired." };
  }

  // Language is the hard one. Everything else can be worked around; a session
  // in a language someone cannot think in cannot.
  const language = request.preferred_language;
  if (language && !therapist.languages.includes(language)) {
    return { matches: false, reason: `This request asked for ${language}.` };
  }

  const wantsRoom = request.delivery_preference === "in_person";
  const wantsScreen = request.delivery_preference === "telehealth";

  if (wantsRoom && !therapist.delivery.includes("in_person")) {
    return { matches: false, reason: "This request asked to meet in person." };
  }
  if (wantsScreen && !therapist.delivery.includes("telehealth")) {
    return { matches: false, reason: "This request asked for video or phone." };
  }
  // Sharing a room means sharing a state. Telehealth does not — registration
  // is national.
  if (wantsRoom && request.state && therapist.state !== request.state) {
    return { matches: false, reason: `This request is in ${request.state}.` };
  }

  const wanted = specialtiesFor(request.concern_areas);
  if (wanted.length > 0 && !wanted.some((specialty) => therapist.specialties.includes(specialty))) {
    return { matches: false, reason: "This request is outside what you listed." };
  }

  return { matches: true };
}

/**
 * How many practitioners may offer on one request before it stops accepting
 * more.
 *
 * Someone who has just worked up the nerve to ask for help should not open the
 * app to fifteen strangers competing for them. Five is enough to choose from
 * and few enough to read.
 */
export const MAX_OFFERS_PER_REQUEST = 5;
