// The Living Map · main application.
// The seam (binding): the machine renders, records, remembers, computes deltas,
// serves evidence. It never interprets, never suggests a keystone, never scores
// beyond what the scoring table on the spec names, and never hides a field.

import * as S from "./state.js";
import { MapView, lineDef, ghostMap, lightFor } from "./map.js";
import { NODES, VIEWBOX, pairKey } from "./geometry.js";
import { RULES, ROOM_LAW, DOMAINS, LINES, FOLLOWUP_FORM, GAS_LABELS, METHOD_EVIDENCE, REFUSALS, PRIVACY_LINE, CLIENT_READY, DRAFT_LINE, LENS_EXIT_LABEL, PAPER_ONLY_LABEL } from "../content/content.js";
import { PRACTICES, KEYSTONE_PROTOCOLS } from "../content/arsenal.js";
import { EVIDENCE } from "../content/evidence.js";
import * as Cabinet from "./cabinet.js";

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };

let map = null;
let currentTab = "walk";
let currentDomain = 0;      // index into walk order
let walkOrder = DOMAINS.map(d => d.code);
let connectMode = false;
let openLineKey = null;     // line card currently expanded in the lines tab
let room = null;            // circle transport, when format === "circle"

// ---------------------------------------------------------------- screens

function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  $(id).classList.add("active");
}

// ---------------------------------------------------------------- home

function initHome() {
  $("#home-law").textContent = "“" + ROOM_LAW + "”";
  $("#home-ghostmap").prepend(ghostMap());
  if (!CLIENT_READY) {
    const d = el("p", "draftnote", DRAFT_LINE);
    $(".home-left").append(d);
  }
  $("#btn-start").addEventListener("click", () => {
    const label = $("#client-label").value.trim();
    if (!label) { $("#client-label").focus(); return; }
    S.start(label, $("#format-pick").value);
    currentTab = "walk"; currentDomain = 0; room = null;
    enterDay();
  });
  renderRoster();
  $("#btn-open-file").addEventListener("click", () => $("#file-input").click());
  $("#file-input").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try { S.load(JSON.parse(await f.text())); enterDay(); }
    catch (err) { toast("Could not read that file: " + err.message); }
    e.target.value = "";
  });
  $("#btn-rerate-home").addEventListener("click", async () => {
    // day-90: open a file, go straight to the sequenced re-rate
    const input = el("input"); input.type = "file"; input.accept = ".json,.fortifymap";
    input.addEventListener("change", async () => {
      const f = input.files[0]; if (!f) return;
      try { S.load(JSON.parse(await f.text())); startRerate("full"); }
      catch (err) { toast("Could not read that file: " + err.message); }
    });
    input.click();
  });
  $("#btn-print-blank").addEventListener("click", () => { renderSheet(null, { blank: true }); window.print(); });
}

let cabinetOpenUI = false;
function renderCabinetBlock() {
  const box = $("#cabinet-box"); if (!box) return;
  box.textContent = "";
  const st = Cabinet.getStatus();
  const row0 = el("div", "home-row");
  row0.append(el("p", "mono cabinet-line", "cabinet · " + st.detail));
  if (st.state !== "on") {
    const manage = el("button", "btn quiet", cabinetOpenUI ? "Close" : "Set up");
    manage.addEventListener("click", () => { cabinetOpenUI = !cabinetOpenUI; renderCabinetBlock(); });
    row0.append(manage);
  }
  box.append(row0);
  if (st.state === "on") return;
  if (!cabinetOpenUI) return;
  if (st.state === "locked") {
    const pw = el("input"); pw.type = "password"; pw.placeholder = "Practice passphrase"; pw.autocomplete = "current-password";
    const go = el("button", "btn secondary", "Unlock the cabinet");
    go.addEventListener("click", async () => {
      try { await Cabinet.unlock(pw.value); await cabinetPull(); renderCabinetBlock(); renderRoster(); }
      catch (e) { toast(e.message); }
    });
    const row = el("div", "home-row"); row.append(pw, go); box.append(row);
    return;
  }
  // not set up on this device
  const pw = el("input"); pw.type = "password"; pw.placeholder = "Practice passphrase"; pw.autocomplete = "new-password";
  const tk = el("input"); tk.type = "password"; tk.placeholder = "Device token";
  const start = el("button", "btn secondary", "Start the cabinet");
  start.addEventListener("click", async () => {
    if (!pw.value || !tk.value) { toast("Both the passphrase and the device token are needed."); return; }
    try { await Cabinet.setup(pw.value, tk.value); await cabinetPush(); renderCabinetBlock(); }
    catch (e) { toast("The cabinet rail is not reachable yet: " + e.message); }
  });
  const join = el("button", "btn quiet", "Join from another device");
  join.addEventListener("click", async () => {
    if (!pw.value || !tk.value) { toast("Both the passphrase and the device token are needed."); return; }
    try { await Cabinet.join(pw.value, tk.value); await cabinetPull(); renderCabinetBlock(); renderRoster(); }
    catch (e) { toast(e.message); }
  });
  const row = el("div", "home-row"); row.append(pw, tk); box.append(row);
  const row2 = el("div", "home-row"); row2.style.marginTop = "0.5rem"; row2.append(start, join); box.append(row2);
  box.append(el("p", "mono", "encrypted on this device before anything leaves. the passphrase is yours alone; losing it makes the cabinet unreadable, and your exported files remain the fallback."));
}

async function cabinetPull() {
  const idx = await S.sessionIndex();
  const pulled = await Cabinet.pullNewer(idx);
  const good = pulled.filter(x => x && !x.__undecryptable);
  const bad = pulled.length - good.length;
  const merged = await S.importSessions(good);
  if (merged) toast(`Cabinet restored ${merged} session${merged === 1 ? "" : "s"} to this device.`);
  if (bad) toast(`${bad} cabinet row(s) could not be opened with this passphrase; they were left untouched.`);
}

// After first setup, file everything the device already holds.
async function cabinetPush() {
  const sessions = await S.listSessions();
  for (const meta of sessions) {
    const full = await S.open(meta.id);
    Cabinet.file(full);
  }
}

async function renderRoster() {
  const box = $("#roster"); if (!box) return;
  box.textContent = "";
  const sessions = await S.listSessions();
  if (!sessions.length) {
    box.append(el("p", "mono", "nothing on this device yet. sessions land here the moment they begin, and stay."));
    return;
  }
  for (const meta of sessions.slice(0, 12)) {
    const row = el("button", "roster-row");
    row.append(el("span", "roster-name", meta.client_label || "·"));
    row.append(el("span", "mono", `${meta.date}${meta.format === "circle" ? " · circle" : ""} · last touched ${meta.updated_at || meta.date}`));
    row.addEventListener("click", async () => {
      try { await S.open(meta.id); currentTab = "walk"; currentDomain = 0; room = null; enterDay(); }
      catch (err) { toast(err.message); }
    });
    box.append(row);
  }
}

// ---------------------------------------------------------------- day

function enterDay() {
  const s = S.get();
  show("#screen-day");
  $("#day-names").textContent = (s.client_label || "·") + "  ·  Jeremy   ·  " + s.date + (s.format === "circle" ? "  ·  circle" : "");
  $("#day-law").textContent = ROOM_LAW.toLowerCase();
  if (!map) {
    map = new MapView($("#map-svg"), {
      onNodeTap: (code) => {
        if (connectMode) return; // handled inside MapView pairing
        const i = walkOrder.indexOf(code);
        if (i < 0) return;
        currentDomain = i;
        if (lens) { renderLensCard(); return; }  // in the client's hands, a node tap moves their card
        setTab("walk");
      },
      onConnect: (key) => {
        const def = lineDef(key);
        S.addLine(key, def.pair);
        setConnect(false);
        $("#day-law").textContent = "line drawn. tap it on the map to change its loudness; its probe is in the lines tab.";
        openLineKey = key;
        setTab("lines");
      },
      onLineTap: (key) => {
        if (lens) return;   // in the client lens, lines are read-only (record protected)
        S.cycleLoudness(key);
      },
      onConnectInvalid: (a, b) => {
        $("#day-law").textContent = NODES[a].name.toLowerCase() + " and " + NODES[b].name.toLowerCase() + " are not one of the map's twenty-two lines. tap two connected domains, or tap the tool to stop.";
      },
    });
    S.onChange(() => { map.render(S.get()); renderTabBadge(); });
    S.onChange((s2) => Cabinet.file(s2));
  }
  if (s.format === "circle" && !room) room = new Room(s);
  map.render(s);
  renderTabs(); setTab(currentTab);
  $("#tool-connect").onclick = () => setConnect(!connectMode);
  $("#tool-lens").onclick = () => setLens(true);
  $("#tool-home").onclick = () => { show("#screen-home"); renderRoster(); };
}

// ---------------------------------------------------------------- the client lens
// "Face the client": the screen turns, and the apparatus leaves. The client sees
// the map, the current domain's anchors, and their bar. Less apparatus, never
// less record: everything recorded still renders here, because it is theirs.
let lens = false;
function setLens(on) {
  lens = on;
  document.body.classList.toggle("lens", on);
  renderLensCard();
}
function renderLensCard() {
  const card = $("#lens-card"); card.textContent = "";
  if (!lens) return;
  const s = S.get();
  const d = DOMAINS.find(x => x.code === walkOrder[currentDomain]);
  const inner = el("div", "lens-inner");
  const h = el("h2");
  const cs = el("span", "code", d.code); cs.setAttribute("aria-hidden", "true");
  h.append(cs, document.createTextNode(d.name)); inner.append(h);
  const dl = el("dl", "anchors");
  for (const k of [2, 5, 8]) { dl.append(el("dt", null, String(k)), el("dd", null, d.anchors[k])); }
  inner.append(dl);
  const bar = el("div", "ratebar");
  bar.setAttribute("role", "radiogroup"); bar.setAttribute("aria-label", d.name + ", 0 to 10");
  const cur = s.ratings[d.code]?.value;
  for (let v = 0; v <= 10; v++) {
    const b = el("button", cur === v ? "sel" : "", String(v));
    b.setAttribute("role", "radio"); b.setAttribute("aria-checked", cur === v ? "true" : "false");
    b.setAttribute("aria-label", d.name + " " + v + " of 10");
    b.addEventListener("click", () => { S.rate(d.code, v); renderLensCard(); });
    bar.append(b);
  }
  inner.append(bar);
  const exit = el("button", "lens-exit", LENS_EXIT_LABEL);
  exit.addEventListener("click", () => setLens(false));
  inner.prepend(exit);
  card.append(inner);
}

function setConnect(on) {
  connectMode = on;
  $("#tool-connect").classList.toggle("on", on);
  $("#tool-connect").textContent = on ? "tap two domains…" : "draw a line";
  $("#day-law").textContent = on ? "tap the first domain, then the second. the line is pulled, never computed."
                                 : ROOM_LAW.toLowerCase();
  if (!on) map.setConnectFrom(null);
  else {
    // the next node tap arms the pairing
    const orig = map.handlers.onNodeTap;
    map.handlers.onNodeTap = (code) => {
      if (!connectMode) { orig(code); return; }
      if (!map.connectFrom) { map.setConnectFrom(code); return; }
      orig(code);
    };
  }
}

// ---------------------------------------------------------------- undo (C2: calm recovery, no modals)
let lastRemoved = null;   // { kind, restore(), label }
let undoTimer = null;
function offerUndo(label, restore) {
  lastRemoved = { label, restore };
  clearTimeout(undoTimer);
  renderUndoChip();
  undoTimer = setTimeout(() => { lastRemoved = null; renderUndoChip(); }, 8000);
}
function renderUndoChip() {
  document.querySelectorAll(".undo-chip").forEach(n => n.remove());
  if (!lastRemoved) return;
  const chip = el("button", "undo-chip", lastRemoved.label + " · undo");
  chip.addEventListener("click", () => {
    lastRemoved.restore(); lastRemoved = null; renderUndoChip(); setTab(currentTab);
  });
  $("#rail-body")?.prepend(chip);
}

// ---------------------------------------------------------------- tabs

const TABS = [
  ["walk", "the walk"], ["lines", "the lines"], ["keystone", "keystone"],
  ["plan", "the plan"], ["close", "the close"], ["about", "about"],
];

function renderTabs() {
  const t = $("#tabs"); t.textContent = "";
  t.setAttribute("role", "tablist");
  const hadFocus = document.activeElement && document.activeElement.classList?.contains("tab");
  for (const [id, label] of TABS) {
    const b = el("button", "tab" + (id === currentTab ? " on" : ""), label);
    b.dataset.tab = id;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-selected", id === currentTab ? "true" : "false");
    b.addEventListener("click", () => setTab(id));
    t.append(b);
    if (hadFocus && id === currentTab) queueMicrotask(() => b.focus());
  }
}
function renderTabBadge() { /* reserved for counts; deliberately quiet */ }

function setTab(id) {
  const switched = id !== currentTab;
  currentTab = id;
  renderTabs();
  const body = $("#rail-body"); body.textContent = "";
  if (switched) { body.classList.remove("enter"); void body.offsetWidth; body.classList.add("enter"); }
  if (id === "walk") renderWalk(body);
  if (id === "lines") renderLines(body);
  if (id === "keystone") renderKeystone(body);
  if (id === "plan") renderPlan(body);
  if (id === "close") renderClose(body);
  if (id === "about") renderAbout(body);
}

// ---------------------------------------------------------------- walk

function renderWalk(body) {
  const s = S.get();
  const nav = el("div", "walk-nav");
  walkOrder.forEach((code, i) => {
    const rated = s.ratings[code]?.value != null;
    const b = el("button", "walk-dot" + (rated ? " rated" : "") + (i === currentDomain ? " current" : ""), code);
    b.addEventListener("click", () => { currentDomain = i; setTab("walk"); });
    nav.append(b);
  });
  body.append(nav);

  const d = DOMAINS.find(x => x.code === walkOrder[currentDomain]);
  const card = el("div", "dcard");
  const h = el("h2");
  const codeSpan = el("span", "code", d.code); codeSpan.setAttribute("aria-hidden", "true");
  h.append(codeSpan, document.createTextNode(d.name)); card.append(h);
  card.append(el("p", "desc", d.desc));
  card.append(el("p", "opening", "“" + d.opening + "”"));

  const dl = el("dl", "anchors");
  for (const k of [2, 5, 8]) { dl.append(el("dt", null, String(k)), el("dd", null, d.anchors[k])); }
  card.append(dl);

  // the client's bar: 0..10
  const bar = el("div", "ratebar");
  bar.setAttribute("role", "radiogroup"); bar.setAttribute("aria-label", d.name + ", 0 to 10");
  const cur = s.ratings[d.code]?.value;
  for (let v = 0; v <= 10; v++) {
    const b = el("button", cur === v ? "sel" : "", String(v));
    b.setAttribute("role", "radio");
    b.setAttribute("aria-checked", cur === v ? "true" : "false");
    b.setAttribute("aria-label", d.name + " " + v + " of 10");
    b.addEventListener("click", () => { S.rate(d.code, v); setTab("walk"); });
    bar.append(b);
  }
  card.append(bar);

  const hist = s.ratings[d.code]?.history || [];
  card.append(el("div", "ghosttrail", hist.map(g => `moved ${g.from} → ${g.to} at ${g.at.slice(11)}`).join("   ·   ")));

  // follow-up form, cited
  const fu = el("p", "followup", "“" + FOLLOWUP_FORM + "”");
  fu.append(cite("sfbt-scaling-questions", "de shazer & berg"));
  card.append(fu);

  // margin words
  const mw = el("div", "margin-words");
  mw.append(el("h3", null, "Their words, in the margin"));
  (s.ratings[d.code]?.words || []).forEach((w) => {
    const row = el("div", "word-item");
    row.append(el("span", null, "“" + w.text + "”"), el("span", "mono", w.at.slice(11)));
    mw.append(row);
  });
  const ta = el("textarea"); ta.placeholder = "Their exact words. The number says how much; the words say what.";
  ta.setAttribute("aria-label", "Their words, for the margin");
  const addRow = el("div", "walk-next");
  const addBtn = el("button", "btn secondary", "Add to the margin");
  addBtn.addEventListener("click", () => { S.addWords(d.code, ta.value); ta.value = ""; setTab("walk"); });
  addRow.append(addBtn);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    const mic = el("button", "btn quiet", "Dictate");
    mic.addEventListener("click", () => {
      const rec = new SR(); rec.lang = "en-US"; rec.interimResults = false;
      rec.onresult = (ev) => { ta.value = (ta.value + " " + ev.results[0][0].transcript).trim(); };
      rec.onerror = () => toast("Dictation is not available right now; typing still works.");
      rec.start();
    });
    addRow.append(mic);
  }
  mw.append(ta, addRow);
  card.append(mw);

  card.append(el("p", "listenline", "listen for · " + d.listen));

  // evidence chips for the domain
  if (d.evidence.length) {
    const evRow = el("div", "cite-row");
    d.evidence.forEach(k => evRow.append(cite(k)));
    card.append(el("h3", null, "The research standing under this domain"), evRow);
  }

  const next = el("div", "walk-next");
  const prev = el("button", "btn quiet", "← previous");
  prev.addEventListener("click", () => { currentDomain = (currentDomain + walkOrder.length - 1) % walkOrder.length; setTab("walk"); });
  const nxt = el("button", "btn", "Next domain →");
  nxt.addEventListener("click", () => { currentDomain = (currentDomain + 1) % walkOrder.length; setTab("walk"); });
  next.append(prev, nxt);
  if (room) next.append(shareBtn(() => room.share("domain", { code: d.code, value: s.ratings[d.code]?.value ?? null })));
  card.append(next);
  body.append(card);
}

function shortSrc(k) {
  const src = EVIDENCE[k].src;
  const name = (src.split(",")[0] || k).replace(/ [A-Z]{1,3}$/, "");
  const year = (src.match(/\b(19|20)\d{2}\b/) || [""])[0];
  return year ? `${name} ${year}` : name;
}

// Provenance is a footnote you can open, never an action the room asks for.
function cite(key, label) {
  const c = el("button", "cite", label || (EVIDENCE[key] ? shortSrc(key) : key));
  c.setAttribute("aria-label", "Where this comes from");
  c.addEventListener("click", () => openEvidence(key));
  return c;
}

// ---------------------------------------------------------------- lines

function renderLines(body) {
  const s = S.get();
  body.append(el("p", "mono", "lines are pulled in the room (draw a line, tap two domains). tap a line on the map to change its loudness."));
  // the non-spatial path: every line the Model publishes, addable from a list
  const addRow = el("div", "plan-add");
  const sel = el("select");
  sel.setAttribute("aria-label", "Draw a line from the list");
  sel.append(new Option("Draw a line from the list…", ""));
  for (const l of LINES) {
    const key = pairKey(l.pair[0], l.pair[1]);
    if (s.lines[key]) continue;
    const names = l.pair.map(c => NODES[c]?.name || c).join(" · ");
    sel.append(new Option(names + (l.name ? "  ·  " + l.name : ""), key));
  }
  sel.addEventListener("change", () => {
    if (!sel.value) return;
    const def = lineDef(sel.value);
    S.addLine(sel.value, def.pair);
    openLineKey = sel.value;
    setTab("lines");
  });
  addRow.append(sel);
  body.append(addRow);
  const drawn = Object.entries(s.lines);
  if (!drawn.length) body.append(el("p", null, "No lines yet. The map shows which connections are loud; those get their probes."));
  for (const [key, l] of drawn) {
    const def = lineDef(key) || { probe: "", tier: 3, evidence: [] };
    const item = el("div", "line-item");
    const head = el("div", "head");
    head.append(el("span", "pair", l.pair.join(" · ")));
    if (def.name) head.append(el("span", "name", def.name));
    head.append(el("span", "mono", "loudness " + l.loudness + (l.keystone ? " · keystone" : "")));
    item.append(head);
    if (def.probe) item.append(el("p", "probe", "“" + def.probe + "”"));
    item.append(el("p", "followup", "then: “" + FOLLOWUP_FORM + "”"));
    const controls = el("div", "line-controls");
    const loud = el("button", "chipbtn", l.loudness >= 3 ? "quieter" : "louder");
    loud.addEventListener("click", () => { S.cycleLoudness(key); setTab("lines"); });
    const keyb = el("button", "chipbtn" + (l.keystone ? " keyed" : ""), l.keystone ? "keystone ✓" : "mark keystone");
    keyb.addEventListener("click", () => { S.toggleKeystoneLine(key); setTab("lines"); });
    const rm = el("button", "chipbtn", "remove");
    rm.addEventListener("click", () => {
      const snapshot = JSON.parse(JSON.stringify(l));
      S.removeLine(key);
      setTab("lines");
      offerUndo("line removed", () => { const nl = S.addLine(key, snapshot.pair); Object.assign(nl, snapshot); });
    });
    controls.append(loud, keyb, rm);
    item.append(controls);
    if ((def.evidence || []).length) {
      const evRow = el("div", "cite-row");
      def.evidence.forEach(k2 => evRow.append(cite(k2)));
      item.append(evRow);
    }
    if (key === openLineKey) item.scrollIntoView({ block: "nearest" });
    body.append(item);
  }
  openLineKey = null;
}

// ---------------------------------------------------------------- keystone

let inkDirty = false;
function renderKeystone(body) {
  const s = S.get();
  body.append(el("h3", null, "The keystone, named. In their words, or not yet."));
  body.append(el("p", "mono", "mark the cascade's lines in the lines tab; they take the rust color. the sentence is the client's: typed or written by hand. there is no draft to offer."));
  const ta = el("textarea", "key-sentence");
  ta.setAttribute("aria-label", "The keystone sentence, in the client's own words");
  ta.value = s.keystone.sentence || "";
  // deliberately no placeholder: the field offers nothing
  let kt = null;
  ta.addEventListener("input", () => { clearTimeout(kt); kt = setTimeout(() => S.setKeystone(ta.value, S.get().keystone.ink), 600); });
  ta.addEventListener("change", () => { clearTimeout(kt); S.setKeystone(ta.value, S.get().keystone.ink); });
  body.append(ta);

  body.append(el("p", "key-note", "or by hand:"));
  const pad = el("canvas"); pad.id = "ink-pad"; pad.width = 900; pad.height = 300;
  pad.setAttribute("aria-label", "Handwriting space for the keystone sentence, pencil or finger");
  body.append(pad);
  const ctx = pad.getContext("2d");
  ctx.lineWidth = 3.2; ctx.lineCap = "round"; ctx.strokeStyle = "#26251F";
  if (s.keystone.ink) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0); img.src = s.keystone.ink; }
  let drawing = false;
  const pos = (e) => { const r = pad.getBoundingClientRect(); return [(e.clientX - r.left) * pad.width / r.width, (e.clientY - r.top) * pad.height / r.height]; };
  pad.addEventListener("pointerdown", (e) => { drawing = true; inkDirty = true; const [x, y] = pos(e); ctx.beginPath(); ctx.moveTo(x, y); });
  pad.addEventListener("pointermove", (e) => { if (!drawing) return; const [x, y] = pos(e); ctx.lineTo(x, y); ctx.stroke(); });
  const up = () => { if (drawing) { drawing = false; S.setKeystone(ta.value, pad.toDataURL("image/png")); } };
  pad.addEventListener("pointerup", up); pad.addEventListener("pointerleave", up);

  const row = el("div", "walk-next");
  const clearB = el("button", "btn quiet", "Clear the ink");
  clearB.addEventListener("click", () => {
    const oldInk = s.keystone.ink;
    ctx.clearRect(0, 0, pad.width, pad.height);
    S.setKeystone(ta.value, null);
    if (oldInk) offerUndo("ink cleared", () => S.setKeystone(ta.value, oldInk));
  });
  row.append(clearB);
  if (room) row.append(shareBtn(() => room.share("keystone", { sentence: S.get().keystone.sentence })));
  body.append(row);
}

// ---------------------------------------------------------------- plan

function renderPlan(body) {
  const s = S.get();

  // The follow-up starting point: what moved, and what leads the agenda.
  const checked = s.plan.filter(p => p.checkins.length);
  if (checked.length) {
    const last = checked.map(p => p.checkins[p.checkins.length - 1].at).sort().pop();
    const behind = s.plan.filter(p => p.checkins.length && p.checkins[p.checkins.length - 1].level < 0);
    const since = el("div", "since-block");
    since.append(el("h3", null, "Since last time"));
    since.append(el("p", "mono", `last check-in ${last}`));
    if (behind.length) {
      since.append(el("p", null, "First agenda, by the plan's own rule (a level below expected leads the session):"));
      behind.forEach(p => since.append(el("p", "since-item", "· " + p.title + "  (level " + p.checkins[p.checkins.length - 1].level + ")")));
    } else {
      since.append(el("p", null, "Every checked-in item sits at expected or better. The session opens wherever he chooses."));
    }
    body.append(since);
  }

  const add = el("div", "plan-add");
  const sel = el("select");
  sel.append(new Option("Add from the Arsenal…", ""));
  const groups = {};
  for (const p of PRACTICES) (groups[p.domain] = groups[p.domain] || []).push(p);
  for (const [dom, list] of Object.entries(groups)) {
    const og = document.createElement("optgroup"); og.label = dom + " · " + (NODES[dom]?.name || dom);
    list.forEach(p => og.append(new Option(p.title + (p.referral ? "  (referral)" : ""), p.id)));
    sel.append(og);
  }
  const ogK = document.createElement("optgroup"); ogK.label = "keystone protocols";
  KEYSTONE_PROTOCOLS.forEach(p => ogK.append(new Option(p.title, "ks:" + p.id)));
  sel.append(ogK);
  sel.addEventListener("change", () => {
    if (!sel.value) return;
    let p, works;
    if (sel.value.startsWith("ks:")) { p = KEYSTONE_PROTOCOLS.find(x => "ks:" + x.id === sel.value); works = p.works; }
    else { p = PRACTICES.find(x => x.id === sel.value); works = [p.domain]; }
    S.addPlanItem({ practice_ref: p.id, title: p.title, referral: !!p.referral, contact: "", dose: "", day: "", works, gas: { "-2": "", "-1": "", "0": "", "1": "", "2": "" }, checkins: [] });
    setTab("plan");
  });
  add.append(sel);
  body.append(add);
  body.append(el("p", "mono", "from the arsenal only. nothing is invented in the room. every item leaves with its five levels, expected first."));

  s.plan.forEach((item, i) => {
    const card = el("div", "plan-item");
    const h = el("h4", null, item.title);
    if (item.referral) h.append(el("span", "refchip", "referral · a name and a number"));
    card.append(h);
    card.append(el("p", "mono", "works on · " + item.works.map(c => (NODES[c]?.name || c).toLowerCase()).join(" · ")));

    const grid = el("div", "plan-grid");
    if (item.referral) {
      grid.append(labeled("who (name and number)", input(item.contact, v => S.updatePlanItem(i, { contact: v }))));
      grid.append(labeled("by when", input(item.day, v => S.updatePlanItem(i, { day: v }))));
    } else {
      grid.append(labeled("dose", input(item.dose, v => S.updatePlanItem(i, { dose: v }))));
      grid.append(labeled("day / cadence", input(item.day, v => S.updatePlanItem(i, { day: v }))));
    }
    card.append(grid);

    // GAS editor: expected first
    const gas = el("div", "gas");
    gas.append(el("label", null, "the five levels, written together · expected first"));
    const expectedFilled = !!item.gas["0"].trim();
    for (const lvl of ["0", "1", "2", "-1", "-2"]) {
      const row = el("div", "gas-row");
      row.append(el("span", "lvl", lvl === "0" ? "0 ·" : (lvl > 0 ? "+" + lvl : lvl)));
      const inp = input(item.gas[lvl], v => { item.gas[lvl] = v; S.updatePlanItem(i, { gas: item.gas }); setTab("plan"); });
      inp.placeholder = GAS_LABELS[lvl];
      if (lvl !== "0" && !expectedFilled) { inp.disabled = true; }
      row.append(inp);
      gas.append(row);
    }
    if (!expectedFilled) gas.append(el("p", "gas-note", "level 0 first: expected means realistic if the plan holds, not aspirational. the other levels unlock when it is written."));
    const gasRow = el("div", "cite-row");
    gasRow.append(cite("gas-idiographic-validated", "why five levels · kiresuk & sherman"));
    gas.append(gasRow);
    card.append(gas);

    // check-ins
    const ci = el("div", "checkin-row");
    ci.setAttribute("role", "radiogroup"); ci.setAttribute("aria-label", "Check-in level for " + item.title);
    ci.append(el("span", "mono", "check-in:"));
    for (const lvl of [-2, -1, 0, 1, 2]) {
      const last = item.checkins[item.checkins.length - 1];
      const sel2 = last && last.level === lvl;
      const b = el("button", sel2 ? "circled" : "", lvl > 0 ? "+" + lvl : String(lvl));
      b.setAttribute("role", "radio"); b.setAttribute("aria-checked", sel2 ? "true" : "false");
      b.setAttribute("aria-label", item.title + " level " + (lvl > 0 ? "+" + lvl : lvl));
      b.addEventListener("click", () => { S.checkin(i, lvl); setTab("plan"); });
      ci.append(b);
    }
    card.append(ci);
    if (item.checkins.length) {
      card.append(el("div", "checkin-log", item.checkins.map(c => `${c.at.slice(0, 10)}: level ${c.level > 0 ? "+" + c.level : c.level}`).join(" · ")));
    }

    const controls = el("div", "line-controls");
    const rm = el("button", "chipbtn", "remove item");
    rm.addEventListener("click", () => {
      const snapshot = JSON.parse(JSON.stringify(item));
      S.removePlanItem(i);
      setTab("plan");
      offerUndo("plan item removed", () => S.addPlanItem(snapshot));
    });
    controls.append(rm);
    if (room) controls.append(shareBtn(() => room.share("plan-item", { title: item.title, dose: item.dose, day: item.day })));
    card.append(controls);
    body.append(card);
  });

  // honest roll-up: the only aggregate the machine computes
  const withCheckins = s.plan.filter(p => p.checkins.length);
  if (withCheckins.length) {
    const atOrAbove = withCheckins.filter(p => p.checkins[p.checkins.length - 1].level >= 0).length;
    body.append(el("p", "mono", `the only roll-up this instrument computes: ${atOrAbove} of ${withCheckins.length} checked-in items at expected or better.`));
  }

  // engagement re-rate
  body.append(el("h3", null, "Between sessions: re-rate what the plan touches"));
  const touched = [...new Set(s.plan.flatMap(p => p.works))];
  const rrRow = el("div", "line-controls");
  const rrBtn = el("button", "btn secondary", touched.length ? "Re-rate " + touched.join(", ") : "Re-rate (add plan items first)");
  rrBtn.disabled = !touched.length;
  rrBtn.addEventListener("click", () => startRerate(touched));
  rrRow.append(rrBtn);
  rrRow.append(cite("progress-feedback-d014-029", "why brief re-rates · de jong 2021"));
  body.append(rrRow);
}

let fieldSeq = 0;
function labeled(text, node) {
  const w = el("div");
  const lab = el("label", null, text);
  const id = "f" + (++fieldSeq);
  node.id = id; lab.setAttribute("for", id);
  w.append(lab, node); return w;
}
function input(val, onChange) {
  const i = el("input"); i.value = val || "";
  let t = null;
  i.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => onChange(i.value), 500); });
  i.addEventListener("change", () => { clearTimeout(t); onChange(i.value); });
  return i;
}

// ---------------------------------------------------------------- close / export

function renderClose(body) {
  const s = S.get();
  body.append(el("h3", null, "The export ceremony"));
  body.append(el("p", "privacy", PRIVACY_LINE));

  // the actions lead; every completion is confirmed with the exact artifact
  const status = el("div", "export-status");
  const actions = el("div", "export-actions");
  const confirm = (msg) => { status.textContent = ""; status.append(el("p", "mono done-line", msg)); };
  const printB = el("button", "btn", "Print the Sheet");
  printB.addEventListener("click", () => { S.recordExport("print"); renderSheet(S.get(), {}); window.print(); confirm("the sheet went to print · " + S.nowStamp().slice(11)); });
  const dl = el("button", "btn secondary", "Download the map file");
  dl.addEventListener("click", () => {
    S.recordExport("download");
    const blob = new Blob([JSON.stringify(S.toFile({ stripPaperOnly: true }), null, 2)], { type: "application/json" });
    const a = el("a"); a.href = URL.createObjectURL(blob); a.download = S.fileName(); a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    confirm("saved · " + S.fileName());
  });
  actions.append(printB, dl);
  if (navigator.canShare) {
    const share = el("button", "btn secondary", "Hand it over (AirDrop / share)");
    share.addEventListener("click", async () => {
      const file = new File([JSON.stringify(S.toFile({ stripPaperOnly: true }), null, 2)], S.fileName(), { type: "application/json" });
      if (navigator.canShare({ files: [file] })) {
        S.recordExport("share");
        try { await navigator.share({ files: [file] }); confirm("handed over · " + S.fileName()); }
        catch (e) { confirm("the handoff was closed before sending; nothing left the device"); }
      } else toast("Sharing files is not available here; download instead.");
    });
    actions.append(share);
  }
  const blank = el("button", "btn quiet", "Print the blank paper kit");
  blank.addEventListener("click", () => { renderSheet(null, { blank: true }); window.print(); });
  actions.append(blank);
  body.append(actions, status);
  body.append(el("p", "mono", "the client keeps the original. jeremy keeps a copy only if the client sends him one."));

  body.append(el("h3", null, "Everything the file contains"));
  body.append(el("p", null, "The complete record, every field. Nothing leaves this device that is not on this screen."));

  const b1 = el("div", "review-block");
  b1.append(el("h4", null, "Session"));
  b1.append(el("div", null, `${s.client_label} · ${s.date} · ${s.format}`));
  b1.append(el("div", "mono", `record ${s.id} · backup key ${s.sync_id || "not yet assigned"} · last touched ${s.updated_at || s.date}`));
  body.append(b1);

  for (const d of DOMAINS) {
    const r = s.ratings[d.code]; if (!r) continue;
    const blk = el("div", "review-block");
    blk.append(el("h4", null, `${d.name} · ${r.value ?? "·"}`));
    (r.history || []).forEach(g => blk.append(el("div", "mono", `moved ${g.from} → ${g.to} at ${g.at}`)));
    (r.words || []).forEach((w, wi) => {
      const row = el("label", "word-item word-choice");
      const cb = el("input"); cb.type = "checkbox"; cb.checked = w.paper_only;
      cb.addEventListener("change", () => S.setPaperOnly(d.code, wi, cb.checked));
      row.append(cb, el("span", null, "“" + w.text + "”"), el("span", "mono", PAPER_ONLY_LABEL));
      blk.append(row);
    });
    body.append(blk);
  }

  const bl = el("div", "review-block"); bl.append(el("h4", null, "Lines"));
  Object.values(s.lines).forEach(l => {
    const names = l.pair.map(c => NODES[c]?.name || c).join(" · ");
    bl.append(el("div", null, `${names} · loudness ${l.loudness}${l.keystone ? " · keystone" : ""}${l.notes ? " · note: “" + l.notes + "”" : ""}`));
  });
  if (!Object.keys(s.lines).length) bl.append(el("div", "mono", "none drawn"));
  body.append(bl);

  const bk = el("div", "review-block"); bk.append(el("h4", null, "Keystone"));
  bk.append(el("div", null, s.keystone.sentence ? "“" + s.keystone.sentence + "”" : "not named yet"));
  bk.append(el("div", "mono", s.keystone.ink ? "plus the handwritten ink, which prints on the sheet and travels in the file" : "no handwritten ink"));
  body.append(bk);

  const bp = el("div", "review-block"); bp.append(el("h4", null, "The plan, with its measures"));
  s.plan.forEach(p2 => {
    const item = el("div", "review-plan-item");
    item.append(el("div", "review-plan-title", p2.title + (p2.referral ? "  (referral: " + (p2.contact || "no name yet") + (p2.day ? ", by " + p2.day : "") + ")" : "  ·  " + (p2.dose || "no dose yet") + "  ·  " + (p2.day || "no day yet"))));
    item.append(el("div", "mono", "works on " + p2.works.map(c => (NODES[c]?.name || c).toLowerCase()).join(", ")));
    for (const lvl of ["2", "1", "0", "-1", "-2"]) {
      if (p2.gas[lvl]) item.append(el("div", "review-gas", (lvl === "0" ? "0 expected" : (lvl > 0 ? "+" + lvl : lvl)) + " · " + p2.gas[lvl]));
    }
    if (p2.checkins.length) item.append(el("div", "mono", "check-ins · " + p2.checkins.map(c => `${c.at.slice(0, 10)} level ${c.level > 0 ? "+" + c.level : c.level}`).join(" · ")));
    bp.append(item);
  });
  if (!s.plan.length) bp.append(el("div", "mono", "no plan items yet"));
  body.append(bp);

  const br = el("div", "review-block"); br.append(el("h4", null, "Re-rates"));
  s.rerates.forEach(r => {
    br.append(el("div", null, `${r.at} · ${Array.isArray(r.scope) ? r.scope.map(c => NODES[c]?.name || c).join(", ") : "the full map"} · ` +
      Object.entries(r.values).map(([c, v]) => `${NODES[c]?.name || c} ${v}`).join(", ") +
      (r.day0_pulled_early ? " · day 0 was shown early, at the client's right" : "")));
  });
  if (!s.rerates.length) br.append(el("div", "mono", "none yet"));
  body.append(br);

  const bx = el("div", "review-block"); bx.append(el("h4", null, "Exports and room log"));
  s.exports.forEach(x => bx.append(el("div", "mono", `${x.at} · ${x.kind}`)));
  s.log.forEach(m => bx.append(el("div", "mono", `${m.at} · ${m.text}`)));
  if (!s.exports.length && !s.log.length) bx.append(el("div", "mono", "empty"));
  body.append(bx);

  // the structural guarantee behind "everything": the raw file itself, readable
  const raw = el("details", "review-block");
  const sum = el("summary", null, "The raw file, exactly as it leaves this device");
  const pre = el("pre", "rawfile", JSON.stringify(S.toFile({ stripPaperOnly: true }), null, 1));
  raw.append(sum, pre);
  body.append(raw);
}

// ---------------------------------------------------------------- about

function renderAbout(body) {
  body.append(el("h3", null, "What this instrument refuses, permanently"));
  const ul = el("ul", "refusal-list");
  REFUSALS.forEach(r => ul.append(el("li", null, r)));
  body.append(ul);

  body.append(el("h3", null, "Where the method comes from"));
  const t = el("table", "ev-table");
  METHOD_EVIDENCE.forEach(k => {
    const ev = EVIDENCE[k]; if (!ev) return;
    const tr = el("tr");
    const td1 = el("td");
    td1.append(cite(k));
    const td2 = el("td", null, ev.claim);
    tr.append(td1, td2); t.append(tr);
  });
  body.append(t);
  body.append(el("h3", null, "The rules of the room"));
  const r2 = el("ul", "refusal-list");
  RULES.forEach(x => { const li = el("li", null, x); li.style.setProperty("list-style", "none"); r2.append(li); });
  body.append(r2);
  body.append(el("p", "privacy", PRIVACY_LINE));
  body.append(el("p", "mono", "every citation in this instrument is verified at its source before it may appear here, and re-verified before every release."));
}

// ---------------------------------------------------------------- evidence modal

let modalReturnFocus = null;
function openEvidence(key) {
  modalReturnFocus = document.activeElement;
  const ev = EVIDENCE[key];
  const m = $("#modal-body"); m.textContent = "";
  m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
  m.setAttribute("aria-label", "Where this comes from");
  if (!ev) { m.append(el("p", null, "This citation is not in the current evidence file: " + key)); }
  else {
    m.append(el("h3", null, "Where this comes from"));
    m.append(el("p", "claim", ev.claim));
    const meta = el("p", "meta");
    meta.innerHTML = "";
    const standing = ev.status === "corrected" ? "verified at source · corrected wording carried" : "verified at source";
    meta.append(document.createTextNode(ev.src + (ev.doi ? " · doi " + ev.doi : "")), el("br"), document.createTextNode(ev.pop + " · " + ev.design + " · " + standing));
    m.append(meta);
    m.append(el("p", "note", ev.note));
  }
  const row = el("div", "close-row");
  const c = el("button", "btn secondary", "Back to the room");
  c.addEventListener("click", closeModal);
  row.append(c); m.append(row);
  $("#modal-wrap").classList.add("open");
  queueMicrotask(() => c.focus());
}
function closeModal() {
  $("#modal-wrap").classList.remove("open");
  if (modalReturnFocus && modalReturnFocus.isConnected) modalReturnFocus.focus();
  modalReturnFocus = null;
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#modal-wrap").classList.contains("open")) closeModal();
});
$("#modal-wrap").addEventListener("pointerdown", (e) => { if (e.target.id === "modal-wrap") closeModal(); });

function toast(msg) { openToast(msg); }
function openToast(msg) {
  const m = $("#modal-body"); m.textContent = "";
  m.append(el("p", "claim", msg));
  const row = el("div", "close-row");
  const c = el("button", "btn secondary", "OK"); c.addEventListener("click", closeModal);
  row.append(c); m.append(row);
  $("#modal-wrap").classList.add("open");
}

// ---------------------------------------------------------------- re-rate

function startRerate(scope) {
  // scope: "full" (day-90, sequenced: fresh first) or [codes] (engagement)
  const full = scope === "full";
  const codes = full ? DOMAINS.map(d => d.code) : scope;
  const values = {};
  let pulledEarly = false;
  let idx = 0;
  show("#screen-rerate");
  const body = $("#rerate-body");

  function step() {
    body.textContent = "";
    if (idx >= codes.length) { review(); return; }
    const d = DOMAINS.find(x => x.code === codes[idx]);
    body.append(el("p", "mono", (full ? "day-90 re-rate · fresh first, day 0 stays out of sight until the pass completes" : "between-sessions re-rate") + ` · ${d.name} · ${idx + 1} of ${codes.length}`));
    const card = el("div", "dcard");
    const h = el("h2"); h.append(document.createTextNode(d.name)); h.setAttribute("tabindex", "-1"); card.append(h);
    card.append(el("p", "desc", d.desc));
    const dl = el("dl", "anchors");
    for (const k of [2, 5, 8]) dl.append(el("dt", null, String(k)), el("dd", null, d.anchors[k]));
    card.append(dl);
    const bar = el("div", "ratebar");
    bar.setAttribute("role", "radiogroup"); bar.setAttribute("aria-label", d.name + ", 0 to 10");
    for (let v = 0; v <= 10; v++) {
      const b = el("button", values[d.code] === v ? "sel" : "", String(v));
      b.setAttribute("role", "radio"); b.setAttribute("aria-checked", values[d.code] === v ? "true" : "false");
      b.setAttribute("aria-label", d.name + " " + v + " of 10");
      b.addEventListener("click", () => { values[d.code] = v; step(); });
      bar.append(b);
    }
    card.append(bar);
    const nav = el("div", "walk-next");
    const back = el("button", "btn quiet", "← Back");
    back.disabled = idx === 0;
    back.addEventListener("click", () => { idx--; step(); });
    const next = el("button", "btn", idx === codes.length - 1 ? "Review the pass →" : "Next →");
    next.disabled = values[d.code] === undefined;
    next.addEventListener("click", () => { idx++; step(); });
    nav.append(back, next);
    if (full) {
      const pull = el("button", "btn quiet", "Show my day-0 number");
      pull.addEventListener("click", () => {
        pulledEarly = true;
        const day0 = S.get().ratings[d.code]?.value;
        toast(`Day 0 for ${d.name}: ${day0 ?? "not rated"}. Your data is never gated from you; the early look is noted openly on the sheet.`);
      });
      nav.append(pull);
    }
    card.append(nav);
    body.append(card);
    queueMicrotask(() => h.focus());
  }

  function review() {
    body.textContent = "";
    body.append(el("h3", null, "The pass, before anything is saved"));
    body.append(el("p", null, "Check each number. Nothing is recorded until you confirm."));
    const t = el("table", "delta-table");
    codes.forEach((code, i) => {
      const d = DOMAINS.find(x => x.code === code);
      const tr = el("tr");
      tr.append(el("td", null, d.name));
      tr.append(el("td", "mono", String(values[code] ?? "·")));
      const edit = el("button", "chipbtn", "change");
      edit.addEventListener("click", () => { idx = i; step(); });
      const tde = el("td"); tde.append(edit); tr.append(tde);
      t.append(tr);
    });
    body.append(t);
    const nav = el("div", "export-actions");
    const back = el("button", "btn quiet", "← Back to the last domain");
    back.addEventListener("click", () => { idx = codes.length - 1; step(); });
    const save = el("button", "btn", full ? "Confirm · show day 0 beside today" : "Confirm and save");
    save.addEventListener("click", () => {
      S.addRerate({ at: S.nowStamp(), scope: full ? "full" : codes, values, day0_pulled_early: pulledEarly });
      if (full) renderCompare(body, values);
      else { show("#screen-day"); setTab("plan"); }
    });
    nav.append(back, save);
    body.append(nav);
  }

  step();
}

function renderCompare(body, freshValues) {
  const s = S.get();
  body.textContent = "";
  body.append(el("h3", null, "Day 0 and today, side by side. The delta is the conversation."));
  const grid = el("div", "compare-grid");
  grid.append(miniMap(code => s.ratings[code]?.value, "day 0"));
  grid.append(miniMap(code => freshValues[code], "today"));
  body.append(grid);
  const t = el("table", "delta-table");
  for (const d of DOMAINS) {
    const a = s.ratings[d.code]?.value, b = freshValues[d.code];
    const tr = el("tr");
    tr.append(el("td", null, d.name));
    tr.append(el("td", "mono", `${a ?? "·"} → ${b ?? "·"}`));
    const delta = (a != null && b != null) ? b - a : null;
    tr.append(el("td", delta > 0 ? "delta-up" : delta < 0 ? "delta-down" : "delta-flat",
      delta === null ? "" : delta > 0 ? "↑ " + delta : delta < 0 ? "↓ " + Math.abs(delta) : "→ held"));
    t.append(tr);
  }
  body.append(t);
  body.append(el("p", null, "Direction leads; magnitude follows. Movement is an outcome."));
  const row = el("div", "export-actions");
  const redo = el("button", "btn quiet", "Redo this pass (the earlier one stays on the record)");
  redo.addEventListener("click", () => startRerate("full"));
  const back = el("button", "btn", "Back to the room");
  back.addEventListener("click", () => { show("#screen-day"); setTab("close"); });
  row.append(back, redo);
  body.append(row);
}

function miniMap(getVal, label) {
  const wrap = el("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", VIEWBOX);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", label + ": " + DOMAINS.map(d => d.name + " " + (getVal(d.code) ?? "unrated")).join(", "));
  for (const [code, p] of Object.entries(NODES)) {
    const v = getVal(code);
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y);
    c.setAttribute("r", v != null ? 9 + v * 1.7 : 6);
    if (v != null) c.setAttribute("fill", lightFor(v));
    else { c.setAttribute("fill", "none"); c.setAttribute("stroke", "#B7B1A4"); c.setAttribute("stroke-dasharray", "2.5 3.5"); }
    svg.append(c);
    if (v != null) {
      const val = document.createElementNS("http://www.w3.org/2000/svg", "text");
      val.setAttribute("x", p.x); val.setAttribute("y", p.y + 4.5);
      val.setAttribute("text-anchor", "middle");
      val.setAttribute("class", "node-value"); val.textContent = String(v);
      svg.append(val);
    }
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", p.lx); t.setAttribute("y", p.ly); t.setAttribute("text-anchor", p.anchor);
    t.setAttribute("class", "mini-label"); t.textContent = NODES[code].name;
    svg.append(t);
  }
  wrap.append(svg, el("p", "mono", label));
  return wrap;
}

// ---------------------------------------------------------------- circle (S7)

// Private by default. Sharing is a deliberate gesture; only what is pushed leaves
// the device. Transport: BroadcastChannel (same device / demo) with a relay
// interface reserved for the hosted ephemeral relay (deployed at rehearsal).
class Room {
  constructor(session) {
    this.code = (session.client_label || "room").toLowerCase().replace(/[^a-z0-9]/g, "") + "-" + session.date.replace(/-/g, "");
    try { this.chan = new BroadcastChannel("fortify-room-" + this.code); } catch (e) { this.chan = null; }
  }
  share(kind, payload) {
    if (!this.chan) { openToast("No room channel here. Show your screen: that is always the honest fallback."); return; }
    this.chan.postMessage({ kind, payload, at: S.nowStamp() });
    S.logMoment("shared to the room: " + kind);
    openToast("Shared to the room screen. Only what you push ever leaves this device.");
  }
}
function shareBtn(fn) {
  const b = el("button", "btn quiet", "Show the room");
  b.addEventListener("click", fn);
  return b;
}

// ---------------------------------------------------------------- the printed Sheet

function renderSheet(s, opts) {
  const sheet = $("#sheet"); sheet.textContent = "";
  sheet.append(el("div", "s-mark", "JEREMY RUNGE"));
  const head = el("div", "s-head");
  head.append(el("b", null, "FORTIFY · THE MAP"));
  head.append(el("span", "s-meta", s ? `${s.client_label} · jeremy · ${s.date} · the client keeps this original` : "blank kit · rated together, in conversation"));
  sheet.append(head);

  // the map
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", VIEWBOX);
  // lines first
  if (s) for (const l of Object.values(s.lines)) {
    const A = NODES[l.pair[0]], B = NODES[l.pair[1]];
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", A.x); line.setAttribute("y1", A.y);
    line.setAttribute("x2", B.x); line.setAttribute("y2", B.y);
    line.setAttribute("stroke", l.keystone ? "#834112" : "#7D93A1");
    line.setAttribute("stroke-width", l.loudness * 2.2);
    svg.append(line);
  }
  for (const [code, p] of Object.entries(NODES)) {
    const v = s?.ratings[code]?.value;
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y);
    c.setAttribute("r", v != null ? 9 + v * 1.7 : 8);
    c.setAttribute("fill", v != null ? "#46606F" : "none");
    c.setAttribute("stroke", "#B7B1A4");
    svg.append(c);
    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", p.lx); t.setAttribute("y", p.ly); t.setAttribute("text-anchor", p.anchor);
    t.setAttribute("style", "font: 11.5px ui-monospace; fill:#26251F;");
    t.textContent = p.name + (v != null ? " · " + v : "");
    svg.append(t);
  }
  sheet.append(svg);
  if (s?.keystone.sentence) sheet.append(el("p", "s-caption", "“" + s.keystone.sentence + "”"));
  if (s?.keystone.ink) { const img = el("img"); img.src = s.keystone.ink; img.style.cssText = "display:block;margin:0 auto;max-width:4in;"; sheet.append(img); }

  // ratings + words
  sheet.append(el("h3", null, "The ten, in their numbers and their words"));
  const t1 = el("table");
  const thead1 = el("thead"); const thr = el("tr");
  ["domain", "rating", "moved", "their words"].forEach(h => thr.append(el("th", null, h)));
  thead1.append(thr); t1.append(thead1);
  for (const d of DOMAINS) {
    const r = s?.ratings[d.code];
    const tr = el("tr");
    tr.append(el("td", null, `${d.code} ${d.name}`));
    tr.append(el("td", null, r?.value != null ? String(r.value) : ""));
    tr.append(el("td", null, (r?.history || []).map(g => `${g.from}→${g.to}`).join("  ")));
    tr.append(el("td", null, (r?.words || []).map(w => "“" + w.text + "”").join("  ")));
    t1.append(tr);
  }
  sheet.append(t1);

  // plan
  sheet.append(el("h3", null, "The plan, with its measures"));
  const t2 = el("table");
  const th2 = el("tr"); ["item", "dose / who", "day", "the five levels"].forEach(h => th2.append(el("th", null, h))); t2.append(th2);
  (s?.plan || []).forEach(p => {
    const tr = el("tr");
    tr.append(el("td", null, p.title + (p.referral ? " (referral)" : "")));
    tr.append(el("td", null, p.referral ? (p.contact || "") : (p.dose || "")));
    tr.append(el("td", null, p.day || ""));
    tr.append(el("td", null, ["-2", "-1", "0", "1", "2"].filter(l => p.gas[l]).map(l => `${l === "0" ? "0" : (l > 0 ? "+" + l : l)}: ${p.gas[l]}`).join("  ·  ")));
    t2.append(tr);
  });
  if (!s) for (let i = 0; i < 4; i++) { const tr = el("tr"); for (let j = 0; j < 4; j++) tr.append(el("td", null, " ")); t2.append(tr); }
  sheet.append(t2);

  if (s?.rerates?.length) {
    sheet.append(el("h3", null, "Re-rates"));
    const t3 = el("table");
    s.rerates.forEach(r => {
      const tr = el("tr");
      tr.append(el("td", null, r.at));
      tr.append(el("td", null, Array.isArray(r.scope) ? r.scope.join(", ") : "full"));
      tr.append(el("td", null, Object.entries(r.values).map(([c, v]) => `${c} ${v}`).join("  ")));
      tr.append(el("td", null, r.day0_pulled_early ? "day 0 pulled early, at the client's right" : ""));
      t3.append(tr);
    });
    sheet.append(t3);
  }

  const laws = el("div", "s-laws");
  laws.append(el("div", null, "law · nothing lands on this sheet that the client does not watch land"));
  laws.append(el("div", null, "law · same anchors at day 90, no exceptions, or the comparison is theater"));
  laws.append(el("div", null, "law · the sheet is the client's. jeremy keeps a copy, never the original"));
  sheet.append(laws);

  if (opts?.blank) {
    // the paper kit: anchor cards, one page per print flow
    const kit = el("div", "pagebreak");
    kit.append(el("h3", null, "The anchor cards, for a paper day"));
    const t4 = el("table");
    const th4 = el("tr"); ["domain", "opening", "2", "5", "8"].forEach(h => th4.append(el("th", null, h))); t4.append(th4);
    for (const d of DOMAINS) {
      const tr = el("tr");
      tr.append(el("td", null, `${d.code} ${d.name}`), el("td", null, d.opening), el("td", null, d.anchors[2]), el("td", null, d.anchors[5]), el("td", null, d.anchors[8]));
      t4.append(tr);
    }
    kit.append(t4);
    kit.append(el("h3", null, "The twenty-two probes"));
    const t5 = el("table");
    LINES.forEach(l => { const tr = el("tr"); tr.append(el("td", null, l.pair.join(" · ") + (l.name ? " · " + l.name : "")), el("td", null, l.probe)); t5.append(tr); });
    kit.append(t5);
    sheet.append(kit);
  }
}

// ---------------------------------------------------------------- boot

initHome();
S.onPersist((r) => {
  const n = $("#save-note"); if (!n) return;
  n.classList.toggle("savefail", !r.ok);
  const cab = Cabinet.getStatus();
  n.textContent = (r.ok ? "saved locally " + r.at.slice(11) : "SAVE FAILED · export the file now") + " · cabinet · " + cab.detail;
});
Cabinet.loadConf();
renderCabinetBlock();
Cabinet.onStatus((st) => {
  const n = $("#save-note");
  if (n && !n.classList.contains("savefail")) n.textContent = "saved locally · cabinet · " + st.detail;
  const line = document.querySelector(".cabinet-line");
  if (line) line.textContent = "cabinet · " + st.detail;
});
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
// Acceptance hook: archetype replays load a file via ?replay= (used by tests, harmless live)
window.__fortify = { load: (obj) => { S.load(obj); enterDay(); }, get: () => S.get(), startRerate };
