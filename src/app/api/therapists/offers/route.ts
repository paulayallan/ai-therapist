import { z } from "zod";
import { jsonError, jsonOk, readBody, requireUser } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { MAX_OFFERS_PER_REQUEST, matches } from "@/lib/referral-matching";
import { screenText } from "@/lib/safety";
import type { ReferralRequest } from "@/lib/referrals";
import type { Therapist } from "@/lib/therapists";

const offerSchema = z.object({
  requestId: z.string().uuid(),
  message: z.string().trim().min(1, "Say something. An empty offer is worse than none.").max(800),
});

/**
 * A practitioner offering to take a request.
 *
 * Reads the request with the service role because row-level security gives it
 * to its author and nobody else — which is the correct default, and the reason
 * this check happens here rather than in a policy. Every condition is
 * re-evaluated server-side: a practitioner could otherwise post any request id
 * they liked and reach someone they were never shown.
 */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, offerSchema);
  if (!data) return badBody;

  const supabase = await createSupabaseServerClient();
  const { data: therapistRow } = await supabase
    .from("therapists")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const therapist = therapistRow as Therapist | null;
  if (!therapist) return jsonError("Not found.", 404);

  // The practitioner's own words go in front of someone who is struggling, so
  // they are screened like any other text in this app.
  const screen = screenText(data.message);
  if (screen.level === "crisis") {
    return jsonError(
      "That message cannot be sent. If you are concerned for this person's safety, contact them "
        + "through your own practice rather than here.",
      422,
    );
  }

  const admin = createSupabaseAdminClient();

  const { data: requestRow } = await admin
    .from("referral_requests")
    .select("*")
    .eq("id", data.requestId)
    .maybeSingle();

  const referral = requestRow as ReferralRequest | null;
  if (!referral) return jsonError("That request no longer exists.", 404);

  const verdict = matches(therapist, referral);
  if (!verdict.matches) return jsonError(verdict.reason ?? "You cannot offer on that request.", 403);

  const { count } = await admin
    .from("referral_offers")
    .select("id", { count: "exact", head: true })
    .eq("request_id", referral.id)
    .in("status", ["offered", "accepted"]);

  if ((count ?? 0) >= MAX_OFFERS_PER_REQUEST) {
    return jsonError("This request already has as many offers as it can take.", 409);
  }

  const { error } = await admin.from("referral_offers").insert({
    request_id: referral.id,
    therapist_id: therapist.id,
    message: data.message,
    status: "offered",
  });

  if (error) {
    // The unique index on (request_id, therapist_id) is what stops a
    // practitioner offering twice, so this is the common case, not a fault.
    return jsonError("You have already offered on this request.", 409);
  }

  return jsonOk({ offered: true });
}
