// The map engine. SVG, the Model's geometry, unveiling by rating.
// Nodes take light the instant the thumb moves; lines are pulled, never computed.

import { NODES, VIEWBOX, pairKey } from "./geometry.js";
import { LINES } from "../content/content.js";

const SVGNS = "http://www.w3.org/2000/svg";

const VALID_PAIRS = new Set(LINES.map(l => pairKey(l.pair[0], l.pair[1])));
export function lineDef(key) { return LINES.find(l => pairKey(l.pair[0], l.pair[1]) === key); }

export class MapView {
  // handlers: { onNodeTap(code), onLineTap(key), onConnect(key) }
  constructor(svgEl, handlers) {
    this.svg = svgEl;
    this.handlers = handlers || {};
    this.connectFrom = null;         // node code awaiting its pair
    this.svg.setAttribute("viewBox", VIEWBOX);
    this.gLines = document.createElementNS(SVGNS, "g");
    this.gNodes = document.createElementNS(SVGNS, "g");
    this.gLabels = document.createElementNS(SVGNS, "g");
    this.caption = document.createElementNS(SVGNS, "text");
    this.caption.setAttribute("class", "map-caption");
    this.caption.setAttribute("x", "300"); this.caption.setAttribute("y", "608");
    this.caption.setAttribute("text-anchor", "middle");
    this.svg.append(this.gLines, this.gNodes, this.gLabels, this.caption);
    this.nodeEls = {}; this.labelEls = {}; this.ghostEls = {};
    this.buildNodes();
  }

  buildNodes() {
    for (const [code, p] of Object.entries(NODES)) {
      const hit = document.createElementNS(SVGNS, "circle"); // generous touch target
      hit.setAttribute("cx", p.x); hit.setAttribute("cy", p.y); hit.setAttribute("r", 34);
      hit.setAttribute("class", "node-hit");
      hit.addEventListener("pointerdown", (e) => { e.preventDefault(); this.tapNode(code); });

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
      ghost.setAttribute("x", p.x); ghost.setAttribute("y", p.y + 30);
      ghost.setAttribute("text-anchor", "middle");
      ghost.setAttribute("class", "node-ghost");

      const val = document.createElementNS(SVGNS, "text");
      val.setAttribute("x", p.x); val.setAttribute("y", p.y + 4.5);
      val.setAttribute("text-anchor", "middle");
      val.setAttribute("class", "node-value");

      this.gNodes.append(hit, c, val);
      this.gLabels.append(label, ghost);
      this.nodeEls[code] = { c, val, hit };
      this.labelEls[code] = label;
      this.ghostEls[code] = ghost;
    }
  }

  tapNode(code) {
    if (this.connectFrom && this.connectFrom !== code) {
      const key = pairKey(this.connectFrom, code);
      const from = this.connectFrom;
      this.setConnectFrom(null);
      if (VALID_PAIRS.has(key)) { this.handlers.onConnect && this.handlers.onConnect(key); return; }
      // not one of the Model's 22 lines: fall through to a plain node tap on the second node
      void from;
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
    // nodes
    for (const [code, els] of Object.entries(this.nodeEls)) {
      const r = session && session.ratings[code];
      const rated = r && r.value !== null && r.value !== undefined;
      els.c.classList.toggle("unrated", !rated);
      this.labelEls[code].classList.toggle("unrated", !rated);
      if (rated) {
        els.c.setAttribute("r", 9 + r.value * 1.7);
        els.c.style.setProperty("--lum", String(r.value / 10));
        els.val.textContent = String(r.value);
        const h = r.history || [];
        this.ghostEls[code].textContent = h.length ? `${h[h.length - 1].from} → ${r.value}` : "";
      } else {
        els.c.setAttribute("r", 7);
        els.val.textContent = "";
        this.ghostEls[code].textContent = "";
      }
    }
    // lines
    this.gLines.textContent = "";
    if (session) {
      for (const [key, l] of Object.entries(session.lines)) {
        const [a, b] = l.pair;
        const A = NODES[a], B = NODES[b];
        if (!A || !B) continue;
        const hit = document.createElementNS(SVGNS, "line");
        hit.setAttribute("x1", A.x); hit.setAttribute("y1", A.y);
        hit.setAttribute("x2", B.x); hit.setAttribute("y2", B.y);
        hit.setAttribute("class", "line-hit");
        hit.addEventListener("pointerdown", (e) => { e.preventDefault(); this.handlers.onLineTap && this.handlers.onLineTap(key); });
        const el = document.createElementNS(SVGNS, "line");
        el.setAttribute("x1", A.x); el.setAttribute("y1", A.y);
        el.setAttribute("x2", B.x); el.setAttribute("y2", B.y);
        el.setAttribute("class", "line" + (l.keystone ? " keystone" : ""));
        el.setAttribute("stroke-width", l.loudness * 2.2);
        this.gLines.append(el, hit);
      }
    }
    // caption
    this.caption.textContent = session && session.keystone.sentence
      ? "“" + session.keystone.sentence + "”" : "";
  }
}
