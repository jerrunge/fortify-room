// The evidence gate: a claim retired in the ledger cannot ship in the instrument.
// Verifies that (1) every claim key cited by content.js exists in evidence.js,
// (2) every embedded row still exists in claims_ledger with status verified or
// corrected, and (3) no embedded claim text drifted from the ledger's text.
// Run before any deploy:  node scripts/evidence-check.mjs
// Credentials: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY from env or ~/.env.local
// (fortify-life-os project; same loader convention as the chart-house dragnet).

import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "room-8d41f2");
const { EVIDENCE } = await import(join(root, "content", "evidence.js"));
const content = await import(join(root, "content", "content.js"));

// 1. every cited key resolves locally
const cited = new Set(content.METHOD_EVIDENCE);
for (const d of content.DOMAINS) (d.evidence || []).forEach(k => cited.add(k));
for (const l of content.LINES) (l.evidence || []).forEach(k => cited.add(k));
cited.add("sfbt-scaling-questions");
const missingLocal = [...cited].filter(k => !EVIDENCE[k]);
if (missingLocal.length) fail("cited by content.js but absent from evidence.js: " + missingLocal.join(", "));

// 2 + 3. live check against the ledger
function loadEnv() {
  const env = { SUPABASE_URL: process.env.SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY };
  const p = join(homedir(), ".env.local");
  if (existsSync(p)) for (const line of readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^(SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=["']?([^"']+)["']?/);
    if (m && !env[m[1]]) env[m[1]] = m[2];
  }
  return env;
}
const env = loadEnv();
if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log("evidence-check: OFFLINE (no ledger credentials). Local citation integrity passed;");
  console.log("the live ledger check is REQUIRED before deploy. Exit 2 so CI cannot green-light this.");
  process.exit(2);
}
const keys = Object.keys(EVIDENCE);
const res = await fetch(env.SUPABASE_URL + "/rest/v1/claims_ledger?select=claim_key,claim,status&claim_key=in.(" + keys.map(k => `"${k}"`).join(",") + ")", {
  headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY },
});
if (!res.ok) fail("ledger unreachable: HTTP " + res.status);
const rows = await res.json();
const byKey = Object.fromEntries(rows.map(r => [r.claim_key, r]));

const problems = [];
for (const k of keys) {
  const row = byKey[k];
  if (!row) { problems.push(`${k}: NOT IN LEDGER`); continue; }
  if (row.status !== "verified" && row.status !== "corrected") problems.push(`${k}: ledger status is ${row.status.toUpperCase()}`);
  if (row.claim.trim() !== EVIDENCE[k].claim.trim()) problems.push(`${k}: claim text drifted from the ledger. Regenerate evidence.js.`);
}
if (problems.length) fail(problems.join("\n"));
console.log(`evidence-check: green. ${keys.length} embedded rows all live in the ledger, verified or corrected, text intact.`);

function fail(msg) { console.error("EVIDENCE CHECK FAILED\n" + msg); process.exit(1); }
