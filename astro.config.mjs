// @ts-check
import { defineConfig } from 'astro/config';

// A fully static, English-only export with trailing-slash-free URLs.
export default defineConfig({
  site: 'https://codexredx.github.io',
  output: 'static',
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  vite: {
    ssr: {
      noExternal: ['three'],
    },
  },
});
