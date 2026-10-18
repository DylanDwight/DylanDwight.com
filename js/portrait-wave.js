// ============================================================
// portrait-wave.js — portrait hover hello
// On hover (or keyboard focus on the home link), crossfades the
// portrait to a short muted clip of a wave and plays it once,
// holding on the last frame. Skipped on touch-only devices and
// under prefers-reduced-motion; the still photo stays as is.
// ============================================================

export function initPortraitWave() {
  const portraits = document.querySelectorAll('.about-portrait');
  if (!portraits.length) return;

  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  portraits.forEach((box) => {
    const video = box.querySelector('.portrait-wave');
    if (!video) return;
    if (!canHover || reduce) {
      video.remove();
      return;
    }

    const start = () => {
      video.preload = 'auto';
      video.currentTime = 0;
      const played = video.play();
      if (played) played.catch(() => {});
      box.classList.add('is-waving');
    };
    const stop = () => {
      box.classList.remove('is-waving');
      // Let the fade finish before rewinding.
      setTimeout(() => {
        if (!box.classList.contains('is-waving')) video.pause();
      }, 400);
    };

    box.addEventListener('pointerenter', start);
    box.addEventListener('pointerleave', stop);
    box.addEventListener('focusin', start);
    box.addEventListener('focusout', stop);
  });
}
