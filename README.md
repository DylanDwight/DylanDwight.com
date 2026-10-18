# DylanDwight.com

Source code for [dylandwight.com](https://dylandwight.com) — the portfolio and services site of Dylan Dwight Creative Technologies: web design and front-end development for restaurants, artists, musicians, and small businesses.

## Overview

A hand-built, dependency-free static site focused on clarity, accessibility, performance, and a maintainable design system.

- No build step, no framework, no bundler, no runtime third-party scripts
- Semantic HTML, one `h1` per page, landmark regions, visible skip link
- Design-token-driven CSS, dark theme only (the light theme and toggle were removed in Oct 2026 and are in git history)
- Native ES modules for the small amount of JavaScript (nav drawer, scroll reveal, case study progress)
- Works without JavaScript; respects `prefers-reduced-motion`
- Per-page metadata, Open Graph / Twitter cards, JSON-LD (`ProfessionalService`, `Person`, `WebSite`), `robots.txt`, `sitemap.xml`, branded 404

## Structure

```
index.html              Home
services/index.html     Services
about/index.html        About (copy from the Phase 1 spec, section 7)
work/index.html         Work index (finished projects only; in-progress coursework stays on Home)
work/sand-dollar/index.html      Sand Dollar case study (HTML, same copy as the PDF)
work/sand-dollar-case-study.pdf   Sand Dollar case study (10-page PDF download)
resume/dylan-dwight-resume.pdf   Résumé (linked from the footer, drawer, and Work page)
contact/index.html      Contact / project inquiry
404.html                Not found (served automatically by Vercel)
robots.txt, sitemap.xml
favicon.ico, site.webmanifest   Root icon fallback and manifest (icons exported from assets/favicon.svg)

css/
  tokens.css            Colors, type scale, spacing, radii, shadows, fonts
  base.css              Reset, element defaults, focus styles, reduced motion, skip link
  components.css        Header, drawer, footer, buttons, cards, fact strip, process,
                        CTA panel, page hero, placeholder frames, reveal
  pages.css             Page-specific layouts (home, services, contact, 404)

js/
  app.js                Entry (type="module"); imports the modules below
  nav.js                Mobile drawer: hidden when closed, aria-expanded, focus trap, Escape
  case-study.js         Case study reading progress bar and table-of-contents scroll-spy
  reveal.js             Scroll reveal (disabled under reduced motion; no-JS safe)

assets/
  favicon.svg, favicon-32.png, apple-touch-icon.png, icon-192.png, icon-512.png
  work/                 Approved project screenshots
  icons/                SVG sources for the inline icons (see icons/README.md)
  og/                   1200×630 share images: one per page (og-home.png, og-work.png, …)
                        plus og-default.png for the 404. Regenerate with scripts/og/render.mjs
```

Paths are root-relative (`/css/...`, `/js/...`) so nested pages resolve correctly.

## Conventions

- An inline script in `<head>` adds `html.js` before first paint; progressive-enhancement styles key off it.
- Text colors: `--color-text-subtle` is the quietest color allowed for words (WCAG AA). `--color-text-faint` is for decorative rules only.
- Icons are inlined SVGs; edit the source in `assets/icons/` and update the inline copies.
- Share images: edit copy and layout in `scripts/og/template.html`, then run `node scripts/og/render.mjs` (needs Playwright + Chromium). A new page gets a new key in both files and its own `og:image` / `twitter:image` tags.
- Sand Dollar case study images have their frame baked in by `scripts/frame-shots.py` (needs Pillow). Frame new screenshots with it so they match.

## Running locally

Any static server from the repository root works:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000. (Directory URLs such as `/services/` resolve to `services/index.html`.)

## Deployment

Hosted on Vercel, connected to this repository. Pull requests get preview deployments; `main` is production.

## Tech

HTML, CSS, and vanilla JavaScript. Typefaces: Cabinet Grotesk and General Sans (Fontshare) and JetBrains Mono (Google Fonts).

## License

Code is available under the MIT License. Written content, imagery, and branding are © Dylan Dwight and not covered by that license.
