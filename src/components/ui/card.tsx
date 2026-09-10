import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card p-5 sm:p-6", className)} {...props} />;
}

export function SectionHeading({
  eyebrow,
  title,
  hint,
  className,
}: {
  eyebrow?: string;
  title: string;
  hint?: string;
  className?: string;
}) {
  return (
    <header className={cn("mb-4", className)}>
      {eyebrow ? <p className="label mb-1.5">{eyebrow}</p> : null}
      <h2 className="font-serif text-xl leading-snug text-ink sm:text-2xl">{title}</h2>
      {hint ? <p className="mt-1.5 text-sm leading-relaxed text-muted">{hint}</p> : null}
    </header>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center">
      <p className="font-serif text-lg text-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

/** A quiet inline notice. Never red unless something is actually wrong. */
export function Notice({
  tone = "quiet",
  children,
}: {
  tone?: "quiet" | "warm" | "alert";
  children: React.ReactNode;
}) {
  return (
    <p
      className={cn(
        "rounded-xl px-4 py-3 text-sm leading-relaxed",
        tone === "quiet" && "border border-line bg-surface text-muted",
        tone === "warm" && "border border-sage/25 bg-sage-soft text-ink",
        tone === "alert" && "border border-clay/25 bg-clay-soft text-clay",
      )}
    >
      {children}
    </p>
  );
}
