// THE ARSENAL, as plan-builder content. Source of truth for practice language and
// evidence: the Arsenal page (daily-system fortify-arsenal-c539a4.html), which renders
// from claims_ledger. The plan builder offers ONLY these; nothing is invented in the room.
// referral: true renders a name-and-number slot instead of a dose (referrals stay referrals).

export const KEYSTONE_PROTOCOLS = [
  { id: "paired-week", title: "The paired week", works: ["PH","ME"] },
  { id: "dyad-unit", title: "The dyad is the unit", works: ["SX","RL"] },
  { id: "affirm-before-deciding", title: "Affirm before deciding", works: ["FI","ID"] },
  { id: "parallel-pressures", title: "Parallel pressures, not a chain", works: ["PH","SX"] },
];

export const PRACTICES = [
  { id: "start-below-guideline", title: "Start below the guideline, not at it", domain: "PH" },
  { id: "pair-physical-psychological", title: "Pair the physical and the psychological inside one week", domain: "PH" },
  { id: "sleep-audit", title: "The fourteen-night sleep-opportunity audit", domain: "PH" },
  { id: "cbti-referral", title: "CBT-I when sleep is genuinely broken", domain: "PH", referral: true },
  { id: "behavioural-activation", title: "Behavioural activation", domain: "ME" },
  { id: "cyclic-sighing", title: "Cyclic sighing, five minutes a day", domain: "ME" },
  { id: "hrv-biofeedback", title: "HRV biofeedback", domain: "ME" },
  { id: "worry-postponement", title: "Worry postponement, done as stimulus control", domain: "ME" },
  { id: "meditation-scoped", title: "Meditation, honestly scoped", domain: "ME" },
  { id: "sleep-cognitive", title: "Sleep is the cognitive intervention", domain: "CG" },
  { id: "aerobic-exec", title: "Aerobic exercise for executive function, at honest size", domain: "CG" },
  { id: "aerobic-sexual", title: "Aerobic exercise, prescribed as a sexual-function intervention", domain: "SX" },
  { id: "attention-training", title: "Attention training against cognitive distraction", domain: "SX" },
  { id: "pelvic-floor", title: "Pelvic floor muscle training", domain: "SX" },
  { id: "sleep-real-size", title: "Sleep, stated at its real size", domain: "SX" },
  { id: "treat-one-both", title: "Treat one, both improve", domain: "RL" },
  { id: "couple-therapy", title: "Couple therapy, by referral", domain: "RL", referral: true },
  { id: "attachment-context", title: "Attachment as context, not intervention", domain: "RL" },
  { id: "work-interpretation", title: "Work the interpretation, not the calendar", domain: "SC" },
  { id: "social-connection-health", title: "Social connection as a health variable", domain: "SC" },
  { id: "stop-teaching-automate", title: "Stop teaching, start automating", domain: "FI" },
  { id: "work-identity-side", title: "Work the identity side, because that is the keystone", domain: "FI" },
  { id: "circadian-light", title: "Circadian light hygiene", domain: "EN" },
  { id: "purpose-measurable", title: "Purpose as a measurable variable", domain: "SP" },
  { id: "values-affirmation-writing", title: "Values affirmation writing", domain: "SP" },
  { id: "values-affirmation", title: "Values affirmation", domain: "ID" },
  { id: "job-crafting", title: "Job crafting", domain: "ID" },
  { id: "concealment-assessment", title: "Concealment, as assessment rather than exercise", domain: "ID" },
];
