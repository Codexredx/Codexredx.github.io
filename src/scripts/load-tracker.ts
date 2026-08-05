/**
 * Tracks async asset progress so the preloader shows a real number.
 *
 * Kept out of `three/core.ts` so the loader can read progress without pulling
 * three.js into pages that render no 3D.
 */
class LoadTracker {
  private total = 0;
  private done = 0;
  private listeners = new Set<(pct: number) => void>();

  add(n = 1) {
    this.total += n;
    this.emit();
  }
  complete(n = 1) {
    this.done = Math.min(this.total, this.done + n);
    this.emit();
  }
  onProgress(fn: (pct: number) => void) {
    this.listeners.add(fn);
    fn(this.percent);
    return () => this.listeners.delete(fn);
  }
  get percent() {
    return this.total === 0 ? 0 : Math.round((this.done / this.total) * 100);
  }
  private emit() {
    const p = this.percent;
    this.listeners.forEach((fn) => fn(p));
  }
}

export const loadTracker = new LoadTracker();
