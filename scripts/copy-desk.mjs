// THE COPY DESK BRIDGE. Jeremy edits the room's words on the desk page (jr-os-docs
// docs/strategy/living-map-copy-desk-2026-09-15.html); this script carries them into
// room-8d41f2/content/content.js and back. Since 2026-09-15 content.js is GENERATED
// from the desk's words plus the structure the room owns (codes, pairs, tiers,
// evidence keys, the release flag). His rewrite is final (RULINGS.md 2026-08-11 and
// 2026-09-15); a grammar comb is the only edit a session may make after a sync.
//
//   node scripts/copy-desk.mjs extract                 the words as JSON, from content.js
//   node scripts/copy-desk.mjs build <page.html>       refresh the page's JSON block from content.js
//   node scripts/copy-desk.mjs sync  <page.html>       write content.js from the page's JSON block
//   node scripts/copy-desk.mjs check [page.html]       the round trip must close before anything ships
//
// After a sync: node scripts/evidence-check.mjs (must be green), bump CACHE in
// room-8d41f2/sw.js, commit, push (GitHub Pages deploys main). Nothing here reaches a
// client: the room stays noindex and CLIENT_READY stays false until the rehearsal Day.

import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "room-8d41f2");
const CONTENT = join(ROOT, "content", "content.js");
const EVIDENCE_PATH = join(ROOT, "content", "evidence.js");
const GAS_KEYS = ["2", "1", "0", "-1", "-2"];

// ---------------------------------------------------------------- read

async function importFresh(path) {
  return import(pathToFileURL(path).href + "?t=" + Date.now() + Math.random());
}

function shortCite(key, ev) {
  if (key === "sfbt-scaling-questions") return "de Shazer & Berg";
  let first = (ev.src || "").split(",")[0].trim().replace(/\s+[A-Z]{1,3}$/, "");
  if (first.split(/\s+/).length > 3) first = first.split(/\s+/).slice(0, 3).join(" "); // institutional sources: the first three words
  const year = ((ev.src || "").match(/\b(19|20)\d{2}\b/) || [])[0];
  return first + (year ? " " + year : "");
}

// The words, lifted from a content module. Underscore fields are for the desk's
// eyes (citations to show beside a line) and are ignored on the way back.
export function wordsOf(c, evidence) {
  const cite = (keys) => (keys || []).map(k => evidence && evidence[k] ? shortCite(k, evidence[k]) : k);
  return {
    desk: 1,
    source: "room-8d41f2/content/content.js",
    room_law: c.ROOM_LAW,
    rules: [...c.RULES],
    followup: c.FOLLOWUP_FORM,
    domains: c.DOMAINS.map(d => ({
      code: d.code, name: d.name, desc: d.desc, opening: d.opening,
      a2: d.anchors[2], a5: d.anchors[5], a8: d.anchors[8], listen: d.listen,
      _cites: cite(d.evidence),
    })),
    lines: c.LINES.map(l => {
      const o = { pair: [...l.pair], tier: l.tier };
      if (l.name !== undefined) o.name = l.name;
      o.probe = l.probe;
      o._cites = cite(l.evidence);
      return o;
    }),
    gas: Object.fromEntries(GAS_KEYS.map(k => [k, c.GAS_LABELS[k]])),
    refusals: [...c.REFUSALS],
    privacy: c.PRIVACY_LINE,
    draft_line: c.DRAFT_LINE,
    lens_exit: c.LENS_EXIT_LABEL,
    paper_only: c.PAPER_ONLY_LABEL,
    screen: Object.assign({}, c.SECOND_SCREEN || {}),
  };
}

export async function currentWords() {
  const c = await importFresh(CONTENT);
  const { EVIDENCE } = await importFresh(EVIDENCE_PATH);
  return { words: wordsOf(c, EVIDENCE), content: c };
}

// ---------------------------------------------------------------- the page's block

const BLOCK = /(<script id="copy" type="application\/json">)([\s\S]*?)(<\/script>)/;

export function readPageWords(html) {
  const m = html.match(BLOCK);
  if (!m) throw new Error("the page has no <script id=\"copy\" type=\"application/json\"> block");
  return JSON.parse(m[2]);
}

export function writePageWords(html, words) {
  const json = JSON.stringify(words, null, 1).replace(/</g, "\\u003c");
  if (!BLOCK.test(html)) throw new Error("the page has no copy block to fill");
  return html.replace(BLOCK, (_, a, __, z) => a + json + z);
}

// ---------------------------------------------------------------- validate + merge

function str(v, where) {
  if (typeof v !== "string") throw new Error(where + " is not a string");
  const s = v.replace(/\s+/g, " ").trim();
  return s;
}
function need(v, where) { const s = str(v, where); if (!s) throw new Error(where + " is empty; the room needs a line there"); return s; }
function list(arr, where) {
  if (!Array.isArray(arr)) throw new Error(where + " is not a list");
  const out = arr.map((v, i) => str(v, where + "." + i)).filter(Boolean);
  if (!out.length) throw new Error(where + " would be empty");
  return out;
}

// The desk's words laid over the room's structure. Structure always comes from the
// content module in the repo: codes, pairs, tiers, evidence, workedBy, gate,
// METHOD_EVIDENCE, CLIENT_READY. Words come from the page. Nothing else moves.
export function merge(words, c) {
  if (!words || words.desk !== 1) throw new Error("not a desk words block (desk: 1)");
  if (!Array.isArray(words.domains) || words.domains.length !== c.DOMAINS.length) throw new Error("domain count differs from the room's");
  if (!Array.isArray(words.lines) || words.lines.length !== c.LINES.length) throw new Error("line count differs from the room's");
  const domains = c.DOMAINS.map((d, i) => {
    const w = words.domains[i];
    if (w.code !== d.code) throw new Error(`domain ${i} is ${w.code} on the desk and ${d.code} in the room`);
    const p = "domains." + d.code;
    return {
      code: d.code, name: need(w.name, p + ".name"), gate: d.gate,
      desc: need(w.desc, p + ".desc"), opening: need(w.opening, p + ".opening"),
      anchors: { 2: need(w.a2, p + ".a2"), 5: need(w.a5, p + ".a5"), 8: need(w.a8, p + ".a8") },
      listen: need(w.listen, p + ".listen"), evidence: [...(d.evidence || [])],
    };
  });
  const lines = c.LINES.map((l, i) => {
    const w = words.lines[i];
    const key = (a) => [...a].join("·");
    if (!Array.isArray(w.pair) || key(w.pair) !== key(l.pair)) throw new Error(`line ${i} is ${w.pair} on the desk and ${l.pair} in the room`);
    const p = "lines." + key(l.pair);
    const o = { pair: [...l.pair], tier: l.tier };
    if (l.name !== undefined) o.name = need(w.name, p + ".name");
    o.probe = need(w.probe, p + ".probe");
    if (l.workedBy) o.workedBy = [...l.workedBy];
    if (l.evidence) o.evidence = [...l.evidence];
    return o;
  });
  const gas = {};
  for (const k of GAS_KEYS) gas[k] = need(words.gas && words.gas[k], "gas." + k);
  const screen = {};
  for (const k of Object.keys(c.SECOND_SCREEN || {})) screen[k] = need(words.screen && words.screen[k], "screen." + k);
  return {
    RULES: list(words.rules, "rules"),
    ROOM_LAW: need(words.room_law, "room_law"),
    DOMAINS: domains,
    LINES: lines,
    FOLLOWUP_FORM: need(words.followup, "followup"),
    GAS_LABELS: gas,
    METHOD_EVIDENCE: [...c.METHOD_EVIDENCE],
    REFUSALS: list(words.refusals, "refusals"),
    PRIVACY_LINE: need(words.privacy, "privacy"),
    CLIENT_READY: c.CLIENT_READY,
    DRAFT_LINE: need(words.draft_line, "draft_line"),
    LENS_EXIT_LABEL: need(words.lens_exit, "lens_exit"),
    PAPER_ONLY_LABEL: need(words.paper_only, "paper_only"),
    SECOND_SCREEN: screen,
  };
}

// ---------------------------------------------------------------- generate content.js

const J = (s) => JSON.stringify(s);
const arr = (a) => "[" + a.map(J).join(", ") + "]";

export function render(m) {
  const out = [];
  out.push(`// THE INSTRUMENT'S WORDS. Every client-facing sentence in the room lives here, not in
// code. GENERATED by scripts/copy-desk.mjs from Jeremy's edit surface, the Copy Desk
// (jr-os-docs docs/strategy/living-map-copy-desk-2026-09-15.html): edit the words there,
// then sync; do not hand-edit this file, the next sync would overwrite it. His rewrite is
// final (RULINGS.md 2026-08-11, 2026-09-15). The structure (codes, pairs, tiers, evidence
// keys, the release flag) is the room's and is carried through every sync unchanged.
// Source of the first draft: the Mapping Protocol page
// (jr-os-docs docs/strategy/fortify-mapping-protocol-draft-2026-08-11.html).
// Evidence keys refer to content/evidence.js, generated from claims_ledger.
`);
  out.push("export const RULES = [");
  for (const r of m.RULES) out.push("  " + J(r) + ",");
  out.push("];\n");
  out.push("export const ROOM_LAW = " + J(m.ROOM_LAW) + ";\n");
  out.push("export const DOMAINS = [");
  for (const d of m.DOMAINS) {
    out.push("  {");
    out.push("    code: " + J(d.code) + ", name: " + J(d.name) + "," + (d.gate ? " gate: " + J(d.gate) + "," : ""));
    out.push("    desc: " + J(d.desc) + ",");
    out.push("    opening: " + J(d.opening) + ",");
    out.push("    anchors: {");
    for (const k of [2, 5, 8]) out.push("      " + k + ": " + J(d.anchors[k]) + ",");
    out.push("    },");
    out.push("    listen: " + J(d.listen) + ",");
    out.push("    evidence: " + arr(d.evidence) + ",");
    out.push("  },");
  }
  out.push("];\n");
  out.push("// The Model's 22 lines. tier 1 = keystone, 2 = named second, 3 = quiet line.");
  out.push("// Geometry pairs must match geometry.js LINKS exactly (the Model is the contract).");
  out.push("export const LINES = [");
  for (const l of m.LINES) {
    if (l.tier === 3) {
      out.push("  { pair: " + arr(l.pair) + ", tier: 3, probe: " + J(l.probe) + " },");
    } else {
      out.push("  { pair: " + arr(l.pair) + ", name: " + J(l.name) + ", tier: " + l.tier + ",");
      out.push("    probe: " + J(l.probe) + ",");
      out.push("    " + (l.workedBy ? "workedBy: " + arr(l.workedBy) + ", " : "") + "evidence: " + arr(l.evidence || []) + " },");
    }
  }
  out.push("];\n");
  out.push("export const FOLLOWUP_FORM = " + J(m.FOLLOWUP_FORM) + "; // sfbt-scaling-questions\n");
  out.push("export const GAS_LABELS = {");
  for (const k of GAS_KEYS) out.push("  " + J(k) + ": " + J(m.GAS_LABELS[k]) + ",");
  out.push("};\n");
  out.push("export const METHOD_EVIDENCE = [");
  for (const k of m.METHOD_EVIDENCE) out.push("  " + J(k) + ",");
  out.push("];\n");
  out.push("export const REFUSALS = [");
  for (const r of m.REFUSALS) out.push("  " + J(r) + ",");
  out.push("];\n");
  out.push("export const PRIVACY_LINE = " + J(m.PRIVACY_LINE) + ";\n");
  out.push("// Release state. The room shows none of the machinery; this flag shows one quiet");
  out.push("// line on the home screen until Jeremy's copy edit and the rehearsal Day land.");
  out.push("export const CLIENT_READY = " + (m.CLIENT_READY ? "true" : "false") + ";");
  out.push("export const DRAFT_LINE = " + J(m.DRAFT_LINE) + ";\n");
  out.push("export const LENS_EXIT_LABEL = " + J(m.LENS_EXIT_LABEL) + ";");
  out.push("export const PAPER_ONLY_LABEL = " + J(m.PAPER_ONLY_LABEL) + ";\n");
  out.push("// The second screen (the two-device console, his words 2026-09-15): what the client");
  out.push("// reads on his own device. Apparatus never; record always.");
  out.push("export const SECOND_SCREEN = {");
  for (const k of Object.keys(m.SECOND_SCREEN || {})) out.push("  " + k + ": " + J(m.SECOND_SCREEN[k]) + ",");
  out.push("};");
  return out.join("\n") + "\n";
}

// ---------------------------------------------------------------- compare

function snapshot(c) {
  const pick = ["RULES", "ROOM_LAW", "DOMAINS", "LINES", "FOLLOWUP_FORM", "GAS_LABELS", "METHOD_EVIDENCE", "REFUSALS", "PRIVACY_LINE", "CLIENT_READY", "DRAFT_LINE", "LENS_EXIT_LABEL", "PAPER_ONLY_LABEL", "SECOND_SCREEN"];
  return JSON.stringify(Object.fromEntries(pick.map(k => [k, c[k]])));
}

function flat(o, p = "", out = {}) {
  if (Array.isArray(o)) o.forEach((v, i) => flat(v, p + "." + i, out));
  else if (o && typeof o === "object") for (const k of Object.keys(o)) { if (k.startsWith("_")) continue; flat(o[k], p ? p + "." + k : k, out); }
  else out[p] = String(o);
  return out;
}
export function diffWords(a, b) {
  const fa = flat(a), fb = flat(b), out = [];
  for (const k of new Set([...Object.keys(fa), ...Object.keys(fb)])) if (fa[k] !== fb[k]) out.push({ path: k, was: fa[k], now: fb[k] });
  return out;
}

async function importRendered(text) {
  const dir = mkdtempSync(join(tmpdir(), "copy-desk-"));
  const p = join(dir, "content.js");
  writeFileSync(p, text);
  return importFresh(p);
}

// ---------------------------------------------------------------- commands

const [, , cmd, pageArg] = process.argv;
const pagePath = pageArg && pageArg;

if (cmd === "extract") {
  const { words } = await currentWords();
  process.stdout.write(JSON.stringify(words, null, 1) + "\n");
} else if (cmd === "build") {
  if (!pagePath) fail("build needs the page path");
  const { words } = await currentWords();
  const html = readFileSync(pagePath, "utf8");
  writeFileSync(pagePath, writePageWords(html, words));
  console.log("copy-desk: the page's words refreshed from content.js (" + Object.keys(flat(words)).length + " strings).");
} else if (cmd === "sync") {
  if (!pagePath) fail("sync needs the page path");
  const { words: before, content } = await currentWords();
  const incoming = readPageWords(readFileSync(pagePath, "utf8"));
  const merged = merge(incoming, content);
  const text = render(merged);
  const re = await importRendered(text);
  const { EVIDENCE } = await importFresh(EVIDENCE_PATH);
  const after = wordsOf(re, EVIDENCE);
  const back = diffWords(incoming, after);
  if (back.length) fail("the desk's words did not survive the round trip:\n" + back.map(d => `${d.path}: desk ${J(d.was)} became ${J(d.now)}`).join("\n"));
  const changes = diffWords(before, after);
  writeFileSync(CONTENT, text);
  console.log("copy-desk: content.js written. " + changes.length + " string" + (changes.length === 1 ? "" : "s") + " changed.");
  for (const d of changes) console.log("  " + d.path + "\n    was: " + d.was + "\n    now: " + d.now);
  console.log("next: node scripts/evidence-check.mjs; bump CACHE in room-8d41f2/sw.js; commit; push.");
} else if (cmd === "check") {
  const { words, content } = await currentWords();
  const { EVIDENCE } = await importFresh(EVIDENCE_PATH);
  // 1. content.js -> words -> content.js is stable (same exports, same text twice)
  const text1 = render(merge(words, content));
  const re1 = await importRendered(text1);
  if (snapshot(re1) !== snapshot(content)) fail("regenerating content.js from its own words changed an export");
  const text2 = render(merge(wordsOf(re1, EVIDENCE), re1));
  if (text2 !== text1) fail("the generator is not idempotent");
  const current = readFileSync(CONTENT, "utf8");
  console.log("check 1: content.js regenerates to identical exports" + (current === text1 ? ", and the file on disk is already in generated form." : "; the file on disk is hand-formatted (a sync will reformat it, words unchanged)."));
  // 2. the page's words -> content.js -> words closes
  if (pagePath) {
    const incoming = readPageWords(readFileSync(pagePath, "utf8"));
    const merged = merge(incoming, content);
    const re = await importRendered(render(merged));
    const after = wordsOf(re, EVIDENCE);
    const back = diffWords(incoming, after);
    if (back.length) fail("the page's words do not survive the round trip:\n" + back.map(d => `${d.path}: page ${J(d.was)} became ${J(d.now)}`).join("\n"));
    const changes = diffWords(words, incoming);
    console.log("check 2: the page's " + Object.keys(flat(incoming)).length + " strings round-trip to content.js and back intact; " + changes.length + " differ from the room today.");
    for (const d of changes) console.log("  " + d.path + ": " + J(d.was) + " -> " + J(d.now));
  }
  console.log("copy-desk: green.");
} else {
  console.log("usage: node scripts/copy-desk.mjs extract | build <page> | sync <page> | check [page]");
  process.exit(cmd ? 1 : 0);
}

function fail(msg) { console.error("COPY DESK FAILED\n" + msg); process.exit(1); }
