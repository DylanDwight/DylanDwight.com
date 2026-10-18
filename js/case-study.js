// ============================================================
// case-study.js — reading progress + table-of-contents scroll-spy
// Runs only on pages with [data-cs-progress] or .cs-toc. One
// rAF-throttled scroll handler drives both, so scrolling does at
// most one layout read per frame. Without JS the TOC is still a
// plain list of working anchor links.
// ============================================================

export function initCaseStudy() {
  const bar = document.querySelector('[data-cs-progress]');
  const body = document.querySelector('.cs-body');
  const links = [...document.querySelectorAll('.cs-toc a[href^="#"]')];
  if (!body || (!bar && !links.length)) return;

  const sections = links
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);

  let active = null;
  let queued = false;

  function setActive(id) {
    if (id === active) return;
    active = id;
    links.forEach((link) => {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    });
  }

  function update() {
    queued = false;
    const vh = window.innerHeight;

    if (bar) {
      // 0 when the article's top reaches the viewport top, 1 when its end
      // scrolls into view.
      const rect = body.getBoundingClientRect();
      const total = rect.height - vh;
      const progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 1;
      bar.style.setProperty('--cs-progress', progress.toFixed(4));
    }

    if (sections.length) {
      // The current section is the last one whose heading has passed
      // the upper third of the viewport.
      const line = vh * 0.33;
      let current = sections[0].id;
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= line) current = section.id;
        else break;
      }
      // At the very bottom, the last section can be too short to reach
      // the line, so mark it once the page can't scroll further.
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      setActive(atEnd ? sections[sections.length - 1].id : current);
    }
  }

  function onScroll() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}
