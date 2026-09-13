#!/usr/bin/env python3
"""
Removes the line pinned under the chat composer:

    Not therapy, and not monitored by a person. 5 messages left today.

Three changes in src/components/chat-client.tsx:

  1. The footer paragraph goes.
  2. "This isn't therapy, and nothing here is read by another person" moves
     into the opening screen of a new conversation, so the disclaimer is
     still said — once, as an honest opening line — rather than sitting
     under the box for the whole session.
  3. The message count comes back only when 3 or fewer are left. No meter
     under the box while someone is mid-thought, but no silent wall either.

Run from anywhere:  python3 remove-chat-footer.py
"""

import sys
from pathlib import Path

OLD_INTRO = """            <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
              However you want to put it. There&rsquo;s no right way to start, and nothing here is
              read by another person.
            </p>"""

NEW_INTRO = """            {/*
             * The "not therapy, not monitored by a person" disclaimer lives here
             * — said once, as an opening line — rather than pinned under the
             * composer for the whole session. Same information, but it reads as
             * honesty about what this is instead of a warning label someone has
             * to sit under while they are upset.
             */}
            <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
              However you want to put it. There&rsquo;s no right way to start. This isn&rsquo;t
              therapy, and nothing here is read by another person.
            </p>"""

OLD_FOOTER = """        <p className="mt-2 text-[0.7rem] leading-relaxed text-faint">
          Not therapy, and not monitored by a person.
          {typeof left === "number" ? ` ${left} messages left today.` : ""}
        </p>"""

NEW_FOOTER = """        {/*
         * The count appears only when it is nearly gone. Someone mid-thought
         * does not need a meter under the box, but running into the wall with
         * no warning at all is worse — so it stays quiet until it matters.
         */}
        {typeof left === "number" && left > 0 && left <= 3 ? (
          <p className="mt-2 text-[0.7rem] leading-relaxed text-faint">
            {left} {left === 1 ? "message" : "messages"} left today.
          </p>
        ) : null}"""


def find_repo() -> Path:
    seeds = [Path(__file__).resolve().parent, Path.cwd()]
    for seed in seeds:
        for root in [seed, *seed.parents]:
            if (root / "src" / "components" / "chat-client.tsx").is_file():
                return root
    sys.exit(
        "Could not find src/components/chat-client.tsx above this script.\n"
        "Put this file inside ~/Documents/mentara-v2 and run it again."
    )


def main() -> None:
    root = find_repo()
    path = root / "src" / "components" / "chat-client.tsx"
    src = path.read_text(encoding="utf-8")
    original = src

    if "Not therapy, and not monitored by a person." not in src:
        print("The footer line is already gone. Nothing to do.")
        return

    if OLD_INTRO in src:
        src = src.replace(OLD_INTRO, NEW_INTRO, 1)
        print("  · disclaimer moved into the opening screen")
    else:
        print("  ! opening paragraph not found — left alone")

    if OLD_FOOTER in src:
        src = src.replace(OLD_FOOTER, NEW_FOOTER, 1)
        print("  · footer removed; count now shows only at 3 or fewer")
    else:
        sys.exit(
            "\nCould not find the footer paragraph to remove.\n"
            "Nothing was written. Tell me and I will send a corrected patch."
        )

    if src == original:
        print("Nothing changed.")
        return

    path.write_text(src, encoding="utf-8")
    print(f"\nWrote {path.relative_to(root)}")
    print("\nNext:")
    print('  git add -A && git commit -m "Move the chat disclaimer out of the composer"')
    print("  git push")


if __name__ == "__main__":
    main()
