import type { ButtonHTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost" | "danger";
  }
>;

export function Button({ className, variant = "primary", children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2.5 text-sm font-medium transition sm:min-h-10 sm:py-2",
        variant === "primary" && "bg-pine text-white hover:bg-ink",
        variant === "secondary" && "bg-white/80 text-ink ring-1 ring-pine/10 hover:bg-white",
        variant === "ghost" && "bg-transparent text-pine hover:bg-pine/5",
        variant === "danger" && "bg-coral text-white hover:opacity-90",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
