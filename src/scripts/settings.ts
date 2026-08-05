/**
 * User-agent preferences the scripts respect.
 *
 * The site stores nothing: no cookies, no localStorage, no analytics.
 */

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
