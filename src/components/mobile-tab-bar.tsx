"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Brain, Bot, Compass, HeartPulse, LayoutDashboard, Menu, NotebookPen, Settings, Sparkles, Wind } from "lucide-react";

const mobileTabs = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/coach", label: "Support", icon: Brain },
  { href: "/sos", label: "SOS", icon: HeartPulse },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/more", label: "More", icon: Menu }
];

const moreItems = [
  { href: "/twin", label: "My Twin", icon: Bot },
  { href: "/tools", label: "Tools", icon: Wind },
  { href: "/strategy", label: "Strategy", icon: Compass },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function MobileTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-pine/10 bg-white/95 px-2 py-2 backdrop-blur lg:hidden"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
      aria-label="Mobile navigation"
    >
      {showMore ? (
        <div className="mx-auto mb-2 max-w-lg rounded-2xl border border-pine/10 bg-white p-2">
          <div className="grid grid-cols-2 gap-2">
            {moreItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs ${
                    active ? "bg-mist text-ink" : "text-pine/80"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="mx-auto grid max-w-lg grid-cols-6 gap-1">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const active =
            tab.href === "/more"
              ? showMore
              : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          const isMore = tab.href === "/more";
          return (
            <button
              key={tab.href}
              type="button"
              onClick={() => {
                if (isMore) {
                  setShowMore((current) => !current);
                  return;
                }
                setShowMore(false);
                router.push(tab.href);
              }}
              className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] transition ${
                active ? "bg-mist text-ink" : "text-pine/75 hover:bg-mist/50"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
