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

- His copy edit of every client-facing word, made on the Copy Desk (jr-os-docs
  `docs/strategy/living-map-copy-desk-2026-09-15.html`, his private edit page; his
  saves come back into `room-8d41f2/content/content.js` through
  `scripts/copy-desk.mjs`). His rewrite is final; the instrument is not client-ready
  until it lands.
- The live rehearsal Day (spec S9).
- The SX module carries the JER-84 licensed-therapist review gate.

## The Copy Desk (his edit surface, since 2026-09-15)

`content/content.js` is generated. The words live on the Copy Desk page in the vault;
Jeremy edits there and presses Save, which publishes a new version of that page. A
session then carries the words back:

1. Read the saved page (the artifact's current HTML, or the vault file after `build`).
2. `node scripts/copy-desk.mjs check <page.html>`: the round trip must close.
3. `node scripts/copy-desk.mjs sync <page.html>`: writes `content.js` (words his,
   structure the room's: codes, pairs, tiers, evidence keys, the release flag).
4. `node scripts/evidence-check.mjs`: must be green.
5. Bump `CACHE` in `room-8d41f2/sw.js`, commit, push. GitHub Pages deploys main.

A grammar comb is the only edit a session may make after a sync. Never hand-edit
`content.js`; the next sync overwrites it.

## The coach's side, the roster, the wide plan (built 2026-09-15 on his taps)

- **Settings** (`settings` at the foot of the arrival): the Cabinet's set-up, unlock,
  join, file-now and restore; this device's library (count, persistent storage, export
  the whole library, import a library file), the build in service, a reload to the latest
  build; the release state. Never on the arrival; nothing there is a client's.
- **The roster** (`manage` beside the practice heading): rename, archive (an archived
  group folds under the list), and a recoverable delete (an eight-second undo). A
  deletion writes a tombstone on the device and files an encrypted tombstone to the
  Cabinet, so a deleted session never returns from a pull on any device.
- **The plan, wide**: at 1180px and up the plan tab reads as a list beside the active
  measure (master-detail); narrower, one column as before.

## The second screen (the two-device console, his words 2026-09-15)

He drives the room on his Mac; the client opens a client version on his own device.
`second screen` in the map tools opens a room code (three words and a number) and a
link (`?join=cedar-tide-harbor-1234`). The client's screen shows everything recorded
and nothing of the apparatus: the map lit as it is rated, the current card with its
anchors, his own 0 to 10 bar, his words in the margin (a box on his screen; what he
types lands marked as his), the keystone once written, the plan as it is written.
Transport: `js/relay.js`, a hand-written Phoenix client on the estate's Supabase
Realtime, one ephemeral broadcast channel named by a hash of the code, nothing stored;
every message encrypted on the device (AES-GCM under a key derived from the code).
Jeremy's device is the record; the client's is a view with a bar. The solo room stays
offline-first; only the second screen needs a network. The words the client reads live
in `content.js` (`SECOND_SCREEN`) and so on the Copy Desk.

## The regression pass

`node scripts/replay-check.mjs [url]` drives a headless Chrome (the Mac's own) over
the DevTools protocol: loads each fixture in `archetypes/` through the room's file
door, checks the recorded state and the rendered map against the fixture, times load to
first paint, runs a blind day-90 pass through the wizard, and prints the Sheet to PDF on
Letter and A4 into `out/` (gitignored). Run it against the local dev server before a
deploy and against the deployed room after.

## Acceptance fixtures

`archetypes/a{1,2,3}.fortifymap.json` replay the Day dry run's three archetypes.
Load one via the home screen ("Open a map file") or `window.__fortify.load(...)`.

## Circle relay

Circle mode is private-by-default with share-by-gesture. Transport today:
BroadcastChannel (same-device demo) plus the honest no-relay degradation (show
your screen). The hosted ephemeral relay (room code, TLS, zero persistence) is a
deploy step at rehearsal; the transport seam is `Room` in `js/main.js`.
