# Commodore Crossroads: Choose Your Life After Vanderbilt

An original **Twine 2 / SugarCube 2.37.3** interactive story (20 passages) about post-graduation career ethics at Vanderbilt. One source builds the GitHub Pages game and the Twine import file—the same game, not two separate versions.

**Topic:** Choose Your Life After Vanderbilt — career pressure, integrity, wellness, and ethical tradeoffs.

## Play the game

- **Online:** [Play on GitHub Pages](https://parkingcommerce.github.io/100millionmoneymodels/)
- **Offline:** open `index.html` in any browser (HUD/gallery PNGs are embedded; favicon still uses `assets/favicon.svg`)

## Import into Twine 2

Twine 2 imports **HTML story files** and **Twee** (`.twee`). It does **not** import a GitHub repository ZIP. If you import the ZIP directly, Twine reads the ZIP’s binary header (`PK`) as text and creates a garbage passage named **“PK”** — that is expected and means you picked the wrong file.

**Correct steps:**

1. On GitHub, click **Code → Download ZIP**
2. **Extract** the ZIP on your computer (double-click it)
3. Open **Twine 2** → **Library** tab → **Import**
4. Choose **`Commodore-Crossroads.html`** from the extracted folder

Alternative: import **`Commodore-Crossroads.twee`** instead of the HTML file.

See **[TWINE_WORKFLOW.md](TWINE_WORKFLOW.md)** for editing in Twine, syncing back to git, asset behavior, and a manual verification checklist.

See **[ASSIGNMENT_AUDIT.md](ASSIGNMENT_AUDIT.md)** for passage count, pathways, ethics, multimedia, and reflection/bibliography compliance.

See **[PLAYTHROUGHS.md](PLAYTHROUGHS.md)** for three documented start-to-ending routes.

## One authoritative source

| Edit this | Purpose |
| --- | --- |
| `story/Passages.twee` | Passage text, choices, state changes |
| `story/Head.twee` | Metadata, StoryInit variables |
| `source/stylesheet.css` | Vanderbilt UI |
| `source/script.js` | HUD, Hall of Shame, gallery, resources, sounds |
| `assets/images/` | Source PNGs (embedded into HTML at build for Twine portability) |

```bash
python3 scripts/build-story.py          # build index.html + import files
python3 scripts/audit-story.py          # assignment checklist
python3 scripts/import-from-html.py FILE.html  # pull Twine edits back into story/
python3 scripts/verify-import-roundtrip.py     # verify import preserves edits
```

**Why SugarCube?** Harlowe cannot support this project's custom dashboard, JavaScript panels, or multimedia UI. SugarCube is the correct Twine format for passages plus custom CSS/JS.

## Internet and backend requirements

| Feature | Offline? | Notes |
| --- | --- | --- |
| Story passages & choices | Yes | Core game |
| HUD / gallery images | Yes | Embedded at build; `assets/images/` kept as source |
| Google Fonts | No | Loaded from CDN |
| Resources (YouTube) | No | Requires internet |
| Immersion Sounds | No | YouTube audio, opt-in; requires internet |
| Hall of Shame / Rankings | Partial | Empty offline; live data requires internet + Supabase (`BACKEND_SETUP.md`) |

HUD and gallery images work in **Twine Test/Play** and **Publish to File** (embedded PNGs). YouTube resources and the live leaderboard require internet.

## GitHub Pages

Push to `main`. The workflow runs `python3 scripts/build-story.py` then deploys.

## Team

- **Zhaoyu Wang:** Passages 1–6
- **Carlyn Sharp:** Passages 7–14
- **Mohammad Ibrahim:** Passages 15–20, build & testing
