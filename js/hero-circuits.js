// ============================================================
// hero-circuits.js — home hero circuit traces
// Spawns short circuit traces at random edges of the 3D logo
// panel; each draws in, carries a light pulse, then fades out
// after ~3s. Without JS, or under prefers-reduced-motion, the
// static traces already in the markup stay as they are.
// ============================================================

const NS = 'http://www.w3.org/2000/svg';
const W = 320;
const H = 220;
// Keep traces clear of the logo in the middle of the panel.
const KEEP = { x0: 95, x1: 225, y0: 35, y1: 185 };
const LIFETIME = 3000;
const MAX_LIVE = 9;

const rand = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.round(rand(min, max));

function makePoints() {
  const fromLeft = Math.random() < 0.5;
  const dx = fromLeft ? 1 : -1;
  const limit = fromLeft ? KEEP.x0 - 6 : KEEP.x1 + 6;
  let x = fromLeft ? 0 : W;
  let y = randInt(12, H - 34); // stay above the DESIGN × CODE label
  const pts = [[x, y]];
  const steps = randInt(2, 4);

  for (let k = 0; k < steps; k++) {
    x += dx * randInt(10, 34);
    const hitLimit = fromLeft ? x >= limit : x <= limit;
    if (hitLimit) x = limit;
    pts.push([x, y]);
    if (hitLimit || k === steps - 1) break;

    const ny = Math.max(8, Math.min(H - 30, y + (Math.random() < 0.5 ? -1 : 1) * randInt(8, 26)));
    if (Math.random() < 0.5) {
      // 45° jog, as long as it stays outside the keep-out zone
      const nx = x + dx * Math.abs(ny - y);
      if (fromLeft ? nx <= limit : nx >= limit) x = nx;
    }
    y = ny;
    pts.push([x, y]);
  }
  return pts;
}

function el(name, attrs) {
  const node = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  return node;
}

function spawn(layer) {
  const pts = makePoints();
  if (pts.length < 2) return;
  const d = 'M' + pts.map(([a, b]) => `${a} ${b}`).join(' L');
  const [ex, ey] = pts[pts.length - 1];

  const g = el('g', { class: 'circ' });
  g.append(
    el('path', { class: 'circ-trace', d, pathLength: 100 }),
    el('circle', { class: 'circ-node', cx: ex, cy: ey, r: 1.8 }),
    el('path', { class: 'circ-pulse', d, pathLength: 100 })
  );
  layer.append(g);

  setTimeout(() => {
    g.classList.add('is-out');
    setTimeout(() => g.remove(), 700);
  }, LIFETIME + rand(-400, 400));
}

export function initHeroCircuits() {
  const svg = document.querySelector('.hero-3d-circuits');
  if (!svg) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  svg.replaceChildren();
  const layer = el('g', { class: 'circ-live' });
  svg.append(layer);

  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(svg);
  }

  for (let i = 0; i < 4; i++) setTimeout(() => spawn(layer), i * 250);

  const tick = () => {
    if (visible && !document.hidden && layer.childElementCount < MAX_LIVE) spawn(layer);
    setTimeout(tick, rand(350, 800));
  };
  setTimeout(tick, 1000);
}
