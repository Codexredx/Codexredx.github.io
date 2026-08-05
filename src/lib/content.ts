import data from '~/data/en.json';

/**
 * The site is English-only: one content bundle, served from the root.
 */
export type Bundle = typeof data;

export type PageKey = 'home' | 'about' | 'projects';

export const LANG = 'en';

export const SITE_ORIGIN = 'https://codexredx.github.io';

export function getBundle(): Bundle {
  return data;
}

/** Path for a page. */
export function pagePath(page: PageKey): string {
  return page === 'home' ? '/' : `/${page}`;
}

/** Canonical absolute URL, used for <link rel="canonical"> and og:url. */
export function canonicalUrl(page: PageKey): string {
  return `${SITE_ORIGIN}${pagePath(page)}`;
}
