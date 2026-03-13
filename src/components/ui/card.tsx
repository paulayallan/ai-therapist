import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return (
    <div
      className={cn("rounded-[28px] border border-pine/10 bg-white/80 p-6 shadow-glow backdrop-blur", className)}
      {...props}
    >
      {children}
    </div>
  );
}
