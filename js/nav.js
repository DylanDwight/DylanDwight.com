// ============================================================
// nav.js — mobile drawer
// Requirements this module meets:
//  - drawer is `hidden` when closed, so its links leave the tab order
//  - toggle carries aria-expanded / aria-controls
//  - focus moves into the drawer on open and returns to the toggle on close
//  - Escape closes; Tab is trapped inside while open
//  - background scroll is locked while open
// ============================================================

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function initNav() {
  const drawer = document.querySelector('[data-mobile-nav]');
  const openBtn = document.querySelector('[data-mobile-nav-open]');
  if (!drawer || !openBtn) return;

  const closeBtn = drawer.querySelector('[data-mobile-nav-close]');
  const desktopQuery = window.matchMedia('(min-width: 721px)');
  let lastFocused = null;

  function focusables() {
    return Array.from(drawer.querySelectorAll(FOCUSABLE)).filter(
      (el) => el.offsetParent !== null || el === document.activeElement
    );
  }

  function open() {
    lastFocused = document.activeElement;
    drawer.hidden = false;
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('is-locked');
    (closeBtn || focusables()[0] || drawer).focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close({ restoreFocus = true } = {}) {
    drawer.hidden = true;
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
    document.removeEventListener('keydown', onKeydown);
    if (restoreFocus && lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  openBtn.addEventListener('click', () => (drawer.hidden ? open() : close()));
  if (closeBtn) closeBtn.addEventListener('click', () => close());

  // Any in-drawer link closes the drawer; let the navigation proceed.
  drawer.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener('click', () => close({ restoreFocus: false }));
  });

  // If the viewport grows past the mobile breakpoint, make sure the
  // drawer is not left open behind the desktop nav.
  desktopQuery.addEventListener('change', (e) => {
    if (e.matches && !drawer.hidden) close({ restoreFocus: false });
  });

  // Initial state
  drawer.hidden = true;
  openBtn.setAttribute('aria-expanded', 'false');
}
