// ============================================================
// app.js — entry point (native ES module, no bundler)
// Each module is self-contained and safe to run on pages where
// its markup is absent.
// ============================================================

import { initNav } from './nav.js';
// Dark mode only for now: theme.js (the light/dark toggle) is not loaded.
// To bring light mode back, restore this import and initTheme(), unhide
// the [data-theme-toggle] buttons, and restore the pre-paint script.
import { initReveal } from './reveal.js';
import { initCaseStudy } from './case-study.js';

initNav();
initReveal();
initCaseStudy();
