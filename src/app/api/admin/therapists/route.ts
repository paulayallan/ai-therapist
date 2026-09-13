import { z } from "zod";
import { jsonError, jsonOk, readBody } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { nextRegistrationExpiry } from "@/lib/therapists";

const decisionSchema = z.object({
  therapistId: z.string().uuid(),
  decision: z.enum(["verify", "reject", "suspend", "reinstate"]),
  /** What was found on the register. Conditions and undertakings go here. */
  conditions: z.string().trim().max(600).optional().or(z.literal("")),
  reason: z.string().trim().max(600).optional().or(z.literal("")),
  expiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.").optional(),
});

/**
 * Verifying a practitioner.
 *
 * Runs as service_role because the database deliberately refuses to let anyone
 * else touch the verification columns — including the practitioner themselves.
 * The admin check happens here, against ADMIN_EMAILS, before the service-role
 * client is ever created.
 */
export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Not found.", 404);

  const { data, response } = await readBody(request, decisionSchema);
  if (!data) return response;

  if (data.decision === "reject" && !data.reason?.trim()) {
    return jsonError("Say why. They are told this, and 'no' with no reason is not useful to anyone.", 422);
  }

  const supabase = createSupabaseAdminClient();

  const patch: Record<string, unknown> =
    data.decision === "verify"
      ? {
          status: "verified",
          status_reason: null,
          registration_verified_at: new Date().toISOString(),
          registration_expires_on: data.expiresOn ?? nextRegistrationExpiry(),
          registration_conditions: data.conditions?.trim() || null,
          verified_by: admin.id,
        }
      : data.decision === "reject"
        ? { status: "rejected", status_reason: data.reason?.trim() ?? null }
        : data.decision === "suspend"
          ? { status: "suspended", status_reason: data.reason?.trim() || "Suspended pending review." }
          : { status: "pending", status_reason: null };

  const { data: updated, error } = await supabase
    .from("therapists")
    .update(patch)
    .eq("id", data.therapistId)
    .select("id, status, registration_verified_at, registration_expires_on")
    .single();

  if (error || !updated) return jsonError("That did not save.", 500);

  // The trigger that stops practitioners verifying themselves works by putting
  // the old values back. If it ever failed to recognise this connection as
  // service_role it would silently undo this write, so the result is checked
  // rather than assumed — a verification that quietly did not happen is the
  // worst possible failure here.
  const expected =
    data.decision === "verify"
      ? "verified"
      : data.decision === "reject"
        ? "rejected"
        : data.decision === "suspend"
          ? "suspended"
          : "pending";

  if (updated.status !== expected) {
    return jsonError(
      "The database refused that change. Nothing was saved — the service role key is probably missing or wrong.",
      500,
    );
  }

  return jsonOk({ therapist: updated });
}
