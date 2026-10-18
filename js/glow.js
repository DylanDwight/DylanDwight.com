// ============================================================
// glow.js — "Start a project" CTA ring
// Each primary "Start a project" button gets a glowing ring
// (.cta-ring) once it scrolls into view. The first time a ring
// appears it pulses twice; the header button only pulses once per
// visit, so it doesn't repeat on every page. Under
// prefers-reduced-motion the ring appears without the pulse.
// ============================================================

const SEEN_KEY = 'ddct-cta-glow';

export function initGlow() {
  const buttons = document.querySelectorAll('a.btn-primary[href="/contact/"]');
  if (!buttons.length) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let headerSeen = false;
  try {
    headerSeen = sessionStorage.getItem(SEEN_KEY) === '1';
  } catch (_) {}

  function ring(btn) {
    const inHeader = Boolean(btn.closest('.header'));
    btn.classList.add('cta-ring');
    if (reduce || (inHeader && headerSeen)) return;
    if (inHeader) {
      try {
        sessionStorage.setItem(SEEN_KEY, '1');
      } catch (_) {}
    }
    btn.classList.add('is-pulsing');
    btn.addEventListener('animationend', () => btn.classList.remove('is-pulsing'), { once: true });
  }

  // The drawer copy is hidden until the menu opens; leave it plain.
  const targets = [...buttons].filter((btn) => !btn.closest('.mobile-nav'));

  if (!('IntersectionObserver' in window)) {
    targets.forEach(ring);
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);
        ring(entry.target);
      });
    },
    { threshold: 0.6 }
  );
  targets.forEach((btn) => io.observe(btn));
}
