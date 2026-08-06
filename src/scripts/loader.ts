import gsap from 'gsap';
import { loadTracker } from './load-tracker';
import { setProgress, markFinished } from './loader-state';

/**
 * Drives the intro overlay: a neon progress gauge over the racecar scene.
 *
 * The bar takes the larger of real asset progress and a time floor. The floor
 * has to be able to reach 100 on its own - a page whose assets never register
 * with the tracker would otherwise sit just short of the finish line until the
 * hard ceiling at the bottom of this file fires.
 */
export function initLoader() {
  const loader = document.querySelector<HTMLElement>('#loader');

  // Pages without an intro (anything with no 3D to wait for) are ready at once.
  if (!loader) {
    document.documentElement.classList.add('loaded');
    document.dispatchEvent(new CustomEvent('site:ready'));
    return;
  }

  const fill = loader.querySelector<HTMLElement>('.loader-fill');
  const pctEl = loader.querySelector<HTMLElement>('.loader-pct');

  let shown = 0;
  let real = 0;
  let finished = false;

  loadTracker.onProgress((p) => {
    real = p;
  });

  const started = performance.now();

  function frame() {
    const elapsed = (performance.now() - started) / 1000;
    const target = Math.max(real, Math.min(100, elapsed * 35));
    shown += (target - shown) * 0.08;

    const pct = Math.min(100, Math.round(shown));
    if (pctEl) pctEl.textContent = String(pct);
    if (fill) fill.style.width = `${pct}%`;
    setProgress(pct);

    if (pct >= 99) {
      finish();
      return;
    }
    requestAnimationFrame(frame);
  }

  function finish() {
    if (finished) return;
    finished = true;

    if (pctEl) pctEl.textContent = '100';
    if (fill) fill.style.width = '100%';
    setProgress(100);

    // The scene launches the car down the road; the overlay clears behind it.
    markFinished();

    gsap.to(loader!, {
      autoAlpha: 0,
      duration: 0.6,
      delay: 0.75,
      ease: 'power2.inOut',
      onComplete: () => {
        loader!.style.display = 'none';
        document.documentElement.classList.add('loaded');
        document.dispatchEvent(new CustomEvent('site:ready'));
      },
    });
  }

  requestAnimationFrame(frame);

  // Hard ceiling: never trap the user behind the loader.
  window.setTimeout(finish, 9000);
}
