// Buffer theme behaviour. Loaded with `defer`; the theme is chosen earlier by an inline head script.

const root = document.documentElement;

// ---------- theme toggle + browser toolbar colour ----------
const darkQuery = matchMedia("(prefers-color-scheme: dark)");
const effectiveTheme = () => root.dataset.theme || (darkQuery.matches ? "dark" : "light");

function syncTheme() {
  const dark = effectiveTheme() === "dark";
  for (const meta of document.querySelectorAll('meta[name="theme-color"]')) meta.content = dark ? "#2a2827" : "#f2e5bc";
  for (const b of document.querySelectorAll(".theme-toggle")) {
    const label = dark ? "Switch to light theme" : "Switch to dark theme";
    b.setAttribute("aria-label", label);
    b.title = label;
  }
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".theme-toggle")) return;
  const next = effectiveTheme() === "dark" ? "light" : "dark";
  root.dataset.theme = next;
  try { localStorage.setItem("pref-theme", next); } catch {}
  syncTheme();
});
darkQuery.addEventListener("change", () => {
  let stored = null;
  try { stored = localStorage.getItem("pref-theme"); } catch {}
  if (!stored) root.dataset.theme = darkQuery.matches ? "dark" : "light";
  syncTheme();
});
syncTheme();

// ---------- contribution graph: open on the latest weeks ----------
for (const el of document.querySelectorAll(".cal-scroll")) el.scrollLeft = el.scrollWidth;

// ---------- copy buttons on code blocks ----------
document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".copy");
  if (!btn) return;
  const code = btn.closest(".code")?.querySelector("pre code");
  if (!code) return;
  const label = btn.querySelector("span");
  try {
    await navigator.clipboard.writeText(code.textContent.replace(/\n$/, ""));
    label.textContent = "Copied";
  } catch {
    label.textContent = "Copy failed";
  }
  setTimeout(() => { label.textContent = "Copy"; }, 1600);
});

// ---------- sortable tables ----------
for (const table of document.querySelectorAll("[data-sort-table]")) {
  const body = table.tBodies[0];
  for (const btn of table.querySelectorAll("th button[data-key]")) {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      const th = btn.parentElement;
      const current = th.getAttribute("aria-sort");
      const asc = current === "descending" ? true : current === "ascending" ? false : key === "name" || key === "lang";
      for (const h of table.querySelectorAll("th")) h.removeAttribute("aria-sort");
      th.setAttribute("aria-sort", asc ? "ascending" : "descending");
      const rows = [...body.rows].sort((x, y) => {
        const a = x.dataset[key], b = y.dataset[key];
        const r = key === "stars" ? a - b : a.localeCompare(b, undefined, { sensitivity: "base" });
        return asc ? r : -r;
      });
      for (const r of rows) body.append(r);
    });
  }
}

// ---------- search with suggestions ----------
const box = document.querySelector("[data-search]");
if (box) initSearch(box);

function initSearch(box) {
  const input = box.querySelector("input");
  const panel = box.querySelector(".search-panel");
  const list = panel.querySelector("[role=listbox]");
  const msg = panel.querySelector(".search-msg");
  const status = box.querySelector("[aria-live]");
  const MAX = 8;
  let items = null, loading = null, hits = [], active = -1;

  box.hidden = false; // the box only works with JavaScript

  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const mark = (text, words) => {
    let out = esc(text);
    for (const w of words) {
      const i = out.toLowerCase().indexOf(esc(w));
      if (i >= 0) { out = out.slice(0, i) + "<mark>" + out.slice(i, i + esc(w).length) + "</mark>" + out.slice(i + esc(w).length); break; }
    }
    return out;
  };

  function load() {
    if (items) return Promise.resolve(items);
    loading ??= fetch(box.dataset.index)
      .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then((data) => (items = data.map((d) => ({ ...d, t: d.title.toLowerCase(), m: `${d.kind} ${d.description} ${d.keywords}`.toLowerCase(), b: (d.body || "").toLowerCase() }))))
      .finally(() => { loading = null; });
    return loading;
  }

  function score(item, words) {
    let total = 0;
    for (const w of words) {
      let s = 0;
      if (item.t.startsWith(w) || item.t.includes(" " + w) || item.t.includes("-" + w)) s = 10;
      else if (item.t.includes(w)) s = 6;
      else if (item.m.includes(w)) s = 3;
      else if (item.b.includes(w)) s = 1;
      if (!s) return 0; // every word must match somewhere, in any order
      total += s;
    }
    return total;
  }

  function open(show) {
    panel.hidden = !show;
    input.setAttribute("aria-expanded", String(show && hits.length > 0));
    if (!show) input.removeAttribute("aria-activedescendant");
  }

  function setActive(i) {
    active = i;
    [...list.children].forEach((li, n) => li.setAttribute("aria-selected", String(n === i)));
    const li = list.children[i];
    if (li) { input.setAttribute("aria-activedescendant", li.id); li.scrollIntoView({ block: "nearest" }); }
    else input.removeAttribute("aria-activedescendant");
  }

  function render(words, query) {
    list.innerHTML = hits.map((h, i) =>
      `<li role="option" id="q-opt-${i}" aria-selected="false"><span class="o-k">${h.kind.toLowerCase()}</span>` +
      `<span class="o-t">${mark(h.title, words)}</span><span class="o-d">${esc(h.description || "")}</span></li>`).join("");
    msg.hidden = hits.length > 0;
    msg.textContent = hits.length ? "" : `Nothing matches “${query}”. Try fewer or shorter words.`;
    status.textContent = hits.length ? `${hits.length} ${hits.length === 1 ? "result" : "results"}` : "No results";
    open(true);
    setActive(hits.length ? 0 : -1);
  }

  function update() {
    const query = input.value.trim();
    if (!query) { hits = []; list.innerHTML = ""; status.textContent = ""; open(false); return; }
    if (!items) { list.innerHTML = ""; msg.hidden = false; msg.textContent = "Loading…"; open(true); }
    load().then(() => {
      if (input.value.trim() !== query) return; // a newer query is running
      const words = query.toLowerCase().split(/\s+/);
      hits = items.map((it) => ({ it, s: score(it, words) })).filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s).slice(0, MAX).map((r) => r.it);
      render(words, query);
    }).catch(() => {
      if (input.value.trim() !== query) return;
      hits = []; list.innerHTML = "";
      msg.hidden = false; msg.textContent = "Search couldn’t load. Keep typing to try again.";
      status.textContent = "Search couldn’t load";
      open(true);
    });
  }

  const go = (i) => { if (hits[i]) location.href = hits[i].url; };

  input.addEventListener("input", update);
  input.addEventListener("focus", () => { load().catch(() => {}); if (input.value.trim()) update(); });
  input.addEventListener("keydown", (e) => {
    const n = hits.length;
    if (e.key === "ArrowDown" && n) { e.preventDefault(); if (panel.hidden) update(); else setActive((active + 1) % n); }
    else if (e.key === "ArrowUp" && n) { e.preventDefault(); setActive((active - 1 + n) % n); }
    else if (e.key === "Enter") { e.preventDefault(); go(active >= 0 ? active : 0); }
    else if (e.key === "Escape") {
      if (!panel.hidden) { e.preventDefault(); open(false); }
      else if (input.value) { input.value = ""; update(); }
      else input.blur();
    }
  });
  list.addEventListener("mousedown", (e) => e.preventDefault()); // keep focus in the input
  list.addEventListener("click", (e) => { const li = e.target.closest("[role=option]"); if (li) go([...list.children].indexOf(li)); });
  list.addEventListener("mousemove", (e) => { const li = e.target.closest("[role=option]"); if (li) { const i = [...list.children].indexOf(li); if (i !== active) setActive(i); } });
  document.addEventListener("click", (e) => { if (!box.contains(e.target)) open(false); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    e.preventDefault();
    input.focus();
  });
}
