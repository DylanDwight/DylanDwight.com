# DylanDwight.com

Source code for [dylandwight.com](https://dylandwight.com) — the personal portfolio site of Dylan Dwight, UX/UI designer and front-end developer.

## Overview

A hand-built, dependency-free static site focused on performance, accessibility, and clean typography.

- No build step, no framework, no bundler
- Semantic HTML with skip links and `prefers-reduced-motion` support
- Design-token-driven CSS
- Structured data (JSON-LD) and Open Graph metadata for SEO

## Structure

```
index.html        Single-page markup (header, work, about, contact)
base.css          Reset, tokens, and base element styles
style.css         Component and layout styles
app.js            Progressive enhancement (nav, scroll, interactions)
assets/           Favicon and static assets
```

## Running locally

Because it is plain static files, any local server works:

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000

## Tech

HTML, CSS, and vanilla JavaScript. Typefaces are Cabinet Grotesk and General Sans (Fontshare) with JetBrains Mono (Google Fonts).

## License

Code is available under the MIT License. Written content, imagery, and branding are © Dylan Dwight and not covered by that license.
