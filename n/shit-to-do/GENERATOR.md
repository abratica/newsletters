# Shit To Do: daily update instructions

One living page of things for Andrew and Rachel to do around Somerville, Cambridge and Boston. It's refreshed every morning (by about 5 AM ET). There are **no past issues**: each run writes today's file, points `index.json` at it, and deletes the previous file.

Read `TASTE.md` and `watchlist.json` first. Today = the run date in America/New_York.

## Files
- `issues/YYYY-MM-DD.json`: today's page (schema below).
- `index.json`: `{ "issues": [ { "date": "YYYY-MM-DD", "headline": "<weekend note or the top pick's name>", "ticker": [...] } ] }`. **Only today's entry.**
- Delete every other file in `issues/` (`git rm`).

## Start from yesterday
Load yesterday's file (the one `index.json` points to) and carry over every event and DJ show that hasn't happened yet (`endDate` or `date` ≥ today). Keep their `id` and `added` unchanged. Re-check anything that looks shaky (cancelled, sold out, date moved) and update or drop it.
Then search for new events and add them with `added` = today. The app tags `added == today` as **New**, so never set `added` to today on an item that was already there.

## What to look for
Coverage window: today through about 4 weeks out. Priorities:
1. **The coming weekend** (Mon–Thu: the next Fri–Sun; Fri–Sun: the current one). Aim for 6–10 good events, with exactly **3 `pick: true`** that fall on the weekend: the best fits for the two of them, with a mix (not three of the same kind). Re-choose the picks each day.
2. **Still this week**: a few standouts happening before the weekend.
3. **Plan ahead**: 4–8 bigger or ticketed things further out worth planning around, plus ongoing runs (exhibits, seasonal light shows) that are closing within the window.
Keep the whole page scannable: about 15–25 events total.

Sources (read the actual page; never list an event you haven't seen on a source):
- Roundups: Boston Magazine "Things to do this week", WBUR weekend picks, Boston Globe things to do, do617 (`https://do617.com/events/YYYY/MM/DD`, free events), The Boston Calendar, Boston Hassle, Arts Fuse, MeetBoston, boston.gov events.
- Somerville: Somerville Arts Council, Somerville Theatre events, Arts at the Armory, The Rockwell, Aeronaut Brewing, Bow Market, Union Square Main Streets, Davis Square, Assembly Row, Somerville Public Library (adult events only), Patch Somerville.
- Cambridge: The Sinclair, The Foundry, Brattle Theatre, Central Square Theater, Harvard Square and Kendall events.
- House/techno vibe: EDMTrain Boston listing (day parties, open-air and brunch-type events; not every club night), Bassline Boston (After Brunch events), Royale, Big Night Live, Roadrunner, Bijou, Venu, Descent, rooftop and patio day parties (Eventbrite, posh.vip, RA / Resident Advisor Boston).
- Film: Coolidge Corner Theatre, Brattle, Somerville Theatre, Harvard Film Archive.
WebFetch works for these; the shell can't reach the web.

## DJs in town
**No time limit here.** The 4-week coverage window is for events only. Any announced Boston-area date for a watchlist DJ goes on the list, even if it's 6+ months out (next summer's festival, a spring arena date). It stays until the show has happened.

For **every** artist in `watchlist.json`, search for a Boston-area show (Boston, Cambridge, Somerville, and the big nearby venues: TD Garden, MGM Music Hall, Roadrunner, Big Night Live, Royale, House of Blues, Agganis, Leader Bank Pavilion, Boch Center, festivals like Boston Calling). Search `"<Artist>" Boston 2026` and `"<Artist>" Boston 2027`, and check the artist's official tour page or Songkick/Bandsintown when available. **Check EDMTrain's Boston listing every day** (edmtrain.com; find the Boston/Massachusetts page via search): it lists electronic shows by city months ahead, so scan it for every watchlist name. Do this in batches so it doesn't take forever, but cover the whole list every day.
- Only shows confirmed on an official page (artist, venue, promoter, or Ticketmaster/AXS listing).
- Shows stay until the date passes. Keep `added` from when it first appeared.
- `onSale`: "On sale now", "On sale Fri, Nov 6, 10 AM", "Presale Wed, Nov 4", or "Sold out".
- A newly found show is automatically flagged at the top of the Coming up tab the day it's added (and again in the last 2 days before the show).

## Schema (`issues/YYYY-MM-DD.json`)
```json
{
  "date": "2026-10-29",
  "weekendNote": "Halloween weekend",
  "events": [
    {
      "id": "2026-10-31-blair-project",
      "name": "The BLAIR Project",
      "date": "2026-10-31",
      "endDate": "2026-11-08",
      "time": "6–11:30 PM",
      "startTime": "18:00", "endTime": "23:30",
      "venue": "City Hall Plaza", "area": "Boston",
      "price": "$20–$35", "free": true,
      "note": "Sundays through Nov 15",
      "pick": true,
      "tags": ["djs"],
      "why": "One or two sentences on what it is and why it fits them.",
      "url": "https://...", "linkLabel": "Tickets",
      "added": "2026-10-29"
    }
  ],
  "djShows": [
    { "artist": "John Summit", "date": "2026-10-29", "time": "7 PM", "startTime": "19:00", "venue": "TD Garden",
      "with": "Alok and Jackie Hollander", "onSale": "On sale now", "url": "https://...", "added": "2026-10-29" }
  ],
  "watchlist": ["...copied from watchlist.json..."],
  "ticker": ["..."]
}
```
- `id`: `<date>-<slug>`, stable across days.
- `date`: the event day. For a multi-day run, `date` is the first day it's open **from today on** (use today if it's already running) and `endDate` is the last day. Leave `endDate` out for one-day events. For a weekly recurring thing, list only the next occurrence and put the pattern in `note`.
- `time` is what's shown ("8 PM", "6–11:30 PM"); `startTime`/`endTime` are 24h `HH:MM` for the Add to calendar button. Omit any you don't know. Never guess a time or price.
- `free: true` only if a source says it's free (pay-what-you-can is not free; put that in `price`).
- `tags`: any of `somerville` (it's in Somerville), `house`, `djs`, `film`, `comedy`, `music`, `food`, `market`, `outdoors`. "Last chance" and "New" are added by the app.
- `why`: required for picks, optional for the rest. Plain and factual, from the source. No hype words.
- `url`: the event's official page or ticket page when you can find it; otherwise the roundup page you read it on. `linkLabel`: "Tickets" if it's a ticket page, else "Info".
- `ticker`: 2–3 items under ~30 characters for the home screen, e.g. `"Free: BLAIR Project, Sat"`, `"John Summit, TD Garden, Thu"`. A newly announced watchlist show always goes first.

## Reactions
The 👍 / 👎 / Going buttons are saved on Andrew's phone only for now, so the run can't see them. When Andrew tells Claude what he liked or skipped, add a short line under "Learned from reactions" in `TASTE.md`.

## Commit
Validate the JSON (`python3 -I -c "import json;json.load(open(...))"`), then commit `Shit To Do YYYY-MM-DD` with the issue, the updated `index.json`, and the deleted old file. Fetch, rebase and push.

## Final message
One line, e.g. "18 events; picks: Coolidge horror marathon, BLAIR Project, Eleventh Year live score; new DJ show: none."
