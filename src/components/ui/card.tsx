import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn("rounded-[24px] border border-pine/10 bg-white/80 p-4 shadow-glow backdrop-blur sm:rounded-[28px] sm:p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}
