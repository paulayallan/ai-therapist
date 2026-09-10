import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function round(value: number, places = 1): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

/** Clamp to a 1-5 scale, rejecting anything non-finite. */
export function clampScale(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(5, Math.max(1, Math.round(parsed)));
}

export function pluralise(count: number, singular: string, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

/** Trim, collapse runs of whitespace, and cap length. */
export function normaliseText(input: string, maxLength = 6000): string {
  return input.replace(/\s+/g, " ").trim().slice(0, maxLength);
}
