# Twine workflow — one game, one source

Commodore Crossroads is a **native SugarCube 2.37.3 Twine story**. The GitHub Pages site, Twine import file, and playable HTML are all compiled from the same source. There is no separate custom game engine and no Harlowe copy.

## Authoritative source files

| Edit this | Contains |
| --- | --- |
| `story/Passages.twee` | All 20 passage texts, choices, `<<set>>` state changes |
| `story/Head.twee` | Story title, IFID, StoryInit variables |
| `source/stylesheet.css` | Vanderbilt UI styling |
| `source/script.js` | HUD, Hall of Shame, gallery, resources, sounds |
| `assets/images/` | **Source PNGs** for HUD and gallery (embedded at build time) |

Build command:

```bash
python3 scripts/build-story.py
```

Outputs (do not edit by hand):

- `index.html` — GitHub Pages game
- `Commodore-Crossroads.html` — Twine import file
- `Commodore-Crossroads.twee` — flat Twee export
- `source/embedded-images.js` — generated base64 map (gitignored)

## Download and import (correct workflow)

1. GitHub → **Code → Download ZIP**
2. **Extract** the ZIP (do not import the ZIP itself into Twine)
3. Twine 2 → **Library → Import**
4. Select **`Commodore-Crossroads.html`**

Twine opens the story in **SugarCube** with all 20 passages, the full stylesheet, and the full JavaScript.

## Editing in Twine and syncing back to GitHub

### Option A — Edit source in the repository (recommended for teams using git)

1. Edit `story/Passages.twee` (and CSS/JS if needed)
2. Run `python3 scripts/build-story.py`
3. Commit and push

### Option B — Edit in Twine, then import back

1. Import `Commodore-Crossroads.html` into Twine
2. Edit passages, StoryInit, Story Stylesheet, or Story JavaScript in Twine
3. **Publish to File** → save as `published.html` anywhere (images are embedded; `assets/` optional)
4. Run:

```bash
python3 scripts/import-from-html.py published.html
python3 scripts/build-story.py
```

This imports **passages, StoryInit, stylesheet, and JavaScript** by default. Embedded PNG data is stripped from imported JS and regenerated on rebuild.

Round-trip verification:

```bash
python3 scripts/verify-import-roundtrip.py
```

## Asset handling and internet requirements

| Feature | Offline? | Notes |
| --- | --- | --- |
| **HUD / gallery PNGs** | Yes | Embedded as data URIs at build time; works in Twine Test/Play and Publish to any folder |
| **Passage logic / HUD / panels** | Yes | SugarCube + custom JS |
| **Immersion sounds (YouTube)** | **No** | Requires internet |
| **Resources panel (YouTube thumbnails)** | **No** | Requires internet |
| **Google Fonts** | **No** | Requires internet (fallback system fonts if blocked) |
| **Hall of Shame (live submissions)** | **No** | Requires internet + Supabase backend (`BACKEND_SETUP.md`) |
| **Game Rankings (live leaderboard)** | **No** | Requires internet + Supabase backend |

When the backend is not configured, **Hall of Shame** and **Game Rankings** show empty states—no fabricated sample players.

Original PNGs remain in `assets/images/` as editable source files.

## Manual verification checklist

**Status: pending** — Twine desktop is not available in CI. Complete locally:

- [ ] Extract repo ZIP; confirm `Commodore-Crossroads.html` is present
- [ ] Import `Commodore-Crossroads.html` into Twine 2
- [ ] Story format shows **SugarCube 2.37.3**; passage map shows **20 passages**
- [ ] Open **Story Stylesheet** and **Story JavaScript** — Vanderbilt CSS/JS present
- [ ] **Test Play** — confirm HUD icons and gallery images load (embedded)
- [ ] **Publish to File** to Desktop; open published HTML — HUD/gallery still work
- [ ] Edit one passage line → Publish → `import-from-html.py` → rebuild → confirm edit in `story/Passages.twee`
- [ ] Play Route 1 from `PLAYTHROUGHS.md`; confirm `check` changes with résumé choice
- [ ] Reach `reflection`; confirm **Exploring Identity** theme and bibliography

## Why SugarCube, not Harlowe

Harlowe cannot host this project's custom dashboard, JavaScript panels, YouTube modals, or immersion-sounds toggle. SugarCube is the standard Twine format for passages plus custom CSS/JS while remaining fully editable in Twine.
