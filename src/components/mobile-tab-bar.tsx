"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, HeartPulse, LayoutDashboard, NotebookPen, Sparkles } from "lucide-react";

const mobileTabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/coach", label: "Support", icon: Brain },
  { href: "/sos", label: "SOS", icon: HeartPulse },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/insights", label: "Insights", icon: Sparkles }
];

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-pine/10 bg-white/95 px-2 py-2 backdrop-blur lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition ${
                active ? "bg-mist text-ink" : "text-pine/75 hover:bg-mist/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
