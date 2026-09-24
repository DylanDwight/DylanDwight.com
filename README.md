# DylanDwight.com

Source code for [dylandwight.com](https://dylandwight.com) — the portfolio and services site of Dylan Dwight Creative Technologies: web design and front-end development for restaurants, artists, musicians, and small businesses.

## Overview

A hand-built, dependency-free static site focused on clarity, accessibility, performance, and a maintainable design system.

- No build step, no framework, no bundler, no runtime third-party scripts
- Semantic HTML, one `h1` per page, landmark regions, visible skip link
- Design-token-driven CSS with light and dark themes (single dark token block)
- Native ES modules for the small amount of JavaScript (nav drawer, theme, reveal)
- Works without JavaScript; respects `prefers-reduced-motion`
- Per-page metadata, Open Graph / Twitter cards, JSON-LD (`ProfessionalService`, `Person`, `WebSite`), `robots.txt`, `sitemap.xml`, branded 404

## Structure

```
index.html              Home
services/index.html     Services
contact/index.html      Contact / project inquiry
404.html                Not found (served automatically by Vercel)
robots.txt, sitemap.xml

css/
  tokens.css            Colors (both themes), type scale, spacing, radii, shadows, fonts
  base.css              Reset, element defaults, focus styles, reduced motion, skip link
  components.css        Header, drawer, footer, buttons, cards, fact strip, process,
                        CTA panel, page hero, placeholder frames, reveal
  pages.css             Page-specific layouts (home, services, contact, 404)

js/
  app.js                Entry (type="module"); imports the modules below
  nav.js                Mobile drawer: hidden when closed, aria-expanded, focus trap, Escape
  theme.js              Light/dark toggle with persisted preference
  reveal.js             Scroll reveal (disabled under reduced motion; no-JS safe)

assets/
  favicon.svg, favicon-32.png, apple-touch-icon.png
  icons/                SVG sources for the inline icons (see icons/README.md)
  og/og-default.png     Default 1200×630 share image
```

Paths are root-relative (`/css/...`, `/js/...`) so nested pages resolve correctly.

## Conventions

- Theme: an inline script in `<head>` sets `data-theme` from the saved choice or the OS setting before first paint, and adds `html.js`. Dark tokens live only on `[data-theme='dark']`.
- Text colors: `--color-text-subtle` is the quietest color allowed for words (WCAG AA). `--color-text-faint` is for decorative rules only.
- `--project-accent` defaults to the primary color; case-study pages override it within their own scope.
- Icons are inlined SVGs; edit the source in `assets/icons/` and update the inline copies.
- Placeholder frames (`.placeholder-frame`) mark where approved screenshots will go. They are labeled and carry `role="img"` with a description.

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
