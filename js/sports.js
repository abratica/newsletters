/* Boston Sports layout: scoreboard green. Renders an issue and the archive as HTML strings. */
(() => {
  const TEAMS = {
    patriots: { color: "#1D4F8C" },
    celtics:  { color: "#007A33" },
    bruins:   { color: "#E0A31A" },
    redsox:   { color: "#BD3039" },
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const teamVar = (key) => `--team:${(TEAMS[key] || {}).color || "var(--muted)"}`;
  const longDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US",
    { weekday: "long", month: "long", day: "numeric" });
  const shortDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US",
    { weekday: "short", month: "short", day: "numeric" });
  const chevron = (size) => `<svg width="${size}" height="${size}" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function masthead(name, sub, ctx) {
    return `<header class="masthead">
      <a class="back" href="${ctx.backHref}" aria-label="${esc(ctx.backLabel)}">‹</a>
      <h1 class="wordmark">${esc(name).replace(/ (\S+)$/, " <span>$1</span>")}</h1>
      <p class="dateline">${esc(sub)}</p>
      ${window.themeButton ? window.themeButton() : ""}
    </header>`;
  }

  // ESPN's public scoreboard feed, used for live scores in Today's games.
  const SPORT_PATH = { nba: "basketball/nba", nhl: "hockey/nhl", nfl: "football/nfl", mlb: "baseball/mlb" };
  const ESPN_ABBR = { patriots: "NE", celtics: "BOS", bruins: "BOS", redsox: "BOS" };

  function board(today, date) {
    const ymd = String(date || "").replace(/-/g, "");
    const rows = (today || []).map((g) => {
      const league = SPORT_PATH[g.league] ? g.league : "";
      const href = league ? `https://www.espn.com/${league}/scoreboard/_/date/${ymd}` : "";
      const attrs = league ? ` href="${href}" target="_blank" rel="noopener" data-league="${league}" data-abbr="${ESPN_ABBR[g.teamKey] || ""}"` : "";
      const tag = league ? "a" : "div";
      return `<${tag} class="board-row"${attrs}>
        <div class="board-team"><span class="chip" style="${teamVar(g.teamKey)}"></span>${esc(g.team)}${
          g.record ? ` <span class="board-rec">${esc(g.record)}</span>` : ""}</div>
        <div class="board-time">${esc(g.time)}</div>
        <div class="board-detail">${esc(g.matchup)}${g.oppRecord ? ` (${esc(g.oppRecord)})` : ""}</div>
        <div class="board-venue">${esc(g.venue || "")}</div>
        ${g.tv ? `<div class="board-tv"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5" width="19" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 21h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>${esc(g.tv)}</div>` : ""}
      </${tag}>`;
    }).join("");
    return `<section class="board" aria-label="Today's games">
      <h2>Today's games</h2>
      ${rows || `<div class="board-empty">No Boston games today.</div>`}
    </section>`;
  }

  /* ── Highlight videos (official YouTube uploads) ──
     Shows a thumbnail; the YouTube player only loads when tapped. */
  const ytId = (id) => String(id || "").replace(/[^A-Za-z0-9_-]/g, "");
  function player(v) {
    const id = ytId(v.id);
    return `<button class="yt" type="button" data-yt="${id}" aria-label="Play: ${esc(v.title)}">
      <img src="https://i.ytimg.com/vi/${id}/hqdefault.jpg" alt="" loading="lazy">
      <span class="yt-play" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor"/></svg></span>
    </button>`;
  }
  function videos(list) {
    const vids = (list || []).filter((v) => ytId(v.id));
    if (!vids.length) return "";
    const [main, ...more] = vids;
    return `<div class="vids">
      <div class="yt-slot">${player(main)}</div>
      <p class="yt-cap"><span class="yt-title">${esc(main.title)}</span> <span class="yt-ch">${esc(main.channel || "")}</span></p>
      ${more.length ? `<ul class="yt-more">${more.map((v) => `<li><button type="button" class="yt-swap" data-yt="${ytId(v.id)}" data-title="${esc(v.title)}" data-ch="${esc(v.channel || "")}">
          <img src="https://i.ytimg.com/vi/${ytId(v.id)}/mqdefault.jpg" alt="" loading="lazy">
          <span><span class="yt-title">${esc(v.title)}</span><span class="yt-ch">${esc(v.channel || "")}</span></span>
        </button></li>`).join("")}</ul>` : ""}
    </div>`;
  }
  function embed(id) {
    return `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0" title="Highlights" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
  }
  document.addEventListener("click", (e) => {
    const play = e.target.closest(".yt[data-yt]");
    if (play) { play.outerHTML = embed(ytId(play.dataset.yt)); return; }
    const swap = e.target.closest(".yt-swap");
    if (swap) {
      const box = swap.closest(".vids");
      box.querySelector(".yt-slot").innerHTML = embed(ytId(swap.dataset.yt));
      box.querySelector(".yt-cap").innerHTML = `<span class="yt-title">${esc(swap.dataset.title)}</span> <span class="yt-ch">${esc(swap.dataset.ch)}</span>`;
    }
  });
  // Collapsing a game card stops its video.
  document.addEventListener("toggle", (e) => {
    const d = e.target;
    if (!(d instanceof HTMLDetailsElement) || d.open || !d.classList.contains("game")) return;
    d.querySelectorAll(".yt-slot iframe").forEach((f) => {
      const id = (f.src.match(/embed\/([A-Za-z0-9_-]+)/) || [])[1];
      if (id) f.outerHTML = player({ id, title: "Highlights" });
    });
  }, true);

  function game(g) {
    const perf = (g.performers || []).map((p) => `
      <li><span class="p-name">${esc(p.name)}</span>
        <span class="p-line">${esc(p.line)}</span>
        ${p.note ? `<span class="p-note">${esc(p.note)}</span>` : ""}</li>`).join("");
    const recap = (Array.isArray(g.recap) ? g.recap : [g.recap]).filter(Boolean)
      .map((para) => `<p>${esc(para)}</p>`).join("");
    const sep = g.home === false ? "at" : "vs";
    return `<details class="game" style="${teamVar(g.teamKey)}">
      <summary>
        <h3 class="headline">${esc(g.headline)}</h3>
        <div class="scoreline">
          <span>${esc(g.boston.abbr)} <span class="num">${esc(g.boston.score)}</span></span>
          <span class="sep">${sep}</span>
          <span>${esc(g.opp.abbr)} <span class="num">${esc(g.opp.score)}</span></span>
          <span class="result ${esc(g.result)}">${esc(g.result)}</span>
          <span class="record">${esc(g.record)}</span>
        </div>
        <span class="toggle">${chevron(16)}</span>
      </summary>
      <div class="game-body">
        ${recap}
        ${perf ? `<h4 class="sub">Who showed up</h4><ul class="performers">${perf}</ul>` : ""}
        ${g.opponentNote ? `<h4 class="sub">For ${esc(g.opp.name || g.opp.abbr)}</h4><p style="margin-top:0">${esc(g.opponentNote)}</p>` : ""}
        ${g.takeaway ? `<p class="takeaway"><strong>What it means.</strong> ${esc(g.takeaway)}</p>` : ""}
        ${videos(g.videos)}
      </div>
    </details>`;
  }

  function table(t, ranked) {
    const cuts = new Set(t.cutAfter || []);
    return `<table class="${ranked ? "ranked" : ""}">
      <thead><tr>${t.columns.map((c) => `<th scope="col">${esc(c)}</th>`).join("")}</tr></thead>
      <tbody>${t.rows.map((r, i) => `<tr class="${[r.boston ? "bos" : "", cuts.has(i + 1) ? "cut" : ""].join(" ").trim()}">${
        r.cells.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`;
  }

  function standings(list) {
    return (list || []).map((t) => `
      <div class="standings" style="${teamVar(t.teamKey)}">
        <h3>${esc(t.title)}${t.league ? ` <span>${esc(t.league)}</span>` : ""}</h3>
        ${table(t, false)}
        ${t.full ? `<details class="full">
          <summary>Full ${esc(t.full.title)} ${chevron(14)}</summary>
          ${table(t.full, true)}
          ${t.full.cutNote ? `<p class="cut-note">${esc(t.full.cutNote)}</p>` : ""}
        </details>` : ""}
      </div>`).join("");
  }

  function issue(data, ctx) {
    const results = data.results || [];
    const off = data.off || [];
    const injuries = data.injuries || [];
    return `${masthead(ctx.name, longDate(data.date), ctx)}
      <main class="sports-main">
        ${board(data.today, data.date)}
        ${results.length ? `<h2 class="section-title">Last night</h2>${results.map(game).join("")}` : ""}
        ${off.length ? `<h2 class="section-title">No game</h2><ul class="off">${off.map((o) => `
          <li><span class="chip" style="${teamVar(o.teamKey)}"></span><span><b>${esc(o.team)}</b> ${esc(o.text)}</span></li>`).join("")}</ul>` : ""}
        ${(data.standings || []).length ? `<h2 class="section-title">Standings</h2>${standings(data.standings)}` : ""}
        ${injuries.length ? `<h2 class="section-title">Injury moves</h2><ul class="injuries">${injuries.map((i) => `
          <li><b>${esc(i.team)}</b> ${esc(i.text)}</li>`).join("")}</ul>` : ""}
        <a class="archive-link" href="${ctx.archiveHref}">Past issues ${ctx.unreadOthers
          ? `<span class="badge">${ctx.unreadOthers} unread</span>` : `<span aria-hidden="true">›</span>`}</a>
      </main>`;
  }

  function archive(list, ctx) {
    return `${masthead(ctx.name, "Past issues", ctx)}
      <main class="sports-main"><ul class="issues">${list.map((i) => `
        <li><a href="${ctx.issueHref(i.date)}">
          <span class="issue-date">${esc(shortDate(i.date))}</span>
          ${ctx.isRead(i.date) ? "" : `<span class="dot" aria-label="Unread"></span>`}
          <span class="issue-head">${esc(i.headline || "")}</span>
        </a></li>`).join("")}</ul></main>`;
  }

  /* ── Live scores ─────────────────────────
     While today's issue is open, poll ESPN every 30s for each game in Today's games.
     If the feed can't be reached, rows stay as they are and still open ESPN when tapped. */
  let timer = null;
  function stopLive() {
    if (timer) clearInterval(timer);
    timer = null;
    document.removeEventListener("visibilitychange", onVisible);
  }
  let tick = null;
  function onVisible() { if (!document.hidden && tick) tick(); }

  function showGame(row, ev) {
    const comp = ev.competitions && ev.competitions[0];
    if (!comp) return;
    const us = comp.competitors.find((c) => c.team && c.team.abbreviation === row.dataset.abbr);
    const them = comp.competitors.find((c) => c !== us);
    if (!us || !them) return;
    const link = (ev.links || []).find((l) => (l.rel || []).includes("summary")) || (ev.links || [])[0];
    if (link && link.href) row.href = link.href;
    const state = ev.status && ev.status.type && ev.status.type.state;
    const detail = (ev.status && ev.status.type && ev.status.type.shortDetail) || "";
    if (state === "pre") return;
    const timeEl = row.querySelector(".board-time");
    const venueEl = row.querySelector(".board-venue");
    timeEl.innerHTML = `<span class="live-score">${esc(us.score)}<span class="dash">–</span>${esc(them.score)}</span>`;
    row.classList.toggle("is-live", state === "in");
    row.classList.toggle("is-final", state === "post");
    venueEl.innerHTML = state === "in"
      ? `<span class="live-dot" aria-hidden="true"></span>${esc(detail)}`
      : `${us.winner ? "W" : them.winner ? "L" : ""} ${esc(detail)}`.trim();
  }

  function mount(root, data) {
    stopLive();
    const rows = [...root.querySelectorAll(".board-row[data-league]")];
    const todayET = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
    if (!rows.length || data.date !== todayET) return;
    const ymd = data.date.replace(/-/g, "");
    tick = async () => {
      if (document.hidden) return;
      let allDone = true;
      for (const league of [...new Set(rows.map((r) => r.dataset.league))]) {
        try {
          const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${SPORT_PATH[league]}/scoreboard?dates=${ymd}`, { cache: "no-store" });
          const json = await res.json();
          rows.filter((r) => r.dataset.league === league).forEach((r) => {
            const ev = (json.events || []).find((e) => e.competitions && e.competitions[0] &&
              e.competitions[0].competitors.some((c) => c.team && c.team.abbreviation === r.dataset.abbr));
            if (!ev) { allDone = false; return; }
            showGame(r, ev);
            if (!(ev.status && ev.status.type && ev.status.type.state === "post")) allDone = false;
          });
        } catch { allDone = false; }
      }
      if (allDone) stopLive();
    };
    tick();
    timer = setInterval(tick, 30000);
    document.addEventListener("visibilitychange", onVisible);
  }
  window.addEventListener("hashchange", stopLive);

  window.Layouts = window.Layouts || {};
  window.Layouts.sports = { issue, archive, mount, themeColor: "#141414" };
})();
