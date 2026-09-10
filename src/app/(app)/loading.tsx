export default function Loading() {
  return (
    <div className="stack space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <div className="h-8 w-40 animate-pulse rounded-lg bg-surface" />
      <div className="h-24 animate-pulse rounded-2xl bg-surface" />
      <div className="h-72 animate-pulse rounded-2xl bg-surface" />
      <div className="h-48 animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}
