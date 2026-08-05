# Conrad du Toit — portfolio (Astro 7)

A synthwave portfolio for **Conrad du Toit**, BScHons Computer Science at the
University of Pretoria. Built on Astro 7 with vanilla three.js and GSAP.

**English only. No cookies, no analytics, no third-party requests.**
See [Privacy](#privacy).

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # -> dist/
npm run preview
```

Requires Node >= 22.12 (Astro 7's engine floor).

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home — 3D hero, about summary, world scene, three featured projects |
| `/about` | The full about page — status, background, skills, tooling, interests |
| `/projects` | A plain card grid of work experience and academic background |

The racecar intro belongs to the home page only. `/about` and `/projects` render no
3D, so they ship no loader and no three.js and open straight into content.

Navigation is a hamburger dropdown in the header: pages, contact details and
social links. Nothing else.

## Layout

```
public/
  fonts/            27 font files (hashes stripped)
  three/            models, textures
  video/            1 mp4 (the services TVs)
  draco/            DRACO decoder (required, see below)
  images/projects/  card images
src/
  data/en.json      all site content
  lib/prismic.ts    rich-text renderer for the content blocks
  lib/content.ts    content access + page paths
  layouts/          BaseLayout — head + chrome
  components/       Header (+menu), Footer, Loader, per-page sections
  scripts/          client behaviour; three/ holds the scenes
  styles/           global/home/projects + port.css
```

`port.css` holds the menu, footer and canvas rules that back states the client
scripts drive, and is annotated with why each rule exists.

## Content

Everything the pages render lives in `src/data/en.json`:

- `menu` — page links, contact details, social links
- `footer` — role, tagline, column titles
- `pages.home` — the home page copy, in Prismic-style rich-text blocks
  (`{ type, text, spans }`, rendered by `lib/prismic.ts`)
- `pages.projects.cards` — one entry per card: index, title, meta, period,
  `current` flag, image, description, technologies, optional link
- `pages.home.more_*` — the three blocks beside the CD on the home page: two
  featured projects and the contact block
- `pages.about` — status, background copy, `logo_groups` (technology grids),
  `tag_groups`, interests, languages and the photo

Adding a project card means adding an object to `pages.projects.cards` and
dropping its image in `public/images/projects/`.

**Technology logos are vendored, not hot-linked.** `public/images/logos/`
holds SVGs from [Devicon](https://github.com/devicons/devicon) (MIT). Two are
recoloured for the dark theme (GitHub's and the AWS wordmark's near-black fill
is swapped for `#f5d7e3`) and Oracle's `viewBox` is tightened so the wordmark
does not shrink to a sliver inside its tile. An entry in `logo_groups` with
`icon: null` renders a monogram tile instead.

## 3D scenes

Camera settings, geometry, materials, shaders and ScrollTrigger configuration
are set per scene in `src/scripts/three/scenes.ts`:

| Scene | Spec |
| --- | --- |
| Loader | an open-wheel racer on a neon grid road running at a retro sun; three-quarter chase camera at `[2.3, 1.15, 3.9]`, fog `#0d0221` 12→70. The car is built from primitives (extruded side profile, box wings, cylinder wheels) and traced in cyan `EdgesGeometry`. Road, centre line and underglow are `CanvasTexture`s drawn at runtime — the loader paints before anything has downloaded, so it must not wait on an image |
| Hero | camera fov 75 / pos `[0, 0.15, 0.95]`, fog `0x2a0637` near .5 far 2.5, retro sun plane 15×15 at z −50 on a 10s yoyo, 1000-point starfield rotating at −0.0875 rad/s, four 1×2 displaced planes (`emissiveIntensity: 10`) leapfrogging at 0.25 u/s, and `<SOFTWARE DEV />` extruded text |
| World | earth `icosahedron(0.85, 3)` + moon `(0.2125, 1)` on a 1.5-radius orbit, plus a barycentric-wireframe icosahedron; scroll-pinned for 2500px |
| Services | 2–4 wireframe TVs (`#f601de`) by screen width, video texture `repeat(3.5, 4)` `offset(-1.075, -0.225)`, each spinning 2π over 5s staggered by i/5 |
| More | An F1 wheel in `MeshPhongMaterial(white, specular cyan, shininess 75)` under a pink and a cyan point light, hopping between the three `.more-canvas-N` slots on scroll |

Palette: `#f5d7e3 #0d0221 #2de2e6 #f6019d #540d6e #2a0637`.

The `<SOFTWARE DEV />` text uses **Feels Like Nostalgia Bold**, whose typeface
JSON lives at `public/fonts/hero-typeface.json`.

## Things worth knowing

**The wheel model is optimised, not raw.** The source is a 37 MB / 1.16 M-triangle
Sketchfab export; `public/three/models/f1-wheel-draco.glb` is 652 KB / 215 k
triangles. The pipeline, with [gltf-transform](https://gltf-transform.dev):

```
dedup → weld → simplify --ratio 0.08 --error 0.002 --lock-border true
      → strip textures + UVs → join → prune → draco
```

Two details matter. **`--lock-border` is not optional**: the model is 11
separate shells, and without it the simplifier collapses across their borders
and punches holes through the tyre. And **joining before welding destroys the
rim spokes** — welded into the rim face, they simplify away to a blank disc, so
the join has to come after. Textures go because the scene overrides the
material anyway.

**All models are DRACO-compressed.** Each `.glb` lists
`KHR_draco_mesh_compression` in `extensionsRequired`, so `GLTFLoader` needs a
`DRACOLoader` or every load fails silently. The decoder is vendored into
`public/draco/` rather than pulled from a CDN. This is the single most
load-bearing detail in the 3D setup.

**three.js loads on demand.** It is a ~650KB chunk — by far the largest thing
on the site — so `site.ts` imports `three/core` and `three/scenes` dynamically
and only when the page actually contains a `canvas[data-scene]`. Two small
modules exist purely to keep that split clean: `palette.ts` (the colours the
GSAP timelines need), `load-tracker.ts` (asset progress) and `loader-state.ts`
(the loader's own progress and finish signal).
Importing either from `three/scenes` would drag three.js back onto every page.

**The loader bar must be able to reach 100 on its own.** Its bar takes the
larger of real asset progress and a time floor. If that floor stops below the
completion threshold, a page whose assets never register with the tracker sits
there until the 9-second hard ceiling fires — which is exactly what used to
happen on `/projects`.

**The loader's bar and its scene talk through `loader-state.ts`.** That module
carries no three.js import on purpose: `loader.ts` ships on every page, the
scene only where 3D renders. The bar publishes progress (the car's speed rises
with it) and calls `markFinished()`, which launches the car down the road while
the overlay fades. `onFinish` fires immediately if loading beat the scene to it.

**State is driven through GSAP inline styles, not classes.** The menu dropdown
starts hidden in the markup and is revealed by the scripts.

**Reveals use IntersectionObserver, not ScrollTrigger.** These animations hide
real content, and a scroll-event-driven trigger does not fire for programmatic
jumps (anchor links, restored scroll position) once Lenis is mediating scroll —
which stranded content invisible. Every reveal also has a timeout fallback.

**The CRT look is a post-processing pass, not a CSS trick.** Every canvas runs
the same effect chain — Scanline(density 1.5) + ChromaticAberration(offset
0.00075) — through the `postprocessing` package, so there is nothing to do in
CSS.

**Three.js version drift bites in two places.** Both are commented at the call site:

- `TextGeometry` now takes `depth` (default **50**) where the original's custom
  class mapped its `height` option onto it. Passing `height` extrudes the hero
  text 50 units into the camera.
- Punctual light intensity is physically based since r155; the original ran on a
  three that scaled it by π, so the CD's point lights carry that factor.

## Privacy

The site collects nothing and talks to no third party.

- **No analytics or tag managers.**
- **No cookies.** Nothing calls `document.cookie`; a loaded page reports zero
  cookies, and there is no consent state to store.
- **No third-party requests.** Every asset — fonts, models, textures, video,
  images, the DRACO decoder — is served from this origin.
- **No local state.** Nothing is written to `localStorage` or `sessionStorage`;
  `settings.ts` only reads the `prefers-reduced-motion` media query.

Outbound `<a href>` links (social profiles, contact details) remain, but they
are ordinary links — nothing is requested until you click.

## Known gaps

- **Scene composition is stable; exact frame timing is not.** Time-based motion
  (the moon's orbit, TV spin phase, video playhead) is wall-clock driven, so a
  screenshot will not be pixel-identical between runs.
- The home page copy is still generic placeholder text in places and is meant
  to be rewritten for Conrad.

## Verification

`npx astro check` — 0 errors.
