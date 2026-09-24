// ============================================================
// theme.js — light / dark toggle with persistence
// The pre-paint decision (saved choice, else OS preference) runs
// inline in <head> so the page never flashes. This module only
// wires the button and keeps the saved choice in sync.
// ============================================================

const STORAGE_KEY = 'ddct-theme';

function current() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (_) {
    /* storage unavailable (private mode, etc.) — toggle still works for this page */
  }
}

function label(btn, theme) {
  const next = theme === 'dark' ? 'light' : 'dark';
  btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
  btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
}

export function initTheme() {
  const buttons = document.querySelectorAll('[data-theme-toggle]');
  if (!buttons.length) return;

  buttons.forEach((btn) => label(btn, current()));

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = current() === 'dark' ? 'light' : 'dark';
      apply(next);
      buttons.forEach((b) => label(b, next));
    });
  });

  // Follow the OS if the user has never chosen explicitly.
  const osDark = window.matchMedia('(prefers-color-scheme: dark)');
  osDark.addEventListener('change', (e) => {
    let saved = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch (_) {}
    if (saved) return;
    const theme = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    buttons.forEach((b) => label(b, theme));
  });
}
