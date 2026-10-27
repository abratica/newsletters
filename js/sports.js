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
      <h1 class="wordmark">${esc(name)}</h1>
      <p class="dateline">${esc(sub)}</p>
    </header>`;
  }

  function board(today) {
    const rows = (today || []).map((g) => `
      <div class="board-row">
        <div class="board-team"><span class="chip" style="${teamVar(g.teamKey)}"></span>${esc(g.team)}</div>
        <div class="board-time">${esc(g.time)}</div>
        <div class="board-detail">${esc(g.matchup)}${g.oppRecord ? ` (${esc(g.oppRecord)})` : ""}</div>
        <div class="board-venue">${esc(g.venue || "")}</div>
      </div>`).join("");
    return `<section class="board" aria-label="Today's games">
      <h2>Today's games</h2>
      ${rows || `<div class="board-empty">No Boston games today.</div>`}
    </section>`;
  }

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
        ${board(data.today)}
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

  window.Layouts = window.Layouts || {};
  window.Layouts.sports = { issue, archive, themeColor: "#1E3A2D" };
})();
