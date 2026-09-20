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


def _html_unescape(text: str) -> str:
    return (
        text.replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", '"')
        .replace("&amp;", "&")
        .replace("&#39;", "'")
    )


def twine_parse_links(text: str) -> list[str]:
    """Match Twine 2 parseLinks(): unique destinations of [[...]] wiki links."""
    tags = re.findall(r"\[\[.*?\]\]", text)
    seen: list[str] = []
    for tag in tags:
        inner = tag[2:-2]
        if "][" in inner:
            inner = inner.split("][", 1)[0]
        if "->" in inner:
            dest = inner.split("->")[-1]
        elif "<-" in inner:
            dest = inner.split("<-")[0]
        elif "|" in inner:
            dest = inner.split("|")[-1]
        else:
            dest = inner
        dest = dest.strip()
        if dest and dest not in seen and not re.match(r"^\w+://", dest):
            seen.append(dest)
    return seen


def validate_html(path: Path) -> None:
    html = path.read_text(encoding="utf-8")
    if 'format="SugarCube"' not in html:
        raise SystemExit(f"{path.name}: missing SugarCube story data")
    storydata = re.search(r"<tw-storydata.*?</tw-storydata>", html, re.DOTALL).group(0)
    names = re.findall(r'<tw-passagedata[^>]*name="([^"]+)"', storydata)
    story_passages = [n for n in names if n not in SPECIAL_PASSAGES]
    expected = {
        "start", "family", "invitation", "resume", "vault", "choose",
        "careerLaw", "careerFinance", "careerResearch", "submitted", "waiting",
        "interview", "rejection", "offer", "check", "twoOffers", "emergency",
        "betrayal", "graduation", "reflection",
    }
    if set(story_passages) != expected:
        raise SystemExit(f"Passage mismatch in {path.name}: {story_passages}")

    expected_links = {
        "start": {"family"},
        "family": {"invitation"},
        "invitation": {"resume"},
        "resume": {"vault"},
        "vault": {"choose"},
        "choose": {"careerLaw", "careerFinance", "careerResearch"},
        "careerLaw": {"submitted"},
        "careerFinance": {"submitted"},
        "careerResearch": {"submitted"},
        "submitted": {"waiting"},
        "waiting": {"interview"},
        "interview": {"rejection"},
        "rejection": {"offer"},
        "offer": {"check"},
        "check": {"twoOffers"},
        "twoOffers": {"emergency"},
        "emergency": {"betrayal"},
        "betrayal": {"graduation"},
        "graduation": {"reflection", "start"},
        "reflection": {"graduation", "start"},
    }
    boxes: list[tuple[str, int, int]] = []
    for match in re.finditer(
        r'<tw-passagedata([^>]*)>(.*?)</tw-passagedata>',
        storydata,
        re.DOTALL,
    ):
        attrs, raw = match.group(1), match.group(2)
        name = re.search(r'\bname="([^"]+)"', attrs).group(1)
        body = _html_unescape(raw)
        if re.search(r'<<button\s+(?:"|\')', body):
            raise SystemExit(f"{path.name}: {name} still uses quoted <<button>> args Twine cannot map")
        links = set(twine_parse_links(body))
        expect = expected_links.get(name)
        if expect is not None and links != expect:
            raise SystemExit(f"{path.name}: Twine map links for {name} are {sorted(links)}, expected {sorted(expect)}")
        pos = re.search(r'\bposition="([^"]+)"', attrs)
        if pos:
            x, y = (int(float(p)) for p in pos.group(1).split(","))
            boxes.append((name, x, y))
    for i, (a, ax, ay) in enumerate(boxes):
        for b, bx, by in boxes[i + 1 :]:
            if abs(ax - bx) < 100 and abs(ay - by) < 100:
                raise SystemExit(f"{path.name}: overlapping map boxes {a} ({ax},{ay}) and {b} ({bx},{by})")
    util_y = [y for name, x, y in boxes if name in {"StoryInit", "StoryInterface"}]
    story_y = [y for name, x, y in boxes if name in expected]
    if util_y and story_y and max(util_y) + 100 > min(story_y):
        raise SystemExit(f"{path.name}: utility passages overlap the narrative map")


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
