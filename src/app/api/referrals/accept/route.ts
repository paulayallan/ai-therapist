import { z } from "zod";
import { jsonError, jsonOk, readBody, requireUser } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const acceptSchema = z.object({
  offerId: z.string().uuid(),
  /** "accept" releases contact details. "withdraw" ends the whole request. */
  action: z.enum(["accept", "withdraw"]),
});

/**
 * Choosing a practitioner, or choosing nobody.
 *
 * Runs as the signed-in person rather than the service role. The row-level
 * security policies already say a client may update offers on their own
 * requests and nothing else, so acting as them means the database enforces
 * ownership instead of this route promising to.
 *
 * Accepting is the moment contact details become readable by one practitioner.
 * Everyone else's offer is declined in the same breath, so nobody is left
 * waiting on an answer that is never coming.
 */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, acceptSchema);
  if (!data) return badBody;

  const supabase = await createSupabaseServerClient();

  const { data: offer } = await supabase
    .from("referral_offers")
    .select("id, request_id, status")
    .eq("id", data.offerId)
    .maybeSingle();

  if (!offer) return jsonError("That offer no longer exists.", 404);

  const { data: referral } = await supabase
    .from("referral_requests")
    .select("id, status, user_id")
    .eq("id", offer.request_id)
    .maybeSingle();

  if (!referral || referral.user_id !== user.id) return jsonError("Not found.", 404);
  if (referral.status !== "open") {
    return jsonError("That request has already been answered.", 409);
  }

  if (data.action === "withdraw") {
    await supabase
      .from("referral_offers")
      .update({ status: "declined" })
      .eq("request_id", referral.id)
      .eq("status", "offered");
    await supabase
      .from("referral_requests")
      .update({ status: "withdrawn" })
      .eq("id", referral.id);
    return jsonOk({ withdrawn: true });
  }

  if (offer.status !== "offered") return jsonError("That offer is no longer open.", 409);

  const { error: acceptError } = await supabase
    .from("referral_offers")
    .update({ status: "accepted" })
    .eq("id", offer.id);

  if (acceptError) return jsonError("That did not save.", 500);

  // Everyone else, in the same action. A practitioner refreshing a queue to
  // find out whether they were picked is a bad experience for them and a
  // slower one for the next person they could be helping.
  await supabase
    .from("referral_offers")
    .update({ status: "declined" })
    .eq("request_id", referral.id)
    .eq("status", "offered")
    .neq("id", offer.id);

  const { error: matchError } = await supabase
    .from("referral_requests")
    .update({ status: "matched", matched_offer_id: offer.id })
    .eq("id", referral.id);

  if (matchError) return jsonError("That did not save.", 500);

  return jsonOk({ matched: true });
}
