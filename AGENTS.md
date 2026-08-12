# AGENTS.md · fortify-room · the Living Map

Standing law for any agent working in this repo, plus the current commission at the
bottom. Written 2026-08-11 (Pacific) for a Codex second-opinion pass on UX/UI.

## What this is, and the stakes

The Living Map is the room instrument for Fortify's Mapping Day: an iPad on the table
between Jeremy (the coach) and a client, drawing a ten-domain map live while they talk.
The Day sells for $10,000. The clientele is high-earners: founders, executives, top
producers. They read imperfection as disrespect and as "I paid for something unfinished."
The quality bar is not "works." It is "feels worth the price in the first sixty seconds."

One session of real use looks like: morning conversation, client's thumb sets 0 to 10
per domain, lines pulled between domains, a keystone sentence written in the client's
own words, an afternoon plan with five-level measures, a printed Sheet plus a
.fortifymap file that leaves in the client's hand, a day-90 re-rate that compares maps
side by side.

## Run it

- Deployed: https://jerrunge.github.io/fortify-room/room-8d41f2/ (noindex, no analytics)
- Local: `python3 scripts/dev-server.py` then http://localhost:4181 (no build step,
  no dependencies; the dev server sends no-store so edits are always live)
- To see a real session: home screen, "Open a map file", pick `archetypes/a1.fortifymap.json`
  (a fictional archetype: founder running on six hours). a2 and a3 are siblings.
- Surfaces to review, all of them: home (the arrival), the walk (domain cards), the
  lines, keystone, the plan (including the GAS five-level editor and check-ins), the
  close (export review), about, the client lens ("face the client" in the map toolbar),
  the day-90 re-rate wizard and comparison (home, "Day-90 re-rate", open a1), and the
  printed Sheet (print preview from the close tab, plus the blank paper kit).
- Primary device target: iPad landscape, on a table, readable across it, daylight.
  Secondary: laptop, and phone for between-session re-rates only.

## The bar it is judged against

This app must read as the same design studio as the rest of the Fortify estate:

- The Model: https://jerrunge.github.io/daily-system/fortify-model-68cd06.html
- The Arsenal: https://jerrunge.github.io/daily-system/fortify-arsenal-c539a4.html

Same faces (Schibsted Grotesk / Newsreader / IBM Plex Mono, self-hosted in
`room-8d41f2/fonts/`), same paper palette (tokens at the top of `room-8d41f2/app.css`),
same register: editorial calm, mono micro-labels, rust accents, restraint.

## Deliberate design law: do not "fix" these

These are method and ruling, not oversights. Flag friction WITHIN them, never against them.

1. **The seam.** The machine renders, records, remembers, computes deltas, serves
   evidence. It never interprets, never suggests a keystone (the keystone field has no
   placeholder on purpose), never scores beyond: node light from rating, line weight
   from client-set loudness, deltas, and "n of m items at expected or better."
2. **The refusals.** No composite score, no norms or benchmarks, no categories, no
   traffic lights or alarm colors on a person's life, no hidden fields, no timers or
   talk analytics, no lockouts. If a suggestion adds one of these, it is wrong here.
3. **Nothing recorded is hidden from the client.** The export review renders every
   field. The client lens hides APPARATUS (probes, listen-fors, tabs), never RECORD.
4. **Provenance is a footnote, never a button.** Citations render as quiet dotted
   mono text ("de shazer & berg", "Myers 2002") opening a modal. This replaced a boxed
   "source" button that read as tap-to-continue. Keep this convention.
5. **GAS editor locks levels until "expected" (0) is written.** Method, not a bug.
   "-2" is deliberately framed as information, never failure.
6. **A moved rating leaves a visible ghost** ("moved 6 → 3 at 10:40"). Change is data.
7. **No sound, ever. No spinners. Offline is a supported mode.** Autosave on every
   touch; every session is its own IndexedDB record (the practice roster on home).
8. **The copy is Jeremy's lane.** Every client-facing word lives in
   `room-8d41f2/content/content.js`, awaiting his rewrite, which is final. Note copy
   problems as observations; do not treat rewording as a fix you land.
9. **Evidence is generated from a claims ledger** (`content/evidence.js`;
   `scripts/evidence-check.mjs` gates deploys). Never hand-edit claims.

## The commission: a second opinion on UX/UI

An affordance-level defect shipped recently and was caught by Jeremy, not by review:
a boxed button labeled "source" beside a question, reading as "tap here when you've
read this." The class: informational things dressed as actions, internal vocabulary
leaking to the room, labels naming states instead of actions. Siblings already swept:
ledger slugs on the about screen, "ledger status: corrected" in a client-facing modal,
an unlabeled change ghost, a "loudness → 2" button. Hunt the rest of this class, and
everything else a design lead would catch.

Walk every surface as two people:

1. **A first-time client** who has paid $10,000 and knows nothing about the app.
   At every interactive element: what would they think it does? What would they feel?
2. **Jeremy driving the room**: reachability of controls at a table, glanceability,
   error recovery mid-conversation, awkward moments (what happens on a mis-tap, on
   rotating the iPad, on a phone call interrupting).

Review at minimum: type hierarchy and rhythm, spacing consistency, touch targets,
contrast in daylight, motion (too much, too little, interrupted states), empty states
and first-run, the export ceremony's clarity, the day-90 wizard's pacing, the client
lens ergonomics (entering, rating, exiting), the printed Sheet as a physical artifact,
responsive behavior 768px to 1366px, landscape and portrait, keyboard focus states,
and VoiceOver labels on the map.

## Deliverable

One markdown report at repo root: `REPORT-UX-SECOND-OPINION.md`.

- Findings ranked by severity: A (would embarrass the room), B (client would notice),
  C (professional polish), D (nit). Each finding: the surface, the element, what a
  first-time client would think or feel, and a concrete suggested fix.
- Screenshots or exact selectors welcome. Suggested CSS may be included IN the report.
- Do not land code changes, do not push, do not touch `content/` or `archetypes/`.
  The report is the deliverable; Jeremy rules on it, and his rewrite is final.
- Plain language. No em dashes. Specific beats comprehensive.
