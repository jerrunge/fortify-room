// The map engine. SVG, the Model's geometry, unveiling by rating.
// Nodes take light the instant the thumb moves; lines are pulled, never computed.

import { NODES, VIEWBOX, pairKey } from "./geometry.js";
import { LINES } from "../content/content.js";

const SVGNS = "http://www.w3.org/2000/svg";

const VALID_PAIRS = new Set(LINES.map(l => pairKey(l.pair[0], l.pair[1])));
export function lineDef(key) { return LINES.find(l => pairKey(l.pair[0], l.pair[1]) === key); }

// The light: fill interpolates from barely-there paper tones at 0 through slate
// to a deep lit blue at 10. All stops are the estate's own colors.
const STOPS = [[0, [0xA8, 0xAB, 0xA0]], [5, [0x46, 0x60, 0x6F]], [10, [0x24, 0x45, 0x5A]]];
export function lightFor(v) {
  let lo = STOPS[0], hi = STOPS[STOPS.length - 1];
  for (let i = 0; i < STOPS.length - 1; i++) if (v >= STOPS[i][0] && v <= STOPS[i + 1][0]) { lo = STOPS[i]; hi = STOPS[i + 1]; }
  const t = hi[0] === lo[0] ? 0 : (v - lo[0]) / (hi[0] - lo[0]);
  const c = lo[1].map((x, i) => Math.round(x + (hi[1][i] - x) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export class MapView {
  // handlers: { onNodeTap(code), onLineTap(key), onConnect(key) }
  constructor(svgEl, handlers) {
    this.svg = svgEl;
    this.handlers = handlers || {};
    this.connectFrom = null;
    this.svg.setAttribute("viewBox", VIEWBOX);
    this.svg.removeAttribute("role");
    this.svg.setAttribute("aria-label", "The map. Ten domains; each is a button.");

    const defs = document.createElementNS(SVGNS, "defs");
    defs.innerHTML = '<filter id="soften" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>';
    this.svg.append(defs);

    this.gGlow = document.createElementNS(SVGNS, "g");
    this.gLines = document.createElementNS(SVGNS, "g");
    this.gNodes = document.createElementNS(SVGNS, "g");
    this.gLabels = document.createElementNS(SVGNS, "g");
    this.caption = document.createElementNS(SVGNS, "text");
    this.caption.setAttribute("class", "map-caption");
    this.caption.setAttribute("x", "300"); this.caption.setAttribute("y", "608");
    this.caption.setAttribute("text-anchor", "middle");
    this.svg.append(this.gGlow, this.gLines, this.gNodes, this.gLabels, this.caption);
    this.nodeEls = {}; this.labelEls = {}; this.ghostEls = {};
    this.buildNodes();
  }

  buildNodes() {
    for (const [code, p] of Object.entries(NODES)) {
      const hit = document.createElementNS(SVGNS, "circle");
      hit.setAttribute("cx", p.x); hit.setAttribute("cy", p.y); hit.setAttribute("r", 34);
      hit.setAttribute("class", "node-hit");
      hit.setAttribute("role", "button");
      hit.setAttribute("tabindex", "0");
      hit.setAttribute("aria-label", p.name + ", not yet rated");
      hit.addEventListener("pointerdown", (e) => { e.preventDefault(); this.tapNode(code); });
      hit.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.tapNode(code); } });

      const glow = document.createElementNS(SVGNS, "circle");
      glow.setAttribute("cx", p.x); glow.setAttribute("cy", p.y);
      glow.setAttribute("class", "node-glow");
      glow.setAttribute("filter", "url(#soften)");
      glow.setAttribute("r", 0); glow.setAttribute("opacity", 0);

      const c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", p.x); c.setAttribute("cy", p.y);
      c.setAttribute("class", "node unrated");
      c.setAttribute("r", 7);

      const label = document.createElementNS(SVGNS, "text");
      label.setAttribute("x", p.lx); label.setAttribute("y", p.ly);
      label.setAttribute("text-anchor", p.anchor);
      label.setAttribute("class", "node-label unrated");
      label.textContent = p.name;

      const ghost = document.createElementNS(SVGNS, "text");
      ghost.setAttribute("x", p.x); ghost.setAttribute("y", p.y + 32);
      ghost.setAttribute("text-anchor", "middle");
      ghost.setAttribute("class", "node-ghost");

      const val = document.createElementNS(SVGNS, "text");
      val.setAttribute("x", p.x); val.setAttribute("y", p.y + 4.2);
      val.setAttribute("text-anchor", "middle");
      val.setAttribute("class", "node-value");

      this.gGlow.append(glow);
      this.gNodes.append(hit, c, val);
      this.gLabels.append(label, ghost);
      this.nodeEls[code] = { c, val, hit, glow };
      this.labelEls[code] = label;
      this.ghostEls[code] = ghost;
    }
  }

  tapNode(code) {
    if (this.connectFrom && this.connectFrom !== code) {
      const from = this.connectFrom;
      const key = pairKey(from, code);
      this.setConnectFrom(null);
      if (VALID_PAIRS.has(key)) { this.handlers.onConnect && this.handlers.onConnect(key); return; }
      this.handlers.onConnectInvalid && this.handlers.onConnectInvalid(from, code);
      return;
    }
    this.handlers.onNodeTap && this.handlers.onNodeTap(code);
  }

  setConnectFrom(code) {
    this.connectFrom = code;
    for (const [c, els] of Object.entries(this.nodeEls)) {
      els.c.classList.toggle("connect-from", c === code);
    }
  }

  render(session) {
    for (const [code, els] of Object.entries(this.nodeEls)) {
      const r = session && session.ratings[code];
      const rated = r && r.value !== null && r.value !== undefined;
      els.c.classList.toggle("unrated", !rated);
      this.labelEls[code].classList.toggle("unrated", !rated);
      if (rated) {
        els.hit.setAttribute("aria-label", NODES[code].name + ", rated " + r.value + " of 10");
        const radius = 9 + r.value * 1.7;
        els.c.setAttribute("r", radius);
        els.c.style.fill = lightFor(r.value);
        els.glow.setAttribute("r", radius + 13);
        els.glow.setAttribute("opacity", (0.06 + (r.value / 10) * 0.4).toFixed(2));
        els.val.textContent = String(r.value);
        const h = r.history || [];
        this.ghostEls[code].textContent = h.length ? `${h[h.length - 1].from} → ${r.value}` : "";
      } else {
        els.hit.setAttribute("aria-label", NODES[code].name + ", not yet rated");
        els.c.setAttribute("r", 7);
        els.c.style.fill = "";
        els.glow.setAttribute("opacity", 0);
        els.val.textContent = "";
        this.ghostEls[code].textContent = "";
      }
    }
    this.gLines.textContent = "";
    if (session) {
      for (const [key, l] of Object.entries(session.lines)) {
        const [a, b] = l.pair;
        const A = NODES[a], B = NODES[b];
        if (!A || !B) continue;
        if (l.keystone) {
          const under = document.createElementNS(SVGNS, "line");
          under.setAttribute("x1", A.x); under.setAttribute("y1", A.y);
          under.setAttribute("x2", B.x); under.setAttribute("y2", B.y);
          under.setAttribute("class", "line-under");
          under.setAttribute("stroke-width", l.loudness * 2.2 + 8);
          this.gLines.append(under);
        }
        const el = document.createElementNS(SVGNS, "line");
        el.setAttribute("x1", A.x); el.setAttribute("y1", A.y);
        el.setAttribute("x2", B.x); el.setAttribute("y2", B.y);
        el.setAttribute("class", "line" + (l.keystone ? " keystone" : ""));
        el.setAttribute("stroke-width", l.loudness * 2.2);
        el.setAttribute("opacity", (0.5 + l.loudness * 0.15).toFixed(2));
        const hit = document.createElementNS(SVGNS, "line");
        hit.setAttribute("x1", A.x); hit.setAttribute("y1", A.y);
        hit.setAttribute("x2", B.x); hit.setAttribute("y2", B.y);
        hit.setAttribute("class", "line-hit");
        hit.setAttribute("role", "button");
        hit.setAttribute("tabindex", "0");
        hit.setAttribute("aria-label", "Line " + NODES[a].name + " to " + NODES[b].name + ", loudness " + l.loudness + (l.keystone ? ", keystone" : "") + ". Activates louder.");
        hit.addEventListener("pointerdown", (e) => { e.preventDefault(); this.handlers.onLineTap && this.handlers.onLineTap(key); });
        hit.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); this.handlers.onLineTap && this.handlers.onLineTap(key); } });
        this.gLines.append(el, hit);
      }
    }
    this.caption.textContent = session && session.keystone.sentence
      ? "“" + session.keystone.sentence + "”" : "";
  }
}

// The arrival image: ten faint unlit points in the Model's geometry.
export function ghostMap() {
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("viewBox", VIEWBOX);
  for (const [code, p] of Object.entries(NODES)) {
    void code;
    const c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", 7);
    c.setAttribute("class", "ghost-node");
    svg.append(c);
    const t = document.createElementNS(SVGNS, "text");
    t.setAttribute("x", p.lx); t.setAttribute("y", p.ly); t.setAttribute("text-anchor", p.anchor);
    t.setAttribute("class", "ghost-label");
    t.textContent = p.name;
    svg.append(t);
  }
  return svg;
}
