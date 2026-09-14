import { z } from "zod";
import { jsonError, jsonOk, readBody, requireUser } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { screenText } from "@/lib/safety";
import { CONCERN_AREAS, REFERRAL_LANGUAGES, REFERRALS_OPEN } from "@/lib/referrals";
import { COUNTRY_CODES, countryName, referralsAvailableIn } from "@/lib/countries";
import { STATES } from "@/lib/therapists";

const requestSchema = z.object({
  concernAreas: z.array(z.enum(CONCERN_AREAS)).min(1, "Choose at least one."),
  note: z.string().trim().max(1500).optional().or(z.literal("")),
  preferredLanguage: z.enum(REFERRAL_LANGUAGES),
  deliveryPreference: z.enum(["telehealth", "in_person", "either"]),
  country: z.enum(COUNTRY_CODES),
  state: z.enum(STATES),
  funding: z.enum(["medicare_referral", "private", "unsure"]),
  contactName: z.string().trim().min(1, "Tell them what to call you.").max(80),
  contactEmail: z.string().trim().email("That email does not look right.").max(160),
});

/**
 * Asking for a person.
 *
 * The important part of this route is what it does when someone is in crisis.
 * A referral takes days: a practitioner has to see the request, offer, and be
 * chosen. Putting someone who has just written that they want to die into that
 * queue and saying "we'll be in touch" is the worst possible answer, so the
 * request is held, nothing is sent to anyone, and the caller is told to show
 * crisis resources instead.
 *
 * The screen runs against the note in every supported language at once — the
 * words arrive in whichever language the feeling does, not the one the
 * interface happens to be set to.
 */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, requestSchema);
  if (!data) return badBody;

  /*
   * Same reasoning as the country check below. The form hides itself, but
   * hiding a form is a suggestion, not a rule. While matching is off there is
   * nobody to route this to, so accepting it would mean storing what someone
   * wrote on a hard night and never answering it.
   */
  if (!REFERRALS_OPEN) {
    return jsonError(
      "Mentara is not matching people with practitioners yet, so this could not be answered. "
        + "The Find help page lists what works today.",
      422,
    );
  }

  /*
   * Checked here and not only in the form. The form hides itself outside
   * Australia, but hiding a form is a suggestion, not a rule — and a request
   * from a country with no verifiable practitioners is one nobody can ever
   * answer. Better to refuse it out loud than to accept it into silence.
   */
  if (!referralsAvailableIn(data.country)) {
    return jsonError(
      `Mentara's practitioners are in Australia only for now, so a request from `
        + `${countryName(data.country)} could not be answered. The Find help page lists what does `
        + `work where you are.`,
      422,
    );
  }

  const supabase = await createSupabaseServerClient();

  // One open request at a time. Someone anxious will submit three times; three
  // identical requests in a practitioner's queue helps nobody.
  const { data: existing } = await supabase
    .from("referral_requests")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["open", "matched", "held"])
    .maybeSingle();

  if (existing) {
    return jsonError(
      existing.status === "held"
        ? "There is already a request on your account that we are looking at."
        : "You already have a request open. It is on the Find help page.",
      409,
    );
  }

  const screen = screenText(data.note ?? "");
  const held = screen.level === "crisis";

  const { error } = await supabase.from("referral_requests").insert({
    user_id: user.id,
    concern_areas: data.concernAreas,
    note: data.note?.trim() || null,
    preferred_language: data.preferredLanguage,
    delivery_preference: data.deliveryPreference,
    country: data.country,
    state: data.state,
    funding: data.funding,
    safety_level: screen.level,
    // Held requests are invisible to practitioners. Nobody is matched to
    // someone who needs help tonight rather than next week.
    status: held ? "held" : "open",
    contact_name: data.contactName,
    contact_email: data.contactEmail,
  });

  if (error) return jsonError("That did not send. Try again in a moment.", 500);

  return jsonOk({ held, level: screen.level });
}
