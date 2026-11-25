// Header search: suggestions from /index.json as you type. Words match in any order.
const root = document.querySelector(".site-search");
if (root) init(root);

function init(root) {
  const input = root.querySelector("input");
  const panel = root.querySelector(".site-search-panel");
  const list = root.querySelector("[role=listbox]");
  const message = root.querySelector(".site-search-message");
  const status = root.querySelector("#site-search-status");
  const MAX = 8;
  let items = null;     // loaded index
  let loading = null;   // in-flight load
  let results = [];
  let active = -1;

  root.hidden = false;  // the box only works with JavaScript

  function load() {
    if (items) return Promise.resolve(items);
    if (!loading) {
      loading = fetch(root.dataset.index)
        .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then((data) => {
          items = data.map((d) => ({
            ...d,
            t: d.title.toLowerCase(),
            meta: `${d.kind} ${d.description} ${d.keywords}`.toLowerCase(),
            b: d.body.toLowerCase(),
          }));
          return items;
        })
        .finally(() => { loading = null; });
    }
    return loading;
  }

  function score(item, words) {
    let total = 0;
    for (const w of words) {
      let s = 0;
      if (item.t.startsWith(w) || item.t.includes(" " + w) || item.t.includes("-" + w)) s = 10;
      else if (item.t.includes(w)) s = 6;
      else if (item.meta.includes(w)) s = 3;
      else if (item.b.includes(w)) s = 1;
      if (!s) return 0;   // every word must match somewhere
      total += s;
    }
    return total;
  }

  function show(text) {
    message.textContent = text;
    message.hidden = !text;
  }

  function open(isOpen) {
    panel.hidden = !isOpen;
    input.setAttribute("aria-expanded", String(isOpen && results.length > 0));
  }

  function setActive(i) {
    active = i;
    for (const [n, li] of [...list.children].entries()) li.setAttribute("aria-selected", String(n === i));
    if (i >= 0) {
      input.setAttribute("aria-activedescendant", list.children[i].id);
      list.children[i].scrollIntoView({ block: "nearest" });
    } else {
      input.removeAttribute("aria-activedescendant");
    }
  }

  function render(query) {
    list.replaceChildren();
    setActive(-1);
    for (const [i, r] of results.entries()) {
      const li = document.createElement("li");
      li.id = `site-search-option-${i}`;
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", "false");
      const head = document.createElement("span");
      head.className = "site-search-title";
      head.textContent = r.title;
      const kind = document.createElement("span");
      kind.className = "site-search-kind";
      kind.textContent = r.kind;
      head.append(kind);
      li.append(head);
      if (r.description) {
        const d = document.createElement("span");
        d.className = "site-search-desc";
        d.textContent = r.description;
        li.append(d);
      }
      li.addEventListener("mousedown", (e) => e.preventDefault()); // keep focus in the input
      li.addEventListener("click", () => go(i));
      li.addEventListener("mousemove", () => { if (active !== i) setActive(i); });
      list.append(li);
    }
    if (!results.length) {
      show(`Nothing matches “${query}”. Try fewer or shorter words.`);
      status.textContent = "No results";
    } else {
      show("");
      status.textContent = `${results.length} ${results.length === 1 ? "result" : "results"}`;
    }
    open(true);
  }

  function update() {
    const query = input.value.trim();
    if (!query) { results = []; list.replaceChildren(); show(""); status.textContent = ""; open(false); return; }
    if (!items) { list.replaceChildren(); show("Loading…"); open(true); }
    load().then(() => {
      if (input.value.trim() !== query) return;   // stale
      const words = query.toLowerCase().split(/\s+/);
      results = items
        .map((item) => ({ item, s: score(item, words) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, MAX)
        .map((r) => r.item);
      render(query);
    }).catch(() => {
      if (input.value.trim() !== query) return;
      results = []; list.replaceChildren();
      show("Search couldn’t load. Keep typing to try again.");
      status.textContent = "Search couldn’t load";
      open(true);
    });
  }

  function go(i) {
    const r = results[i];
    if (r) window.location.href = r.url;
  }

  input.addEventListener("input", update);
  input.addEventListener("focus", () => { load().catch(() => {}); if (input.value.trim()) update(); });
  input.addEventListener("blur", () => open(false));
  input.addEventListener("keydown", (e) => {
    const n = results.length;
    if (e.key === "ArrowDown" && n) { e.preventDefault(); if (panel.hidden) update(); setActive((active + 1) % n); }
    else if (e.key === "ArrowUp" && n) { e.preventDefault(); setActive((active - 1 + n) % n); }
    else if (e.key === "Enter") { e.preventDefault(); go(active >= 0 ? active : 0); }
    else if (e.key === "Escape") {
      if (!panel.hidden) { e.preventDefault(); open(false); }
      else if (input.value) { input.value = ""; update(); }
      else input.blur();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
    const t = e.target;
    if (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
    e.preventDefault();
    input.focus();
  });
}
