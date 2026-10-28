# Boston Sports: daily issue generator

These are the instructions for the scheduled run that writes each morning's Boston Sports issue.
All paths below are relative to `n/boston-sports/` in the `abratica/newsletters` repo.
The app (`index.html`, `js/`, `css/`) only displays what is in these JSON files. Do not change the app, other newsletters, or `newsletters.json` during a daily run.

## What to produce

1. `issues/YYYY-MM-DD.json`: today's issue, where the date is **today in America/New_York**.
2. Update `index.json`: put `{ "date", "headline", "ticker" }` at the **top** of `issues` (newest first), copying `headline` and `ticker` from the issue. If today's date is already there, replace that entry instead of adding a second one.
3. Validate both files (`python3 -m json.tool <file>`), then commit `Boston Sports YYYY-MM-DD` and push to `main`.

## Ticker

`ticker` is 2–5 very short items that scroll across the top of the app's home screen, mixed with other newsletters' items. Plain text, no labels, under ~30 characters each:
- Each final from last night: `"Celtics 134, Bulls 99"` (Boston's score first, winner wording not needed).
- Each game today: `"Celtics vs Nets 7:30"`, `"Bruins at Hurricanes 8:00"` (ET, no "PM").
- At most one big injury or roster note if there is one: `"<Player> out (ankle)"`.
If there's nothing, use an empty array.

Publish an issue every day, even when no Boston team played or plays. On those days the issue is just the Today's games strip (or "No Boston games today"), the No game lines, and standings.

## Teams

| teamKey  | Team     | League | Home venue      | Standings table  |
|----------|----------|--------|-----------------|------------------|
| patriots | Patriots | NFL    | Gillette Stadium | AFC East         |
| celtics  | Celtics  | NBA    | TD Garden       | Atlantic Division |
| bruins   | Bruins   | NHL    | TD Garden       | Atlantic Division |
| redsox   | Red Sox  | MLB    | Fenway Park     | AL East          |

## Data: where facts come from

- Use the sports data tool first (`fetch_sports_data`): `scores` with the team filter for each league, `game_stats` with the game id for every Boston game that finished yesterday, and `standings` for each in-season league.
- If that tool isn't available or is missing something, use web search against official or major sources (NFL.com, NBA.com, NHL.com, MLB.com, ESPN, AP) and fetch the box score page.
- **Only state facts that come from the data or a source you actually read.** No descriptors you haven't verified ("rookie", "career high", "first time since…") unless a source says so. If unsure, leave it out.
- Whenever a recap mentions a lead or a turning point, give the actual score at that point. The data has scores at each period/quarter break, so anchor to those. If you don't have the exact score for a moment (like the peak of a lead), don't mention that moment.

## Sections

### today (Today's games)
Every Boston game scheduled today (ET), sorted by start time.
- `league`: `"nfl"`, `"nba"`, `"nhl"`, or `"mlb"`. Required: the app uses it to show the live score during the game.
- `record`: the Boston team's current record, same format as `oppRecord`. Shown next to the team name.
- `matchup`: `"vs Nets"` at home, `"at Hurricanes"` on the road (opponent nickname).
- `oppRecord`: opponent's current record (NBA/NFL `W–L`, NHL `W–L–OT`, MLB `W–L`).
- `time`: ET, like `"7:30 PM"`.
- `tv`: where to watch, from an official or schedule source you read for this game (team/league schedule, NBC Sports Boston or NESN listings, the league's national TV schedule, or a broadcast-listing schedule like FanDuel Research's team schedule page). List the Boston-area option(s) a viewer in Boston would use, joined with ` · `: e.g. `"NBC Sports Boston · Peacock"` (Celtics local; Peacock streams NBCSB), `"NESN"` (Bruins/Red Sox local), `"ESPN"`, `"TNT"`, `"Prime Video"`, `"CBS"`. If a national broadcast is exclusive (local channel not listed), show only the national one. Omit the field if you can't confirm it. Never guess.
- `venue`: home venue name for home games; for road games, the arena/stadium name only if a source confirms it, otherwise the city.
- No extra notes (no back-to-backs, no TV unless asked later).

### results (Last night)
Every Boston game that **started yesterday (ET)** and is final, including late West Coast games. Order by **how newsworthy the result is**, biggest first (blowouts, comebacks, rivals, milestones, playoff stakes), not by sport.

Each result:
- `headline`: short, punchy, factual. e.g. "Pritchard's seven threes bury Chicago".
- `home`: true/false. `boston` / `opp`: `abbr` (3 letters), `score`; `opp.name` is the opponent's city or nickname used in "For ___".
- `result`: `"W"`, `"L"`, `"OTL"` (NHL overtime/shootout loss), or `"T"`.
- `record`: Boston's record after the game.
- `recap`: one paragraph (array of strings, usually one). How the game turned, with scores at the breaks, and the one or two stats that explain it. Neutral beat-writer voice with a little edge. No fan cheerleading.
- `performers` ("Who showed up"): 3 players on quiet nights, up to 5 on big ones. Each has `name`, `line` (stats joined with ` · `), and `note` (one sentence on why it mattered, can include a bad side, e.g. turnovers).
- `opponentNote`: one or two sentences on the opponent's top threats.
- `takeaway` ("What it means"): one sentence. Streak, standings move, concern, injury to watch.
- `videos` (optional): official YouTube highlight videos for this game, shown after "What it means" in the expanded card. `[{ "id": "<YouTube video id>", "title": "short title", "channel": "NBA" }]`. Use **one video: the full-game highlights only**. No talk shows, analysis, reaction, podcast or postgame segments.
  - **Official channels only:** the league (NBA, NHL, NFL, MLB), the team (Boston Celtics, NHL Bruins, New England Patriots, Red Sox), or the rights-holding broadcaster (NBC Sports Boston, NESN). Never fan, reaction, or independent-media channels (e.g. CLNS), even if they look official.
  - Main video: the league's full-game highlights (e.g. NBA titles look like `"BULLS at CELTICS | FULL GAME HIGHLIGHTS | October 26, 2026"`; NHL uses `"Bruins at Hurricanes | Highlights | ..."`). Search for it, e.g. web search `"<AWAY> at <HOME>" "FULL GAME HIGHLIGHTS" "<Month D, YYYY>"`, or check a daily-links roundup page.
  - **Verify every video** before using it by fetching `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json`: the `author_name` must be one of the official channels above and the `title` must match this game and date. If oEmbed fails (deleted, private, or embedding disabled), don't use the video.
  - Write `title` in plain sentence case (not the channel's ALL-CAPS), e.g. `"Bulls at Celtics: full game highlights"`.
  - If no verified official video is up yet, omit `videos`. Never guess an id.
- `report` ("In-depth game report", collapsed in the card): a line score plus a short write-up per quarter/period.
  ```json
  "report": {
    "periods": ["1","2","3","4"],          // NHL: ["1","2","3"] (+ "OT", "SO"); NFL: ["1","2","3","4"] (+ "OT"); MLB: innings "1"–"9" (+ extras)
    "boston": [33,33,39,29], "opp": [21,33,21,24],   // points/goals/runs per period, from the data tool's scoring_by_period or the official box score
    "sections": [ { "label": "1st quarter", "score": "BOS 33, CHI 21", "text": "2–4 sentences" } ],
    "sources": [ { "name": "AP", "url": "https://..." } ]
  }
  ```
  - One section per quarter (NBA/NFL) or period (NHL, plus OT/shootout). MLB: group into 3–4 sections around the innings that mattered (e.g. "Innings 1–3", "6th inning").
  - `score` is the score at the end of that period (`"Final: ..."` for the last one).
  - Each section covers what actually swung it: runs with their numbers, who drove them, key plays, foul trouble/injuries, momentum shifts. Every score you mention must be an actual score at that moment.
  - Facts must come from the line score plus recaps you read: AP, ESPN, NBA.com/NHL.com/NFL.com/MLB.com, Boston Globe, NBC Sports Boston. If two sources disagree, use the one whose numbers add up against the line score, or leave the detail out. Don't attach a play to a quarter unless a source places it there.
  - A blowout's last quarter can be one short line.

Stat lines by sport:
- **NBA**: PTS, REB, AST, plus FG / 3PT makes-attempts, STL, BLK, TO when relevant; plus-minus in the note.
- **NFL**: QB line (CMP-ATT, YDS, TD, INT), top rusher (CAR-YDS-TD), top receiver (REC-YDS-TD), key defensive play (sacks, INT, forced fumble) in the note.
- **NHL**: goals and assists (G, A), shots; the goalie's saves and save % (e.g. "31 SV · .939 SV%").
- **MLB**: starting pitcher (IP, H, ER, BB, K), key hitters (H-AB, HR, RBI).

### off (No game)
**In-season** Boston teams with **no result last night and no game today**, each with their next game: `"Next: Sun, Nov 1 at Dolphins, 4:25 PM"`.
Teams in their offseason are left out of the issue entirely (no line, no standings table).

### standings
One table per **in-season** Boston team. Teams that played last night first, then the rest.
- NBA: columns `["Team", "W–L", "GB"]`, the Atlantic Division.
- NHL: columns `["Team", "W–L–OT", "PTS"]`, the Atlantic Division, sorted by points. If the data only has W and L, derive OT from the win percentage (games played = round(W / win_pct); OT = GP − W − L) and double-check Boston's own line against the box scores or a search.
- NFL: columns `["Team", "W–L", "GB"]` (use `W–L–T` if any ties), the AFC East.
- MLB: columns `["Team", "W–L", "GB"]`, the AL East.
- Set `"boston": true` on the Boston row. Use en dashes in records (`9–2–1`). GB "—" for the leader.
- Every table also gets a `full` object: the whole conference, shown when the reader taps "Full …". Columns get a leading `"#"` rank column. Rank by the source's conference rank/seeding (use it as the tiebreaker for equal records).
  - NBA: `"Eastern Conference"`, `["#","Team","W–L","GB"]` (GB from the conference leader), `"cutAfter": [6, 10]`, `"cutNote": "Top 6 make the playoffs, 7–10 the play-in"`.
  - NHL: `"Eastern Conference"`, `["#","Team","W–L–OT","PTS"]`, sorted by points (fewer games played breaks ties). No cut lines.
  - NFL: `"AFC"`, `["#","Team","W–L"]` in seeding order, `"cutAfter": [7]`, `"cutNote": "Top 7 make the playoffs (division leaders seeded 1–4)"`.
  - MLB: `"American League"`, `["#","Team","W–L","GB"]`, `"cutAfter": [6]`, `"cutNote": "Top 6 make the playoffs"`.
- See `issues/2026-10-27.json` for the exact shape.

### injuries (Injury moves)
Only **changes in the last ~24 hours**: who went down, who's back, who's questionable for today. One line each: `{ "team": "Celtics", "text": "<Player> (ankle) is questionable vs Nets" }`. Source must be a news report from the last day. If nothing changed, use an empty array; the section hides itself.

## Shape

`issues/2026-10-27.json` is the reference example. Keys: `date`, `headline` (the top story's headline; on quiet days a one-line summary), `ticker`, `today`, `results`, `off`, `standings`, `injuries`.

## Final message of the run

End the run with one line summarizing the issue, e.g. "Celtics beat the Bulls 134–99; Celtics and Bruins play tonight." No notification is sent; the issue is simply waiting in the app.
