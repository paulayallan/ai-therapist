import { jsonOk, recordActivity, requireUser } from "@/lib/api";
import { isLocalDate } from "@/lib/date";

/**
 * Records that something happened, for the patterns page. Deliberately
 * forgiving: a malformed body returns ok rather than an error, because a
 * failed analytics write must never surface to someone mid-task.
 */
export async function POST(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  try {
    const body = await request.json();
    const activityType = typeof body?.activityType === "string" ? body.activityType.slice(0, 60) : null;
    const localDate = isLocalDate(body?.localDate) ? body.localDate : null;
    if (activityType && localDate) await recordActivity(user.id, activityType, localDate);
  } catch {
    // Intentionally ignored.
  }

  return jsonOk({ recorded: true });
}
