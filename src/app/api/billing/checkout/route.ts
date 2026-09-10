import { NextResponse } from "next/server";
import { jsonError, requireUser } from "@/lib/api";
import { webCheckoutUrl } from "@/lib/billing";

/**
 * Web checkout.
 *
 * The live app had a conversion bug where paid buttons sent web users back to
 * /upgrade instead of a real checkout, so nobody could pay. The fix is kept
 * here and made explicit: a missing URL returns a clear error rather than a
 * redirect back to the page they came from. A dead loop looks like a broken
 * app; an honest message looks like a configuration gap.
 */
export async function GET(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const plan = new URL(request.url).searchParams.get("plan");
  if (plan !== "pro" && plan !== "premium") {
    return jsonError("Choose either the pro or premium plan.", 422);
  }

  const url = webCheckoutUrl(plan);
  if (!url) {
    return jsonError(
      "Web checkout is not configured yet. On iPhone or iPad you can subscribe inside the app.",
      503,
      { plan },
    );
  }

  return NextResponse.redirect(url, { status: 303 });
}
