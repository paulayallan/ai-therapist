#!/usr/bin/env python3
"""
Fixes the type error that has been failing every Vercel build since yesterday.

  ./capacitor.config.ts:49:7
  Type error: Type '"native"' is not assignable to type 'KeyboardResize | undefined'.

`resize` is typed as the KeyboardResize enum, not a string. The fix is the
form Capacitor's own docs use: import the enum and use KeyboardResize.Native.

Run from anywhere:  python3 fix-capacitor-types.py
"""

import sys
from pathlib import Path

TYPE_IMPORT = 'import type { CapacitorConfig } from "@capacitor/cli";'

NEW_IMPORTS = '''import type { CapacitorConfig } from "@capacitor/cli";
// A value import, not a type one: `resize` is typed as the KeyboardResize enum,
// and TypeScript will not accept the bare string "native" in its place. This is
// the form Capacitor's own docs use.
import { KeyboardResize } from "@capacitor/keyboard";'''


def find_repo() -> Path:
    seeds = [Path(__file__).resolve().parent, Path.cwd()]
    for seed in seeds:
        for root in [seed, *seed.parents]:
            if (root / "capacitor.config.ts").is_file():
                return root
    sys.exit(
        "Could not find capacitor.config.ts above this script.\n"
        "Put this file inside ~/Documents/mentara-v2 and run it again."
    )


def main() -> None:
    root = find_repo()
    path = root / "capacitor.config.ts"
    src = path.read_text(encoding="utf-8")
    original = src

    if "@capacitor/keyboard" in src and "KeyboardResize.Native" in src:
        print("Already fixed. Nothing to do.")
        return

    if TYPE_IMPORT not in src:
        sys.exit("Could not find the CapacitorConfig import line. Nothing changed.")
    if 'resize: "native"' not in src:
        sys.exit('Could not find `resize: "native"`. Nothing changed.')

    src = src.replace(TYPE_IMPORT, NEW_IMPORTS, 1)
    print("  · added the KeyboardResize import")

    src = src.replace('resize: "native"', "resize: KeyboardResize.Native", 1)
    print("  · resize: \"native\"  ->  resize: KeyboardResize.Native")

    if src == original:
        print("Nothing changed.")
        return

    path.write_text(src, encoding="utf-8")
    print(f"\nWrote {path.name}")
    print("\nNext — and read the output this time, do not just let it scroll past:")
    print("  npm run check")
    print("\nIf it says anything other than passing, paste it to me before committing.")


if __name__ == "__main__":
    main()
