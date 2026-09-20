#!/usr/bin/env python3
"""Verify Twine HTML import preserves passage, StoryInit, CSS, and JS edits."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PASSAGES = ROOT / "story" / "Passages.twee"
HEAD = ROOT / "story" / "Head.twee"
STYLES = ROOT / "source" / "stylesheet.css"
SCRIPT = ROOT / "source" / "script.js"
HTML = ROOT / "Commodore-Crossroads.html"

MARKER = "TWINE_ROUNDTRIP_MARKER"
INIT_MARKER = "<<set $roundtripTest to true>>"


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, cwd=ROOT)


def main() -> None:
    originals = {
        "passages": PASSAGES.read_text(encoding="utf-8"),
        "head": HEAD.read_text(encoding="utf-8"),
        "styles": STYLES.read_text(encoding="utf-8"),
        "script": SCRIPT.read_text(encoding="utf-8"),
    }

    try:
        passages = originals["passages"]
        if MARKER not in passages:
            passages = passages.replace(
                "<<button [[Begin the countdown|family]]>><</button>>",
                f"<<button [[Begin the countdown|family]]>><</button>>\n<p>{MARKER}</p>",
                1,
            )
            PASSAGES.write_text(passages, encoding="utf-8")

        head = originals["head"]
        if INIT_MARKER not in head:
            head = re.sub(
                r"(:: StoryInit(?:\s+\{[^}]*\})?\s*\n)",
                r"\1" + INIT_MARKER + "\n",
                head,
                count=1,
            )
            HEAD.write_text(head, encoding="utf-8")

        styles = originals["styles"]
        css_marker = "/* TWINE_ROUNDTRIP_CSS */"
        if css_marker not in styles:
            STYLES.write_text(styles.rstrip() + f"\n{css_marker}\n", encoding="utf-8")

        script = originals["script"]
        js_marker = "/* TWINE_ROUNDTRIP_JS */"
        if js_marker not in script:
            SCRIPT.write_text(script.rstrip() + f"\n{js_marker}\n", encoding="utf-8")

        run([sys.executable, "scripts/build-story.py"])
        run([sys.executable, "scripts/import-from-html.py", str(HTML)])

        imported_passages = PASSAGES.read_text(encoding="utf-8")
        imported_head = HEAD.read_text(encoding="utf-8")
        imported_styles = STYLES.read_text(encoding="utf-8")
        imported_script = SCRIPT.read_text(encoding="utf-8")

        checks = [
            (MARKER in imported_passages, f"passage edit ({MARKER})"),
            (INIT_MARKER in imported_head, f"StoryInit edit ({INIT_MARKER})"),
            (css_marker in imported_styles, f"stylesheet edit ({css_marker})"),
            (js_marker in imported_script, f"JavaScript edit ({js_marker})"),
        ]
        failed = [name for ok, name in checks if not ok]
        if failed:
            raise SystemExit("Import round-trip failed to preserve: " + ", ".join(failed))

        run([sys.executable, "scripts/build-story.py", "--check"])
        print("Import round-trip OK: passage, StoryInit, stylesheet, and script edits survived rebuild.")
    finally:
        PASSAGES.write_text(originals["passages"], encoding="utf-8")
        HEAD.write_text(originals["head"], encoding="utf-8")
        STYLES.write_text(originals["styles"], encoding="utf-8")
        SCRIPT.write_text(originals["script"], encoding="utf-8")
        run([sys.executable, "scripts/build-story.py"])


if __name__ == "__main__":
    main()
