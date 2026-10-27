# Newsletters

My personal newsletter app, installed on my phone as a PWA from GitHub Pages.

- `newsletters.json` lists the newsletters shown on the home screen.
- Each newsletter lives in `n/<id>/`: `index.json` (issues, newest first, with ticker items), `issues/YYYY-MM-DD.json`, and `GENERATOR.md` (instructions for the scheduled task that writes each issue).
- Layouts live in `js/` (`sports.js` for Boston Sports). The home screen and router are in `js/app.js`.
- Fonts (SIL Open Font License) are self-hosted in `fonts/`.

## Newsletters
- **Boston Sports** (`n/boston-sports`): daily, Patriots / Celtics / Bruins / Red Sox.
