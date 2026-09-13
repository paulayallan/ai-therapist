#!/usr/bin/env python3
"""
Puts the Mentara icon into the iOS app, without opening Xcode.

The v2 iOS project was generated fresh by Capacitor, so its icon is still
Capacitor's default — the blue X that showed up in App Store Connect. This
replaces it.

It reads the asset catalog's own Contents.json rather than guessing filenames,
works out the pixel size each slot wants from its size and scale, and renders
each one with `sips`, which ships with macOS. No Xcode, no Pillow, nothing to
install.

Put appicon-1024.png next to this script (or anywhere in the repo) and run:

    python3 set-app-icon.py
"""

import json
import subprocess
import sys
from pathlib import Path

SOURCE_NAMES = ["appicon-1024.png", "appicon.png", "AppIcon-1024.png", "icon-1024.png"]


def find_repo() -> Path:
    seeds = [Path(__file__).resolve().parent, Path.cwd()]
    for seed in seeds:
        for root in [seed, *seed.parents]:
            if (root / "ios" / "App" / "App" / "Assets.xcassets").is_dir():
                return root
    sys.exit(
        "Could not find ios/App/App/Assets.xcassets above this script.\n"
        "Put this file inside ~/Documents/mentara-v2 and run it again."
    )


def find_source(root: Path) -> Path:
    for name in SOURCE_NAMES:
        for candidate in (root / name, Path.cwd() / name, Path(__file__).resolve().parent / name):
            if candidate.is_file():
                return candidate
    hits = sorted(root.glob("appicon*.png"))
    if hits:
        return hits[0]
    sys.exit(
        "Could not find the icon. Download appicon-1024.png into\n"
        "~/Documents/mentara-v2 and run this again."
    )


def pixels(entry: dict) -> int | None:
    """A slot's real pixel size: its point size times its scale."""
    size = entry.get("size")
    if not size:
        return None
    try:
        points = float(size.split("x")[0])
    except ValueError:
        return None
    scale = entry.get("scale", "1x")
    try:
        factor = int(str(scale).rstrip("x"))
    except ValueError:
        factor = 1
    return int(round(points * factor))


def main() -> None:
    root = find_repo()
    appiconset = root / "ios" / "App" / "App" / "Assets.xcassets" / "AppIcon.appiconset"
    if not appiconset.is_dir():
        sys.exit(f"No AppIcon.appiconset at {appiconset}")

    source = find_source(root)
    print(f"  source: {source.name}")

    contents_path = appiconset / "Contents.json"
    if not contents_path.is_file():
        sys.exit("AppIcon.appiconset has no Contents.json — open it in Xcode instead.")

    contents = json.loads(contents_path.read_text(encoding="utf-8"))
    images = contents.get("images", [])

    written = 0
    unfilled = 0
    for entry in images:
        filename = entry.get("filename")
        if not filename:
            unfilled += 1
            continue
        px = pixels(entry)
        target = appiconset / filename
        if px is None:
            # No size declared (the modern single-slot format). Copy as-is.
            target.write_bytes(source.read_bytes())
            print(f"  · {filename} (as supplied)")
        else:
            result = subprocess.run(
                ["sips", "-z", str(px), str(px), str(source), "--out", str(target)],
                capture_output=True,
                text=True,
            )
            if result.returncode != 0:
                print(f"  ! {filename} failed: {result.stderr.strip()}")
                continue
            print(f"  · {filename}  {px}x{px}")
        written += 1

    if written == 0:
        sys.exit(
            "Every slot in Contents.json is empty, so there was nothing to replace.\n"
            "Drag the icon onto AppIcon in Xcode's asset catalog instead."
        )

    print(f"\nWrote {written} icon file(s).")
    if unfilled:
        print(f"{unfilled} slot(s) had no filename and were left alone.")
    print("\nNow in Xcode: General -> Version 1.6, Build 2, then Product -> Archive.")
    print("If Xcode is already open, close and reopen it so it re-reads the catalog.")


if __name__ == "__main__":
    main()
