// ============================================================
// case-study.js — reading progress + table-of-contents scroll-spy
// Runs only on pages with [data-cs-progress] or .cs-toc. One
// rAF-throttled scroll handler drives everything, so scrolling
// does at most one round of layout reads per frame.
//
// - Top bar: --cs-progress (0–1) reveals the gradient; the tip's
//   color tracks the gradient; .is-complete makes the whole bar glow.
// - TOC rail: --cs-toc-fill (px) fills the rail down to the current
//   reading position; .is-complete glows once the last section
//   is reached.
// - Scroll-spy: aria-current="true" on the current section's link.
//
// Without JS the bar and rail are hidden and the TOC is still a
// plain list of working anchor links.
// ============================================================

const clamp = (n) => Math.min(Math.max(n, 0), 1);

export function initCaseStudy() {
  const progress = document.querySelector('[data-cs-progress]');
  const body = document.querySelector('.cs-body');
  const toc = document.querySelector('.cs-toc');
  const rail = document.querySelector('.cs-toc-rail');
  const links = [...document.querySelectorAll('.cs-toc a[href^="#"]')];
  if (!body || (!progress && !links.length)) return;

  const sections = links
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);

  // The tip's color is read from the same tokens the gradient uses, so it
  // follows the theme without hard-coding colors here.
  const styles = getComputedStyle(document.documentElement);
  const warm = styles.getPropertyValue('--color-warning').trim();
  const cool = styles.getPropertyValue('--color-primary').trim();
  const tipColor = (t) =>
    CSS.supports('color', 'color-mix(in oklch decreasing hue, red, blue)')
      ? `color-mix(in oklch decreasing hue, ${cool} ${(t * 100).toFixed(1)}%, ${warm})`
      : cool;

  // Link midpoints within the TOC list. Cached, and refreshed on resize,
  // since they only change when the layout does.
  let mids = [];
  let railHeight = 0;
  function measureRail() {
    if (!rail || !rail.offsetParent) {
      mids = [];
      return;
    }
    mids = links.map((link) => link.offsetTop + link.offsetHeight / 2);
    railHeight = rail.offsetHeight;
  }

  let active = null;
  let queued = false;

  function setActive(index) {
    if (index === active) return;
    active = index;
    links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function update() {
    queued = false;
    const vh = window.innerHeight;
    const atEnd = vh + window.scrollY >= document.documentElement.scrollHeight - 2;

    // ---- Top bar: 0 when the article's top reaches the viewport top,
    // 1 when its end scrolls into view.
    if (progress) {
      const rect = body.getBoundingClientRect();
      const total = rect.height - vh;
      const p = atEnd ? 1 : total > 0 ? clamp(-rect.top / total) : 1;
      progress.style.setProperty('--cs-progress', p.toFixed(4));
      progress.style.setProperty('--cs-tip', tipColor(p));
      progress.style.setProperty('--cs-tip-on', p > 0.002 && p < 0.999 ? '1' : '0');
      progress.classList.toggle('is-complete', p >= 0.999);
    }

    if (!sections.length) return;

    // ---- Scroll-spy: the current section is the last one whose top has
    // passed the upper third of the viewport. At the very bottom the last
    // section can be too short to reach that line, so it wins there.
    const line = vh * 0.33;
    const tops = sections.map((s) => s.getBoundingClientRect().top);
    let index = 0;
    tops.forEach((top, i) => {
      if (top <= line) index = i;
    });
    if (atEnd) index = sections.length - 1;
    setActive(index);

    // ---- TOC rail: fill from the current link toward the next one in
    // step with how far through the current section the reader is.
    if (mids.length) {
      const last = sections.length - 1;
      let fill;
      if (tops[0] > line) {
        fill = 0;
      } else if (atEnd) {
        fill = railHeight;
      } else {
        const end =
          index < last ? tops[index + 1] : body.getBoundingClientRect().bottom - vh + line;
        const span = end - tops[index];
        const t = span > 0 ? clamp((line - tops[index]) / span) : 1;
        const from = mids[index];
        const to = index < last ? mids[index + 1] : railHeight;
        fill = from + (to - from) * t;
      }
      const ratio = railHeight ? fill / railHeight : 0;
      toc.style.setProperty('--cs-toc-fill', `${fill.toFixed(1)}px`);
      toc.style.setProperty('--cs-toc-tip', tipColor(ratio));
      toc.style.setProperty('--cs-toc-tip-on', fill > 0 && index < last ? '1' : '0');
      // "Finished" glow as soon as the last section (Reflection) is reached.
      toc.classList.toggle('is-complete', index === last);
    }
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  function onResize() {
    measureRail();
    onScroll();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  // Web fonts can change link heights after first paint.
  if (document.fonts) document.fonts.ready.then(onResize);
  measureRail();
  update();
}
