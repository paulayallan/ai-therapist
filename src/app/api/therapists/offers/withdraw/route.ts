import { z } from "zod";
import { jsonError, jsonOk, readBody, requireUser } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Therapist } from "@/lib/therapists";

const withdrawSchema = z.object({ offerId: z.string().uuid() });

/**
 * Taking an offer back.
 *
 * A practitioner whose book fills between offering and being chosen needs a
 * way out that is not "accept and then let them down". The person on the other
 * end sees the offer disappear rather than a rejection, which is the kinder
 * version of the same fact.
 *
 * Only an offer still waiting can be withdrawn. Once someone has chosen you,
 * that is a conversation to have with them directly — not something to undo
 * from a dashboard after their details have already been released.
 */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, withdrawSchema);
  if (!data) return badBody;

  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("therapists")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const therapist = row as Therapist | null;
  if (!therapist) return jsonError("Not found.", 404);

  const admin = createSupabaseAdminClient();
  const { data: offer } = await admin
    .from("referral_offers")
    .select("id, therapist_id, status")
    .eq("id", data.offerId)
    .maybeSingle();

  if (!offer || offer.therapist_id !== therapist.id) return jsonError("Not found.", 404);
  if (offer.status === "accepted") {
    return jsonError(
      "They have already chosen you and have your details. Contact them directly rather than "
        + "withdrawing here.",
      409,
    );
  }
  if (offer.status !== "offered") return jsonError("That offer is no longer open.", 409);

  const { error } = await admin
    .from("referral_offers")
    .update({ status: "withdrawn" })
    .eq("id", offer.id);

  if (error) return jsonError("That did not save.", 500);

  return jsonOk({ withdrawn: true });
}
