"use client";

import { cn } from "@/lib/utils";

/**
 * Five discrete taps rather than a slider: easier on a phone, announces
 * cleanly to a screen reader, and avoids implying precision the answer does
 * not have.
 */
export function ChoiceRow<T extends string | number>({
  legend,
  hint,
  options,
  value,
  onChange,
  tone = "sage",
}: {
  legend: string;
  hint?: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  tone?: "sage" | "clay";
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="p-0 text-sm font-medium text-ink">{legend}</legend>
      {hint ? <p className="mt-0.5 text-xs text-faint">{hint}</p> : null}

      <div className="mt-3 flex gap-1.5" role="radiogroup" aria-label={legend}>
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={String(option.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                "group flex-1 rounded-xl border px-1 py-3 text-center transition-all duration-150",
                selected
                  ? tone === "clay"
                    ? "border-clay bg-clay-soft shadow-soft"
                    : "border-sage bg-sage-soft shadow-soft"
                  : "border-line bg-raised hover:border-sage/50",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "mx-auto block h-2 w-2 rounded-full transition-colors",
                  selected
                    ? tone === "clay"
                      ? "bg-clay"
                      : "bg-sage-deep"
                    : "bg-line group-hover:bg-sage/40",
                )}
              />
              <span
                className={cn(
                  "mt-2 block text-[0.68rem] leading-tight",
                  selected
                    ? tone === "clay"
                      ? "font-medium text-clay"
                      : "font-medium text-sage-deep"
                    : "text-faint",
                )}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Multi-select chips, for factors and symptoms. */
export function ChipGroup({
  legend,
  hint,
  options,
  values,
  onToggle,
}: {
  legend: string;
  hint?: string;
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="p-0 text-sm font-medium text-ink">{legend}</legend>
      {hint ? <p className="mt-0.5 text-xs text-faint">{hint}</p> : null}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const selected = values.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => onToggle(option)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-sm transition-colors",
                selected
                  ? "border-sage bg-sage-soft text-sage-deep"
                  : "border-line bg-raised text-muted hover:border-sage/40",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
