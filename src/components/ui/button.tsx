import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "urgent";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-sage text-white hover:bg-sage-deep active:bg-sage-deep",
  secondary: "bg-raised text-ink border border-line hover:border-sage hover:text-sage-deep",
  ghost: "text-muted hover:bg-sage-soft hover:text-sage-deep",
  danger: "bg-clay text-white hover:opacity-90",
  urgent: "bg-clay-soft text-clay border border-clay/25 hover:bg-clay hover:text-white",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-lg gap-1.5",
  md: "h-11 px-5 text-[0.95rem] rounded-xl gap-2",
  lg: "h-14 px-7 text-base rounded-2xl gap-2.5",
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-colors duration-150",
        "disabled:cursor-not-allowed disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});
