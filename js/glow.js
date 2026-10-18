// ============================================================
// glow.js — "Start a project" glows once on first sight
// Each primary "Start a project" button pulses twice the first
// time it scrolls into view. The header button only does it once
// per visit, so it doesn't repeat on every page. Skipped entirely
// under prefers-reduced-motion.
// ============================================================

const SEEN_KEY = 'ddct-cta-glow';

export function initGlow() {
  const buttons = document.querySelectorAll('a.btn-primary[href="/contact/"]');
  if (!buttons.length) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  let headerSeen = false;
  try {
    headerSeen = sessionStorage.getItem(SEEN_KEY) === '1';
  } catch (_) {}

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const btn = entry.target;
        io.unobserve(btn);
        if (btn.closest('.header')) {
          try {
            sessionStorage.setItem(SEEN_KEY, '1');
          } catch (_) {}
        }
        btn.classList.add('is-glowing');
        btn.addEventListener('animationend', () => btn.classList.remove('is-glowing'), { once: true });
      });
    },
    { threshold: 0.6 }
  );

  buttons.forEach((btn) => {
    // The drawer copy is hidden until the menu opens.
    if (btn.closest('.mobile-nav')) return;
    if (btn.closest('.header') && headerSeen) return;
    io.observe(btn);
  });
}
