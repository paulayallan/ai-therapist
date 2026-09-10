"use client";

import { useMemo, useRef, useState } from "react";
import { formatDay } from "@/lib/date";

/**
 * Mood and anxiety on one 1–5 axis. Anxiety is stored 1–10 and halved for
 * display, so both series share a scale honestly — a second y-axis would let
 * the chart imply a relationship the numbers do not contain.
 *
 * Colours are a validated categorical pair: lightness band, chroma floor,
 * colour-vision separation, normal-vision floor and surface contrast all pass
 * in both themes. Series are also direct-labelled, so identity never rests on
 * colour alone.
 */
const SERIES = [
  { key: "mood" as const, label: "Mood", light: "#12855C", dark: "#1F9A6E" },
  { key: "anxiety" as const, label: "Anxiety", light: "#BB5A12", dark: "#CE7C1E" },
];

export type ChartPoint = { date: string; mood: number | null; anxiety: number | null };

const W = 720;
const H = 240;
const PAD = { top: 16, right: 54, bottom: 28, left: 30 };

export function MoodChart({ points }: { points: ChartPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const x = (index: number) =>
    PAD.left + (points.length <= 1 ? plotW / 2 : (index / (points.length - 1)) * plotW);
  const y = (value: number) => PAD.top + plotH - ((value - 1) / 4) * plotH;

  /** Missing days break the line rather than being interpolated across. */
  const paths = useMemo(
    () =>
      SERIES.map((series) => {
        const segments: string[] = [];
        let run: string[] = [];
        points.forEach((point, index) => {
          const value = point[series.key];
          if (value === null) {
            if (run.length > 1) segments.push(run.join(" "));
            run = [];
            return;
          }
          run.push(`${run.length === 0 ? "M" : "L"} ${x(index).toFixed(1)} ${y(value).toFixed(1)}`);
        });
        if (run.length > 1) segments.push(run.join(" "));
        return { ...series, d: segments.join(" ") };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points],
  );

  const endLabels = useMemo(
    () =>
      SERIES.map((series) => {
        for (let index = points.length - 1; index >= 0; index -= 1) {
          const value = points[index]?.[series.key];
          if (value !== null && value !== undefined) return { series, index, value };
        }
        return null;
      }).filter(Boolean) as { series: (typeof SERIES)[number]; index: number; value: number }[],
    [points],
  );

  if (points.filter((point) => point.mood !== null).length < 2) {
    return (
      <p className="rounded-xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
        Two check-ins and a chart appears here.
      </p>
    );
  }

  function locate(event: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = ((event.clientX - rect.left) / rect.width) * W;
    const index = Math.round(((ratio - PAD.left) / plotW) * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, index)));
  }

  const active = hover !== null ? points[hover] : null;

  return (
    <figure className="m-0">
      <style>{`
        :root { --series-mood: ${SERIES[0]?.light}; --series-anxiety: ${SERIES[1]?.light}; }
        :root[data-theme="dark"] { --series-mood: ${SERIES[0]?.dark}; --series-anxiety: ${SERIES[1]?.dark}; }
      `}</style>

      <figcaption className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {SERIES.map((series) => (
          <span key={series.key} className="flex items-center gap-1.5 text-xs text-muted">
            <span
              aria-hidden="true"
              className="h-0.5 w-4 rounded-full"
              style={{ background: `var(--series-${series.key})` }}
            />
            {series.label}
          </span>
        ))}
        <span className="ml-auto text-xs text-faint">Both on a 1–5 scale</span>
      </figcaption>

      <div className="overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full min-w-[420px] touch-pan-y"
          role="img"
          aria-label={`Mood and anxiety across ${points.length} days, each on a 1 to 5 scale.`}
          onPointerMove={locate}
          onPointerLeave={() => setHover(null)}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <g key={value}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(value)}
                y2={y(value)}
                stroke="rgb(var(--line))"
                strokeWidth={1}
                opacity={value === 1 ? 0.9 : 0.45}
              />
              <text
                x={PAD.left - 8}
                y={y(value) + 4}
                textAnchor="end"
                className="fill-[rgb(var(--faint))] text-[11px] tabular-nums"
              >
                {value}
              </text>
            </g>
          ))}

          {hover !== null ? (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + plotH}
              stroke="rgb(var(--faint))"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          ) : null}

          {paths.map((series) => (
            <path
              key={series.key}
              d={series.d}
              fill="none"
              stroke={`var(--series-${series.key})`}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

          {hover !== null
            ? SERIES.map((series) => {
                const value = points[hover]?.[series.key];
                if (value === null || value === undefined) return null;
                return (
                  <circle
                    key={series.key}
                    cx={x(hover)}
                    cy={y(value)}
                    r={5}
                    fill={`var(--series-${series.key})`}
                    stroke="rgb(var(--surface))"
                    strokeWidth={2}
                  />
                );
              })
            : null}

          {endLabels.map(({ series, index, value }) => (
            <text
              key={series.key}
              x={x(index) + 10}
              y={y(value) + 4}
              className="text-[11px] font-medium"
              fill={`var(--series-${series.key})`}
            >
              {series.label}
            </text>
          ))}

          <text x={PAD.left} y={H - 8} className="fill-[rgb(var(--faint))] text-[11px]">
            {formatDay(points[0]?.date ?? "")}
          </text>
          <text
            x={W - PAD.right}
            y={H - 8}
            textAnchor="end"
            className="fill-[rgb(var(--faint))] text-[11px]"
          >
            {formatDay(points[points.length - 1]?.date ?? "")}
          </text>
        </svg>
      </div>

      <div aria-live="polite" className="mt-2 min-h-[1.5rem] text-xs text-muted">
        {active ? (
          <span>
            <span className="font-medium text-ink">{formatDay(active.date)}</span>
            {active.mood !== null ? ` · mood ${active.mood}` : " · no check-in"}
            {active.anxiety !== null ? ` · anxiety ${active.anxiety}` : ""}
          </span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setShowTable((value) => !value)}
        className="mt-1 text-xs text-faint underline underline-offset-4 hover:text-muted"
      >
        {showTable ? "Hide the numbers" : "Show the numbers"}
      </button>

      {showTable ? (
        <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-line">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Daily mood and anxiety</caption>
            <thead className="sticky top-0 bg-paper text-xs text-faint">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Day</th>
                <th scope="col" className="px-3 py-2 font-medium">Mood</th>
                <th scope="col" className="px-3 py-2 font-medium">Anxiety</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((point) => (
                <tr key={point.date} className="border-t border-line">
                  <th scope="row" className="px-3 py-1.5 font-normal text-muted">
                    {formatDay(point.date)}
                  </th>
                  <td className="px-3 py-1.5 tabular-nums text-ink">{point.mood ?? "—"}</td>
                  <td className="px-3 py-1.5 tabular-nums text-ink">{point.anxiety ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </figure>
  );
}
