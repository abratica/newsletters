/* Shit To Do layout: one living page (no archive). Events drop off once they've happened,
   and sections ("This weekend", "Still this week", "Plan ahead") are worked out on the phone
   from today's date, so the page stays right even between updates. */
(() => {
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TZ = "America/New_York";
  const DAY = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  // Dates are plain "YYYY-MM-DD" strings in Boston time; compare them as strings.
  const todayET = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
  const parse = (iso) => { const [y, m, d] = iso.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
  const fmt = (dt) => dt.toISOString().slice(0, 10);
  const add = (iso, n) => { const d = parse(iso); d.setUTCDate(d.getUTCDate() + n); return fmt(d); };
  const dow = (iso) => parse(iso).getUTCDay();
  const nice = (iso) => parse(iso).toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" });
  const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);

  function weekend(today) {
    const d = dow(today);
    const fri = d === 5 ? today : d === 6 ? add(today, -1) : d === 0 ? add(today, -2) : add(today, 5 - d);
    return { fri, sun: add(fri, 2) };
  }

  /* Reactions and "Going", kept on this phone. */
  const RK = "std-react", GK = "std-going";
  const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || "null") || d; } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* not saved */ } };

  function calHref(ev) {
    const p = new URLSearchParams({ action: "TEMPLATE", text: ev.name, ctz: TZ });
    const place = [ev.venue, ev.area].filter(Boolean).join(", ");
    if (place) p.set("location", place);
    if (ev.url) p.set("details", ev.url);
    const day = (iso) => iso.replace(/-/g, "");
    if (ev.startTime && !ev.endDate) {
      const [h, m] = ev.startTime.split(":").map(Number);
      let endDay = ev.date, eh, em;
      if (ev.endTime) { [eh, em] = ev.endTime.split(":").map(Number); if (eh * 60 + em <= h * 60 + m) endDay = add(ev.date, 1); }
      else { eh = h + 2; em = m; if (eh >= 24) { eh -= 24; endDay = add(ev.date, 1); } }
      const t = (H, M) => `T${String(H).padStart(2, "0")}${String(M).padStart(2, "0")}00`;
      p.set("dates", `${day(ev.date)}${t(h, m)}/${day(endDay)}${t(eh, em)}`);
    } else {
      p.set("dates", `${day(ev.date)}/${day(add(ev.endDate || ev.date, 1))}`);
    }
    return `https://calendar.google.com/calendar/render?${p}`;
  }

  function dateBlock(ev, today, cls) {
    if (ev.endDate && ev.date <= today) {
      const e = ev.endDate;
      return `<div class="std-date ${cls}"><div class="d">THRU</div><div class="n small">${MON[parse(e).getUTCMonth()]}<br>${parse(e).getUTCDate()}</div></div>`;
    }
    const iso = ev.date < today ? today : ev.date;
    const late = ev.startTime && Number(ev.startTime.split(":")[0]) >= 17;
    const top = iso === today ? (late ? "TONIGHT" : "TODAY") : iso === add(today, 1) ? "TMRW" : DAY[dow(iso)];
    return `<div class="std-date ${cls}"><div class="d">${top}</div><div class="n">${parse(iso).getUTCDate()}</div></div>`;
  }

  function tags(ev, today, issueDate, isPick) {
    const t = [];
    if (isPick) t.push(`<span class="std-tag t-pick">Top pick</span>`);
    if (ev.added === issueDate) t.push(`<span class="std-tag t-new">New</span>`);
    if (ev.free) t.push(`<span class="std-tag t-free">Free</span>`);
    if (ev.endDate && daysBetween(today, ev.endDate) <= 3) t.push(`<span class="std-tag t-last">Last chance</span>`);
    for (const k of ev.tags || []) {
      const lbl = { fav: "★ On your list", somerville: "Somerville", house: "House", djs: "DJs", comedy: "Comedy", film: "Film", food: "Food", market: "Market", outdoors: "Outdoors", music: "Live music" }[k];
      if (lbl) t.push(`<span class="std-tag t-${k === "fav" ? "pick" : k === "somerville" ? "som" : k === "house" || k === "djs" ? "house" : "plain"}">${lbl}</span>`);
    }
    return t.length ? `<div class="std-tags">${t.join("")}</div>` : "";
  }

  const COLORS = ["pink", "lime", "sky", "sun"];
  function card(ev, today, issueDate, opts) {
    const react = load(RK, {})[ev.id];
    const going = load(GK, []).includes(ev.id);
    const meta = [[ev.venue, ev.area].filter(Boolean).join(", "), ev.time, ev.free ? "" : ev.price, ev.note].filter(Boolean).join(" · ");
    return `<article class="std-ev${opts.pick ? " pick" : ""}" data-id="${esc(ev.id)}">
      ${dateBlock(ev, today, opts.pick ? COLORS[opts.i % COLORS.length] : "")}
      <div class="std-body">
        ${tags(ev, today, issueDate, opts.pick)}
        <div class="std-name">${esc(ev.name)}</div>
        ${meta ? `<div class="std-meta">${esc(meta)}</div>` : ""}
        ${ev.why ? `<div class="std-why${opts.pick ? "" : " short"}">${esc(ev.why)}</div>` : ""}
        <div class="std-acts">
          <button class="std-btn${react === "up" ? " on" : ""}" data-act="up" aria-label="More like this">👍</button>
          <button class="std-btn${react === "down" ? " on" : ""}" data-act="down" aria-label="Not for us">👎</button>
          <button class="std-btn${going ? " going" : ""}" data-act="going">${going ? "✓ Going" : "Going"}</button>
          <a class="std-btn" href="${esc(calHref(ev))}" target="_blank" rel="noopener">+ Calendar</a>
          ${ev.url ? `<a class="std-btn link" href="${esc(ev.url)}" target="_blank" rel="noopener">${esc(ev.linkLabel || "Info")} ›</a>` : ""}
        </div>
      </div>
    </article>`;
  }

  function sections(events, today) {
    const { fri, sun } = weekend(today);
    const out = { weekend: [], week: [], ahead: [] };
    for (const ev of events) {
      const end = ev.endDate || ev.date;
      if (end < today) continue;                       // already happened
      const eff = ev.date < today ? today : ev.date;
      let s;
      if (ev.endDate && end >= fri && end <= sun) s = "weekend";       // run that ends this weekend
      else if (ev.endDate && end > sun && eff <= sun) s = "ahead";      // ongoing, go anytime
      else if (eff < fri) s = "week";
      else if (eff <= sun) s = "weekend";
      else s = "ahead";
      out[s].push(ev);
    }
    const key = (e) => `${e.date < today ? today : e.date}${e.startTime || "99"}`;
    for (const k in out) out[k].sort((a, b) => key(a).localeCompare(key(b)));
    return { ...out, fri, sun };
  }

  function djWhen(iso, today) {
    if (iso === today) return "Tonight";
    if (iso === add(today, 1)) return "Tomorrow";
    return nice(iso);
  }

  function mast(data, ctx, djCount, favCount) {
    return `<header class="std-mast">
      <a class="std-back" href="${ctx.backHref}" aria-label="${esc(ctx.backLabel)}">‹ Newsletters</a>
      ${window.themeButton ? window.themeButton() : ""}
      <div class="std-sticker">FOR A + R</div>
      <h1 class="std-word"><span class="s">Shit</span><br>To Do<span class="dot" aria-hidden="true"></span></h1>
      <p class="std-sub">Somerville &amp; greater Boston — updated ${esc(nice(data.date))}</p>
      <nav class="std-tabs" role="tablist">
        <button class="std-tab on" data-tab="up" role="tab" aria-selected="true">Coming up</button>
        <button class="std-tab" data-tab="com" role="tab" aria-selected="false">Comedy${favCount ? `<span class="n">${favCount}</span>` : ""}</button>
        <button class="std-tab" data-tab="dj" role="tab" aria-selected="false">DJs${djCount ? `<span class="n">${djCount}</span>` : ""}</button>
      </nav>
    </header>`;
  }

  function issue(data, ctx) {
    const today = todayET();
    const evs = data.events || [];
    const S = sections(evs, today);
    const shows = (data.djShows || []).filter((s) => s.date >= today).sort((a, b) => a.date.localeCompare(b.date));
    const favs = new Set((data.comedianWatchlist || []).map((n) => n.toLowerCase()));
    const slug = (t) => String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const comedy = (data.comedyShows || []).filter((c) => c.date >= today).sort((a, b) => (a.date + (a.startTime || "99")).localeCompare(b.date + (b.startTime || "99")))
      .map((c) => ({ ...c, id: c.id || `com-${c.date}-${slug(c.comedian)}`, name: c.comedian, linkLabel: "Tickets",
        note: [c.note, c.onSale].filter(Boolean).join(" · "), fav: favs.has(c.comedian.toLowerCase()),
        tags: favs.has(c.comedian.toLowerCase()) ? ["fav"] : [] }));
    const going = load(GK, []);
    const plans = [...evs, ...comedy].filter((e) => going.includes(e.id) && (e.endDate || e.date) >= today)
      .sort((a, b) => (a.date < today ? today : a.date).localeCompare(b.date < today ? today : b.date));

    const alerts = shows.filter((s) => s.added === data.date || daysBetween(today, s.date) <= 2).map((s) => `
      <button class="std-alert" data-tab="dj">
        <span class="ic" aria-hidden="true">🎧</span>
        <span><b>${esc(s.artist)} · ${esc(djWhen(s.date, today).toLowerCase())}</b><span>${esc([s.venue, s.with ? `with ${s.with}` : ""].filter(Boolean).join(", "))}</span></span>
        <span class="go" aria-hidden="true">›</span>
      </button>`).join("") + comedy.filter((c) => c.fav && (c.added === data.date || daysBetween(today, c.date) <= 2)).map((c) => `
      <button class="std-alert" data-tab="com">
        <span class="ic" aria-hidden="true">🎤</span>
        <span><b>${esc(c.comedian)} · ${esc(djWhen(c.date, today).toLowerCase())}</b><span>${esc([c.venue, c.area].filter(Boolean).join(", "))}</span></span>
        <span class="go" aria-hidden="true">›</span>
      </button>`).join("");

    const picks = S.weekend.filter((e) => e.pick).slice(0, 3);
    const rest = S.weekend.filter((e) => !picks.includes(e));
    const list = (arr) => arr.map((e) => card(e, today, data.date, {})).join("");

    const up = `
      ${alerts}
      ${plans.length ? `<h3 class="std-h3">Your plans</h3>${list(plans)}` : ""}
      <h2 class="std-h2"><span class="hl">This weekend</span></h2>
      <div class="std-range">${esc(nice(S.fri))} – ${esc(nice(S.sun))}${data.weekendNote && weekend(data.date).fri === S.fri ? ` · ${esc(data.weekendNote)}` : ""}</div>
      ${picks.map((e, i) => card(e, today, data.date, { pick: true, i })).join("")}
      ${rest.length ? `<h3 class="std-h3">${picks.length ? "More this weekend" : ""}</h3>${list(rest)}` : ""}
      ${!S.weekend.length ? `<p class="std-empty">Nothing picked for the weekend yet. Check back tomorrow.</p>` : ""}
      ${S.week.length ? `<h3 class="std-h3">Still this week</h3>${list(S.week)}` : ""}
      ${S.ahead.length ? `<h3 class="std-h3">Plan ahead</h3>${list(S.ahead)}` : ""}
      <p class="std-foot">Updated every morning · past events drop off on their own</p>`;

    const months = [];
    for (const c of [...comedy.filter((c) => c.fav), ...comedy.filter((c) => !c.fav)]) {
      const label = c.fav ? "On your list" : parse(c.date).toLocaleDateString("en-US", { timeZone: "UTC", month: "long", year: parse(c.date).getUTCFullYear() === parse(today).getUTCFullYear() ? undefined : "numeric" });
      let m = months.find((x) => x.label === label); if (!m) months.push(m = { label, items: [] });
      m.items.push(c);
    }
    const com = `
      <h2 class="std-h2">Comedy around town</h2>
      <div class="std-range">Touring comedians in greater Boston. Shows stay here until they've happened.</div>
      ${months.map((m) => `<h3 class="std-h3">${esc(m.label)}</h3>${list(m.items)}`).join("")}
      ${!comedy.length ? `<p class="std-empty">No comedy shows listed right now.</p>` : ""}
      <div class="std-watch">
        <h3 class="std-h3" style="margin:0">${(data.comedianWatchlist || []).length ? `Watching ${(data.comedianWatchlist || []).length} comedians` : "Your comedians"}</h3>
        ${(data.comedianWatchlist || []).length ? `<div class="chips">${data.comedianWatchlist.map((n) => `<span class="std-chip${comedy.some((c) => c.fav && c.comedian.toLowerCase() === n.toLowerCase()) ? " hit" : ""}">${esc(n)}</span>`).join("")}</div>` : ""}
        <p class="std-note">Tell Claude which comedians you love. Their shows go to the top of this tab, with no date limit, and get flagged on Coming up when they're announced.</p>
      </div>`;

    const hits = new Set(shows.map((s) => s.artist));
    const dj = `
      <h2 class="std-h2">Coming to town</h2>
      <div class="std-range">From your watchlist. Each show stays here until it's happened.</div>
      ${shows.map((s) => `<article class="std-dj">
        <span class="when">${esc(djWhen(s.date, today).toUpperCase())}${s.date === today || s.date === add(today, 1) ? ` · ${esc(nice(s.date).toUpperCase())}` : ""}</span>
        <div class="who">${esc(s.artist)}</div>
        <div class="std-meta">${esc([s.venue, s.time, s.with ? `with ${s.with}` : ""].filter(Boolean).join(" · "))}</div>
        <div class="row">${s.onSale ? `<b>Tickets</b><span>${esc(s.onSale)}</span>` : ""}${s.added ? `<b>Added</b><span>${esc(nice(s.added))}</span>` : ""}</div>
        <div class="std-acts">
          <a class="std-btn" href="${esc(calHref({ name: s.artist, date: s.date, startTime: s.startTime, venue: s.venue, url: s.url }))}" target="_blank" rel="noopener">+ Calendar</a>
          ${s.url ? `<a class="std-btn link" href="${esc(s.url)}" target="_blank" rel="noopener">Tickets ›</a>` : ""}
        </div>
      </article>`).join("")}
      ${!shows.length ? `<p class="std-empty">No Boston dates from your list right now.</p>` : ""}
      <div class="std-watch">
        <h3 class="std-h3" style="margin:0">Watching ${(data.watchlist || []).length} DJs</h3>
        <div class="chips">${(data.watchlist || []).map((n) => `<span class="std-chip${hits.has(n) ? " hit" : ""}">${esc(n)}</span>`).join("")}</div>
        <p class="std-note">When one of them announces a Boston show, it shows up here and gets flagged at the top of Coming up that morning. To add or drop a DJ, just tell Claude.</p>
      </div>`;

    return `${mast(data, ctx, shows.length, comedy.filter((c) => c.fav).length)}
      <main class="std-main">
        <section class="std-panel on" id="std-up" role="tabpanel">${up}</section>
        <section class="std-panel" id="std-com" role="tabpanel">${com}</section>
        <section class="std-panel" id="std-dj" role="tabpanel">${dj}</section>
      </main>`;
  }

  function mount(root) {
    const show = (t) => {
      root.querySelectorAll(".std-tab").forEach((b) => { const on = b.dataset.tab === t; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
      root.querySelectorAll(".std-panel").forEach((p) => p.classList.toggle("on", p.id === `std-${t}`));
      try { sessionStorage.setItem("std-tab", t); } catch { /* fine */ }
    };
    let saved = "up"; try { saved = sessionStorage.getItem("std-tab") || "up"; } catch { /* fine */ }
    show(saved);
    // The app reuses the same root element, so swap out any handler from a previous visit.
    if (root._stdClick) root.removeEventListener("click", root._stdClick);
    root._stdClick = (e) => {
      const tab = e.target.closest("[data-tab]");
      if (tab) { show(tab.dataset.tab); window.scrollTo(0, 0); return; }
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const id = btn.closest(".std-ev").dataset.id;
      const act = btn.dataset.act;
      // Every card for this event (it can appear under "Your plans" too).
      const cards = root.querySelectorAll(`.std-ev[data-id="${CSS.escape(id)}"]`);
      if (act === "going") {
        const g = load(GK, []); const i = g.indexOf(id);
        if (i >= 0) g.splice(i, 1); else g.push(id);
        save(GK, g);
        cards.forEach((c) => { const b = c.querySelector('[data-act="going"]'); const on = g.includes(id); b.classList.toggle("going", on); b.textContent = on ? "✓ Going" : "Going"; });
      } else {
        const r = load(RK, {}); r[id] = r[id] === act ? undefined : act; save(RK, r);
        cards.forEach((c) => c.querySelectorAll('[data-act="up"],[data-act="down"]').forEach((b) => b.classList.toggle("on", r[id] === b.dataset.act)));
      }
    };
    root.addEventListener("click", root._stdClick);
  }

  function archive(list, ctx) {
    return `<main class="std-main"><p class="std-empty">Shit To Do is one page that updates every morning, so there are no past issues. <a href="#/n/shit-to-do">Back to it ›</a></p></main>`;
  }

  window.Layouts = window.Layouts || {};
  window.Layouts.todo = { issue, archive, mount, themeColor: "#1A1430" };
})();
