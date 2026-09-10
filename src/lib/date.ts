/**
 * Day boundaries are the user's, not the server's. Every "today" in the app
 * comes from a client-supplied local date (YYYY-MM-DD), validated here.
 */

const LOCAL_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isLocalDate(value: unknown): value is string {
  if (typeof value !== "string" || !LOCAL_DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** The browser's own local date, never the server's. */
export function clientLocalDate(date = new Date()): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 10);
}

/**
 * An ISO cutoff N days back, used to window queries. Compared against both
 * `local_date` (YYYY-MM-DD) and `created_at` (full ISO) — a date-only string
 * sorts correctly against an ISO timestamp with the same prefix, so one
 * cutoff serves both.
 */
export function daysAgo(days: number, from = new Date()): string {
  return new Date(from.getTime() - days * 86_400_000).toISOString().slice(0, 10);
}

/** Human wording for the daily_check_ins sleep enum. */
export const SLEEP_LABELS: Record<string, string> = {
  very_poorly: "Very poorly",
  poorly: "Poorly",
  okay: "Okay",
  well: "Well",
  very_well: "Very well",
};

export function shiftLocalDate(localDate: string, days: number): string {
  const base = new Date(`${localDate}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/** Inclusive list of local dates, oldest first. */
export function localDateRange(end: string, days: number): string[] {
  return Array.from({ length: days }, (_, index) => shiftLocalDate(end, index - (days - 1)));
}

export function formatDay(localDate: string): string {
  return new Date(`${localDate}T00:00:00Z`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}
