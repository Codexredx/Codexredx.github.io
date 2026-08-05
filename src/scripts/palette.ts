/**
 * The site palette.
 *
 * Kept out of `three/scenes.ts` so that modules which only need a colour (the
 * GSAP timelines in `animations.ts`) do not drag three.js into their bundle.
 */
export const COLORS = {
  white: '#f5d7e3',
  black: '#0d0221',
  cyan: '#2de2e6',
  pink: '#f6019d',
  purple: '#540d6e',
  darkPurple: '#2a0637',
  lightPurple: '#560d70',
} as const;
