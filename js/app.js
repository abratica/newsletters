(() => {
  const app = document.getElementById("app");
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const HOME_THEME = "#0E1A2E";
  let registry = null;           // newsletters.json
  const indexes = {};            // id -> issues list (newest first)

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const longDate = (d) => d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  async function getJSON(path) {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(`${path} returned ${res.status}`);
    return res.json();
  }

  /* Read state, per newsletter, kept on this phone only. */
  const readKey = (id) => `nl-read:${id}`;
  function readSet(id) {
    try { return new Set(JSON.parse(localStorage.getItem(readKey(id)) || "[]")); }
    catch { return new Set(); }
  }
  function markRead(id, date) {
    try { const s = readSet(id); s.add(date); localStorage.setItem(readKey(id), JSON.stringify([...s])); }
    catch { /* storage unavailable: unread markers won't persist */ }
  }

  async function loadRegistry() {
    if (!registry) registry = (await getJSON("newsletters.json")).newsletters || [];
    return registry;
  }
  async function loadIndex(id, fresh) {
    if (!indexes[id] || fresh) {
      try { indexes[id] = (await getJSON(`n/${id}/index.json`)).issues || []; }
      catch { indexes[id] = []; }
    }
    return indexes[id];
  }

  function setView(view, theme) {
    document.body.className = `view-${view}`;
    themeMeta.setAttribute("content", theme);
    window.scrollTo(0, 0);
  }

  /* ── Home ─────────────────────────────── */
  async function renderHome() {
    const list = await loadRegistry();
    const idx = await Promise.all(list.map((n) => loadIndex(n.id, true)));
    const tickerItems = idx.flatMap((issues) => (issues[0] && issues[0].ticker) || []);
    const unread = list.filter((n, i) => idx[i][0] && !readSet(n.id).has(idx[i][0].date));
    const count = unread.length === 0 ? "All caught up"
      : unread.length === 1 ? "One fresh issue waiting" : `${unread.length} fresh issues waiting`;

    const rows = list.map((n, i) => {
      const isNew = idx[i][0] && !readSet(n.id).has(idx[i][0].date);
      return `<li><a class="nl-row" href="#/n/${esc(n.id)}">
        <span class="nl-num">${String(i + 1).padStart(2, "0")}</span>
        <span><span class="nl-name">${esc(n.name)}</span><span class="nl-cadence" style="display:block">${esc(n.cadence || "")}</span></span>
        ${isNew ? `<span class="nl-new">New</span>` : "<span></span>"}
      </a></li>`;
    }).join("");
    const placeholder = list.length === 1 ? `<li><div class="nl-row placeholder" aria-hidden="true">
        <span class="nl-num">02</span><span class="nl-name">Next one goes here</span><span></span></div></li>` : "";

    setView("home", HOME_THEME);
    app.innerHTML = `<div class="home">
      ${tickerItems.length ? ticker(tickerItems) : ""}
      <header class="home-head">
        <p class="home-date">${esc(longDate(new Date()))}</p>
        <h1 class="home-title">Newsletters</h1>
        <p class="home-count">${count}</p>
      </header>
      <ul class="nl-list">${rows}${placeholder}</ul>
    </div>`;
    wireTicker();
  }

  function ticker(items) {
    const run = items.map((t) => `<span>${esc(t)}</span>`).join("");
    // Two copies of the run so the crawl loops seamlessly.
    return `<div class="ticker" role="marquee" aria-label="Today: ${esc(items.join(", "))}">
      <span class="ticker-label">Today</span>
      <div class="ticker-window"><div class="ticker-track">${run}${run}</div></div>
    </div>`;
  }
  function wireTicker() {
    const el = app.querySelector(".ticker");
    if (!el) return;
    const track = el.querySelector(".ticker-track");
    // Keep a steady reading speed (~45px/s) whatever the length.
    const half = track.scrollWidth / 2;
    track.style.setProperty("--crawl", `${Math.max(12, half / 45)}s`);
    const pause = () => el.classList.add("paused");
    const resume = () => el.classList.remove("paused");
    el.addEventListener("pointerdown", pause);
    el.addEventListener("pointerup", resume);
    el.addEventListener("pointerleave", resume);
    el.addEventListener("pointercancel", resume);
  }

  /* ── A newsletter ─────────────────────── */
  async function renderNewsletter(id, part) {
    const list = await loadRegistry();
    const nl = list.find((n) => n.id === id);
    if (!nl) { location.hash = ""; return; }
    const layout = window.Layouts[nl.layout];
    const issues = await loadIndex(id, !part);
    if (!issues.length) {
      setView(nl.layout, HOME_THEME);
      app.innerHTML = `<p class="status">No issues yet. The first one arrives tomorrow morning.</p>`;
      return;
    }
    const read = readSet(id);
    const ctx = {
      name: nl.name,
      backHref: "#/",
      backLabel: "Back to newsletters",
      archiveHref: `#/n/${id}/archive`,
      issueHref: (date) => `#/n/${id}/${date}`,
      isRead: (date) => read.has(date),
    };

    if (part === "archive") {
      setView(nl.layout, layout.themeColor);
      ctx.backHref = `#/n/${id}`;
      ctx.backLabel = "Back to today's issue";
      app.innerHTML = layout.archive(issues, ctx);
      return;
    }

    const date = part || issues[0].date;
    const data = await getJSON(`n/${id}/issues/${date}.json`);
    if (date !== issues[0].date) { ctx.backHref = `#/n/${id}/archive`; ctx.backLabel = "Back to past issues"; }
    ctx.unreadOthers = issues.filter((i) => i.date !== date && !read.has(i.date)).length;
    setView(nl.layout, layout.themeColor);
    app.innerHTML = layout.issue(data, ctx);
    if (layout.mount) layout.mount(app, data, ctx);
    markRead(id, date);
  }

  async function route() {
    try {
      const m = location.hash.match(/^#\/n\/([a-z0-9-]+)(?:\/(archive|\d{4}-\d{2}-\d{2}))?$/);
      if (m) await renderNewsletter(m[1], m[2]);
      else await renderHome();
    } catch (err) {
      console.error(err);
      app.innerHTML = `<p class="status">Couldn't load this. Check your connection and reopen the app.</p>`;
    }
  }

  window.addEventListener("hashchange", route);
  route();

  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
