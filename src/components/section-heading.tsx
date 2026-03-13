export function SectionHeading({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5">
      {eyebrow ? <p className="mb-2 text-xs uppercase tracking-[0.24em] text-pine/60">{eyebrow}</p> : null}
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl text-sm text-pine/70">{description}</p> : null}
    </div>
  );
}
