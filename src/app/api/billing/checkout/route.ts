import { jsonError, jsonOk, requireUser } from "@/lib/api";
import { webCheckoutUrl } from "@/lib/billing";

/**
 * Web checkout.
 *
 * Returns the checkout URL as JSON rather than issuing a redirect.
 *
 * The redirect version could never have worked from the browser: the button
 * calls this with `fetch`, fetch follows the 303 to pay.rev.cat, and that
 * cross-origin response carries no CORS headers — so the request throws before
 * any code here gets a say. The person sees "checkout is unavailable" no
 * matter how correctly the links are configured. Handing back a URL for the
 * page to navigate to sidesteps CORS entirely, because a navigation is not a
 * fetch.
 *
 * The live app had a related bug where paid buttons bounced people back to
 * /upgrade with no explanation. That fix is preserved: a missing link is an
 * explicit, visible failure rather than a silent dead end.
 */
export async function GET(request: Request) {
  const { user, response } = await requireUser();
  if (!user) return response;

  const plan = new URL(request.url).searchParams.get("plan");
  if (plan !== "pro" && plan !== "premium") {
    return jsonError("Choose either the pro or premium plan.", 422);
  }

  // The person's own id is what ties the purchase back to their account, so it
  // is built here from the session rather than trusted from the request.
  const url = webCheckoutUrl(plan, user.id, user.email);
  if (!url) {
    return jsonError(
      "Web checkout is not set up yet. On iPhone or iPad you can subscribe inside the app.",
      503,
      { plan },
    );
  }

  return jsonOk({ url, plan });
}
