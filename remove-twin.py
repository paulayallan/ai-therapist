#!/usr/bin/env python3
"""
Takes My Twin out of Mentara.

It removes everything a person can see or reach — the page, the nav entries,
the dashboard card, and the pricing copy that promises it. It deliberately
leaves the API route and the library files in place, dormant and unreachable,
so "for now" really is for now: bringing it back later is re-adding a page and
two nav lines, not rebuilding it.

The database tables are not touched, and the account-deletion route still
clears them, so anyone who used the Twin keeps their right to erase it.

  removed:  src/app/(app)/twin/            (the page)
            src/components/twin-client.tsx (its UI)

  edited:   src/components/app-nav.tsx          nav entries, desktop and More sheet
            src/app/(app)/dashboard/page.tsx    the Premium Twin card
            src/components/upgrade-plans.tsx    Premium pitch, one outcome, one limit
            src/app/(app)/upgrade/page.tsx      intro paragraph
            src/lib/supabase/middleware.ts      the /twin protected route

  left:     src/app/api/twin/route.ts, src/lib/twin.ts, the prompt, the schema,
            the usage limit, the data helpers, the tests

Run from anywhere:  python3 remove-twin.py
Nothing is written unless every edit below matches.
"""

import shutil
import sys
from pathlib import Path

# (relative path, old, new, label)
EDITS = [
    (
        "src/components/app-nav.tsx",
        " * The desktop bar can show everything, which is how Twin, Homework and Science\n"
        " * check were reachable on a laptop and completely unreachable on a phone —",
        " * The desktop bar can show everything, which is how Homework and Science\n"
        " * check were reachable on a laptop and completely unreachable on a phone —",
        "comment",
    ),
    (
        "src/components/app-nav.tsx",
        '  { href: "/insights", label: "Patterns" },\n'
        '  { href: "/twin", label: "Twin" },\n'
        '  { href: "/homework", label: "Homework" },',
        '  { href: "/insights", label: "Patterns" },\n'
        '  { href: "/homework", label: "Homework" },',
        "desktop nav",
    ),
    (
        "src/components/app-nav.tsx",
        '      { href: "/insights", label: "Patterns" },\n'
        '      { href: "/twin", label: "Your Twin" },\n'
        '      { href: "/homework", label: "Homework" },',
        '      { href: "/insights", label: "Patterns" },\n'
        '      { href: "/homework", label: "Homework" },',
        "More sheet",
    ),
    (
        "src/app/(app)/dashboard/page.tsx",
        '      {plan === "premium" ? (\n'
        "        <Card>\n"
        "          <SectionHeading\n"
        '            eyebrow="Your Twin"\n'
        "            title=\"Ask something of the version that's read it all\"\n"
        '            hint="Built from your own entries, so it already knows the pattern."\n'
        "          />\n"
        '          <Link href="/twin" className="text-sm text-sage-deep underline underline-offset-4">\n'
        "            Open your Twin\n"
        "          </Link>\n"
        "        </Card>\n"
        "      ) : null}\n"
        "\n"
        "      <Card>",
        "      <Card>",
        "dashboard card",
    ),
    (
        "src/components/upgrade-plans.tsx",
        '    pitch: "For the long view — and a Twin that remembers what you have already worked through.",\n'
        "    outcomes: [\n"
        '      "Your Twin, built from your own patterns",\n'
        '      "Deeper memory across months",\n'
        '      "Decision and reaction simulations",\n'
        '      "Long-range pattern modelling",\n'
        '      "The full tool library",\n'
        "    ],\n"
        "    limits: [\n"
        '      "800 support messages a month",\n'
        '      "300 journal reflections a month",\n'
        '      "80 Twin questions a month",\n'
        '      "180 minutes of voice a month",\n'
        "    ],",
        '    pitch: "For the long view — a memory that holds what you have already worked through.",\n'
        "    outcomes: [\n"
        '      "Deeper memory across months",\n'
        '      "Decision and reaction simulations",\n'
        '      "Long-range pattern modelling",\n'
        '      "The full tool library",\n'
        "    ],\n"
        "    limits: [\n"
        '      "800 support messages a month",\n'
        '      "300 journal reflections a month",\n'
        '      "180 minutes of voice a month",\n'
        "    ],",
        "Premium plan copy",
    ),
    (
        "src/app/(app)/upgrade/page.tsx",
        "          rather than days, and a Twin that knows what you have already told it.",
        "          rather than days, and a memory that holds what you have already told it.",
        "upgrade intro",
    ),
    (
        "src/lib/supabase/middleware.ts",
        '  "/upgrade",\n  "/twin",\n  "/homework",',
        '  "/upgrade",\n  "/homework",',
        "protected routes",
    ),
]

DELETE = ["src/app/(app)/twin", "src/components/twin-client.tsx"]


def find_repo() -> Path:
    seeds = [Path(__file__).resolve().parent, Path.cwd()]
    for seed in seeds:
        for root in [seed, *seed.parents]:
            if (root / "src" / "components" / "app-nav.tsx").is_file():
                return root
    sys.exit(
        "Could not find the repo above this script.\n"
        "Put this file inside ~/Documents/mentara-v2 and run it again."
    )


def main() -> None:
    root = find_repo()

    # Load every file once, apply every edit in memory, and only write if the
    # whole set applies. A half-removed Twin is worse than none.
    buffers: dict[str, str] = {}
    applied: list[str] = []
    already: list[str] = []
    missing: list[str] = []

    for rel, old, new, label in EDITS:
        path = root / rel
        if not path.is_file():
            missing.append(f"{rel} — file not found ({label})")
            continue
        if rel not in buffers:
            buffers[rel] = path.read_text(encoding="utf-8")
        if old in buffers[rel]:
            buffers[rel] = buffers[rel].replace(old, new, 1)
            applied.append(f"{rel} — {label}")
        elif new in buffers[rel]:
            already.append(f"{rel} — {label}")
        else:
            missing.append(f"{rel} — could not find the {label} block")

    if missing:
        print("Nothing was written. These did not match:\n")
        for item in missing:
            print(f"  ! {item}")
        print("\nSend me this output and I will correct the patch.")
        sys.exit(1)

    for rel, text in buffers.items():
        (root / rel).write_text(text, encoding="utf-8")

    for item in applied:
        print(f"  · {item}")
    for item in already:
        print(f"  = {item} (already done)")

    for rel in DELETE:
        target = root / rel
        if target.is_dir():
            shutil.rmtree(target)
            print(f"  x removed {rel}/")
        elif target.is_file():
            target.unlink()
            print(f"  x removed {rel}")
        else:
            print(f"  = {rel} (already gone)")

    print("\nNext:")
    print('  git add -A && git commit -m "Remove My Twin from the app"')
    print("  git push")


if __name__ == "__main__":
    main()
