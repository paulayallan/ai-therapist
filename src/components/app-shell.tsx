import type { ReactNode } from "react";
import Link from "next/link";
import { Bot, Brain, Compass, HeartPulse, LayoutDashboard, NotebookPen, Settings, Sparkles, Wind } from "lucide-react";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach", label: "Support", icon: Brain },
  { href: "/sos", label: "SOS", icon: HeartPulse },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/insights", label: "Deep Insights", icon: Sparkles },
  { href: "/strategy", label: "Strategy", icon: Compass },
  { href: "/twin", label: "My AI Twin", icon: Bot },
  { href: "/tools", label: "Tools", icon: Wind },
  { href: "/settings", label: "Settings", icon: Settings }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,162,147,0.28),_transparent_32%),linear-gradient(180deg,_#f6f0e8_0%,_#edf5f2_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-3 py-4 sm:px-4 sm:py-6 lg:flex-row lg:gap-6">
        <aside className="hidden rounded-[32px] border border-pine/10 bg-white/60 p-5 backdrop-blur lg:mb-0 lg:block lg:w-72">
          <Link href="/" className="mb-8 block">
            <p className="font-display text-2xl text-ink">Mentara</p>
            <p className="mt-1 text-sm text-pine/70">Support first. Psychology OS over time.</p>
          </Link>
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-ink transition hover:bg-pine/5"
                >
                  <Icon className="h-4 w-4 text-pine" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-8 rounded-[24px] bg-pine p-5 text-white">
            <p className="font-display text-xl">Free + Pro model</p>
            <p className="mt-2 text-sm text-white/80">
              Free gives users 24/7 support, SOS tools, journaling, mood check-ins, and weekly insight snapshots. Strategy is Pro. My AI Twin is the premium memory layer.
            </p>
            <Link href="/strategy" className="mt-4 inline-block">
              <Button variant="secondary" className="w-full">
                Open Strategy OS
              </Button>
            </Link>
            <Link href="/upgrade" className="mt-3 inline-block w-full">
              <Button variant="ghost" className="w-full border border-white/20 text-white hover:bg-white/10">
                View plans
              </Button>
            </Link>
          </div>
          <div className="mt-4">
            <LogoutButton />
          </div>
        </aside>
        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      </div>
      <MobileTabBar />
    </div>
  );
}
