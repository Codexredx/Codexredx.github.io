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

/** Path for a single project's detail page. */
export function projectPath(slug: string): string {
  return `/projects/${slug}`;
}

/** Canonical absolute URL for any path already rooted at the site origin. */
export function absoluteUrl(path: string): string {
  return `${SITE_ORIGIN}${path}`;
}
