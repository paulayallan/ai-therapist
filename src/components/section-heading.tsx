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
    <div className="mb-4 sm:mb-5">
      {eyebrow ? <p className="mb-2 text-xs uppercase tracking-[0.24em] text-pine/60">{eyebrow}</p> : null}
      <h2 className="font-display text-2xl leading-tight text-ink sm:text-3xl">{title}</h2>
      {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-pine/70">{description}</p> : null}
    </div>
  );
}
