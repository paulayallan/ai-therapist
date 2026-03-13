import type { ReactNode } from "react";
import Link from "next/link";
import { Brain, HeartPulse, LayoutDashboard, NotebookPen, Sparkles, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/coach", label: "Coach", icon: Brain },
  { href: "/sos", label: "SOS", icon: HeartPulse },
  { href: "/journal", label: "Journal", icon: NotebookPen },
  { href: "/insights", label: "Insights", icon: Sparkles },
  { href: "/tools", label: "Tools", icon: Wind }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,162,147,0.28),_transparent_32%),linear-gradient(180deg,_#f6f0e8_0%,_#edf5f2_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 lg:flex-row lg:gap-6">
        <aside className="mb-6 rounded-[32px] border border-pine/10 bg-white/60 p-5 backdrop-blur lg:mb-0 lg:w-72">
          <Link href="/" className="mb-8 block">
            <p className="font-display text-2xl text-ink">AI Therapist</p>
            <p className="mt-1 text-sm text-pine/70">Science-based mental health support</p>
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
            <p className="font-display text-xl">Safety first</p>
            <p className="mt-2 text-sm text-white/80">
              This app supports reflection and coping skills. It does not replace therapy or emergency care.
            </p>
            <Link href="/sos" className="mt-4 inline-block">
              <Button variant="secondary" className="w-full">
                Open SOS mode
              </Button>
            </Link>
          </div>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
