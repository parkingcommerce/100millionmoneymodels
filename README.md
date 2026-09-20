# Commodore Crossroads: Choose Your Life After Vanderbilt

A **Twine 2 / SugarCube 2.37.3** story that uses the same Vanderbilt black/gold/cream interface as the live website. One source builds both the GitHub Pages game and the Twine import file.

## Play

- **Live website (unchanged until this preview is approved):** [https://parkingcommerce.github.io/100millionmoneymodels/](https://parkingcommerce.github.io/100millionmoneymodels/)
- **This preview branch:** open `index.html` in a browser after building, or use the preview URL posted with the branch.

## Import into Twine 2 (do not import the GitHub ZIP)

Twine imports **HTML story files**, not GitHub’s Download ZIP. If you import the ZIP, Twine reads the archive header (`PK`) and creates a corrupted passage named **PK**. That is expected. Extract first.

**Correct workflow:**

1. On GitHub, click **Code → Download ZIP**
2. **Extract** the ZIP on your computer (double-click it; do not import the `.zip`)
3. Open **Twine 2 → Library → Import**
4. Choose **`Commodore-Crossroads.html`** from the extracted folder

That file is the one to import. It contains 20 editable passages, the custom stylesheet, and the custom JavaScript.

See **[TWINE_WORKFLOW.md](TWINE_WORKFLOW.md)** for Play/Test, Publish to File, and how to bring Twine edits back into this repository.

## One authoritative source

| Edit this | Purpose |
| --- | --- |
| `story/Passages.twee` | Passage text, choices, scoring |
| `story/Head.twee` | Title, IFID, StoryInit variables |
| `story/StoryInterface.twee` | Header, dashboard, side panels, footer chrome |
| `source/stylesheet.css` | Vanderbilt UI |
| `source/script.js` | HUD, Hall of Shame, gallery, resources, sounds |
| `assets/images/` | Source PNGs (embedded into HTML at build time) |

```bash
python3 scripts/build-story.py
```

This writes identical `index.html` and `Commodore-Crossroads.html`.

## What needs internet

| Feature | Offline? | Notes |
| --- | --- | --- |
| Story, choices, scores, timers, endings | Yes | Core game |
| HUD, gallery, header images | Yes | Embedded as data URIs |
| Google Fonts | No | Falls back to system serif/sans |
| Resources (YouTube talks) | No | Thumbnails and embeds |
| Immersion Sounds | No | Opt-in YouTube audio |
| Live Hall of Shame / Rankings submissions | No | Needs internet + Supabase (`BACKEND_SETUP.md`) |

Without a backend, Hall of Shame and Game Rankings show the same on-page sample posts as the current website. Uploads stay in the browser and are not stored.

## Team

- **Zhaoyu Wang:** Passages 1–6
- **Carlyn Sharp:** Passages 7–14
- **Mohammad Ibrahim:** Passages 15–20, build & testing
