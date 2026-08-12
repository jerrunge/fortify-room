# The Living Map (working name, Jeremy's to change)

The Fortify Mapping Protocol as a room instrument: an iPad on the table between
Jeremy and the client, drawing the map while the conversation works it. Built to the
spec at jr-os-docs `docs/strategy/fortify-living-map-spec-2026-08-11.html`, on his
commission ("A+ only. NOT MVP...MAXVP.") and his go ("Yes, build it."), RULINGS.md
2026-08-11.

## What it is

- **Local-first, offline-first PWA.** No accounts, no cloud, no telemetry. Session
  data lives on-device (localStorage autosave on every touch) and leaves only by
  explicit export: printed Sheet, downloaded `.fortifymap.json`, or share/AirDrop.
- **The map unveils; it never reveals.** Nodes take light the instant the client's
  thumb sets a number. Lines are pulled by hand on the Model's 22 published pairs
  only. Changes ghost visibly; a moved number is data, never an error.
- **The seam.** The machine renders, records, remembers, computes deltas, serves
  evidence. It never interprets, never proposes a keystone, and computes nothing
  beyond the spec's scoring table. Its refusals render in the app (about tab).
- **Evidence pipeline.** Every claim chip is generated from `claims_ledger`
  (Supabase project fortify-life-os). `scripts/evidence-check.mjs` fails if any
  embedded row is missing, failed, or text-drifted. A claim retired in the ledger
  cannot ship.

## Running

Serve `room-8d41f2/` from any static server. No build step, no dependencies.
Deploys as GitHub Pages; the directory name is the estate's hashed-URL pattern.

## Gates that are Jeremy's, not buildable around

- His edit of `room-8d41f2/content/content.js` (all client-facing words). His
  rewrite is final; the instrument is not client-ready until it lands.
- The live rehearsal Day (spec S9).
- The SX module carries the JER-84 licensed-therapist review gate.

## Acceptance fixtures

`archetypes/a{1,2,3}.fortifymap.json` replay the Day dry run's three archetypes.
Load one via the home screen ("Open a map file") or `window.__fortify.load(...)`.

## Circle relay

Circle mode is private-by-default with share-by-gesture. Transport today:
BroadcastChannel (same-device demo) plus the honest no-relay degradation (show
your screen). The hosted ephemeral relay (room code, TLS, zero persistence) is a
deploy step at rehearsal; the transport seam is `Room` in `js/main.js`.
