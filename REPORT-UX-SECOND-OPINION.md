# UX/UI second opinion

Reviewed 2026-08-11 at 768, 1024, and 1366 pixel widths, in landscape and portrait, using `archetypes/a1.fortifymap.json`. I walked the home, all six room tabs, client lens, day-90 re-rate and comparison, export review, populated Sheet, and blank-kit structure. I also checked keyboard semantics, accessible names, touch geometry, reduced motion, persistence behavior, and the responsive CSS.

## Verdict

The live map in iPad landscape has the right bones. The paper palette, type pairing, restrained rust, generous map field, and immediate node response feel like the Fortify estate. The loaded map is the most convincing surface in the product.

It is not ready for a paid room yet. Five findings are severity A. Three are direct examples of the commissioned defect class: internal production language shown to a client, a state label where an action is needed, and invisible interactive geometry. The most serious functional issue is the day-90 pass, where one mistaken tap advances immediately and becomes a permanent comparison with no way back.

## A. Would embarrass the room

### A1. Release gates and build machinery are client-facing

- **Surface:** Home, Sexual domain, About.
- **Element:** `.draftnote`; `.gate`; the last `.mono` paragraph in `renderAbout()`.
- **What a first-time client would think or feel:** The arrival says the instrument is an "internal draft," "not client-ready," and awaiting Jeremy's edit. Opening Sexual adds a red boxed "module gated: licensed-therapist review before client use (jer-84)." About ends with `claims_ledger (fortify-life-os)` and `scripts/evidence-check.mjs`. A client who paid $10,000 has just been told, three ways, that they are inside an unfinished internal tool.
- **Suggested fix:** Remove release status and implementation provenance from every room surface before use. Keep the evidence citations and client-facing method explanation. Put build gates in a preflight check that prevents Jeremy from opening an affected build, not in the client's card. This is a copy observation for Jeremy to rule on, not a request to edit `content/` by hand.

### A2. The export review says it shows every field, but it does not

- **Surface:** The close.
- **Element:** `renderClose()` and `.review-block`.
- **What a first-time client would think or feel:** The screen makes an unusually strong promise: "Everything the file contains is below." The file also contains plan `practice_ref`, `works`, all five GAS statements, check-ins, line `notes`, export history, rerate values, and document metadata. The review omits several of these. For the sample file, the carefully co-written five levels and the recorded `+1` check-in disappear from the review. The client cannot verify the artifact they are about to receive.
- **Suggested fix:** Generate the review from the exported object schema, with an explicit renderer for every field. At minimum, show every plan measure and check-in, every rerate value, line notes, and export history. Add a test that walks every leaf in `S.toFile()` and fails if no review renderer claims it. Keep technical identifiers out of the room by mapping them to plain labels, but do not omit the underlying record.

### A3. A day-90 mis-tap is immediately committed with no correction path

- **Surface:** Day-90 re-rate wizard and comparison.
- **Element:** `startRerate()`, `.ratebar`, `renderCompare()`.
- **What a first-time client would think or feel:** Tapping a number instantly replaces the whole card with the next domain. There is no selected-state pause, Back, Undo, review step, or Edit on the comparison. `finish()` records the rerate before the client sees the result. A thumb landing on 4 instead of 5 silently changes the outcome and cannot be corrected in the UI. The sudden advance also makes the ten questions feel like a speed test.
- **Suggested fix:** Keep the selected number visible and require a clear `Next domain` action, or provide a persistent Back control and a final ten-domain review before saving. Do not call `S.addRerate()` until that review is confirmed. After saving, provide a visible `Correct this pass` action that preserves provenance rather than overwriting history.

### A4. The map is presented as one image to VoiceOver, while its real controls are inaccessible

- **Surface:** Main map, line drawing, line loudness, client lens.
- **Element:** `#map-svg[role="img"]`, `.node-hit`, `.line-hit` in `MapView.buildNodes()` and `MapView.render()`.
- **What a first-time client would think or feel:** VoiceOver announces one image, "The map: ten domains, drawn as it is worked." The ten domain targets and drawn lines have no roles, names, values, state, or keyboard focus. A blind or motor-impaired client cannot select a domain, draw a line, or change loudness. Keyboard users cannot operate the central instrument at all.
- **Suggested fix:** Make each node a real keyboard-focusable SVG control with a name such as `Physical, rated 3 of 10`, and expose selected and connection states. Make each line focusable and name its two domains, loudness, and keystone state. Provide keyboard activation and an equivalent non-spatial list for drawing connections. Do not place interactive descendants inside a single `role="img"` accessibility boundary.

### A5. Client lens lets an invisible line target change the record

- **Surface:** Client lens.
- **Element:** `.line-hit` and `onLineTap: (key) => S.cycleLoudness(key)`.
- **What a first-time client would think or feel:** The lens removes the apparatus, but the transparent 24-unit hit area over every line remains live. A client can touch a line while pointing at the map and silently change its loudness. The only feedback is a subtle stroke-weight change. There is no label, confirmation, ghost, or undo, so neither person may notice the record changed.
- **Suggested fix:** In client lens, make lines read-only unless Jeremy explicitly enters a named line-edit mode. If line editing is intentionally available to the client, expose a visible control with the current value, an action label, and undo. Do not attach mutation to an invisible target in the presentation state.

## B. A client would notice

### B1. The arrival leads with coach apparatus and a privacy contradiction

- **Surface:** Home.
- **Element:** The `#cabinet-box` block and `PRIVACY_LINE` used later in Close and About.
- **What a first-time client would think or feel:** "The cabinet · encrypted backup, automatic," a passphrase, a device token, `Start the cabinet`, and `Join from another device` look like required onboarding. They make the client wonder where their life data is going before the day begins. Later the app says "No account, no cloud," even though the home explicitly offers remote encrypted backup. The encryption may be sound, but the visible story is contradictory.
- **Suggested fix:** Move cabinet setup behind a coach-only setup entry or a compact device-status disclosure. On arrival, show only the truthful status needed in the room. Align the privacy statement with the actual design: local-first, with optional client-unreadable encrypted backup when Jeremy has configured it.

### B2. The client-lens exit says `console`, names a state, and sits outside the natural thumb path

- **Surface:** Client lens.
- **Element:** `.lens-exit`.
- **What a first-time client would think or feel:** `console` sounds like developer vocabulary or a destination, not an action. It is a faint, dotted, 36-pixel-high control at the far right of a 760-pixel card. Jeremy has to reach across the client-facing edge of the table to recover his controls.
- **Suggested fix:** Use an action label such as `Return to Jeremy` or Jeremy's final wording, give it a standard 44 to 48 pixel target, and anchor it on Jeremy's side. Consider a second deliberate exit gesture in the map header so orientation changes cannot strand the room.

### B3. Portrait layout gives most of the screen to the map and crushes the working rail

- **Surface:** Main room at 768 by 1024.
- **Element:** `@media (max-width:900px)`, `.map-pane`, `#map-svg`, `.rail`.
- **What a first-time client would think or feel:** The CSS asks for a 46vh map, but the SVG's flex sizing keeps the map pane at roughly three quarters of the viewport in the tested portrait state. Only the tab strip and the top of the domain card remain visible. The conversation moves below a small nested scrolling window, and rotation causes a dramatic reflow at the exact moment the iPad is being passed.
- **Suggested fix:** Set `min-height:0` on the flex children that must shrink, give the portrait map an explicit bounded block size, and preserve a usable minimum rail height. Test both 768 by 1024 and 820 by 1180 with long Plan and Close content, including rotation while a field is focused.

### B4. Unlit and inactive elements disappear in daylight

- **Surface:** Home ghost map, tab bar, map labels, autosave status.
- **Element:** `.ghost-label`, `.ghost-node`, `.tab`, `#save-note`, `.node-label`.
- **What a first-time client would think or feel:** At iPad landscape, the home map is close to invisible and can read as a failed load rather than intentional unlit potential. Inactive tabs and autosave use `--silver` at about 10 to 11 pixels. Across a table in daylight, navigation and status vanish. Main-map domain labels are also very small once the SVG is fitted.
- **Suggested fix:** Preserve the unlit state but raise outline and label contrast enough to read as deliberate structure. Use at least a 12-pixel equivalent for mono navigation and status, with WCAG AA contrast for essential text. Keep silver for decoration, not instructions or state.

### B5. Connection errors are silent and secretly change the next action

- **Surface:** `draw a line` mode.
- **Element:** `MapView.tapNode()` and `setConnect()`.
- **What a first-time client would think or feel:** If the selected pair is not in `VALID_PAIRS`, no line appears and no explanation is shown. The second node silently becomes the new first node. Jeremy now thinks the gesture failed, while the app is armed for a different connection. Tapping the same node twice also gives no useful recovery.
- **Suggested fix:** Keep both chosen nodes visibly identified until the result is resolved. For an unavailable pair, say plainly that this pair is not part of the map and reset to a known state. Add `Cancel line` and an immediate undo for a created line.

### B6. Plan cards leak internal vocabulary and dress information as controls

- **Surface:** The plan.
- **Element:** `Add from the Arsenal…`, `.plan-item > .mono` (`works · ph`), and `.refchip`.
- **What a first-time client would think or feel:** "Arsenal" and `works · PH` sound like internal taxonomy. The rust-outlined `referral · a name and a number` chip looks tappable but is only a state label. This recreates the boxed-source problem in a different costume.
- **Suggested fix:** Keep internal taxonomy in data, not room copy. Present the selector as the concrete action it performs. Render referral information as ordinary supporting text or make it a real action that focuses the required contact fields. Remove button-like borders from non-actions.

### B7. `paper only` is a tiny state label for a consequential action

- **Surface:** Export review.
- **Element:** `.word-item label.mono input[type="checkbox"]`.
- **What a first-time client would think or feel:** A 13 by 13 checkbox followed by `paper only` does not say what tapping it will do. The actual consequence is important: the exact words stay on the printed Sheet but are replaced in the digital file. A client could reasonably read it as an existing status rather than a choice.
- **Suggested fix:** Give the whole row a 44-pixel target and frame it as an action with an immediate consequence, such as Jeremy's wording for keeping those words off the digital file. Show the resulting digital-file state inline, and offer one-tap reversal before handoff.

### B8. Autosave promises more than the persistence path can guarantee

- **Surface:** Main toolbar and all typed fields.
- **Element:** `#save-note`, `state.emit()`, `input()` and the keystone textarea.
- **What a first-time client would think or feel:** The interface always says `autosaved on every touch`. IndexedDB write failures are swallowed, so the message remains reassuring even after persistence fails. Text inputs save on `change`, not while typing. A call, crash, or app eviction before blur can lose the current sentence or measure while the screen still claims every touch is saved.
- **Suggested fix:** Track the actual write promise and render `Saving`, `Saved locally at 10:42`, or a clear recoverable failure. Save text on debounced `input` events. Test backgrounding, forced reload, storage denial, and rotation with text still focused.

### B9. The export ceremony is a long rail scroll with no completed state

- **Surface:** The close.
- **Element:** `renderClose()` and `.export-actions`.
- **What a first-time client would think or feel:** At 1024 landscape, only a few review cards fit in the rail. The actions sit several screens below. After Print, Download, or Share, there is no in-room confirmation, handoff checklist, or visible completion state. The client watches Jeremy scroll and then has to infer whether the ceremony worked.
- **Suggested fix:** Give Close a deliberate full-width review mode or a stable review index while keeping every record visible. Pin a compact handoff footer that reports real completion states, without hiding content. Confirm the exact artifact created and its filename after each successful action.

### B10. The day-90 comparison loses the map's visual finish

- **Surface:** Day-90 comparison, especially phone.
- **Element:** `.compare-grid`, `miniMap()`.
- **What a first-time client would think or feel:** The comparison dots render browser-default black instead of the map's slate light scale. Values disappear from the maps, and the fixed two-column layout makes labels too small on a phone. It looks like a diagnostic prototype beside the polished main map.
- **Suggested fix:** Reuse the same map renderer and visual tokens for mini maps, including readable values and an accessible summary. At phone widths, stack the maps or use a swipe-free vertical comparison with the exact delta table directly below each domain.

### B11. The printed artifact has no pagination protection

- **Surface:** Populated Sheet and blank paper kit.
- **Element:** `@media print`, `renderSheet()` tables, `.pagebreak`.
- **What a first-time client would think or feel:** The populated plan puts five long GAS statements into one 9.5-point, four-column table cell. Rows have no `break-inside: avoid`, headers are plain rows rather than repeating table headers, and only the start of the blank kit forces a page break. Long plan items, anchor rows, or probes can split across pages without their labels. The content is valuable, but the physical object risks looking like a browser printout.
- **Suggested fix:** Design explicit page templates: map and keystone, ratings and words, plan measures, then re-rates. Use real `thead`, repeating headers, row break protection, and intentional page breaks. Give long five-level measures a stacked block rather than a narrow table cell. Verify the populated A1 Sheet and blank kit as rendered PDFs on Letter and A4 before release.

## C. Professional polish

### C1. Several recurring touch targets miss the 44-pixel floor

- **Surface:** Walk, Lines, Plan, Close, client lens.
- **Element:** `.walk-dot` at 38px, `.chipbtn` at 40px, `.lens-exit` at 36px, citation links with no minimum height, and 13px export checkboxes.
- **What a first-time client would think or feel:** The primary number bar feels generous, but secondary controls demand more precision. On a table, a small miss can remove a line or plan item during conversation.
- **Suggested fix:** Make the full visual row or label tappable and use a 44 to 48 pixel minimum for all consequential controls. Keep quiet appearance through color and border treatment, not a small hit area.

### C2. Destructive actions have no recovery

- **Surface:** Lines, Plan, keystone ink.
- **Element:** `remove`, `remove item`, `Clear the ink`.
- **What a first-time client would think or feel:** One tap permanently removes a line, a fully written five-level plan item, or handwritten ink. There is no confirmation or undo. Jeremy has to stop the conversation and reconstruct work.
- **Suggested fix:** Use a short-lived, local Undo for removals and ink clearing. Preserve autosave provenance so undo restores the exact object. Avoid modal confirmations for every action, since undo is calmer in the room.

### C3. Dynamic screens lose focus and do not announce change

- **Surface:** Tabs, day-90 wizard, evidence modal.
- **Element:** `renderTabs()`, `step()`, `#modal-wrap`.
- **What a first-time client would think or feel:** Tab buttons are destroyed and rebuilt after selection, so keyboard focus disappears. Each re-rate choice replaces the card without moving focus to or announcing the new heading. The modal is a generic `div`, with no dialog role, accessible name, focus trap, focus return, or Escape handling.
- **Suggested fix:** Use proper tab semantics and retain the selected tab node. On wizard advance, focus the new domain heading and announce progress. Give the modal `role="dialog"`, `aria-modal="true"`, a labelled heading, Escape close, focus containment, and focus return.

### C4. Form labels are visually present but not programmatically attached

- **Surface:** Plan and keystone.
- **Element:** `labeled()`, `input()`, `.key-sentence`, `#ink-pad`.
- **What a first-time client would think or feel:** VoiceOver encounters unnamed edit fields for dose, cadence, contact, deadline, and GAS levels because the sibling `label` has no `for` relationship. The keystone textarea and handwriting canvas also lack names and instructions.
- **Suggested fix:** Give every input a stable `id` and matching label, including item title and GAS level in the accessible name. Label the keystone text field. Give the ink pad an accessible description and an equivalent way to inspect and clear its recorded state.

### C5. Tab state and rating state are only visual

- **Surface:** Main navigation, Walk, client lens, check-ins.
- **Element:** `.tab.on`, `.ratebar button.sel`, `.checkin-row button.circled`.
- **What a first-time client would think or feel:** A sighted client sees rust underline, dark selection, or green fill. Assistive technology hears ordinary buttons with no selected or current state. In client lens it hears only `0`, `1`, `2` and so on, without the domain name.
- **Suggested fix:** Add tablist, tab, and selected semantics. Give rating groups a domain label and expose `aria-pressed` or radio semantics. Do the same for the latest check-in level. Keep the visible restrained styling.

### C6. Home allows anonymous and accidental permanent sessions

- **Surface:** Home and practice roster.
- **Element:** `#client-label`, `#btn-start`, `.roster-row`.
- **What a first-time client would think or feel:** `Open the sheet` works with an empty label and immediately creates a durable roster entry shown as a dash. A mistaken start cannot be renamed, archived, or removed in the UI. Over time the arrival becomes a cabinet of test and duplicate sessions.
- **Suggested fix:** Require a deliberate label or offer a clearly named private placeholder before creation. Add a quiet coach-only session management path with rename, archive, and recoverable delete. Keep it away from the client arrival.

## D. Nit

### D1. Domain codes run into names in the accessibility tree

- **Surface:** Walk, client lens, day-90.
- **Element:** Headings built from `<span class="code">PH</span>` plus a text node.
- **What a first-time client would think or feel:** The accessible heading is exposed as `PHPhysical`, which may be spoken as one word. The code is useful visually but noisy when it has no separator.
- **Suggested fix:** Hide the decorative code from assistive technology or give the heading an explicit accessible name such as `Physical`.

## Recommended release order

1. Remove client-visible release and build language.
2. Make the export review truthful and complete.
3. Add day-90 review and correction before persistence.
4. Make the map operable and described for VoiceOver and keyboards.
5. Make client-lens lines read-only and replace `console` with a reachable action.
6. Resolve persistence truth, portrait sizing, and the home cabinet story.
7. Finish print pagination, touch targets, and semantic polish.

The reduced-motion rule is already present and appropriately restrained. The provenance footnote convention also reads correctly in the loaded Walk and Lines views. Those should remain intact while the issues above are corrected.
