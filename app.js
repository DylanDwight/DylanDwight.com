// ============================================================
// DYLAN DWIGHT — interactions
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) lucide.createIcons();

  // ---- Theme toggle ----
  const toggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let theme = matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', theme);
  updateToggleIcon();

  toggle &&
    toggle.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', theme);
      updateToggleIcon();
    });

  function updateToggleIcon() {
    if (!toggle) return;
    toggle.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
    toggle.innerHTML =
      theme === 'dark'
        ? '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
        : '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
  }

  // ---- Sticky header: hide on scroll down, show on scroll up ----
  const header = document.getElementById('site-header');
  let lastY = window.scrollY;
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      if (header) {
        header.classList.toggle('header--scrolled', y > 8);
        if (y > lastY && y > 120) header.classList.add('header--hidden');
        else header.classList.remove('header--hidden');
      }
      lastY = y;
    },
    { passive: true }
  );

  // ---- Mobile nav drawer ----
  const drawer = document.querySelector('[data-mobile-nav]');
  const openBtn = document.querySelector('[data-mobile-nav-open]');
  const closeBtns = document.querySelectorAll('[data-mobile-nav-close]');
  openBtn && drawer && openBtn.addEventListener('click', () => drawer.classList.add('is-open'));
  closeBtns.forEach((b) => b.addEventListener('click', () => drawer && drawer.classList.remove('is-open')));

  // ---- Scroll reveal ----
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }
});
