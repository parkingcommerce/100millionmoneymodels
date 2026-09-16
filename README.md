# Commodore Crossroads: Choose Your Life After Vanderbilt

This folder contains a complete playable prototype for the Interactive Digital Narrative Project. Its presentation uses only black, gold, and white, with one consistent minimal sans-serif typeface throughout.

## Run the game

Open `index.html` in a browser. No installation or internet connection is required.

## Publish with GitHub Pages

1. Create a new empty GitHub repository.
2. Upload everything inside this folder to the repository root.
3. Make sure the default branch is named `main`.
4. Open **Settings → Pages** in GitHub.
5. Under **Build and deployment**, select **GitHub Actions**.
6. Push a change or run the “Deploy GitHub Pages” workflow manually.
7. GitHub will provide the public project link after deployment finishes.

Do not upload only `index.html`; keep `.github`, `assets`, `.nojekyll`, and the credit files too.

## Group division

- Person 1: Passages 1–6 — opening mystery, family pressure, résumé ethics, Career Vault.
- Person 2: Passages 7–14 — three career branches, waiting-room mission, interview, rejection, secret offer.
- Person 3: Passages 15–20 — background-check consequences, final decisions, endings, reflection and testing.

## Move it into Twine

The prototype already behaves like a Twine story. To recreate it in Twine:

1. Create a new story using the **SugarCube 2** format.
2. Create passages using the titles shown inside the game.
3. Copy each scene's narrative text and choices from `index.html` or the planning sheet.
4. Use story variables for `$career`, `$integrity`, `$wellness`, `$path`, `$resume`, and `$prepared`.
5. Export the finished Twine story as HTML, test every branch, and publish that HTML through itch.io or GitHub Pages.

## Before submission

- Replace “Person 1/2/3” with the members' names.
- Expand the bibliography with every image, sound, video, or factual source used.
- Ask each member to play at least two routes.
- Confirm that every link works and that the final reflection is included.
- Let only the designated group leader submit the final working link.
- Add every image and audio source to `MEDIA_CREDITS.md`.
