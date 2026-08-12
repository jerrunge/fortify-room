// The Model's published geometry, verbatim (daily-system fortify-model-68cd06.html).
// The Model is the contract: the instrument's map IS the Model's map.

export const NODES = {
  PH: { x: 300.0, y: 85.0,  name: "Physical",      lx: 300.0, ly: 38.0,  anchor: "middle" },
  ME: { x: 426.4, y: 126.1, name: "Mental",        lx: 454.0, ly: 88.0,  anchor: "start" },
  CG: { x: 504.5, y: 233.6, name: "Cognitive",     lx: 549.2, ly: 219.0, anchor: "start" },
  SX: { x: 504.5, y: 366.4, name: "Sexual",        lx: 549.2, ly: 381.0, anchor: "start" },
  RL: { x: 426.4, y: 473.9, name: "Relational",    lx: 454.0, ly: 512.0, anchor: "start" },
  SC: { x: 300.0, y: 515.0, name: "Social",        lx: 300.0, ly: 562.0, anchor: "middle" },
  FI: { x: 173.6, y: 473.9, name: "Financial",     lx: 146.0, ly: 512.0, anchor: "end" },
  EN: { x: 95.5,  y: 366.4, name: "Environmental", lx: 50.8,  ly: 381.0, anchor: "end" },
  SP: { x: 95.5,  y: 233.6, name: "Spiritual",     lx: 50.8,  ly: 219.0, anchor: "end" },
  ID: { x: 173.6, y: 126.1, name: "Identity",      lx: 146.0, ly: 88.0,  anchor: "end" },
};

export const VIEWBOX = "-58 -14 716 628";

export function pairKey(a, b) { return [a, b].sort().join("·"); }
