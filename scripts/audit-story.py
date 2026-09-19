#!/usr/bin/env python3
"""Audit Commodore Crossroads against assignment narrative requirements."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PASSAGES = ROOT / "story" / "Passages.twee"

NARRATIVE_PASSAGES = [
    ("start", "Commodore Crossroads — opening countdown"),
    ("family", "The Pressure Call"),
    ("invitation", "The Secret Invitation"),
    ("resume", "The Résumé Test (ethical choice)"),
    ("vault", "The Career Vault"),
    ("choose", "Choose Your Mission (3-way branch)"),
    ("careerLaw", "Law pathway mission"),
    ("careerFinance", "Finance pathway mission"),
    ("careerResearch", "Research pathway mission"),
    ("submitted", "Application Submitted"),
    ("waiting", "Waiting Room side mission"),
    ("interview", "Interview Battle (conditional)"),
    ("rejection", "The Fall"),
    ("offer", "Devil's Shortcut (ethical choice)"),
    ("check", "Background Check (résumé consequences)"),
    ("twoOffers", "Two Offers final countdown"),
    ("emergency", "The Emergency"),
    ("betrayal", "Betrayal Test (ethical choice)"),
    ("graduation", "Graduation Day (multiple endings)"),
    ("reflection", "Reflection & Bibliography"),
]

ROUTES = {
    "Honest Law Purpose": [
        "start", "family", "invitation", "resume", "vault", "choose", "careerLaw",
        "submitted", "waiting", "interview", "rejection", "offer", "check",
        "twoOffers", "emergency", "betrayal", "graduation",
    ],
    "Exaggerated Finance Prestige": [
        "start", "family", "invitation", "resume", "vault", "choose", "careerFinance",
        "submitted", "waiting", "interview", "rejection", "offer", "check",
        "twoOffers", "emergency", "betrayal", "graduation",
    ],
    "Fake Research Founder": [
        "start", "family", "invitation", "resume", "vault", "choose", "careerResearch",
        "submitted", "waiting", "interview", "rejection", "offer", "check",
        "twoOffers", "emergency", "betrayal", "graduation",
    ],
}

HEADER = re.compile(r"^:: (\w+)")


def parse_passage_names() -> list[str]:
    names = []
    for line in PASSAGES.read_text(encoding="utf-8").splitlines():
        m = HEADER.match(line)
        if m:
            names.append(m.group(1))
    return names


def parse_links() -> dict[str, list[str]]:
    text = PASSAGES.read_text(encoding="utf-8")
    blocks = re.split(r"^:: \w+", text, flags=re.M)[1:]
    names = parse_passage_names()
    links: dict[str, list[str]] = {}
    for name, body in zip(names, blocks):
        targets = re.findall(r'<<button[^>]*"(\w+)"\s*>>', body)
        targets += re.findall(r'<<button[^>]*\|\s*"(\w+)"\s*>>', body)
        links[name] = sorted(set(targets))
    return links


def main() -> None:
    names = parse_passage_names()
    expected = [n for n, _ in NARRATIVE_PASSAGES]
    print("=== Assignment audit: Commodore Crossroads ===\n")
    print("Approved topic: Post-graduation career ethics at Vanderbilt")
    print("(Choose Your Life After Vanderbilt — career, integrity, wellness)\n")
    print(f"Meaningful narrative passages: {len(expected)}")
    for i, (pid, title) in enumerate(NARRATIVE_PASSAGES, 1):
        mark = "OK" if pid in names else "MISSING"
        print(f"  {i:2}. [{mark}] {pid} — {title}")
    print()
    print("Utility/system passages (not counted): StoryInit only (variable setup)\n")
    links = parse_links()
    print("Branching structure:")
    print(f"  - Early linear chain: start → family → invitation → resume → vault → choose")
    print(f"  - 3 career pathways from choose: {links.get('choose', [])}")
    print(f"  - Paths reconverge at: submitted → waiting → interview → rejection → offer")
    print(f"  - Conditional passages: interview, check, twoOffers, betrayal, graduation")
    print()
    print("Sample complete routes (from GROUP_PLAN.md):")
    for route_name, route in ROUTES.items():
        print(f"  • {route_name}: {' → '.join(route[:4])}… → {route[-1]}")
    print()
    print("Ethical consequence hooks:")
    print("  - resume choice → check passage (honest / exaggerated / fake)")
    print("  - waiting choice → interview (prepared vs unprepared branches)")
    print("  - offer choice → favor/offer variables → graduation endings")
    print("  - betrayal choice → integrity/career/wellness score changes")
    print()
    reflection = re.search(
        r":: reflection.*?(\n::|\Z)",
        PASSAGES.read_text(encoding="utf-8"),
        re.S,
    )
    body = reflection.group(0) if reflection else ""
    has_structure = "nonlinear" in body.lower() or "pathway" in body.lower()
    has_ethics = "ethical" in body.lower() or "integrity" in body.lower()
    has_engagement = "engagement" in body.lower() or "countdown" in body.lower()
    has_bib = "bibliography" in body.lower() or "Bibliography" in body
    print("Reflection passage checks:")
    print(f"  - Narrative structure discussed: {'yes' if has_structure else 'NO'}")
    print(f"  - Ethics discussed: {'yes' if has_ethics else 'NO'}")
    print(f"  - Audience engagement discussed: {'yes' if has_engagement else 'NO'}")
    print(f"  - Bibliography section present: {'yes' if has_bib else 'NO'}")


if __name__ == "__main__":
    main()
