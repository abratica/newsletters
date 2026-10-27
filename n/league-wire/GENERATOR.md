# League Wire: daily issue generator

Instructions for the scheduled run that writes each morning's League Wire issue: the news, scores, standouts, moves and (on Tuesdays) consensus power rankings across the NFL, NBA, NHL and MLB.
All paths are relative to `n/league-wire/` in the `abratica/newsletters` repo. The app only displays these JSON files. Do not change the app, other newsletters, or `newsletters.json` during a daily run.

## What to produce

1. `issues/YYYY-MM-DD.json`: today's issue, date = **today in America/New_York**.
2. Update `index.json`: put `{ "date", "headline", "ticker" }` at the **top** of `issues` (newest first), copied from the issue. If today's date is already there, replace it.
3. Validate both files (`python3 -m json.tool <file>`), commit `League Wire YYYY-MM-DD`, push to `main`.

Publish every day.

## Accuracy rules

- Every fact comes from the sports data tool (`fetch_sports_data`: `scores`, `standings`, `game_stats`) or a page you actually read. Never invent stats, quotes, records, rankings, or descriptors ("career high", "rookie") you haven't seen in a source.
- Every story links to the article you read (`url`) and names the outlet (`source`). Prefer ESPN, NFL.com, NBA.com, NHL.com, MLB.com, AP, The Athletic, CBS Sports, Yahoo Sports.
- "Last night" = games that started yesterday ET and are final (include late West Coast games).
- If you can't verify something, leave it out. An empty section is fine; the app hides it.

## Voice

Neutral, plain, a little edge. Short sentences. No hype words. Summaries are 2–3 sentences: what happened, then why it matters.

## Issue shape

See the newest file in `issues/` for a full example.

```json
{
  "date": "2026-10-27",
  "headline": "The #1 top story's headline",
  "ticker": ["Cowboys 38, Eagles 21", "Warriors 134, Nuggets 114"],
  "powerRankingsDay": true,
  "top": [ { "league": "nfl", "headline": "...", "summary": "...", "source": "ESPN", "url": "https://..." } ],
  "leagues": [
    {
      "id": "nfl", "name": "NFL", "status": "in-season",
      "summary": "One line shown on the collapsed card: the biggest thing in this league today",
      "stories":   [ { "headline": "...", "summary": "...", "source": "...", "url": "..." } ],
      "scoresLabel": "Week 8",
      "scores":    [ { "away": "Cowboys", "awayScore": 38, "home": "Eagles", "homeScore": 21, "note": "" } ],
      "standouts": [ { "name": "Player", "team": "Cowboys", "line": "24-31 · 312 YDS · 3 TD", "note": "one sentence" } ],
      "moves":     [ { "text": "Team placed Player (knee) on IR", "url": "https://..." } ],
      "powerRankings": { "sources": ["ESPN", "NFL.com", "CBS Sports", "FOX Sports"],
                         "teams": [ { "team": "Bills", "rank": 1, "prev": 1, "avg": 1.5 } ] }
    }
  ]
}
```

### top (Top of the wire)
The 3 biggest stories across all four leagues, ranked. These should also appear in their league's `stories`.

### leagues
Always in this order: `nfl`, `nba`, `nhl`, `mlb`. Team names are nicknames only ("Celtics", "Red Sox").

- **stories:** 3–5 per in-season league, from the last ~24–36 hours: results that matter, injuries, trades, firings, extensions, standings storylines. Boston teams only when it's genuinely league-wide news (Boston Sports covers them otherwise).
- **scores:** every game from last night, including Boston's. `note` is `""` or one of `"OT"`, `"SO"`, `"Close"` (NBA ≤ 5 pts, NFL ≤ 8 pts, NHL/MLB 1 goal/run), `"Upset"` (the betting underdog won, per a published line you read; never a judgment call). One note per game, in priority order OT/SO, Upset, Close. Order doesn't matter; the app puts Boston first.
  - **NFL:** on Mondays and Tuesdays show the whole week so far (Thu/international/Sun/Mon) with `scoresLabel: "Week N"`. Other days, only last night's game(s); no `scoresLabel`. Omit `scores` when there were none.
- **standouts:** 2–3 best individual performances from last night (NFL: from the week, Mon/Tue only), stat lines verified from box scores. NFL: QB `CMP-ATT · YDS · TD · INT`, rusher `CAR-YDS-TD`, receiver `REC-YDS-TD`. NBA: `PTS · REB · AST` (+ FG if notable). NHL: `G · A` or goalie `SV · SV%`. MLB: pitcher `IP · H · ER · K`, hitter `H-AB · HR · RBI`.
- **moves:** trades, signings, releases, waivers, IR, firings/hires from the last ~48 hours. Each with a source `url`. Empty array if none.
- **status:** `"in-season"` or `"offseason"`. An offseason league has only `moves` (and `stories` if there's real news), and `summary` like `"Offseason · moves only"`. During the postseason it's in-season: cover the games.

### Power rankings (Tuesdays only)
Set `"powerRankingsDay": true` on Tuesdays and include `powerRankings` for every in-season league. Other days, omit both.

Consensus method: take the most recent weekly edition (published in the last ~7 days) from 3–4 major outlets per league, average each team's rank, sort ascending (tie-break: best single rank). Record the outlets in `sources`.
- **NFL:** ESPN, NFL.com, CBS Sports, FOX Sports (Pro Football Network's consensus page lists all of them: https://www.profootballnetwork.com/power-rankings-nfl/). Use the editions published after the latest week's games.
- **NBA:** NBA.com (John Schuhmann, Mondays) plus 2–3 of ESPN, Yahoo Sports, The Athletic, CBS Sports, NBC Sports.
- **NHL:** NHL.com Super 16 (Thursdays, top 16 only: treat unranked teams as missing from that source) plus 2–3 full 1–32 lists (ESPN, Yahoo Sports, The Hockey News, Daily Faceoff, Sportsnet).
- **MLB:** in season only, from MLB.com, ESPN, The Athletic, CBS Sports.
- `prev`: last Tuesday's `rank` for that team, read from the previous Tuesday's issue in `issues/`. `null` if there isn't one.
- Include every team in the league.

### ticker
3–5 very short items (< 30 chars each) for the home-screen ticker: biggest final scores and headline moves, e.g. `"Cowboys 38, Eagles 21"`, `"Bills trade for WR X"`. No Boston-only items (Boston Sports supplies those).

### headline
The #1 `top` story's headline.

## Final message of the run
One line summarizing the issue. No notification is sent.
