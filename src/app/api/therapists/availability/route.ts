import { z } from "zod";
import { jsonError, jsonOk, readBody, requireUser } from "@/lib/api";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const availabilitySchema = z.object({ accepting: z.boolean() });

/**
 * Pausing and unpausing a listing.
 *
 * Runs as the practitioner, not the service role. Row-level security already
 * limits an update to their own row, and the trigger on `therapists` puts back
 * anything to do with verification or billing — so the only field this can
 * actually move is the one it is for. That is a better guarantee than a
 * promise in this file.
 *
 * Worth having at all because a practitioner with a full book who cannot say
 * so either keeps taking requests they must decline, or cancels. Neither helps
 * the person waiting.
 */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, availabilitySchema);
  if (!data) return badBody;

  const supabase = await createSupabaseServerClient();

  const { data: updated, error } = await supabase
    .from("therapists")
    .update({ accepting_clients: data.accepting })
    .eq("user_id", user.id)
    .select("accepting_clients")
    .single();

  if (error || !updated) return jsonError("That did not save.", 500);

  return jsonOk({ accepting: updated.accepting_clients as boolean });
}
