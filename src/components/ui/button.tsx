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
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition",
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
