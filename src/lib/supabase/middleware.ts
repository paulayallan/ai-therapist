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
  "/twin",
  "/homework",
  "/science-check",
  "/onboarding",
];
const AUTH_ROUTES = ["/auth"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Without Supabase configured there is nothing to protect and nothing to
  // refresh — let every request through so the app still boots locally.
  if (!isSupabaseConfigured) return response;

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

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!user && isProtected) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/auth";
    redirect.searchParams.set("next", pathname);
    return NextResponse.redirect(redirect);
  }

  if (user && AUTH_ROUTES.includes(pathname)) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/dashboard";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}
