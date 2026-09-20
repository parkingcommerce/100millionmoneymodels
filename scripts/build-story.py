#!/usr/bin/env python3
"""Build index.html and Commodore-Crossroads.html from story/ (SugarCube Twee source)."""

from __future__ import annotations

import argparse
import platform
import re
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STORY = ROOT / "story"
SOURCE = ROOT / "source"
TOOLS = ROOT / "tools"
TWEEGO = TOOLS / "tweego"
FORMAT_DIR = TOOLS / "storyformats" / "sugarcube-2"
INDEX = ROOT / "index.html"
IMPORT_HTML = ROOT / "Commodore-Crossroads.html"
IMPORT_TWEE = ROOT / "Commodore-Crossroads.twee"

HEAD_PATCH = """
  <meta name="theme-color" content="#0a0a0a">
  <meta name="description" content="A choice-driven Vanderbilt career story about ambition, integrity, and wellbeing.">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet">
"""


def ensure_toolchain() -> None:
    TOOLS.mkdir(exist_ok=True)
    FORMAT_DIR.mkdir(parents=True, exist_ok=True)
    if not TWEEGO.exists():
        system = platform.system().lower()
        machine = platform.machine().lower()
        if system == "darwin":
            asset = "tweego-2.1.1-macos-x64.zip"
        elif system == "linux":
            asset = "tweego-2.1.1-linux-x64.zip" if machine in {"x86_64", "amd64"} else "tweego-2.1.1-linux-x86.zip"
        else:
            asset = "tweego-2.1.1-windows-x64.zip" if machine in {"x86_64", "amd64"} else "tweego-2.1.1-windows-x86.zip"
        url = f"https://github.com/tmedwards/tweego/releases/download/v2.1.1/{asset}"
        archive = TOOLS / "tweego.zip"
        urllib.request.urlretrieve(url, archive)
        with zipfile.ZipFile(archive) as zf:
            zf.extract("tweego" if system != "windows" else "tweego.exe", TOOLS)
        if system != "windows":
            TWEEGO.chmod(0o755)
        archive.unlink(missing_ok=True)
    if not (FORMAT_DIR / "format.js").exists():
        archive = TOOLS / "sugarcube.zip"
        url = "https://github.com/tmedwards/sugarcube-2/releases/download/v2.37.3/sugarcube-2.37.3-for-twine-2.1-local.zip"
        urllib.request.urlretrieve(url, archive)
        with zipfile.ZipFile(archive) as zf:
            for member in zf.namelist():
                if member.endswith(("format.js", "icon.svg")):
                    target = FORMAT_DIR / Path(member).name
                    target.write_bytes(zf.read(member))
        archive.unlink(missing_ok=True)


def embed_assets() -> None:
    subprocess.run([sys.executable, str(ROOT / "scripts" / "embed-assets.py")], check=True, cwd=ROOT)


def write_special_passages() -> None:
    css = (SOURCE / "stylesheet.css").read_text(encoding="utf-8")
    embedded = (SOURCE / "embedded-images.js").read_text(encoding="utf-8")
    js = embedded + "\n" + (SOURCE / "script.js").read_text(encoding="utf-8")
    (STORY / "StoryStylesheet.twee").write_text(
        ":: StoryStylesheet [stylesheet]\n" + css, encoding="utf-8"
    )
    (STORY / "StoryJavaScript.twee").write_text(
        ":: StoryJavaScript [script]\n" + js, encoding="utf-8"
    )


def compile_html(target: Path) -> None:
    cmd = [
        str(TWEEGO),
        "-f",
        "sugarcube-2",
        "-o",
        str(target),
        str(STORY) + "/",
    ]
    subprocess.run(cmd, check=True, cwd=ROOT)


def patch_head(html: str) -> str:
    if "assets/favicon.svg" in html:
        return html
    return html.replace("<title>Commodore Crossroads</title>", "<title>Commodore Crossroads</title>" + HEAD_PATCH, 1)


SPECIAL_PASSAGES = {
    "StoryInit", "StoryInterface", "StoryStylesheet", "Story JavaScript",
    "StoryJavaScript", "Story Stylesheet",
}


def export_import_twee() -> None:
    """Flat Twee export for Twine import (same content as story/ source)."""
    parts = [
        STORY / "Head.twee",
        STORY / "StoryInterface.twee",
        STORY / "Passages.twee",
        STORY / "StoryStylesheet.twee",
        STORY / "StoryJavaScript.twee",
    ]
    IMPORT_TWEE.write_text("".join(p.read_text(encoding="utf-8") + "\n" for p in parts if p.exists()), encoding="utf-8")


def validate_html(path: Path) -> None:
    html = path.read_text(encoding="utf-8")
    if 'format="SugarCube"' not in html:
        raise SystemExit(f"{path.name}: missing SugarCube story data")
    names = re.findall(
        r'<tw-passagedata[^>]*name="([^"]+)"',
        re.search(r"<tw-storydata.*?</tw-storydata>", html, re.DOTALL).group(0),
    )
    story_passages = [n for n in names if n not in SPECIAL_PASSAGES]
    expected = {
        "start", "family", "invitation", "resume", "vault", "choose",
        "careerLaw", "careerFinance", "careerResearch", "submitted", "waiting",
        "interview", "rejection", "offer", "check", "twoOffers", "emergency",
        "betrayal", "graduation", "reflection",
    }
    if set(story_passages) != expected:
        raise SystemExit(f"Passage mismatch in {path.name}: {story_passages}")


def build() -> None:
    ensure_toolchain()
    embed_assets()
    write_special_passages()
    tmp = ROOT / ".build-output.html"
    compile_html(tmp)
    html = patch_head(tmp.read_text(encoding="utf-8"))
    INDEX.write_text(html, encoding="utf-8")
    IMPORT_HTML.write_text(html, encoding="utf-8")
    tmp.unlink(missing_ok=True)
    export_import_twee()
    validate_html(INDEX)
    print(f"Built {INDEX.name} and {IMPORT_HTML.name} (SugarCube 2.37.3, 20 passages).")
    print(f"Wrote {IMPORT_TWEE.name} for Twine import.")


def check() -> None:
    embed_assets()
    write_special_passages()
    tmp = ROOT / ".build-check.html"
    if not TWEEGO.exists():
        ensure_toolchain()
    compile_html(tmp)
    built = patch_head(tmp.read_text(encoding="utf-8"))
    current = INDEX.read_text(encoding="utf-8")
    tmp.unlink(missing_ok=True)
    if built != current:
        raise SystemExit("index.html is out of date. Run: python3 scripts/build-story.py")
    validate_html(INDEX)
    print("Story build is in sync with story/ source (20 passages, SugarCube).")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify index.html matches source")
    args = parser.parse_args()
    if args.check:
        check()
    else:
        build()


if __name__ == "__main__":
    main()
