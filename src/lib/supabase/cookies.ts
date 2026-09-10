import type { CookieOptions } from "@supabase/ssr";

/**
 * The shape @supabase/ssr hands to `setAll`.
 *
 * It is declared here rather than inferred because the callback parameter does
 * not infer under `strict`, and an implicit `any` on the object that carries
 * session cookies is not something to wave through.
 */
export type CookieToSet = {
  name: string;
  value: string;
  options?: CookieOptions;
};
