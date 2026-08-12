// Session state: one .fortifymap document, autosaved on every mutation.
// Law: nothing exists in this file the client cannot see rendered (the export
// review screen renders every field; there are no fields it skips).

// The library: every session is its own IndexedDB record. Starting a new day
// never touches an old one. localStorage keeps only a pointer to the last-active
// session for fast resume. The durable artifact remains the .fortifymap file.
const LAST_KEY = "fortify-room-last-session";
const FILE_VERSION = 1;
const DB_NAME = "fortify-room";
const DB_STORE = "sessions";

let dbp = null;
function db() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}
async function idbPut(obj) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const tx = d.transaction(DB_STORE, "readwrite");
    tx.objectStore(DB_STORE).put(obj);
    tx.oncomplete = resolve; tx.onerror = () => reject(tx.error);
  });
}
async function idbGet(id) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = d.transaction(DB_STORE).objectStore(DB_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function idbAll() {
  const d = await db();
  return new Promise((resolve, reject) => {
    const req = d.transaction(DB_STORE).objectStore(DB_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export function newSession(clientLabel, format) {
  return {
    fortifymap: FILE_VERSION,
    id: (clientLabel || "map").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + today() + "-" + Math.random().toString(36).slice(2, 7),
    sync_id: crypto.randomUUID(),
    updated_at: nowStamp(),
    client_label: clientLabel || "",
    date: today(),
    format: format || "solo",           // solo | circle
    ratings: {},                        // code -> { value, history: [{from,to,at,phase}], words: [{text,at,paper_only}] }
    lines: {},                          // pairKey -> { pair, loudness (1..3), keystone: bool, notes }
    keystone: { sentence: "", ink: null },  // ink: dataURL if written by hand
    plan: [],                           // { practice_ref, title, referral, contact, dose, day, works: [codes], gas: {"-2":..,"2":..}, checkins: [{at, level}] }
    rerates: [],                        // { at, scope: [codes]|"full", values: {code: n}, day0_pulled_early: bool }
    exports: [],                        // { at, kind }
    log: [],                            // open room log: notable moments, all visible
  };
}

// Local time, always: the room's clock, not UTC's.
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function nowStamp() {
  const d = new Date();
  return `${today()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

let session = null;
let listeners = [];

export function get() { return session; }
export function onChange(fn) { listeners.push(fn); }

function emit() {
  session.updated_at = nowStamp();
  if (!session.sync_id) session.sync_id = crypto.randomUUID();
  try { localStorage.setItem(LAST_KEY, session.id); } catch (e) { /* pointer only */ }
  idbPut(JSON.parse(JSON.stringify(session))).catch(() => { /* the export path still works; the roster will show staleness */ });
  for (const fn of listeners) fn(session);
}

export function start(clientLabel, format) { session = newSession(clientLabel, format); emit(); return session; }

export async function resume() {
  try {
    const id = localStorage.getItem(LAST_KEY);
    if (!id) return null;
    session = await idbGet(id);
    return session;
  } catch (e) { return null; }
}

export async function listSessions() {
  try {
    const all = await idbAll();
    return all
      .map(s2 => ({ id: s2.id, client_label: s2.client_label, date: s2.date, format: s2.format, updated_at: s2.updated_at || s2.date }))
      .sort((a, b) => (b.updated_at || "").localeCompare(a.updated_at || ""));
  } catch (e) { return []; }
}

export async function open(id) {
  const s2 = await idbGet(id);
  if (!s2) throw new Error("Session not found on this device.");
  session = s2;
  try { localStorage.setItem(LAST_KEY, id); } catch (e) { /* pointer only */ }
  for (const fn of listeners) fn(session);
  return session;
}

export function load(obj) {
  if (!obj || obj.fortifymap !== FILE_VERSION) throw new Error("Not a fortifymap v1 file.");
  if (!obj.id) obj.id = (obj.client_label || "map").toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + (obj.date || today()) + "-" + Math.random().toString(36).slice(2, 7);
  session = obj; emit(); return session;
}

export function clear() { session = null; localStorage.removeItem(LAST_KEY); }

// Index for the cabinet: what this device already holds, by sync_id.
export async function sessionIndex() {
  const all = await idbAll();
  const idx = {};
  for (const s2 of all) if (s2.sync_id) idx[s2.sync_id] = s2.updated_at || "";
  return idx;
}

// Merge sessions pulled from the cabinet. Last write wins per sync_id.
export async function importSessions(list) {
  const all = await idbAll();
  const bySync = {};
  for (const s2 of all) if (s2.sync_id) bySync[s2.sync_id] = s2;
  let merged = 0;
  for (const incoming of list) {
    if (!incoming || !incoming.sync_id) continue;
    const local = bySync[incoming.sync_id];
    if (local && (local.updated_at || "") >= (incoming.updated_at || "")) continue;
    if (local) incoming.id = local.id;   // same practice record keeps its device identity
    await idbPut(incoming);
    merged++;
  }
  return merged;
}

// ---- ratings -------------------------------------------------------------

export function rate(code, value, phase) {
  const r = session.ratings[code] || (session.ratings[code] = { value: null, history: [], words: [] });
  if (r.value !== value) {
    if (r.value !== null) r.history.push({ from: r.value, to: value, at: nowStamp(), phase: phase || "day" });
    r.value = value;
  }
  emit();
}

export function addWords(code, text) {
  if (!text || !text.trim()) return;
  const r = session.ratings[code] || (session.ratings[code] = { value: null, history: [], words: [] });
  r.words.push({ text: text.trim(), at: nowStamp(), paper_only: false });
  emit();
}

export function setPaperOnly(code, idx, val) {
  const w = session.ratings[code]?.words?.[idx];
  if (w) { w.paper_only = !!val; emit(); }
}

// ---- lines ---------------------------------------------------------------

export function addLine(key, pair) {
  if (!session.lines[key]) session.lines[key] = { pair, loudness: 1, keystone: false, notes: "" };
  emit();
  return session.lines[key];
}
export function cycleLoudness(key) {
  const l = session.lines[key]; if (!l) return;
  l.loudness = l.loudness >= 3 ? 1 : l.loudness + 1; emit();
}
export function removeLine(key) { delete session.lines[key]; emit(); }
export function toggleKeystoneLine(key) {
  const l = session.lines[key]; if (!l) return;
  l.keystone = !l.keystone; emit();
}
export function setKeystone(sentence, ink) {
  session.keystone = { sentence: sentence || "", ink: ink || null }; emit();
}

// ---- plan ----------------------------------------------------------------

export function addPlanItem(item) { session.plan.push(item); emit(); return item; }
export function updatePlanItem(i, patch) { Object.assign(session.plan[i], patch); emit(); }
export function removePlanItem(i) { session.plan.splice(i, 1); emit(); }
export function checkin(i, level) {
  session.plan[i].checkins.push({ at: nowStamp(), level }); emit();
}

// ---- re-rates ------------------------------------------------------------

export function addRerate(entry) { session.rerates.push(entry); emit(); }

export function logMoment(text) { session.log.push({ at: nowStamp(), text }); emit(); }
export function recordExport(kind) { session.exports.push({ at: nowStamp(), kind }); emit(); }

// ---- file ----------------------------------------------------------------

export function toFile(opts) {
  // opts.stripPaperOnly: the export honors paper-only flags (they print, never travel digitally)
  const copy = JSON.parse(JSON.stringify(session));
  if (opts && opts.stripPaperOnly) {
    for (const code of Object.keys(copy.ratings)) {
      copy.ratings[code].words = copy.ratings[code].words.map(w =>
        w.paper_only ? { text: "(kept on paper only, at the client's choice)", at: w.at, paper_only: true } : w);
    }
  }
  return copy;
}

export function fileName() {
  const label = (session.client_label || "map").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  return `${label}-${session.date}.fortifymap.json`;
}
