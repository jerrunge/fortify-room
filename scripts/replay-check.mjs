// The regression pass (spec S9: archetype replays as regression; S5: the Sheet as a
// print-grade artifact). Drives a headless Chrome over the DevTools protocol, no library.
//   node scripts/replay-check.mjs [url]      default http://localhost:4181/
// For each fixture in archetypes/: load it through the room's own file door, compare the
// recorded state and the rendered map to the fixture, time the load, run a blind day-90
// re-rate through the wizard, and print the Sheet to PDF on Letter and A4 into out/.
import { spawn } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const URL_ = process.argv[2] || "http://localhost:4181/";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const fixtures = readdirSync(join(ROOT, "archetypes")).filter(f => f.endsWith(".json")).sort()
  .map(f => ({ name: f, data: JSON.parse(readFileSync(join(ROOT, "archetypes", f), "utf8")) }));
mkdirSync(join(ROOT, "out"), { recursive: true });

// ---- chrome + cdp
const profile = mkdtempSync(join(tmpdir(), "replay-"));
const chrome = spawn(CHROME, ["--headless=new", "--remote-debugging-port=0", "--user-data-dir=" + profile, "--no-first-run", "--window-size=1366,900", "about:blank"], { stdio: ["ignore", "pipe", "pipe"] });
const port = await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error("chrome did not announce DevTools")), 15000);
  chrome.stderr.on("data", (d) => { const m = String(d).match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//); if (m) { clearTimeout(t); resolve(m[1]); } });
});
const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0; const waiting = new Map(); const events = [];
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && waiting.has(m.id)) { const { res, rej } = waiting.get(m.id); waiting.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result); } else if (m.method) events.push(m); };
const cdp = (method, params = {}) => new Promise((res, rej) => { const i = ++id; waiting.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => { const r = await cdp("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error("page: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text)); return r.result.value; };
await cdp("Page.enable"); await cdp("Runtime.enable"); await cdp("Emulation.setDeviceMetricsOverride", { width: 1366, height: 900, deviceScaleFactor: 1, mobile: false });
await cdp("Page.navigate", { url: URL_ });
await new Promise(r => setTimeout(r, 2500));
const ready = await evaluate("!!(window.__fortify && window.__fortify.load)");
if (!ready) fail("the room did not boot at " + URL_);

// ---- the check that runs inside the page
const CHECK = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "replay-check.page.js"), "utf8");
const report = [];
for (const f of fixtures) {
  const r = await evaluate(`(${CHECK})(${JSON.stringify(f.data)})`);
  report.push({ fixture: f.name, ...r });
  // the Sheet: Letter and A4
  await evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent === 'Print the Sheet'); if (!b) throw new Error('no print button'); window.print = () => {}; b.click(); return true; })()`);
  await new Promise(r => setTimeout(r, 300));
  for (const [paper, w, h] of [["letter", 8.5, 11], ["a4", 8.27, 11.69]]) {
    const pdf = await cdp("Page.printToPDF", { paperWidth: w, paperHeight: h, printBackground: true, preferCSSPageSize: false, marginTop: 0.4, marginBottom: 0.4, marginLeft: 0.4, marginRight: 0.4 });
    const out = join(ROOT, "out", `${f.name.replace(".fortifymap.json", "")}-sheet-${paper}.pdf`);
    writeFileSync(out, Buffer.from(pdf.data, "base64"));
    report[report.length - 1][paper] = out.replace(ROOT + "/", "") + " · " + Math.round(Buffer.from(pdf.data, "base64").length / 1024) + " KB";
  }
}
ws.close(); chrome.kill();
let bad = 0;
for (const r of report) {
  console.log(`\n${r.fixture} · ${r.label} · load+render ${r.ms} ms`);
  for (const c of r.checks) { console.log(`  ${c.ok ? "ok  " : "FAIL"} ${c.name}${c.detail ? " · " + c.detail : ""}`); if (!c.ok) bad++; }
  console.log(`  pdf  ${r.letter}\n  pdf  ${r.a4}`);
}
console.log(bad ? `\nreplay-check: ${bad} check(s) failed` : `\nreplay-check: green. ${report.length} fixtures replayed, state and map intact, day-90 pass runs blind, sheets rendered on letter and a4.`);
process.exit(bad ? 1 : 0);
function fail(msg) { console.error("REPLAY CHECK FAILED\n" + msg); try { ws.close(); chrome.kill(); } catch (e) {} process.exit(1); }
