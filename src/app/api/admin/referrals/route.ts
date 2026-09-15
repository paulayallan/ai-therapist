import { z } from "zod";
import { jsonError, jsonOk, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const closeSchema = z.object({
  requestId: z.string().uuid(),
  /** Closing is the only action. There is no "reply" here — the reply is an
   * email you send from your own mail client, and pretending otherwise would
   * put a send button in front of something that does not send. */
  action: z.literal("close"),
});

/**
 * Marking a referral request handled.
 *
 * The whole find-help flow now rests on a person reading these and emailing
 * back. That only works if the inbox empties — an admin screen that keeps
 * showing requests you have already answered stops being read within a week,
 * and then the promise on /find-help quietly becomes false again.
 *
 * Service role, because referral_requests is locked to its owner by RLS and an
 * admin is not the owner. The admin check happens first, against ADMIN_EMAILS,
 * before the service-role client exists.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Not found.", 404);

  const { data, response } = await readBody(request, closeSchema);
  if (!data) return response;

  const supabase = createSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("referral_requests")
    .select("id, status")
    .eq("id", data.requestId)
    .maybeSingle();

  if (!existing) return jsonError("Not found.", 404);

  // Someone who withdrew their own request has said they are done. Closing it
  // again would be harmless but it would also overwrite what they chose, and
  // the difference between "they withdrew" and "we closed it" is worth keeping.
  if (existing.status !== "open" && existing.status !== "held") {
    return jsonError("That request is not open.", 409);
  }

  const { error } = await supabase
    .from("referral_requests")
    .update({ status: "closed" })
    .eq("id", data.requestId);

  if (error) return jsonError("That did not save.", 500);

  return jsonOk({ closed: true });
}
