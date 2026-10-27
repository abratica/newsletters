/* League Wire layout: newsprint + red. Renders an issue and the archive as HTML strings. */
(() => {
  const BOSTON = { nfl: ["Patriots"], nba: ["Celtics"], nhl: ["Bruins"], mlb: ["Red Sox"] };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const longDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US",
    { weekday: "long", month: "long", day: "numeric" });
  const shortDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US",
    { weekday: "short", month: "short", day: "numeric" });
  const chev = (s) => `<svg class="wire-chev" width="${s}" height="${s}" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const isBoston = (lg, team) => (BOSTON[lg] || []).includes(team);

  function mast(sub, ctx, flag) {
    return `<header class="wire-mast">
      <a class="wire-back" href="${ctx.backHref}" aria-label="${esc(ctx.backLabel)}">‹</a>
      <h1 class="wire-word">League <span>Wire</span></h1>
      <p class="wire-date">${esc(sub)}</p>
      ${window.themeButton ? window.themeButton() : ""}
      ${flag ? `<span class="wire-flag">${esc(flag)}</span>` : ""}
    </header>`;
  }

  const src = (it) => it.url
    ? `<a class="wire-src" href="${esc(it.url)}" target="_blank" rel="noopener">Read at ${esc(it.source || "source")} ›</a>` : "";

  function sub(title, count, body, open) {
    return `<details class="wire-sub"${open ? " open" : ""}>
      <summary><span>${esc(title)}${count ? `<span class="wire-ct">${esc(count)}</span>` : ""}</span>${chev(14)}</summary>
      <div class="wire-subin">${body}</div>
    </details>`;
  }

  function stories(list) {
    return list.map((s) => `<div class="wire-item"><div class="h">${esc(s.headline)}</div>
      ${s.summary ? `<div class="s">${esc(s.summary)}</div>` : ""}${src(s)}</div>`).join("");
  }

  function scores(lg, list) {
    const rows = list.map((g) => {
      const awayWon = g.awayScore > g.homeScore;
      const w = awayWon ? { t: g.away, s: g.awayScore, at: true } : { t: g.home, s: g.homeScore, at: false };
      const l = awayWon ? { t: g.home, s: g.homeScore } : { t: g.away, s: g.awayScore };
      const bos = isBoston(lg, g.away) || isBoston(lg, g.home);
      return { bos, html: `<tr class="${bos ? "bos" : ""}">
        <td class="w">${esc(w.t)}${g.note ? `<span class="wire-flagtxt">${esc(g.note.toUpperCase())}</span>` : ""}</td>
        <td class="sc w">${esc(w.s)}</td>
        <td class="l loser">${awayWon ? `<span class="wire-at">at</span> ` : ""}${esc(l.t)}</td>
        <td class="sc l">${esc(l.s)}</td></tr>` };
    });
    rows.sort((a, b) => Number(b.bos) - Number(a.bos));
    return `<table class="wire-scores">${rows.map((r) => r.html).join("")}</table>`;
  }

  function people(list) {
    return list.map((p) => `<div class="wire-item"><div class="h">${esc(p.name)}${p.team ? ` <span class="wire-ct">${esc(p.team)}</span>` : ""}</div>
      <div class="s" style="font-family:var(--cond);font-weight:600;font-size:15.5px;color:var(--ink)">${esc(p.line)}</div>
      ${p.note ? `<div class="s">${esc(p.note)}</div>` : ""}</div>`).join("");
  }

  function moves(list) {
    return list.map((m) => `<div class="wire-item"><div class="s" style="color:var(--ink);margin:0">${esc(m.text)}</div>
      ${m.url ? `<a class="wire-src" href="${esc(m.url)}" target="_blank" rel="noopener">Source ›</a>` : ""}</div>`).join("");
  }

  function mv(t) {
    if (t.prev == null) return `<td class="mv eq">–</td>`;
    const d = t.prev - t.rank;
    if (d > 0) return `<td class="mv up">▲ ${d}</td>`;
    if (d < 0) return `<td class="mv dn">▼ ${-d}</td>`;
    return `<td class="mv eq">–</td>`;
  }
  function rkRow(lg, t) {
    return `<tr class="${isBoston(lg, t.team) ? "bos" : ""}"><td class="n">${esc(t.rank)}</td><td class="t">${esc(t.team)}</td>${mv(t)}</tr>`;
  }
  function rankings(lg, pr) {
    const teams = pr.teams || [];
    const top = teams.slice(0, 5);
    const extra = teams.filter((t) => t.rank > 5 && isBoston(lg, t.team));
    return `<table class="wire-rk">${top.map((t) => rkRow(lg, t)).join("")}${
      extra.length ? `<tr class="gap"><td colspan="3">···</td></tr>${extra.map((t) => rkRow(lg, t)).join("")}` : ""}</table>
      ${teams.length > 5 ? `<details class="wire-all"><summary>See all ${teams.length}</summary>
        <table class="wire-rk">${teams.map((t) => rkRow(lg, t)).join("")}</table></details>` : ""}
      ${(pr.sources || []).length ? `<p class="wire-rk-note">Average of ${esc(pr.sources.join(", "))}.</p>` : ""}`;
  }

  function league(L) {
    const parts = [];
    if ((L.stories || []).length) parts.push(sub("Top stories", String(L.stories.length), stories(L.stories), true));
    if ((L.scores || []).length) parts.push(sub("All scores", `${L.scoresLabel ? L.scoresLabel + " · " : ""}${L.scores.length} game${L.scores.length === 1 ? "" : "s"}`, scores(L.id, L.scores)));
    if ((L.standouts || []).length) parts.push(sub("Standouts", "", people(L.standouts)));
    if ((L.moves || []).length) parts.push(sub("Moves", String(L.moves.length), moves(L.moves)));
    if (L.powerRankings && (L.powerRankings.teams || []).length) parts.push(sub("Power rankings", "Consensus", rankings(L.id, L.powerRankings)));
    return `<details class="wire-league${L.status === "offseason" ? " off" : ""}">
      <summary><span class="wire-chip">${esc(L.name)}</span>
        <div><div class="wire-lt">${esc(L.name)}</div><div class="wire-ls">${esc(L.summary || "")}</div></div>${chev(16)}</summary>
      <div class="wire-inner">${parts.join("") || `<p class="wire-empty">Nothing new today.</p>`}</div>
    </details>`;
  }

  function issue(data, ctx) {
    const top = data.top || [];
    return `${mast(longDate(data.date), ctx, data.powerRankingsDay ? "POWER RANKINGS TUESDAY" : "")}
      <main class="wire-main">
        ${top.length ? `<h2 class="wire-h2">Top of the wire</h2><ol class="wire-top">${top.map((s, i) => `
          <li class="wire-story"><b class="n">${i + 1}</b><div>
            <span class="wire-tag">${esc((s.league || "").toUpperCase())}</span>
            <div class="h">${esc(s.headline)}</div>
            ${s.summary ? `<div class="s">${esc(s.summary)}</div>` : ""}${src(s)}
          </div></li>`).join("")}</ol>` : ""}
        <h2 class="wire-h2">By league</h2>
        ${(data.leagues || []).map(league).join("")}
        <a class="wire-archive-link" href="${ctx.archiveHref}">Past issues ${ctx.unreadOthers
          ? `<span class="wire-badge">${ctx.unreadOthers} unread</span>` : `<span aria-hidden="true">›</span>`}</a>
      </main>`;
  }

  function archive(list, ctx) {
    return `${mast("Past issues", ctx)}
      <main class="wire-main"><ul class="wire-issues">${list.map((i) => `
        <li><a href="${ctx.issueHref(i.date)}">
          <span class="d">${esc(shortDate(i.date))}</span>
          ${ctx.isRead(i.date) ? "" : `<span class="dot" aria-label="Unread"></span>`}
          <span class="hh">${esc(i.headline || "")}</span>
        </a></li>`).join("")}</ul></main>`;
  }

  window.Layouts = window.Layouts || {};
  window.Layouts.wire = { issue, archive, themeColor: "#141414" };
})();
