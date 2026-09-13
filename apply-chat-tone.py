#!/usr/bin/env python3
"""
Stops the support chat defaulting to breathing exercises.

Run from anywhere:  python3 apply-chat-tone.py
It finds the repo from its own location, or from the current directory.

Two changes, both in src/lib/ai/prompts.ts:
  1. The "How to reply" block in coachPrompt — rewritten so the default is
     no technique at all, and so the reply says the true thing rather than
     the soothing one.
  2. The "exercise" field description — narrowed to a body that is actually
     escalating, instead of "one short, concrete thing they could do now",
     which the model read as a standing instruction to end every reply
     with a breathing tip.
"""

import sys
from pathlib import Path

NEW_HOW_TO_REPLY = """How to reply:
- Answer the specific thing they wrote. If your reply would still make sense
  sent to a different person on a different day, it is not a reply, it is a
  template. Delete it and write one.
- Meet the emotion first. One line that shows you actually heard them — not a
  summary of their message handed back to them.

- Most turns need no technique at all, and the default is no technique.
  Breathing, grounding, five-senses, box-breathing and the rest are for a body
  that is escalating right now: racing heart, shaking, air that will not go in.
  Someone lying awake at 2am turning something over does not need to be told to
  breathe. Being told to breathe when what they wanted was to be understood
  reads as being managed, and it is the fastest way to lose them.
- Never suggest the same kind of step twice in one conversation. If breathing
  has been mentioned once, it is spent for the rest of this conversation.
- Silence is allowed. A reply that is only understanding, with nothing to do at
  the end of it, is often the better reply.

- Say the true thing rather than the soothing thing. If they are avoiding
  something, circling the same point, holding themselves to a standard they
  would not hold anyone else to, or asking you to confirm something that is not
  accurate — name it. Once, plainly, without heat. The warmth is in how you say
  it, not in whether you say it.
- Comfort that is not true is not comfort. Do not agree with a harsh
  self-judgement to be kind, and do not talk someone out of a worry that is
  reasonable. If they are right to be worried, say so, then stay with them in
  it.
- Being honest is not being blunt. Never lecture, never moralise, and never
  make them feel caught out. One observation, offered, not pressed.

- If they push back or say it isn't helping, take that at face value and change
  approach — do not defend the last thing you said.
- Two to four sentences of natural response, unless they asked something that
  needs more.

"""

NEW_EXERCISE = """- "exercise": null almost always. Only when their body is escalating right now, and only if
  nothing of the kind has already been said in this conversation. Never a breathing instruction
  for someone who is thinking rather than panicking.
"""


def find_repo() -> Path:
    candidates = [Path(__file__).resolve().parent, Path(__file__).resolve().parent.parent, Path.cwd()]
    for base in candidates:
        for root in [base, *base.parents]:
            if (root / "src" / "lib" / "ai" / "prompts.ts").is_file():
                return root
    sys.exit(
        "Could not find the repo (no src/lib/ai/prompts.ts above this script).\n"
        "Put this file inside ~/Documents/mentara-v2 and run it again."
    )


def main() -> None:
    root = find_repo()
    path = root / "src" / "lib" / "ai" / "prompts.ts"
    src = path.read_text(encoding="utf-8")
    original = src

    # --- 1. the How to reply block -------------------------------------
    start = src.find("How to reply:")
    end = src.find("Most of the fields below")
    if start == -1 or end == -1 or end <= start:
        sys.exit(
            "Could not locate the 'How to reply' block in prompts.ts.\n"
            "The file on this machine is not the version this patch expects.\n"
            "Nothing was changed."
        )
    if "the default is no technique" in src:
        print("  · How to reply — already patched, skipping")
    else:
        src = src[:start] + NEW_HOW_TO_REPLY + src[end:]
        print("  · How to reply — rewritten")

    # --- 2. the exercise field -----------------------------------------
    old_exercise = (
        '- "exercise": one short, concrete thing they could do now, '
        'not already mentioned in "response". Otherwise null.\n'
    )
    if old_exercise in src:
        src = src.replace(old_exercise, NEW_EXERCISE, 1)
        print("  · exercise field — narrowed")
    elif "null almost always" in src:
        print("  · exercise field — already patched, skipping")
    else:
        print("  ! exercise field — not found, left alone (check it by hand)")

    if src == original:
        print("\nNothing to do. The file already has both changes.")
        return

    path.write_text(src, encoding="utf-8")
    print(f"\nWrote {path.relative_to(root)}")
    print("\nNext:")
    print("  npm run check")
    print('  git add -A && git commit -m "Stop the chat defaulting to breathing exercises"')
    print("  git push")


if __name__ == "__main__":
    main()
