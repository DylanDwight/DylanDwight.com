// ============================================================
// app.js — entry point (native ES module, no bundler)
// Each module is self-contained and safe to run on pages where
// its markup is absent.
// ============================================================

import { initNav } from './nav.js';
import { initTheme } from './theme.js';
import { initReveal } from './reveal.js';

initNav();
initTheme();
initReveal();
