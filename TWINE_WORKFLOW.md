# Twine workflow

Commodore Crossroads is a native **SugarCube 2.37.3** story. The website (`index.html`) and the Twine import file (`Commodore-Crossroads.html`) are compiled from the same source. There is no iframe and no second simplified story.

## Download ZIP → extract → import the HTML

1. GitHub → **Code → Download ZIP**
2. **Extract** the ZIP (Finder: double-click). Do **not** import the `.zip` into Twine.
3. Twine 2 → **Library → Import**
4. Select **`Commodore-Crossroads.html`**

Importing the ZIP itself produces a passage named **PK** because Twine reads the ZIP binary header. That is the wrong file.

After import, Twine shows a passage map. Click **Play** or **Test** to see the Vanderbilt website interface, not SugarCube’s default look.

## Play, Test, and Publish to File

- **Play / Test:** HUD icons, gallery photos, and the Vanderbilt star are embedded, so they load even when Twine cannot see the `assets/` folder.
- **Publish to File:** save the HTML anywhere. Local images still work because they are embedded. YouTube resources, Immersion Sounds, Google Fonts, and live backend data still need internet.

## Edit in Twine, then bring changes back

1. Import `Commodore-Crossroads.html`
2. Edit passages, StoryInit, Story Stylesheet, Story JavaScript, or StoryInterface
3. **Publish to File** → save as `published.html`
4. In this repository run:

```bash
python3 scripts/import-from-html.py published.html
python3 scripts/build-story.py
```

That writes passages back into `story/` and stylesheet/script back into `source/`, then rebuilds both HTML files. Embedded PNG data is stripped from imported JavaScript and regenerated on rebuild.

## Edit in git instead

1. Change `story/Passages.twee` (or CSS/JS)
2. Run `python3 scripts/build-story.py`
3. Commit and push

## Verification

```bash
python3 scripts/build-story.py --check
python3 scripts/verify-import-roundtrip.py
```

Twine desktop Import → Play/Test → Publish to File should be confirmed locally; this environment cannot launch the Twine app.
