// The second screen's transport. Commissioned by Jeremy's words 2026-09-15 (RULINGS):
// he drives the room on his Mac; the client opens a client version on his own device.
//
// Transport: the estate's own Supabase Realtime, one ephemeral broadcast channel per
// room, named by a hash of the room code. Nothing is stored anywhere; the channel dies
// with the day. Every payload is encrypted on the device (AES-GCM under a key derived
// from the room code), so the relay carries noise. Jeremy's device is the record; the
// client's device is a view with a bar. No library: the Phoenix channel protocol is a
// few messages, written here so the room keeps zero dependencies and stays offline-first
// for everything except this screen.

const REF = "dsjnvwhyevjzsmuawkcs";
const KEY = "sb_publishable_sCp-UgTDAZsdIGY9OSRMzg_fxaWbNPx"; // publishable by design (the anon role)
const WS = `wss://${REF}.supabase.co/realtime/v1/websocket?apikey=${KEY}&vsn=1.0.0`;
const SALT = "fortify-room-console-v1";

// 128 short, plain words: a three-word code reads aloud across a table.
const WORDS = ("cedar tide harbor kelp slate paper lantern dune fog ridge cove pine anchor reed stone marsh " +
  "ember quill compass oak fern river meadow shore gull heron otter salmon maple birch willow moss " +
  "granite copper amber ivory linen wool cotton canvas thread needle spool loom hammer chisel plane " +
  "orchard grove field furrow barley wheat clover thistle bramble hazel walnut chestnut almond olive fig " +
  "north south east west summit valley canyon delta glacier island lagoon cliff bay inlet channel strait " +
  "candle window ladder bridge gate porch garden fence hedge trail path crossing signal beacon tower mill " +
  "sparrow finch wren robin crow raven owl hawk falcon swift lark thrush plover crane egret pelican " +
  "pebble boulder shale flint quartz basalt marble opal pearl coral shell sand silt clay loam peat").split(/\s+/);

export function newCode() {
  const pick = () => WORDS[crypto.getRandomValues(new Uint32Array(1))[0] % WORDS.length];
  const n = 1000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 9000);
  return `${pick()} ${pick()} ${pick()} ${n}`;
}
export function normalizeCode(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
export function joinLink(code) {
  const u = new URL(location.href); u.search = ""; u.hash = "";
  u.searchParams.set("join", normalizeCode(code).replace(/ /g, "-"));
  return u.toString();
}

const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
async function sha256hex(s) { const b = await crypto.subtle.digest("SHA-256", enc.encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
async function deriveKey(code) {
  const base = await crypto.subtle.importKey("raw", enc.encode(normalizeCode(code)), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey({ name: "PBKDF2", salt: enc.encode(SALT), iterations: 150000, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
}

export class Relay {
  // role: "room" (Jeremy's device, the record) or "screen" (the client's device, a view)
  constructor(code, role) {
    this.code = normalizeCode(code); this.role = role;
    this.handlers = {}; this.statusFns = [];
    this.status = { state: "connecting", detail: "connecting" };
    this.ws = null; this.ref = 0; this.joined = false; this.closed = false;
    this.backoff = 1000; this.outbox = []; this.lastHeard = 0; this.peerSeen = 0;
    this.key = null; this.topic = null;
  }
  on(type, fn) { (this.handlers[type] = this.handlers[type] || []).push(fn); return this; }
  onStatus(fn) { this.statusFns.push(fn); fn(this.status); return this; }
  setStatus(state, detail) { this.status = { state, detail }; this.statusFns.forEach(f => f(this.status)); }
  get peerConnected() { return this.peerSeen && (Date.now() - this.peerSeen) < 45000; }

  async connect() {
    if (!this.key) { this.key = await deriveKey(this.code); this.topic = "realtime:room-" + (await sha256hex("topic:" + this.code)).slice(0, 20); }
    this.open();
    this.timer = setInterval(() => this.tick(), 15000);
    return this;
  }
  open() {
    if (this.closed) return;
    try { this.ws = new WebSocket(WS); } catch (e) { this.retry(); return; }
    this.ws.onopen = () => { this.backoff = 1000; this.push(this.topic, "phx_join", { config: { broadcast: { self: false, ack: false }, presence: { key: "" }, postgres_changes: [] } }); };
    this.ws.onmessage = (e) => this.receive(e.data);
    this.ws.onclose = () => { this.joined = false; this.setStatus("reconnecting", "reconnecting"); this.retry(); };
    this.ws.onerror = () => { /* onclose follows */ };
  }
  retry() {
    if (this.closed) return;
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => this.open(), this.backoff);
    this.backoff = Math.min(this.backoff * 2, 15000);
  }
  push(topic, event, payload) {
    if (!this.ws || this.ws.readyState !== 1) return false;
    this.ws.send(JSON.stringify({ topic, event, payload, ref: String(++this.ref) }));
    return true;
  }
  tick() {
    if (this.closed) return;
    this.push("phoenix", "heartbeat", {});
    if (this.joined) this.send("ping", { role: this.role });
    // the other side has gone quiet: say so, keep listening
    if (this.status.state === "joined" && this.peerSeen && !this.peerConnected) this.setStatus("alone", this.role === "room" ? "the second screen has gone quiet" : "waiting for the room");
  }
  async receive(raw) {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.event === "phx_reply" && m.topic === this.topic && m.payload && m.payload.status === "ok" && !this.joined) {
      this.joined = true;
      this.setStatus("joined", this.role === "room" ? "open · waiting for the second screen" : "joined · waiting for the room");
      this.send("hello", { role: this.role });
      const pending = this.outbox.splice(0); pending.forEach(([t, p]) => this.send(t, p));
      return;
    }
    if (m.event === "phx_error" || (m.event === "phx_reply" && m.payload && m.payload.status === "error")) { this.setStatus("reconnecting", "the relay refused the room; retrying"); try { this.ws.close(); } catch (e) {} return; }
    if (m.event !== "broadcast" || m.topic !== this.topic) return;
    const c = m.payload && m.payload.payload && m.payload.payload.c; if (!c) return;
    let msg;
    try { const [ivb, ctb] = c.split("."); const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(ivb) }, this.key, unb64(ctb)); msg = JSON.parse(dec.decode(pt)); }
    catch (e) { return; } // not ours, or noise
    if (!msg || msg.role === this.role) return;
    this.peerSeen = Date.now();
    if (this.status.state !== "joined" || /waiting|quiet/.test(this.status.detail)) this.setStatus("joined", this.role === "room" ? "the second screen is here" : "joined · your numbers land on the room's screen");
    (this.handlers[msg.t] || []).forEach(fn => fn(msg.p, msg));
    (this.handlers["*"] || []).forEach(fn => fn(msg));
  }
  async send(t, p) {
    if (!this.joined) { if (t !== "ping" && t !== "hello") { this.outbox = this.outbox.filter(x => x[0] !== t); this.outbox.push([t, p]); } return false; }
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, this.key, enc.encode(JSON.stringify({ t, p, role: this.role, at: Date.now() })));
    return this.push(this.topic, "broadcast", { type: "broadcast", event: "m", payload: { c: b64(iv) + "." + b64(ct) } });
  }
  close() {
    this.closed = true; clearInterval(this.timer); clearTimeout(this.retryTimer);
    try { this.push(this.topic, "phx_leave", {}); } catch (e) {}
    try { this.ws && this.ws.close(); } catch (e) {}
    this.setStatus("off", "closed");
  }
}
