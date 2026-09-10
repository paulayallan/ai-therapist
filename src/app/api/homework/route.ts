import { z } from "zod";
import { jsonError, jsonOk, readBody, recordActivity, requireUser } from "@/lib/api";
import { clientLocalDate } from "@/lib/date";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Homework lists and their items.
 *
 * `homework_items` carries both `completed` (boolean) and `status` (a NOT NULL
 * enum). They are always written together — a row where they disagree would
 * make the live app's own queries wrong.
 */

const createSchema = z.object({
  title: z.string().trim().min(1, "Give it a title.").max(120),
  description: z.string().trim().max(500).nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  items: z
    .array(
      z.object({
        text: z.string().trim().min(1).max(300),
        priority: z.enum(["low", "normal", "high"]).default("normal"),
      }),
    )
    .min(1, "Add at least one thing.")
    .max(20),
});

const updateItemSchema = z.object({
  itemId: z.string().uuid(),
  status: z.enum(["pending", "completed", "not_completed"]),
  comment: z.string().trim().max(300).nullable().optional(),
});

const updateListSchema = z.object({
  listId: z.string().uuid(),
  action: z.enum(["complete", "reopen", "archive", "delete"]),
});

export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const { data, response: badBody } = await readBody(request, createSchema);
  if (!data) return badBody;

  const supabase = await createSupabaseServerClient();

  const { data: list, error } = await supabase
    .from("homework_lists")
    .insert({
      user_id: user.id,
      title: data.title,
      description: data.description?.trim() || null,
      due_date: data.dueDate ?? null,
      source_type: "manual",
      status: "active",
    })
    .select("id")
    .single();

  if (error || !list) return jsonError("Could not create that list.", 500);

  const { error: itemsError } = await supabase.from("homework_items").insert(
    data.items.map((item, index) => ({
      homework_list_id: list.id,
      text: item.text,
      priority: item.priority,
      item_order: index,
      completed: false,
      status: "pending" as const,
    })),
  );

  if (itemsError) {
    // Do not leave a list with no items behind — it would look like a bug
    // to the person and count as clutter forever.
    await supabase.from("homework_lists").delete().eq("id", list.id);
    return jsonError("Could not save those steps.", 500);
  }

  await recordActivity(user.id, "homework_created", clientLocalDate(), list.id);
  return jsonOk({ listId: list.id });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError("Expected a JSON body.");
  }

  const supabase = await createSupabaseServerClient();

  /* ------------------------------------------------------------- an item */

  const item = updateItemSchema.safeParse(raw);
  if (item.success) {
    const completed = item.data.status === "completed";
    const { error } = await supabase
      .from("homework_items")
      .update({
        status: item.data.status,
        completed,
        completed_at: completed ? new Date().toISOString() : null,
        user_comment: item.data.comment?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.data.itemId);

    if (error) return jsonError("Could not update that step.", 500);
    if (completed) await recordActivity(user.id, "homework_item_completed", clientLocalDate(), item.data.itemId);
    return jsonOk({ itemId: item.data.itemId, status: item.data.status });
  }

  /* -------------------------------------------------------------- a list */

  const list = updateListSchema.safeParse(raw);
  if (!list.success) return jsonError("That update did not look right.", 422);

  const now = new Date().toISOString();
  const patch =
    list.data.action === "complete"
      ? { status: "completed", completed_at: now, completion_source: "manual", updated_at: now }
      : list.data.action === "reopen"
        ? { status: "active", completed_at: null, completion_source: null, updated_at: now }
        : list.data.action === "archive"
          ? { status: "archived", updated_at: now }
          : { status: "deleted", deleted_at: now, updated_at: now };

  const { error } = await supabase.from("homework_lists").update(patch).eq("id", list.data.listId);
  if (error) return jsonError("Could not update that list.", 500);

  return jsonOk({ listId: list.data.listId, action: list.data.action });
}
