/**
 * The bridge between the loader's progress bar and the loader's 3D scene.
 *
 * Deliberately free of any three.js import: `loader.ts` ships on every page,
 * the scene only on pages that render 3D.
 */

type ProgressFn = (pct: number) => void;

let progress = 0;
let finished = false;

const progressListeners = new Set<ProgressFn>();
const finishListeners = new Set<() => void>();

export function getProgress(): number {
  return progress;
}

export function setProgress(pct: number) {
  progress = pct;
  progressListeners.forEach((fn) => fn(pct));
}

export function onProgress(fn: ProgressFn): () => void {
  progressListeners.add(fn);
  fn(progress);
  return () => progressListeners.delete(fn);
}

/** Fired once the bar reaches 100 — the scene uses it to drive the car off. */
export function markFinished() {
  if (finished) return;
  finished = true;
  finishListeners.forEach((fn) => fn());
}

/** Runs immediately if loading already finished before the scene mounted. */
export function onFinish(fn: () => void): () => void {
  if (finished) {
    fn();
    return () => {};
  }
  finishListeners.add(fn);
  return () => finishListeners.delete(fn);
}
