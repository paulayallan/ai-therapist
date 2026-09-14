"use client";

/**
 * A multi-select as a row of chips.
 *
 * Shared between the practitioner application and the profile they edit
 * afterwards, because those two forms ask the same questions and a divergence
 * between them is how someone ends up unable to un-pick something they picked.
 */
export function Chips({
  legend,
  hint,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  hint?: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-[0.95rem] font-medium text-ink">{legend}</legend>
      {hint ? <p className="mt-1 text-sm leading-relaxed text-muted">{hint}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const on = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(option)}
              className={
                on
                  ? "rounded-full border border-sage bg-sage-soft px-3.5 py-2 text-sm font-medium text-sage-deep"
                  : "rounded-full border border-line px-3.5 py-2 text-sm text-muted transition-colors hover:border-sage hover:text-ink"
              }
            >
              {option}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Toggling one value in a list, which every caller of Chips needs. */
export function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}
