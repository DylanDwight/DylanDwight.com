// ============================================================
// hero-field.js — evolving contour field behind the hero mark
// Draws slowly shifting topographic lines from 3D simplex noise
// on a canvas inside .hero-3d. One contour band brightens and
// drifts through the levels, so the picture never repeats.
// Draws a single still frame under prefers-reduced-motion and
// pauses while the panel is off screen or the tab is hidden.
// ============================================================

// --- 3D simplex noise (Stefan Gustavson, public domain) ---
const GRAD = [
  [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
  [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
  [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];
const PERM = new Uint8Array(512);
(() => {
  const p = new Uint8Array(256).map((_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) PERM[i] = p[i & 255];
})();

function noise3(x, y, z) {
  const F3 = 1 / 3;
  const G3 = 1 / 6;
  const s = (x + y + z) * F3;
  const i = Math.floor(x + s);
  const j = Math.floor(y + s);
  const k = Math.floor(z + s);
  const t = (i + j + k) * G3;
  const x0 = x - (i - t);
  const y0 = y - (j - t);
  const z0 = z - (k - t);
  let i1, j1, k1, i2, j2, k2;
  if (x0 >= y0) {
    if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
    else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
    else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
  } else if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
  else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
  else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
  const offs = [
    [x0, y0, z0, 0, 0, 0],
    [x0 - i1 + G3, y0 - j1 + G3, z0 - k1 + G3, i1, j1, k1],
    [x0 - i2 + 2 * G3, y0 - j2 + 2 * G3, z0 - k2 + 2 * G3, i2, j2, k2],
    [x0 - 1 + 3 * G3, y0 - 1 + 3 * G3, z0 - 1 + 3 * G3, 1, 1, 1],
  ];
  const ii = i & 255;
  const jj = j & 255;
  const kk = k & 255;
  let n = 0;
  for (const [dx, dy, dz, a, b, c] of offs) {
    let tt = 0.6 - dx * dx - dy * dy - dz * dz;
    if (tt < 0) continue;
    const g = GRAD[PERM[ii + a + PERM[jj + b + PERM[kk + c]]] % 12];
    tt *= tt;
    n += tt * tt * (g[0] * dx + g[1] * dy + g[2] * dz);
  }
  return 32 * n; // roughly -1..1
}

const LEVELS = 11;
const CELL = 9; // CSS px per grid cell

export function initHeroField() {
  const panel = document.querySelector('.hero-3d');
  if (!panel) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-field';
  canvas.setAttribute('aria-hidden', 'true');
  panel.prepend(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0;
  let h = 0;
  let cols = 0;
  let rows = 0;
  let field = new Float32Array(0);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = panel.clientWidth;
    h = panel.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cols = Math.ceil(w / CELL) + 1;
    rows = Math.ceil(h / CELL) + 1;
    field = new Float32Array(cols * rows);
  };

  const draw = (t) => {
    const s = 0.008;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = c * CELL;
        const y = r * CELL;
        const v = noise3(x * s, y * s, t) * 0.7 + noise3(x * s * 2.1, y * s * 2.1, t * 1.4 + 9) * 0.3;
        field[r * cols + c] = v * 0.5 + 0.5;
      }
    }

    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    // The bright band drifts through the levels over time.
    const hot = ((t * 2.2) % 1) * LEVELS;

    for (let l = 1; l < LEVELS; l++) {
      const iso = l / LEVELS;
      const glow = Math.max(0, 1 - Math.abs(l - hot) / 1.6);
      ctx.strokeStyle = `rgba(${56 + glow * 130}, ${150 + glow * 80}, 248, ${0.1 + glow * 0.55})`;
      ctx.beginPath();
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          const a = field[r * cols + c];
          const b = field[r * cols + c + 1];
          const d = field[(r + 1) * cols + c];
          const e = field[(r + 1) * cols + c + 1];
          const idx = (a > iso) | ((b > iso) << 1) | ((e > iso) << 2) | ((d > iso) << 3);
          if (idx === 0 || idx === 15) continue;
          const x = c * CELL;
          const y = r * CELL;
          const top = [x + CELL * ((iso - a) / (b - a)), y];
          const right = [x + CELL, y + CELL * ((iso - b) / (e - b))];
          const bottom = [x + CELL * ((iso - d) / (e - d)), y + CELL];
          const left = [x, y + CELL * ((iso - a) / (d - a))];
          const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
          switch (idx) {
            case 1: case 14: seg(left, top); break;
            case 2: case 13: seg(top, right); break;
            case 3: case 12: seg(left, right); break;
            case 4: case 11: seg(right, bottom); break;
            case 5: seg(left, top); seg(right, bottom); break;
            case 6: case 9: seg(top, bottom); break;
            case 7: case 8: seg(left, bottom); break;
            case 10: seg(top, right); seg(left, bottom); break;
          }
        }
      }
      ctx.stroke();
    }
  };

  resize();
  const t0 = Math.random() * 100;
  if (reduce) {
    draw(t0);
    new ResizeObserver(() => { resize(); draw(t0); }).observe(panel);
    return;
  }
  new ResizeObserver(resize).observe(panel);

  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(panel);
  }

  let last = 0;
  const frame = (now) => {
    requestAnimationFrame(frame);
    if (!visible || document.hidden || now - last < 33) return; // ~30fps
    last = now;
    draw(t0 + now / 26000);
  };
  requestAnimationFrame(frame);
}
