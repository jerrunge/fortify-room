// room-cabinet: the Living Map's encrypted backup rail.
// Stores CIPHERTEXT ONLY. Encryption happens on Jeremy's device with a passphrase
// only he holds; nothing readable ever reaches this function or the table.
// Auth: a device token (pasted once per device into the app), checked against a
// SHA-256 hash embedded here. Rotate by redeploying with a new hash.
// verify_jwt=false is deliberate and load-bearing: the app calls this directly.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const TOKEN_HASH = "d12ab5b318b66c2d6a4c34c03cb3eda7be2cdff0951afdcbbca8022190e8f0d8";
const ALLOWED_ORIGINS = ["https://jerrunge.github.io", "http://localhost:4181"];

function cors(origin: string | null) {
  const o = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };
}

async function sha256hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  const headers = cors(req.headers.get("origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers });

  let body: any;
  try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "bad json" }), { status: 400, headers }); }

  if (!body.token || (await sha256hex(String(body.token))) !== TOKEN_HASH) {
    return new Response(JSON.stringify({ error: "bad token" }), { status: 403, headers });
  }

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  if (body.op === "put") {
    const { sync_id, updated_at, ciphertext } = body;
    if (!sync_id || !updated_at || typeof ciphertext !== "string") {
      return new Response(JSON.stringify({ error: "missing fields" }), { status: 400, headers });
    }
    if (ciphertext.length > 4_000_000) {
      return new Response(JSON.stringify({ error: "too large" }), { status: 413, headers });
    }
    const { error } = await db.from("room_cabinet").upsert({ sync_id, updated_at, ciphertext });
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    return new Response(JSON.stringify({ ok: true }), { headers });
  }

  if (body.op === "list") {
    const { data, error } = await db.from("room_cabinet").select("sync_id, updated_at");
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    return new Response(JSON.stringify({ ok: true, rows: data }), { headers });
  }

  if (body.op === "get") {
    if (!body.sync_id) return new Response(JSON.stringify({ error: "missing sync_id" }), { status: 400, headers });
    const { data, error } = await db.from("room_cabinet").select("*").eq("sync_id", body.sync_id).maybeSingle();
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    return new Response(JSON.stringify({ ok: true, row: data }), { headers });
  }

  return new Response(JSON.stringify({ error: "unknown op" }), { status: 400, headers });
});
