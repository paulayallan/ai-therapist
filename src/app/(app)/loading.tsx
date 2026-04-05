export default function AppLoading() {
  return (
    <div className="space-y-4">
      <div className="h-4 w-28 animate-pulse rounded-full bg-mist" />
      <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-mist" />
      <div className="grid gap-3 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-3xl bg-white/70" />
        <div className="h-28 animate-pulse rounded-3xl bg-white/70" />
        <div className="h-28 animate-pulse rounded-3xl bg-white/70" />
      </div>
    </div>
  );
}
