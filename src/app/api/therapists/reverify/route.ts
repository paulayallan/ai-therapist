import { z } from "zod";
import { jsonError, jsonOk, readBody, requireUser } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { registrationBodyFor, type Therapist } from "@/lib/therapists";

const reverifySchema = z.object({
  registrationNumber: z.string().trim().min(4, "We need your current registration number.").max(40),
  note: z.string().trim().max(600).optional().or(z.literal("")),
});

/**
 * Asking to be checked again.
 *
 * Registration renews every year, and when it lapses the app stops showing
 * that practitioner any requests — correctly. But until now it told them to
 * "send us your current registration details" and gave them no way to do it,
 * which is a dead end with a monthly invoice attached.
 *
 * This sends them back to the start of the queue rather than re-verifying
 * anything: status returns to `pending`, the old verification is cleared, and
 * a person opens the register again. Nothing here decides that someone is
 * registered — that decision stays with a human looking at the public record,
 * which is the entire point of it.
 *
 * Needs the service role because the trigger deliberately refuses to let a
 * practitioner touch their own status or registration number. The ownership
 * check happens first, against their session.
 */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, reverifySchema);
  if (!data) return badBody;

  const supabase = await createSupabaseServerClient();
  const { data: row } = await supabase
    .from("therapists")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const therapist = row as Therapist | null;
  if (!therapist) return jsonError("Not found.", 404);

  if (therapist.status === "rejected" || therapist.status === "suspended") {
    return jsonError(
      "This account cannot be re-checked from here. Get in touch and we will look at it.",
      403,
    );
  }
  if (therapist.status === "pending") {
    return jsonError("You are already in the queue to be checked.", 409);
  }

  const admin = createSupabaseAdminClient();
  const { data: updated, error } = await admin
    .from("therapists")
    .update({
      registration_number: data.registrationNumber,
      registration_body: registrationBodyFor(therapist.registration_type),
      registration_verified_at: null,
      registration_expires_on: null,
      registration_conditions: null,
      verified_by: null,
      status: "pending",
      status_reason: data.note?.trim() || null,
    })
    .eq("id", therapist.id)
    .select("status")
    .single();

  if (error || !updated) return jsonError("That did not save.", 500);

  // The trigger works by putting old values back, so a write that silently did
  // nothing would look identical to one that worked. Check rather than assume.
  if (updated.status !== "pending") {
    return jsonError(
      "The database refused that change. Nothing was saved — the service role key is probably missing or wrong.",
      500,
    );
  }

  return jsonOk({ pending: true });
}
