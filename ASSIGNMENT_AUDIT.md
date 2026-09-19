# Assignment compliance audit

Run `python3 scripts/audit-story.py` for a machine-readable summary.

## Approved topic

**Commodore Crossroads: Choose Your Life After Vanderbilt** — an original interactive story about post-graduation career pressure, ethical tradeoffs (career vs integrity vs wellness), and nonlinear pathways through law, finance, and research.

## Passage count (meaningful narrative)

**20 narrative passages** in `story/Passages.twee` (assignment requires 15–20).

| # | Passage | Role |
| --- | --- | --- |
| 1 | start | Opening countdown & mission |
| 2 | family | Social pressure |
| 3 | invitation | Career Vault hook |
| 4 | resume | **Ethical choice** (honest / exaggerated / fake) |
| 5 | vault | Anticipation |
| 6 | choose | **3-way branch** (Law / Finance / Research) |
| 7–9 | careerLaw / careerFinance / careerResearch | Path-specific ethical missions |
| 10 | submitted | Shared convergence |
| 11 | waiting | Side mission affecting interview |
| 12 | interview | **Conditional** (prepared vs not) |
| 13 | rejection | Shared cliffhanger |
| 14 | offer | **Ethical choice** (secret favor) |
| 15 | check | **Consequence** of résumé choice |
| 16 | twoOffers | Prestige vs purpose vs founder |
| 17 | emergency | Family vs career crisis |
| 18 | betrayal | **Final ethical test** |
| 19 | graduation | Multiple endings from scores |
| 20 | reflection | Structure, ethics, engagement, bibliography |

**Not counted:** `StoryInit` (variable setup only — utility, not narrative).

## Pathways (3–5 distinct routes)

**Three career pathways** from `choose`:

1. **Law** → `careerLaw` → …
2. **Finance & Consulting** → `careerFinance` → …
3. **Medicine & Research** → `careerResearch` → …

All paths reconverge at `submitted` for shared nonlinear structure (linear opening, branching middle, converging late game).

**Documented test routes** (see `GROUP_PLAN.md`):

| Route | Key choices | Late consequence |
| --- | --- | --- |
| Honest Law Purpose | honest résumé, Law, prepare, reject shortcut, purpose offer | Clean background check; purposeful ending track |
| Exaggerated Finance Prestige | exaggerated résumé, Finance, party, accept shortcut, prestige offer | Discrepancy at check; prestige ending track |
| Fake Research Founder | fake résumé, Research, prepare, fraud at check, founder offer | Fraud alert; founder ending track |

Additional variation from: waiting-room choice, interview branch, offer/favor, emergency, betrayal (7+ ending variants via `setup.ending()`).

## Linear and nonlinear elements

- **Linear:** start → family → invitation → resume → vault → choose
- **Nonlinear:** 3 career doors; conditional interview, check, betrayal; replay from graduation/reflection
- **Delayed consequences:** résumé → check; preparation → interview; friend flag → betrayal text

## Ethical choices with consequences

| Choice location | Variables affected | Later impact |
| --- | --- | --- |
| resume | `$resume`, scores | `check` passage branches |
| career missions | `$career`, `$integrity`, `$wellness` | graduation ending thresholds |
| waiting | `$prepared` | `interview` conditional choices |
| offer | `$favor`, `$offer` | graduation ending branches |
| betrayal | scores | ending name/text |

## Multimedia

| Type | Location | Requirement |
| --- | --- | --- |
| Images | `assets/images/` — HUD, gallery | Local files; see MEDIA_CREDITS.md |
| Video | Resources panel — 11 curated TED/YouTube talks | Internet |
| Audio | Immersion Sounds toggle — YouTube loop | Internet, user opt-in |
| Fonts | Google Fonts (Libre Caslon, Source Sans 3) | Internet |

## Reflection passage (passage 20)

Covers:

- **Narrative structure** — mission-based journey, nonlinear pathways, reconvergence
- **Ethics** — integrity/career/wellness scoring, tradeoffs, no single “correct” path
- **Audience engagement** — humor, countdowns, delayed results, pressure
- **Bibliography** — Vanderbilt Career Center, Twine/SugarCube docs, cited TED talks used in Resources, MEDIA_CREDITS reference

## Twine authenticity

- Format: **SugarCube 2.37.3**
- Single source: `story/` + `source/` → `scripts/build-story.py`
- No `scenes{}` engine; no Harlowe duplicate
- Import file: `Commodore-Crossroads.html`
