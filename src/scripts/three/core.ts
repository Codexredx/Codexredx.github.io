import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  ScanlineEffect,
  ChromaticAberrationEffect,
} from 'postprocessing';
import { loadTracker } from '../load-tracker';

export { loadTracker };

/**
 * Shared plumbing for every canvas on the site.
 *
 * This mirrors the original's two shared pieces:
 *   CanvasWrapper — a react-three-fiber <Canvas> with `antialias: false`, an
 *                   adaptive dpr, and per-scene camera settings.
 *   Effects       — an EffectComposer carrying Scanline + ChromaticAberration.
 */

export type CameraConfig = {
  fov?: number;
  near?: number;
  far?: number;
  position?: [number, number, number];
};

export type SceneContext = {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  canvas: HTMLCanvasElement;
  size: { width: number; height: number };
};

export type SceneModule = {
  /** Camera settings, matching the original's CanvasWrapper props. */
  camera?: CameraConfig;
  /** Passed through to the EffectComposer (the world scene uses 1). */
  multisampling?: number;
  init(ctx: SceneContext): void | Promise<void>;
  update?(ctx: SceneContext, elapsed: number, delta: number): void;
  resize?(ctx: SceneContext): void;
  dispose?(ctx: SceneContext): void;
};

const textureLoader = new THREE.TextureLoader();
const fontLoader = new FontLoader();

// Every model in /three/models is DRACO-compressed (KHR_draco_mesh_compression
// is in extensionsRequired), so GLTFLoader needs the decoder or each load fails.
// /draco holds both the wasm and js decoders; it is served locally, not from a CDN.
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

export function loadTexture(url: string, configure?: (t: THREE.Texture) => void): Promise<THREE.Texture> {
  loadTracker.add();
  return new Promise((resolve) => {
    textureLoader.load(
      url,
      (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        configure?.(t);
        loadTracker.complete();
        resolve(t);
      },
      undefined,
      (err) => {
        console.error(`[three] failed to load texture ${url}`, err);
        loadTracker.complete();
        resolve(new THREE.Texture());
      }
    );
  });
}

/** Loads a typeface.json font for TextGeometry. */
export function loadFont(url: string): Promise<Font | null> {
  loadTracker.add();
  return new Promise((resolve) => {
    fontLoader.load(
      url,
      (font) => {
        loadTracker.complete();
        resolve(font);
      },
      undefined,
      (err) => {
        console.error(`[three] failed to load font ${url}`, err);
        loadTracker.complete();
        resolve(null);
      }
    );
  });
}

/** Resolves the glTF scene plus a name->mesh map, as useGLTF's `nodes` did. */
export function loadModel(
  url: string
): Promise<{ scene: THREE.Group; nodes: Record<string, THREE.Mesh> } | null> {
  loadTracker.add();
  return new Promise((resolve) => {
    gltfLoader.load(
      url,
      (gltf) => {
        const nodes: Record<string, THREE.Mesh> = {};
        gltf.scene.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) nodes[mesh.name] = mesh;
        });
        loadTracker.complete();
        resolve({ scene: gltf.scene, nodes });
      },
      undefined,
      (err) => {
        // A failed model must not stall the preloader, but it must be loud:
        // silently resolving null makes a missing scene look like a styling bug.
        console.error(`[three] failed to load model ${url}`, err);
        loadTracker.complete();
        resolve(null);
      }
    );
  });
}

/** A <video> element wired up as a three texture, muted+looping for autoplay. */
export function videoTexture(src: string): { texture: THREE.VideoTexture; video: HTMLVideoElement } {
  const video = document.createElement('video');
  video.src = src;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  const tryPlay = () => video.play().catch(() => {});
  tryPlay();
  window.addEventListener('pointerdown', tryPlay, { once: true });

  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture, video };
}

/** Adaptive device pixel ratio, standing in for the original's PerformanceMonitor. */
const baseDpr = () => Math.min(window.devicePixelRatio || 1, 2);

export function mountScene(canvas: HTMLCanvasElement, mod: SceneModule): () => void {
  const parent = canvas.parentElement ?? canvas;
  const cam = mod.camera ?? {};

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false, // the original passed gl={{ antialias: false }}
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(baseDpr());
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(cam.fov ?? 40, 1, cam.near ?? 0.01, cam.far ?? 10);
  camera.position.set(...(cam.position ?? [0, 0, -4]));

  // react-three-fiber points its default camera at the origin. Several scenes
  // rely on this — the world camera sits at [0, 0, -4] and would otherwise face
  // away from the scene entirely. Skip it at the origin, where lookAt is undefined.
  if (camera.position.lengthSq() > 0) camera.lookAt(0, 0, 0);

  const ctx: SceneContext = {
    scene,
    camera,
    renderer,
    canvas,
    size: { width: 1, height: 1 },
  };

  /* ---- post-processing ------------------------------------------------
     Scanline(density 1.5) + ChromaticAberration(offset 0.00075). */
  const composer = new EffectComposer(renderer, { multisampling: mod.multisampling ?? 0 });

  composer.addPass(new RenderPass(scene, camera));

  const effectPass = new EffectPass(
    camera,
    new ScanlineEffect({ density: 1.5 }),
    new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.00075, 0.00075),
      radialModulation: false,
      modulationOffset: 0,
    })
  );
  composer.addPass(effectPass);

  function resize() {
    const rect = parent.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    ctx.size = { width, height };
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(baseDpr());
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    mod.resize?.(ctx);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(parent);
  resize();

  // Only render while the canvas is actually on screen.
  let visible = false;
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry?.isIntersecting ?? false;
    },
    { rootMargin: '100px' }
  );
  io.observe(parent);

  let frame = 0;
  let ready = false;
  const start = performance.now();
  let last = start;

  Promise.resolve(mod.init(ctx)).then(() => {
    ready = true;
    resize();
  });

  function loop(now: number) {
    frame = requestAnimationFrame(loop);
    if (!ready || !visible) {
      last = now;
      return;
    }
    const delta = Math.min((now - last) / 1000, 0.1);
    last = now;
    mod.update?.(ctx, (now - start) / 1000, delta);
    composer.render(delta);
  }
  frame = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(frame);
    ro.disconnect();
    io.disconnect();
    effectPass.dispose();
    mod.dispose?.(ctx);
    composer.dispose();
    renderer.dispose();
  };
}

/** Disposes geometries/materials/textures under a root object. */
export function disposeTree(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
    if (!mat) return;
    const list = Array.isArray(mat) ? mat : [mat];
    list.forEach((m) => {
      Object.values(m).forEach((v) => {
        if (v instanceof THREE.Texture) v.dispose();
      });
      m.dispose();
    });
  });
}
