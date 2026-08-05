import { initMenu, initTitleReveal } from './menu';
import { initLoader } from './loader';
import { initSmoothScroll, initAnimations, primeAnimations } from './animations';

/**
 * Attach every canvas on the page to its registered scene.
 *
 * three.js and the scene graph are imported dynamically: they are by far the
 * largest chunk on the site, and a page with no `canvas[data-scene]` (the
 * projects page) must not pay to download and parse them.
 */
async function mountCanvases(): Promise<Array<() => void>> {
  const canvases = [...document.querySelectorAll<HTMLCanvasElement>('canvas[data-scene]')];
  if (!canvases.length) return [];

  const [{ mountScene }, { SCENES }] = await Promise.all([
    import('./three/core'),
    import('./three/scenes'),
  ]);

  const teardown: Array<() => void> = [];

  canvases.forEach((canvas) => {
    const name = canvas.dataset.scene!;
    const mod = SCENES[name];
    if (!mod) {
      console.warn(`[site] no scene registered for "${name}"`);
      return;
    }
    try {
      teardown.push(mountScene(canvas, mod));
    } catch (err) {
      // A WebGL failure must not take the rest of the page down.
      console.error(`[site] scene "${name}" failed to mount`, err);
      canvas.closest<HTMLElement>('[style*="position:relative"]')?.setAttribute('data-scene-failed', 'true');
    }
  });

  return teardown;
}

function boot() {
  // Before anything else can paint: the reveals have to own their text from
  // the first frame, or it shows up in place and then snaps away to animate.
  primeAnimations();

  initMenu();
  initTitleReveal();

  initSmoothScroll();
  mountCanvases();

  // Animations wait for the loader so reveals are not spent behind the
  // overlay. Registered before the loader runs: a page with no intro
  // dispatches site:ready synchronously from initLoader.
  document.addEventListener('site:ready', () => initAnimations(), { once: true });

  // primeAnimations hid text that only initAnimations brings back, so a loader
  // that never reports in must not be able to strand it. Past the loader's own
  // 9s ceiling, and a no-op once the reveals have started.
  window.setTimeout(initAnimations, 12000);

  initLoader();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
