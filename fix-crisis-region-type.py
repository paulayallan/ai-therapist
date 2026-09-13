#!/usr/bin/env python3
"""
Fixes the build that just failed on Production.

  src/lib/types.ts still declared seven crisis regions:

      export type CrisisRegion = "AU" | "US" | "UK" | "NZ" | "CA" | "IE" | "INTL";

  while the safety.ts shipped in b6529a3 defines twenty. TypeScript rejected
  the thirteen it had never heard of, and the deployment died in 30 seconds.

This is my error: the multilingual safety work was written in an earlier
session across two files, the script that updated types.ts was never run on
this machine, and the crisis-lines fix overwrote safety.ts without checking
its other half had landed.

One line changed. Nothing else in types.ts is touched.

Run from anywhere:  python3 fix-crisis-region-type.py
"""

import re
import sys
from pathlib import Path

OLD = 'export type CrisisRegion = "AU" | "US" | "UK" | "NZ" | "CA" | "IE" | "INTL";'

NEW = '''export type CrisisRegion =
  | "AU" | "NZ" | "US" | "CA" | "UK" | "IE"
  | "ES" | "MX" | "AR" | "CO" | "CL"
  | "BR" | "PT"
  | "TW" | "HK" | "SG"
  | "AE" | "SA" | "EG"
  | "INTL";'''


def find_repo() -> Path:
    seeds = [Path(__file__).resolve().parent, Path.cwd()]
    for seed in seeds:
        for root in [seed, *seed.parents]:
            if (root / "src" / "lib" / "types.ts").is_file():
                return root
    sys.exit(
        "Could not find src/lib/types.ts above this script.\n"
        "Put this file inside ~/Documents/mentara-v2 and run it again."
    )


def main() -> None:
    root = find_repo()
    path = root / "src" / "lib" / "types.ts"
    src = path.read_text(encoding="utf-8")

    if '"TW"' in src and "CrisisRegion" in src:
        print("Already fixed. Nothing to do.")
        return

    if OLD in src:
        src = src.replace(OLD, NEW, 1)
    else:
        # Same line, different spacing or member order.
        pattern = re.compile(r"export type CrisisRegion\s*=\s*[^;]+;", re.MULTILINE)
        if not pattern.search(src):
            sys.exit("Could not find the CrisisRegion type in types.ts. Nothing changed.")
        src = pattern.sub(NEW, src, count=1)

    path.write_text(src, encoding="utf-8")
    print("  ~ src/lib/types.ts — CrisisRegion widened to twenty regions")
    print("\nThen:")
    print('  git add -A && git commit -m "Widen CrisisRegion to match safety.ts"')
    print("  git push")


if __name__ == "__main__":
    main()
