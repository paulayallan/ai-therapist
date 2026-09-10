import { jsonError, jsonOk, readBody, requireUser } from "@/lib/api";
import { toolSaveSchema } from "@/lib/ai/schemas";
import { getTool } from "@/lib/tools";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, toolSaveSchema);
  if (!data) return badBody;

  // Only ids from the shipped library are accepted, so tool_id stays a closed
  // set the recommendation engine can rely on.
  if (!getTool(data.toolId)) return jsonError("Unknown tool.", 422);

  const supabase = await createSupabaseServerClient();

  if (data.saved) {
    const { error } = await supabase
      .from("saved_tools")
      .upsert({ user_id: user.id, tool_id: data.toolId }, { onConflict: "user_id,tool_id" });
    if (error) return jsonError("Could not save that tool.", 500);
  } else {
    const { error } = await supabase.from("saved_tools").delete().eq("tool_id", data.toolId);
    if (error) return jsonError("Could not remove that tool.", 500);
  }

  return jsonOk({ toolId: data.toolId, saved: data.saved });
}
