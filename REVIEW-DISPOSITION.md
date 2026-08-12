# Disposition of the Codex second opinion

Reviewed and applied 2026-08-11 late (Pacific) by the building session. Every finding
was verified against the running app before its disposition. Jeremy's rewrite remains
final on all copy.

## Applied in full

- **A1** Client-visible machinery removed: the draft status is one quiet line on home
  driven by `CLIENT_READY` in content.js; the SX gate chip is gone from the card (the
  gate is a release condition, enforced by the flag, not client reading); the About
  machinery sentence replaced with the client-true verification sentence.
- **A2** The export review now renders every field: full GAS levels, check-ins, line
  notes, re-rate values, export and room log history, session metadata, plus a
  collapsible raw-file view that makes "everything the file contains" structurally
  true rather than a promise.
- **A3** The day-90 pass is deliberate: selection stays visible, explicit Back and
  Next (Next locked until a number is chosen), a full ten-domain review screen, and
  nothing is recorded until Confirm. The comparison offers "Redo this pass" and the
  earlier pass stays on the record.
- **A4** The map is a real control surface: nodes and lines are focusable buttons
  with names and values ("Physical, rated 3 of 10"), keyboard activation works, and
  the lines tab gained a list-based way to draw any of the twenty-two lines without
  touching the map.
- **A5** In the client lens, lines are read-only; the invisible mutating target is gone.
- **B2** The lens exit is "Back to Jeremy" (content.js, his wording to change), 46px,
  anchored on his side of the card.
- **B3** Portrait truth: `min-height:0` on the flex children, the map bounded at
  42vh with a 300px floor, the rail keeps a working height.
- **B4** Daylight contrast: tabs and status up to slate at readable sizes, ghost map
  reads as deliberate structure, map labels enlarged.
- **B5** Line drawing speaks: an unavailable pair is named plainly and the armed
  state resets; a drawn line is confirmed with where its probe lives.
- **B7** Paper-only is a full-height labeled row with the consequence stated
  (content.js wording, his to change).
- **B8** The save line tells the truth: "saved locally 21:44" from the actual write
  promise, a red failure state that says export now, and typed fields save on
  debounced input, not blur.
- **B9** Export actions lead the tab and every completion confirms the exact
  artifact by name.
- **B10** The comparison uses the map's own light: lit fills, values, full domain
  names, stacked on phone widths.
- **B11** The Sheet paginates like an artifact: repeating table headers, protected
  rows, and each five-level measure as its own unbreakable stacked block, blank kit
  included.
- **C1** Touch floors: walk dots and chips at 44, lens exit 46, citations keep the
  footnote look over a 44px hit area, paper-only rows 48.
- **C2** Undo instead of confirmation dialogs: removed lines, removed plan items,
  and cleared ink offer a calm 8-second undo that restores the exact object.
- **C3/C4/C5/D1** Dialog semantics with Escape and focus return, tablist and
  radiogroup roles with selected state, labels attached to every plan and GAS field,
  named keystone textarea and ink pad, decorative domain codes hidden from
  assistive tech, wizard focuses each new domain heading.
- **B6 (partial)** `works · PH` now renders full domain names; the referral chip no
  longer looks tappable.

## Applied with a different shape

- **B1** The cabinet no longer front-loads the arrival: collapsed to one status line
  with a quiet "Set up" toggle. The privacy line now tells the true story (device
  copy in the client's hand; Jeremy's working copy under his own lock). A separate
  coach-only settings surface can follow if Jeremy wants the block out of home
  entirely.

## Rejected, with reasons

- **B6 (partial)** "Add from the Arsenal…" keeps its name. The Arsenal is the
  estate's client-facing name for the practice library (it is a public Toolkit
  page), not internal taxonomy.
- **C6 (partial)** Empty-label sessions: already impossible in the current build
  (the start button refuses and focuses the field); likely observed on a stale
  cached build. The roster-management ask (rename, archive, recoverable delete) is
  real and deferred as a named follow-up for Jeremy to prioritize.

## Deferred, named

- Full master-detail plan composition on wide screens (design-reference board 4).
- A coach-only settings surface consolidating cabinet and device administration.
- Roster management (rename, archive, recoverable delete with undo).
- Rendered-PDF verification of the Sheet on Letter and A4 (belongs to the rehearsal
  Day checklist).
