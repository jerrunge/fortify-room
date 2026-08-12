// THE INSTRUMENT'S WORDS. This file is Jeremy's edit surface: every client-facing
// sentence in the room lives here, not in code. His rewrite is final (RULINGS.md
// 2026-08-11). Source of the current draft: the Mapping Protocol page
// (jr-os-docs docs/strategy/fortify-mapping-protocol-draft-2026-08-11.html).
// STATUS: SESSION DRAFT, awaiting his edit. Nothing here is client-ready until then.
// Evidence keys refer to content/evidence.js, generated from claims_ledger.

export const RULES = [
  "nothing administered ahead, ever",
  "his questions, their numbers",
  "record, do not recall",
  "same anchors both days",
  "the words go in the margin",
  "mechanism, never diagnosis",
  "nothing recorded the client does not see",
  "the client keeps the original",
];

export const ROOM_LAW = "Nothing lands on this sheet that you do not watch land.";

export const DOMAINS = [
  {
    code: "PH", name: "Physical",
    desc: "What the body can do, and what it costs to keep doing it.",
    opening: "Walk me through a normal day in your body. Sleep, movement, energy, waking to lights out.",
    anchors: {
      2: "Running on short nights and calling it fine. Energy borrowed from coffee and adrenaline. The body gets attention only when it fails.",
      5: "The basics happen most weeks. Sleep adequate, and the first thing traded away when work swells.",
      8: "Sleep protected like a meeting. Movement scheduled and kept. The 4pm hour as good as the 9am one.",
    },
    listen: "sleep rated “fine” while the evenings are flat · a fuse shorter than it used to be · short nights in the same season desire went quiet",
    evidence: ["crf-mortality", "ji-exercise-dose", "leproult-testosterone", "smd-073"],
  },
  {
    code: "ME", name: "Mental",
    desc: "The inner weather. Not the absence of illness, the presence of a good state.",
    opening: "When the calendar finally goes quiet, what shows up? Interest, restlessness, or not much at all?",
    anchors: {
      2: "Flat where things used to land. The good days are the busy ones, because busy drowns it out.",
      5: "Weather moves with load. Good stretches, heavy stretches, recoverable either way.",
      8: "A good state that is present, not just an absence of bad ones. Evenings with appetite in them.",
    },
    listen: "flatness arriving in the same season as the short nights · money worry sitting underneath the mood · who actually gets called on the heavy days",
    evidence: ["flourishing-172", "coaching-g059"],
  },
  {
    code: "CG", name: "Cognitive",
    desc: "Attention, memory and the machinery that carries them.",
    opening: "What does deep work cost you now, against what it cost you two years ago?",
    anchors: {
      2: "Rereading the same paragraph. Decisions deferred because the machinery feels loud. Sharpness remembered, not current.",
      5: "Focus available with effort. The best hours known, sometimes protected.",
      8: "Deep blocks land most days. Recall quick. Decisions made once.",
    },
    listen: "sharpness that fell in the same stretch as sleep · attention stolen by an open loop somewhere else on the map · the room it happens in",
    evidence: ["greendale-cognition"],
  },
  {
    code: "SX", name: "Sexual", gate: "jer-84",
    desc: "Desire and function, which move with sleep and stress before they move with hormones.",
    opening: "This domain gets the same seat as the other nine. How is desire, honestly, and when did it change?",
    anchors: {
      2: "Desire gone quiet and read as private failure. Distance growing on both sides of the bed. The subject avoided everywhere.",
      5: "Present but thinned by load. Moves with the calendar.",
      8: "Wanted, present, spoken about. Survives a heavy quarter.",
    },
    listen: "short nights in the same season · the quiet being read as a verdict on the marriage · what its silence is being made to say about the self",
    evidence: ["davis-consensus", "leproult-testosterone", "cayan-2004-partner-domains", "maseroli-2016-partner-hsd", "dubin-2021-blame"],
  },
  {
    code: "RL", name: "Relational",
    desc: "The people close enough to be affected by your condition.",
    opening: "Who lives inside the blast radius of your load? What do they get: the best hours, or what is left of them?",
    anchors: {
      2: "Present in the house, absent in the room. Conversations gone administrative. The partner declared “fine” quickly.",
      5: "Connection real but rationed. Repair happens after the storm, not during it.",
      8: "The partner gets first-quality hours, not remainders. Hard subjects have a place to land.",
    },
    listen: "the partner's experience moving with his state · the couple's wider world thinning · what home absorbs from work without being told",
    evidence: ["heiman-rct", "chew-meta-or3", "jiann-or-25-33", "shindel-2005-dyad-correlation", "attachment-r42"],
  },
  {
    code: "SC", name: "Social",
    desc: "The wider circle. Its absence is measured in mortality, not mood.",
    opening: "Two hundred contacts. On a bad Tuesday, who do you actually call?",
    anchors: {
      2: "A full room and no one to call. Friendship filed under later.",
      5: "A few live wires kept warm. Contact happens when scheduled.",
      8: "People who call him, and get answered. Belonging somewhere that is not the company.",
    },
    listen: "the network mistaken for the circle · what the circle does for the weather · where meaning gets made with other people",
    evidence: ["cigarettes-15"],
  },
  {
    code: "FI", name: "Financial",
    desc: "Security, and the standing that comes with it.",
    opening: "Set the numbers aside. What does money feel like right now: quiet, loud, or the scoreboard?",
    anchors: {
      2: "Loud regardless of the balance. Or the number is the identity, and every dip reads personally.",
      5: "Handled but watched. Security present, standing uncertain.",
      8: "Quiet. Money funds the life instead of grading it.",
    },
    listen: "the balance high while the self dims beside it · worry that does not read the balance · money arriving at home before it is spoken",
    evidence: ["lomas-financial-gap", "platt-pay-gap"],
  },
  {
    code: "EN", name: "Environmental",
    desc: "The rooms and the ground you spend your hours on.",
    opening: "Walk me through the rooms you spend your hours in. Light, order, outside time. What do they give back?",
    anchors: {
      2: "Screens to midnight, daylight rare, the desk a storage unit. The rooms take energy.",
      5: "Serviceable. Some order, some light, outside when convenient.",
      8: "Morning light. Evenings dimmed on purpose. At least one room that restores.",
    },
    listen: "the last two waking hours lit like noon · a workspace that taxes attention · rooms nobody has noticed in years",
    evidence: ["nature-120"],
  },
  {
    code: "SP", name: "Spiritual",
    desc: "What the work is for, underneath the roles.",
    opening: "Underneath the titles, what is the work for? When did you last feel that answer instead of reciting it?",
    anchors: {
      2: "The why went quiet when the scoreboard left. Days run on momentum, not meaning.",
      5: "Purpose visible on the good days, misplaced on the heavy ones.",
      8: "A why that survives a bad quarter. Chosen values with a container to act in.",
    },
    listen: "purpose unanchored after an exit or a role change · meaning moving the weather · the why with no room to live in",
    evidence: [],
  },
  {
    code: "ID", name: "Identity",
    desc: "Who you take yourself to be, and how much of it you can bring to work.",
    opening: "Introduce yourself without the company and the title. What is left, and how much of it gets to show up at work?",
    anchors: {
      2: "The company became the name. Or half the self stays in the car during working hours.",
      5: "A self that exists off the org chart, thinly attended.",
      8: "The whole story present. Work as one expression of the self, not its proof.",
    },
    listen: "the number as the scoreboard of the self · the why with nowhere to live · what desire's silence is being made to mean",
    evidence: ["covering-67", "transparency-72-57"],
  },
];

// The Model's 22 lines. tier 1 = keystone, 2 = named second, 3 = quiet line.
// Geometry pairs must match geometry.js LINKS exactly (the Model is the contract).
export const LINES = [
  { pair: ["FI","ID"], name: "Identity Fusion", tier: 1,
    probe: "When the money moved last, what moved in you?",
    evidence: ["lomas-financial-gap", "platt-pay-gap"] },
  { pair: ["PH","SX"], name: "Depletion Cascade", tier: 1,
    probe: "Put the last six months of sleep next to the last six months of desire. Same curve?",
    evidence: ["leproult-testosterone", "davis-consensus"] },
  { pair: ["PH","ME"], name: "Mind-Body Unity", tier: 1,
    probe: "When the body gets a good week, what happens to the weather?",
    evidence: ["smd-073"] },
  { pair: ["SX","RL"], name: "Intimacy Spillover", tier: 1,
    probe: "What is your quiet being read as, on the other side of the bed?",
    evidence: ["heiman-rct", "jiann-or-25-33"] },
  { pair: ["FI","ME"], name: "Financial Strain", tier: 2,
    probe: "Does the balance quiet the worry, or does the worry not read the balance?",
    workedBy: ["work-interpretation"], evidence: ["platt-pay-gap"] },
  { pair: ["SC","ME"], name: "Social Buffering", tier: 2,
    probe: "After the worst day this quarter, who heard about it first, and when?",
    workedBy: ["social-connection-health"], evidence: ["cigarettes-15"] },
  { pair: ["SP","ID"], name: "Purpose Anchor", tier: 2,
    probe: "When the role changed last, did the why survive the move?",
    workedBy: ["values-affirmation", "purpose-measurable"], evidence: ["covering-67"] },
  { pair: ["CG","PH"], name: "Cognitive Vitality", tier: 2,
    probe: "Your sharpest year: what was the body doing that year?",
    workedBy: ["sleep-cognitive", "aerobic-exec"], evidence: [] },
  { pair: ["ME","CG"], tier: 3, probe: "On the loud days, where does the first hour of focus go?" },
  { pair: ["SX","ID"], tier: 3, probe: "If desire stayed quiet a year, what would that say about you? Whose sentence is that?" },
  { pair: ["RL","SC"], tier: 3, probe: "Did the couple's world shrink when yours did?" },
  { pair: ["EN","PH"], tier: 3, probe: "What is the light doing in your last two waking hours?" },
  { pair: ["EN","CG"], tier: 3, probe: "What does your desk cost your attention?" },
  { pair: ["SP","ME"], tier: 3, probe: "On days the work means something, what is the weather like?" },
  { pair: ["FI","RL"], tier: 3, probe: "Where does money land at home: a topic, a tension, or a silence?" },
  { pair: ["ID","ME"], tier: 3, probe: "Which self are the hard days hardest on?" },
  { pair: ["SC","SP"], tier: 3, probe: "Where do you get to matter outside the P&L?" },
  { pair: ["RL","ME"], tier: 3, probe: "What follows you home, and what follows you back to work?" },
  { pair: ["PH","RL"], tier: 3, probe: "Who gets the body's best hours? Who gets the fumes?" },
  { pair: ["CG","ID"], tier: 3, probe: "When the sharpness dips, how fast does it become a story about you?" },
  { pair: ["EN","ME"], tier: 3, probe: "Which room lifts you, and which one have you stopped noticing?" },
  { pair: ["SC","ID"], tier: 3, probe: "In which room are you most yourself, and how often are you in it?" },
];

export const FOLLOWUP_FORM = "What would one point higher look like?"; // sfbt-scaling-questions

export const GAS_LABELS = {
  "2": "much better than expected",
  "1": "better than expected",
  "0": "the expected outcome, if the plan holds",
  "-1": "less than expected",
  "-2": "much less. Information, not failure: first agenda item next session.",
};

export const METHOD_EVIDENCE = [
  "structured-interviews-042",
  "mechanical-vs-clinical-10pct",
  "collaborative-assessment-d042",
  "cantril-ladder-140-countries",
  "sfbt-scaling-questions",
  "gas-idiographic-validated",
  "progress-feedback-d014-029",
];

export const REFUSALS = [
  "No composite score, index, or wellness number.",
  "No norms, percentiles, or benchmarks against other people.",
  "No categories. Nobody is labeled anything, ever.",
  "No traffic lights, red states, or alarm colors on a person's life.",
  "No suggested keystone, no AI interpretation, no auto-insight.",
  "No hidden fields. Nothing exists in the file you cannot see rendered.",
  "No measurement of the conversation: no timers, no talk analytics.",
  "No lockouts. Your data is never gated from you.",
];

export const PRIVACY_LINE = "Your map lives on this device and leaves only in your hand. Jeremy's working copy stays under his own lock, unreadable to anyone without his key.";

// Release state. The room shows none of the machinery; this flag shows one quiet
// line on the home screen until Jeremy's copy edit and the rehearsal Day land.
export const CLIENT_READY = false;
export const DRAFT_LINE = "internal rehearsal build · not yet for a client room";

export const LENS_EXIT_LABEL = "Back to Jeremy";
export const PAPER_ONLY_LABEL = "keep off the digital file (it still prints)";
