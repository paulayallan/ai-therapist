"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { PLAN_LABEL } from "@/lib/billing";
import type { SubscriptionPlan } from "@/lib/types";

/**
 * Four destinations plus More on the phone. Five icons is the ceiling before
 * the labels stop being readable at 375px.
 *
 * The desktop bar can show everything, which is how Twin, Homework and Science
 * check were reachable on a laptop and completely unreachable on a phone —
 * they lived only in a nav that never renders below `sm`. Anything not in the
 * four below has to be in the More sheet, or it does not exist on mobile.
 */
const TABS = [
  { href: "/dashboard", label: "Today", icon: "sun" },
  { href: "/chat", label: "Support", icon: "chat" },
  { href: "/journal", label: "Journal", icon: "pen" },
  { href: "/tools", label: "Tools", icon: "leaf" },
] as const;

const SECONDARY = [
  { href: "/insights", label: "Patterns" },
  { href: "/twin", label: "Twin" },
  { href: "/homework", label: "Homework" },
  { href: "/science-check", label: "Science" },
] as const;

/** What the More sheet holds on a phone. Grouped, because a flat list of
 *  seven links is a wall. */
const MORE_SECTIONS = [
  {
    label: "Explore",
    items: [
      { href: "/insights", label: "Patterns" },
      { href: "/twin", label: "Your Twin" },
      { href: "/homework", label: "Homework" },
      { href: "/science-check", label: "Science check" },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/upgrade", label: "Plans" },
      { href: "/settings", label: "Settings" },
    ],
  },
] as const;

type IconName = (typeof TABS)[number]["icon"] | "more";

const PATHS: Record<IconName, string> = {
  sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 3v1.5M12 19.5V21M3 12h1.5M19.5 12H21M5.6 5.6l1 1M17.4 17.4l1 1M18.4 5.6l-1 1M6.6 17.4l-1 1",
  chat: "M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A1.5 1.5 0 0 1 4 14.5Z",
  leaf: "M4 20c0-8 5-13 16-13 0 9-5 13-11 13a5 5 0 0 1-5-5ZM9 15c2-3 5-5 9-6",
  pen: "M4 20h4l10-10a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5 17.5 10.5",
  chart: "M4 19V5M4 15.5 9.5 10l3.5 3.5L20 7",
  more: "M5 12h.01M12 12h.01M19 12h.01",
};

function Icon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

export function AppNav({ plan, trialDaysLeft }: { plan: SubscriptionPlan; trialDaysLeft: number | null }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const moreIsActive = MORE_SECTIONS.some((section) =>
    section.items.some((item) => isActive(item.href)),
  );

  // Close on navigation, so returning to a tab never lands behind the sheet.
  useEffect(() => setMoreOpen(false), [pathname]);

  // Escape closes it. A panel that traps someone mid-panic is the last thing
  // this app should do.
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-2 px-5">
          <Link href="/dashboard" className="mr-2 font-serif text-lg tracking-tight text-ink">
            Mentara
          </Link>

          <nav aria-label="Sections" className="hidden items-center gap-0.5 sm:flex">
            {TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive(tab.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive(tab.href)
                    ? "bg-sage-soft font-medium text-sage-deep"
                    : "text-muted hover:bg-sage-soft/60 hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            ))}
            <span aria-hidden="true" className="mx-1 h-4 w-px bg-line" />
            {SECONDARY.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={isActive(tab.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive(tab.href)
                    ? "bg-sage-soft font-medium text-sage-deep"
                    : "text-muted hover:bg-sage-soft/60 hover:text-ink",
                )}
              >
                {tab.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            {trialDaysLeft !== null ? (
              <Link
                href="/upgrade"
                className="hidden rounded-full border border-sage/30 bg-sage-soft px-3 py-1.5 text-xs font-medium text-sage-deep sm:block"
              >
                {trialDaysLeft} {trialDaysLeft === 1 ? "day" : "days"} of Premium left
              </Link>
            ) : plan === "free" ? (
              <Link
                href="/upgrade"
                className="hidden rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-sage-soft hover:text-sage-deep sm:block"
              >
                Upgrade
              </Link>
            ) : (
              <span className="hidden rounded-full bg-sage-soft px-2.5 py-1 text-xs font-medium text-sage-deep sm:block">
                {PLAN_LABEL[plan]}
              </span>
            )}

            <Link
              href="/sos"
              className="rounded-lg border border-clay/30 bg-clay-soft px-3 py-2 text-sm font-medium text-clay transition-colors hover:bg-clay hover:text-white"
            >
              Need help now
            </Link>
            <ThemeToggle />
            <Link
              href="/settings"
              aria-label="Settings"
              className={cn(
                "grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-sage-soft hover:text-sage-deep",
                isActive("/settings") && "bg-sage-soft text-sage-deep",
              )}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
                <g stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 14a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-3-1.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.3-3l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 3 1.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" />
                </g>
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {moreOpen ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMoreOpen(false)}
          className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-[2px] sm:hidden"
        />
      ) : null}

      <div
        id="more-sheet"
        hidden={!moreOpen}
        className="fixed inset-x-0 bottom-[calc(3.75rem+env(safe-area-inset-bottom))] z-40 px-3 sm:hidden"
      >
        <div className="rounded-2xl border border-line bg-paper p-4 shadow-lg">
          {MORE_SECTIONS.map((section) => (
            <div key={section.label} className="mt-4 first:mt-0">
              <p className="label mb-2">{section.label}</p>
              <ul className="grid grid-cols-2 gap-1">
                {section.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      className={cn(
                        "block rounded-xl px-3 py-3 text-sm transition-colors",
                        isActive(item.href)
                          ? "bg-sage-soft font-medium text-sage-deep"
                          : "text-ink hover:bg-sage-soft/60",
                      )}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
      >
        <ul className="flex">
          {TABS.map((tab) => (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={isActive(tab.href) ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[0.66rem] font-medium transition-colors",
                  isActive(tab.href) && !moreOpen ? "text-sage-deep" : "text-faint",
                )}
              >
                <Icon name={tab.icon} />
                {tab.label}
              </Link>
            </li>
          ))}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              aria-expanded={moreOpen}
              aria-controls="more-sheet"
              className={cn(
                "flex w-full flex-col items-center gap-1 py-2.5 text-[0.66rem] font-medium transition-colors",
                moreOpen || moreIsActive ? "text-sage-deep" : "text-faint",
              )}
            >
              <Icon name="more" />
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
