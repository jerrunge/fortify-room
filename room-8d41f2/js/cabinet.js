// The Cabinet: automatic encrypted backup of the practice library to Jeremy's own
// Supabase, so a lost device costs nothing and follow-ups open from any device.
//
// The line that makes it honest: ENCRYPTION HAPPENS HERE, before anything leaves,
// with a passphrase only Jeremy holds. The cabinet stores ciphertext. Supabase,
// tooling sessions, and anyone with database keys see noise. Lose the passphrase
// and the cabinet is unreadable by design; the exported .fortifymap files are the
// plaintext fallback in Jeremy's own hands.
//
// Setup, once per device (home screen): the practice passphrase + the device token.
// After that the cabinet is automatic: every change files itself a moment later.

const FN_URL = "https://dsjnvwhyevjzsmuawkcs.supabase.co/functions/v1/room-cabinet";
const CONF_KEY = "fortify-cabinet-conf-v1"; // { token, saltB64, verifier } local to the device
const ITER = 250000;

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

let conf = null;
let key = null;           // derived CryptoKey, held in memory
let status = { state: "off", detail: "not set up on this device" };
let listeners = [];
let queue = new Map();    // sync_id -> session snapshot awaiting filing
let timer = null;

export function onStatus(fn) { listeners.push(fn); }
function setStatus(state, detail) { status = { state, detail }; listeners.forEach((f) => f(status)); }
export function getStatus() { return status; }
export function isConfigured() { return !!conf; }

async function deriveKey(passphrase, salt) {
  const base = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" },
    base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export async function encryptJSON(obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(JSON.stringify(obj)));
  return b64(iv) + "." + b64(ct);
}
export async function decryptJSON(payload) {
  const [ivb, ctb] = payload.split(".");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(ivb) }, key, unb64(ctb));
  return JSON.parse(dec.decode(pt));
}

async function call(body) {
  const res = await fetch(FN_URL, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: conf.token, ...body }),
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.ok) throw new Error(j.error || ("HTTP " + res.status));
  return j;
}

// ---- setup ---------------------------------------------------------------

export function loadConf() {
  try { conf = JSON.parse(localStorage.getItem(CONF_KEY)); } catch (e) { conf = null; }
  if (conf) setStatus("locked", "set up; unlocking on first use");
  return conf;
}

export async function setup(passphrase, token) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const candidate = { token, saltB64: b64(salt), verifier: null };
  conf = candidate;
  key = await deriveKey(passphrase, salt);
  candidate.verifier = await encryptJSON({ v: "fortify-cabinet" });
  localStorage.setItem(CONF_KEY, JSON.stringify(candidate));
  await call({ op: "put", sync_id: "meta:practice", updated_at: new Date().toISOString(),
    ciphertext: JSON.stringify({ saltB64: candidate.saltB64, verifier: candidate.verifier }) });
  setStatus("on", "cabinet open");
}

// Joining from a new device: fetch the practice salt, derive, verify the passphrase.
export async function join(passphrase, token) {
  conf = { token, saltB64: null, verifier: null };
  const meta = await call({ op: "get", sync_id: "meta:practice" });
  if (!meta.row) throw new Error("No practice found in the cabinet yet; set up on the first device first.");
  const parsed = JSON.parse(meta.row.ciphertext);
  conf.saltB64 = parsed.saltB64; conf.verifier = parsed.verifier;
  key = await deriveKey(passphrase, unb64(parsed.saltB64));
  try { await decryptJSON(parsed.verifier); }
  catch (e) { conf = null; key = null; throw new Error("That passphrase does not open this cabinet."); }
  localStorage.setItem(CONF_KEY, JSON.stringify(conf));
  setStatus("on", "cabinet open");
}

export async function unlock(passphrase) {
  if (!conf) throw new Error("Not set up on this device.");
  key = await deriveKey(passphrase, unb64(conf.saltB64));
  try { await decryptJSON(conf.verifier); }
  catch (e) { key = null; throw new Error("That passphrase does not open this cabinet."); }
  setStatus("on", "cabinet open");
}

// ---- automatic filing ----------------------------------------------------

export function file(session) {
  if (!conf || !key) return;                 // cabinet off or locked: the library still holds
  if (!session.sync_id) return;              // state.js owns sync_id; nothing to file yet
  queue.set(session.sync_id, JSON.parse(JSON.stringify(session)));
  clearTimeout(timer);
  timer = setTimeout(flush, 2500);           // debounce: file moments after the touch settles
}

async function flush() {
  if (!conf || !key || !queue.size) return;
  const entries = [...queue.entries()]; queue.clear();
  try {
    for (const [sync_id, session] of entries) {
      const ciphertext = await encryptJSON(session);
      await call({ op: "put", sync_id, updated_at: new Date().toISOString(), ciphertext });
    }
    const d = new Date();
    setStatus("on", `filed ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  } catch (e) {
    entries.forEach(([id, s]) => queue.set(id, s));   // keep for retry
    setStatus("waiting", "offline; will file when a network returns");
    clearTimeout(timer); timer = setTimeout(flush, 30000);
  }
}

// ---- restore -------------------------------------------------------------

// Pull every cabinet session newer than what this device holds. Returns sessions
// to merge; the caller writes them into the library (last write wins per session).
export async function pullNewer(localIndex) {
  if (!conf || !key) return [];
  const { rows } = await call({ op: "list" });
  const out = [];
  for (const r of rows) {
    if (r.sync_id.startsWith("meta:")) continue;
    const local = localIndex[r.sync_id];
    if (local && local >= r.updated_at) continue;
    const { row } = await call({ op: "get", sync_id: r.sync_id });
    if (!row) continue;
    try { out.push(await decryptJSON(row.ciphertext)); }
    catch (e) { /* a row this passphrase cannot open is surfaced, never hidden */ out.push({ __undecryptable: r.sync_id }); }
  }
  return out;
}
