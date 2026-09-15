async function (fixture) {
  const checks = [];
  const ok = (name, cond, detail) => checks.push({ name, ok: !!cond, detail });
  const t0 = performance.now();
  window.__fortify.load(JSON.parse(JSON.stringify(fixture)));
  await new Promise(r => requestAnimationFrame(() => r()));
  const ms = Math.round(performance.now() - t0);            // load + first paint, the S1 gate
  await new Promise(r => setTimeout(r, 250));
  const walkTab = [...document.querySelectorAll(".tab")].find(b => b.textContent === "the walk"); walkTab.click();
  await new Promise(r => setTimeout(r, 150));
  const s = window.__fortify.get();
  // the recorded state is the fixture's
  const codes = Object.keys(fixture.ratings);
  ok("ratings match", codes.every(c => (s.ratings[c]?.value) === fixture.ratings[c].value), codes.length + " domains");
  ok("lines match", JSON.stringify(Object.keys(s.lines).sort()) === JSON.stringify(Object.keys(fixture.lines).sort()), Object.keys(fixture.lines).length + " lines");
  ok("keystone matches", s.keystone.sentence === fixture.keystone.sentence);
  ok("plan matches", JSON.stringify(s.plan.map(p => p.title)) === JSON.stringify(fixture.plan.map(p => p.title)), fixture.plan.length + " items");
  ok("gas levels match", JSON.stringify(s.plan.map(p => p.gas)) === JSON.stringify(fixture.plan.map(p => p.gas)));
  // the map renders the numbers it was given
  const vals = [...document.querySelectorAll("#map-svg .node-value")].map(t => t.textContent).filter(Boolean).map(Number).sort((a, b) => a - b);
  const want = codes.map(c => fixture.ratings[c].value).filter(v => v != null).sort((a, b) => a - b);
  ok("map lit as rated", JSON.stringify(vals) === JSON.stringify(want), vals.join(" "));
  ok("map lines drawn", document.querySelectorAll("#map-svg line.line").length === Object.keys(fixture.lines).length);
  ok("keystone captions the map", document.querySelector("#map-svg .map-caption").textContent.includes(fixture.keystone.sentence.slice(0, 20)));
  // the walk shows the first card with its anchors
  ok("walk card present", !!document.querySelector(".dcard .opening") && document.querySelectorAll(".dcard .anchors dd").length === 3);
  // the export review renders every domain the fixture rated
  const closeTab = [...document.querySelectorAll(".tab")].find(b => b.textContent === "the close"); closeTab.click();
  await new Promise(r => setTimeout(r, 150));
  const reviewHeads = [...document.querySelectorAll(".review-block h4")].map(h => h.textContent);
  const ratedCount = codes.filter(c => fixture.ratings[c].value != null).length;
  const reviewRated = reviewHeads.filter(h => /\u00b7 \d+$/.test(h)).length;
  ok("export review lists every rated domain", reviewRated === ratedCount, reviewRated + " of " + ratedCount);
  ok("raw file view present", !!document.querySelector(".rawfile"));
  // day 90: a blind pass through the wizard, then the comparison
  const before = s.rerates.length;
  window.__fortify.startRerate("full");
  await new Promise(r => setTimeout(r, 150));
  let day0Visible = false;
  for (let i = 0; i < 10; i++) {
    const card = document.querySelector("#rerate-body .dcard");
    if (card && /day 0/i.test(card.textContent) && /\d+ of 10/.test(card.querySelector(".ratebar")?.getAttribute("aria-label") || "")) day0Visible = true;
    const b = [...document.querySelectorAll("#rerate-body .ratebar button")].find(x => x.textContent === "6"); b.click();
    await new Promise(r => setTimeout(r, 60));
    const next = [...document.querySelectorAll("#rerate-body button")].find(x => /Next|Review the pass/.test(x.textContent)); next.click();
    await new Promise(r => setTimeout(r, 60));
  }
  ok("day-0 numbers stayed out of sight during the pass", !day0Visible);
  const rows = document.querySelectorAll("#rerate-body .delta-table tr").length;
  ok("review lists ten domains before saving", rows === 10, rows + " rows");
  ok("nothing recorded before confirm", window.__fortify.get().rerates.length === before);
  const confirm = [...document.querySelectorAll("#rerate-body button")].find(x => /Confirm/.test(x.textContent)); confirm.click();
  await new Promise(r => setTimeout(r, 150));
  ok("re-rate recorded on confirm", window.__fortify.get().rerates.length === before + 1);
  ok("comparison shows day 0 beside today", document.querySelectorAll("#rerate-body .compare-grid svg").length === 2 && document.querySelectorAll("#rerate-body .delta-table tr").length === 10);
  // back to the room, close tab, for the Sheet
  const back = [...document.querySelectorAll("#rerate-body button")].find(x => /Back to the room/.test(x.textContent)); back.click();
  await new Promise(r => setTimeout(r, 150));
  return { label: fixture.client_label, ms, checks };
}
