// ============================================================
// reveal.js — scroll-in reveal
// Progressive enhancement only: the CSS hides [data-reveal]
// solely when html.js is present, and never under
// prefers-reduced-motion. This module makes elements visible as
// they enter the viewport and does nothing when motion is reduced.
// ============================================================

export function initReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
  );
  els.forEach((el) => io.observe(el));
}
