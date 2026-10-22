// ============================================================
// app.js — entry point (native ES module, no bundler)
// Each module is self-contained and safe to run on pages where
// its markup is absent.
// ============================================================

import { initNav } from './nav.js';
import { initReveal } from './reveal.js';
import { initCaseStudy } from './case-study.js';
import { initContactForm } from './contact-form.js';

initNav();
initReveal();
initCaseStudy();
initContactForm();
