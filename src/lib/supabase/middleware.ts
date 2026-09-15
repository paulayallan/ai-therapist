import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { CookieToSet } from "@/lib/supabase/cookies";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/env";

// /sos is deliberately absent. Someone mid-panic must never hit a sign-in wall,
// so the rescue flow works signed out; it simply cannot log the episode.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/chat",
  "/tools",
  "/journal",
  "/insights",
  "/settings",
  "/upgrade",
  "/homework",
  "/science-check",
  "/find-help",
  "/onboarding",
  // /therapists itself stays public — practitioners have to be able to read
  // what they are signing up to before they sign in.
  "/therapists/apply",
  "/therapists/dashboard",
  "/admin",
];
const AUTH_ROUTES = ["/auth"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Without Supabase configured there is nothing to protect and nothing to
  // refresh — let every request through so the app still boots locally.
  if (!isSupabaseConfigured) return response;

  const { pathname: path } = request.nextUrl;
  const protectedPath = PROTECTED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  const authPath = AUTH_ROUTES.includes(path);

  /*
   * Do not talk to Supabase unless this request needs a decision.
   *
   * getUser() is a network round trip to the auth server in Singapore, and it
   * was running on every single request — the landing page, /sos, the privacy
   * page, every RSC payload, every prefetch. On a public page there is nothing
   * to redirect and nothing to protect, so the call bought nothing and cost a
   * quarter of a second.
   *
   * The session cookie still gets refreshed on every protected page, which is
   * where people actually spend their time.
   */
  if (!protectedPath && !authPath) return response;

  /*
   * Next prefetches links in the viewport. Those requests do not need a
   * redirect decision — nobody is looking at the result, and the page itself
   * re-checks when it is really opened. Skipping the round trip here makes
   * tapping a tab feel instant, because the prefetch that warmed it was not
   * queued behind an auth call.
   */
  if (request.headers.get("next-router-prefetch") === "1") return response;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set({ name, value, ...options });
        }
      },
    },
  });

  // getUser() revalidates the token with Supabase. Do not swap this for
  // getSession(), which trusts the cookie without checking it.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && protectedPath) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/auth";
    redirect.searchParams.set("next", path);
    return NextResponse.redirect(redirect);
  }

  if (user && authPath) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/dashboard";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}
