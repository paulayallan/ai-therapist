import Link from "next/link";
import type { PersonalisedTool } from "@/lib/tools";
import { PLAN_LABEL } from "@/lib/billing";

/**
 * A recommendation always shows its reason. "Recommended for you" with nothing
 * behind it is what makes an app feel algorithmic rather than personal.
 */
export function ToolSuggestions({ suggestions }: { suggestions: PersonalisedTool[] }) {
  if (suggestions.length === 0) return null;

  return (
    <ul className="space-y-2.5">
      {suggestions.map(({ tool, reason, locked }) => {
        const inner = (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-ink">{tool.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{tool.blurb}</p>
              </div>
              <span
                className={
                  locked
                    ? "shrink-0 rounded-full bg-line/60 px-2.5 py-1 text-xs text-faint"
                    : "shrink-0 rounded-full bg-sage-soft px-2.5 py-1 text-xs text-sage-deep"
                }
              >
                {locked ? PLAN_LABEL[tool.tier] : `${tool.minutes} min`}
              </span>
            </div>

            <div className="mt-3 border-t border-line pt-3">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.1em] text-faint">
                {reason.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{reason.text}</p>
            </div>
          </>
        );

        return (
          <li key={tool.id}>
            <Link
              href={locked ? "/upgrade" : `/tools/${tool.id}`}
              className="block rounded-xl border border-line bg-raised px-4 py-3.5 transition-colors hover:border-sage"
            >
              {inner}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
