// Session state: one .fortifymap document, autosaved on every mutation.
// Law: nothing exists in this file the client cannot see rendered (the export
// review screen renders every field; there are no fields it skips).

const STORE_KEY = "fortify-room-session-v1";
const FILE_VERSION = 1;

export function newSession(clientLabel, format) {
  return {
    fortifymap: FILE_VERSION,
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
  try { localStorage.setItem(STORE_KEY, JSON.stringify(session)); } catch (e) { /* storage full: the export path still works */ }
  for (const fn of listeners) fn(session);
}

export function start(clientLabel, format) { session = newSession(clientLabel, format); emit(); return session; }

export function resume() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    session = JSON.parse(raw);
    return session;
  } catch (e) { return null; }
}

export function load(obj) {
  if (!obj || obj.fortifymap !== FILE_VERSION) throw new Error("Not a fortifymap v1 file.");
  session = obj; emit(); return session;
}

export function clear() { session = null; localStorage.removeItem(STORE_KEY); }

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
