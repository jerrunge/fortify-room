# A+ visual direction

These boards accompany `REPORT-UX-SECOND-OPINION.md`. They show the intended level of composition, hierarchy, restraint, legibility, and ceremony for a client paying $10,000 or more for a Mapping Day.

## Reference boards

- `a-plus-room-surfaces.png` shows Arrival, Live Map and Walk, Client Lens, Plan, Export Ceremony, and Day-90 Comparison.
- `a-plus-responsive-scales.png` shows the intended behavior across iPad landscape, iPad portrait, phone re-rate, and the printed Sheet.

## Important interpretation rule

These are art-direction references, not literal product specifications. They were generated to make the target look and feel visible.

Do not copy their placeholder domain names, sample ratings, wording, radial polygon, navigation, or invented fields. The repository is authoritative for:

- the ten Fortify domains;
- the Living Map geometry;
- Jeremy's client-facing copy in `room-8d41f2/content/content.js`;
- the design laws and refusals in `AGENTS.md`;
- the exact recorded fields and export behavior;
- provenance conventions;
- GAS ordering and locking behavior.

## What to carry into implementation

### Across every surface

- Treat the product as an editorial room instrument, not a dashboard.
- Use warm paper, ink, slate, and restrained rust with one sparse vermilion accent.
- Make hierarchy come from type, spacing, alignment, and rules rather than extra containers.
- Reserve boxes and filled controls for real actions. Informational labels must not look tappable.
- Keep essential mono text readable in daylight and across the table.
- Preserve generous whitespace while maintaining 44 to 48 pixel touch targets.
- Keep the main map visually dominant.

### Arrival

- Present one calm beginning gesture.
- Show the unlit map as intentional potential, not a faint or failed load.
- Keep device administration, backup setup, release status, and implementation vocabulary away from the client arrival.

### Live Map and Walk

- Preserve the map and editorial card split in landscape.
- Let the question, anchors, and rating bar read in that order at a glance.
- Keep map controls quiet but legible and reachable.
- Show real save status without competing with the conversation.

### Client Lens

- Make the map and rating action dominant.
- Keep apparatus out of sight and recorded information visible.
- Make the exit an explicit action that is reachable from Jeremy's side.
- Do not leave invisible mutating line targets active.

### Plan

- Use master-detail composition instead of one long wall of repeated cards where space permits.
- Give the active measure enough room for all five levels to read as a coherent authored object.
- Anchor expected level 0 without turning other levels into error states.
- Keep internal taxonomy out of client-facing labels.

### Close

- Treat the handoff as a ceremony with two clear artifacts: the printed Sheet and the living map file.
- Keep the complete record inspectable while making artifact readiness unmistakable.
- Show successful completion and the exact artifact created.
- Do not claim the review is complete unless every recorded field is represented.

### Day 90

- Use the same visual map language for day 0 and today.
- Let direction and exact deltas lead without adding interpretation.
- Provide visible correction before saving the comparison.
- On phone, use a focused single-domain step with explicit Back and Next actions.

### Printed Sheet

- Design the Sheet as a lasting physical artifact, not a browser printout.
- Use intentional pages, repeating table headers, protected rows, and ample writing space.
- Give long five-level measures a stacked layout rather than compressing them into one narrow cell.

## Suggested instruction for Claude

> Read `AGENTS.md`, `REPORT-UX-SECOND-OPINION.md`, and `design-reference/README.md`. Inspect both PNG boards for art direction. Treat the PNG content as illustrative only and preserve the repository's real domains, geometry, copy, data model, and design laws. Propose an implementation plan before changing code, ordered by the report's severity and release sequence.
