import { jsonError, jsonOk, readBody, requireUser } from "@/lib/api";
import { consentSchema } from "@/lib/ai/schemas";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, consentSchema);
  if (!data) return badBody;

  const now = new Date().toISOString();
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      ai_data_consent_granted: data.granted,
      ai_data_consent_granted_at: data.granted ? now : null,
      ai_data_consent_withdrawn_at: data.granted ? null : now,
      ai_data_consent_version: data.granted ? "1" : null,
    })
    .eq("id", user.id);

  if (error) return jsonError("Could not update that setting.", 500);
  return jsonOk({ granted: data.granted });
}
