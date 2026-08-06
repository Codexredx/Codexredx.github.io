import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  type SceneModule,
  loadModel,
  loadTexture,
  loadFont,
  videoTexture,
  disposeTree,
} from './core';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scene definitions recovered from the original build's page chunk. Camera
 * settings, geometry arguments, material parameters and animation constants
 * are taken from that source rather than approximated.
 */

/** The site's palette, from the original's colors module. */
import { COLORS } from '../palette';
import { onProgress, onFinish } from '../loader-state';

export { COLORS };

/* ------------------------------------------------------------------ *
 * Home hero — #home-canvas-container
 *   camera: fov 75, far 100, position [0, 0.15, 0.95]
 *   fog:    near 0.5, far 2.5, colour 0x2a0637
 * ------------------------------------------------------------------ */
export const homeHero: SceneModule = (() => {
  let sun: THREE.Mesh;
  let stars: THREE.Points;
  let tiles: THREE.Mesh[] = [];
  let text: THREE.Mesh | null = null;
  let sunTween: gsap.core.Tween | null = null;

  // Camera rig: mouse look plus a slow scroll-driven descent.
  const mouse = new THREE.Vector2(0, 0);
  const centre = new THREE.Vector2(0, 0);
  let fine = false;
  let onMove: ((e: MouseEvent) => void) | null = null;
  let onScroll: (() => void) | null = null;
  let onResize: (() => void) | null = null;

  function fitText() {
    if (!text) return;
    const n = (window.innerWidth / window.innerHeight) * 0.55;
    const r = n >= 1 ? 1 : n;
    text.scale.set(r, r, r);
  }

  return {
    camera: { fov: 75, far: 100, position: [0, 0.15, 0.95] },

    async init(ctx) {
      ctx.scene.fog = new THREE.Fog(0x2a0637, 0.5, 2.5);

      const [sunTex, textTex, colorMap, dispMap, emisMap, font] = await Promise.all([
        loadTexture('/three/general/retrosun.png'),
        loadTexture('/three/general/retrosun2.png'),
        loadTexture('/three/grid/colorMap.jpg'),
        loadTexture('/three/grid/displacementMap.jpg'),
        loadTexture('/three/grid/emissiveMap.jpg'),
        loadFont('/fonts/hero-typeface.json'),
      ]);

      /* --- retro sun: 15x15 plane far back, bobbing on a 10s yoyo --- */
      sun = new THREE.Mesh(
        new THREE.PlaneGeometry(15, 15, 1, 1),
        new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, fog: false })
      );
      sun.position.set(0, 1, -50);
      ctx.scene.add(sun);
      sunTween = gsap.to(sun.position, {
        y: 2.5,
        repeat: -1,
        repeatDelay: 1,
        yoyo: true,
        duration: 10,
        ease: 'power1',
      });

      /* --- starfield: 1000 points in a 10-unit cube, scaled 20x --- */
      const count = 1000;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < positions.length; i++) positions[i] = (Math.random() - 0.5) * 10;
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      stars = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ size: 0.2, color: 0xffffff, sizeAttenuation: true, fog: false })
      );
      stars.position.set(0, 0, -55);
      stars.scale.set(20, 20, 1);
      ctx.scene.add(stars);

      /* --- terrain: four 1x2 displaced planes forming an endless runway ---
         The original used <Instances limit={4}>; four meshes sharing one
         geometry and material are equivalent at this count. */
      const tileGeo = new THREE.PlaneGeometry(1, 2, 32, 32);
      const tileMat = new THREE.MeshPhongMaterial({
        map: colorMap,
        emissive: new THREE.Color(COLORS.pink),
        emissiveMap: emisMap,
        emissiveIntensity: 10,
        displacementMap: dispMap,
        displacementScale: 0.25,
      });

      const offsets: Array<[number, number, number]> = [
        [0, 0, 0],
        [0, 0, -2],
        [0, 0, -4],
        [0, 0, -4],
      ];
      tiles = offsets.map((p) => {
        const m = new THREE.Mesh(tileGeo, tileMat);
        m.rotation.x = -Math.PI * 0.5;
        m.position.set(...p);
        ctx.scene.add(m);
        return m;
      });

      /* --- "<SOFTWARE DEV />" extruded text, striped via a repeated map --- */
      if (font) {
        // The original's TextGeometry mapped its `height` option onto ExtrudeGeometry's
        // `depth`. Modern three exposes `depth` directly and defaults it to 50, so
        // passing `height` here would extrude the text 50 units toward the camera.
        // 0.70 rather than the original 0.75: '<SOFTWARE DEV />' sets ~7% wider
        // than the string this replaced, and fitText() scales by viewport aspect
        // rather than measured width, so it would otherwise crowd the edges.
        const geo = new TextGeometry('<SOFTWARE DEV />', {
          font,
          size: 0.7,
          depth: 0.35,
          curveSegments: 1,
          bevelEnabled: false,
        });
        geo.center();

        textTex.wrapS = THREE.RepeatWrapping;
        textTex.wrapT = THREE.RepeatWrapping;
        textTex.repeat.set(-4, 1);

        text = new THREE.Mesh(
          geo,
          new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.cyan), map: textTex, fog: false })
        );
        text.position.set(0, 0.95, -4);
        text.rotation.x = -0.1 * Math.PI;
        ctx.scene.add(text);
        fitText();
      }

      /* --- camera rig --- */
      fine = matchMedia('(pointer:fine)').matches;
      centre.set(window.innerWidth / 2, window.innerHeight / 2);
      const container = document.querySelector('#home-canvas-container');

      onMove = (e: MouseEvent) => {
        mouse.x = e.clientX - centre.x;
        mouse.y = e.clientY - centre.y;
      };
      onScroll = () => {
        ctx.camera.position.y = 0.15 - 0.0001 * window.scrollY;
      };
      onResize = () => {
        centre.set(window.innerWidth / 2, window.innerHeight / 2);
        fitText();
      };

      if (fine) container?.addEventListener('mousemove', onMove as EventListener);
      window.addEventListener('scroll', onScroll);
      window.addEventListener('resize', onResize);
    },

    update(ctx, elapsed) {
      // Tiles leapfrog toward the camera; index 3 is intentionally parked.
      const t = 0.25 * elapsed;
      tiles.forEach((tile, i) => {
        if (i !== 3) tile.position.z = (t % 2) - 2 * i;
      });

      stars.rotation.z = -0.0875 * elapsed;

      if (fine) {
        const tx = (1 - mouse.x) * 0.0002;
        const ty = (1 - mouse.y) * 0.0002;
        ctx.camera.rotation.x += 0.05 * (ty - ctx.camera.rotation.x);
        ctx.camera.rotation.y += 0.05 * (tx - ctx.camera.rotation.y);
      }
    },

    resize() {
      fitText();
    },

    dispose(ctx) {
      sunTween?.kill();
      const container = document.querySelector('#home-canvas-container');
      if (onMove) container?.removeEventListener('mousemove', onMove as EventListener);
      if (onScroll) window.removeEventListener('scroll', onScroll);
      if (onResize) window.removeEventListener('resize', onResize);
      disposeTree(ctx.scene);
    },
  };
})();

/* ------------------------------------------------------------------ *
 * Home world — #scroll-canvas-container
 *   camera: near 0.01, far 15 (default fov 40, position [0,0,-4])
 *   an earth/moon pair plus a wireframe icosahedron, scroll-pinned
 * ------------------------------------------------------------------ */
export const homeWorld: SceneModule = (() => {
  let earth: THREE.Mesh;
  let moon: THREE.Mesh;
  let wire: THREE.Mesh;
  const tweens: Array<gsap.core.Timeline> = [];

  return {
    camera: { near: 0.01, far: 15 },
    multisampling: 1,

    async init(ctx) {
      const pixelate = (t: THREE.Texture) => {
        t.generateMipmaps = false;
        t.minFilter = THREE.NearestFilter;
        t.magFilter = THREE.NearestFilter;
      };

      const [earthTex, moonTex] = await Promise.all([
        loadTexture('/three/general/earth.jpeg', pixelate),
        loadTexture('/three/general/moon.jpeg', pixelate),
      ]);

      earth = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.85, 3),
        new THREE.MeshBasicMaterial({ map: earthTex })
      );
      moon = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.2125, 1),
        new THREE.MeshBasicMaterial({ map: moonTex })
      );
      moon.position.set(1.5, 0, 0);
      ctx.scene.add(earth, moon);

      /* --- barycentric wireframe icosahedron --- */
      const geo = new THREE.IcosahedronGeometry(1, 1);
      geo.deleteAttribute('normal');
      geo.deleteAttribute('uv');
      const axes = [
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 1),
      ];
      const pos = geo.attributes.position!;
      const centers = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) axes[i % 3]!.toArray(centers, i * 3);
      geo.setAttribute('center', new THREE.BufferAttribute(centers, 3));

      const mat = new THREE.ShaderMaterial({
        uniforms: { thickness: { value: 5 } },
        vertexShader: `
  attribute vec3 center;
  varying vec3 vCenter;

  void main() {
    vCenter = center;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
        fragmentShader: `
  uniform float thickness;
  varying vec3 vCenter;

  void main() {
    vec3 afwidth = fwidth(vCenter.xyz);
    vec3 edge3 = smoothstep((thickness - 1.0) * afwidth, thickness * afwidth, vCenter.xyz);
    float edge = 1.0 - min(min(edge3.x, edge3.y), edge3.z);
    gl_FragColor.rgb = gl_FrontFacing ? vec3(0.965,0.004,0.616) : vec3(0.337,0.051,0.439);
    gl_FragColor.a = edge;
  }
`,
        side: THREE.DoubleSide,
        alphaToCoverage: true,
      });

      wire = new THREE.Mesh(geo, mat);
      ctx.scene.add(wire);

      /* --- scroll choreography --- */
      const container = document.querySelector('#scroll-canvas-container');
      if (container) {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '#scroll-canvas-container',
            start: 'top top',
            endTrigger: '#home-world',
            end: '+=1000',
            id: 'world',
            refreshPriority: 999,
            scrub: true,
          },
        });
        tl.fromTo(container, { yPercent: -50 }, { yPercent: 0, ease: 'none' });
        tweens.push(tl);
      }

      const pin = gsap.timeline({
        scrollTrigger: {
          trigger: '.world-scroll-container',
          start: 'top-=20% top',
          end: '+=2500',
          pin: true,
          scrub: 1,
        },
      });
      pin
        .to(wire.rotation, { y: 1.5 * Math.PI, ease: 'none' })
        .to(ctx.camera.position, { x: 0.75, y: 0.85, z: -1, ease: 'power1.inOut' }, 0);
      tweens.push(pin);
    },

    update(_ctx, elapsed) {
      earth.rotation.y = 0.5 * elapsed;
      moon.rotation.y = 6 * elapsed;
      moon.position.x = 1.5 * Math.cos(elapsed);
      moon.position.z = 1.5 * Math.sin(elapsed);
      moon.position.y = Math.cos(elapsed);
    },

    dispose(ctx) {
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      disposeTree(ctx.scene);
    },
  };
})();

/* ------------------------------------------------------------------ *
 * Home services — #services-canvas-container
 *   camera: fov 35, near 0.001, far 10, position [0, 0, 5.55]
 *   a staggered stack of wireframe TVs playing the announcement video
 * ------------------------------------------------------------------ */
export const homeServices: SceneModule = (() => {
  let group: THREE.Group;
  let video: HTMLVideoElement;
  const spins: gsap.core.Tween[] = [];

  const instanceCount = () => {
    const w = window.screen.width;
    return w >= 1000 ? 4 : w >= 700 ? 3 : 2;
  };

  return {
    camera: { fov: 35, near: 0.001, far: 10, position: [0, 0, 5.55] },

    async init(ctx) {
      const model = await loadModel('/three/models/oldTv_wireframe-transformed.glb');
      if (!model) return;

      const { texture, video: el } = videoTexture('/video/video-lowest.mp4');
      video = el;
      texture.flipY = false;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(3.5, 4);
      texture.offset.set(-1.075, -0.225);

      const tvMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#f601de') });
      const screenMat = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });

      const tvGeo = model.nodes.TV?.geometry;
      const screenGeo = model.nodes.Screen?.geometry;
      if (!tvGeo || !screenGeo) {
        console.error('[three] oldTv model missing TV/Screen nodes', Object.keys(model.nodes));
        return;
      }

      group = new THREE.Group();
      group.scale.setScalar(2);

      const n = instanceCount();
      for (let i = 0; i < n; i++) {
        const unit = new THREE.Group();
        unit.position.set(i / 1.5, -(0.35 * i), 0);
        unit.rotation.set(-0.2, 0, 0.4);

        const tv = new THREE.Mesh(tvGeo, tvMat);
        tv.rotation.x = Math.PI / 2;
        tv.scale.setScalar(0.25);

        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.rotation.x = Math.PI / 2;
        screen.scale.setScalar(0.25);

        unit.add(tv, screen);
        group.add(unit);
      }

      ctx.scene.add(group);

      // Centre the stack, as the original's `center` groupProp did.
      const box = new THREE.Box3().setFromObject(group);
      const centre = new THREE.Vector3();
      box.getCenter(centre);
      group.position.copy(centre.multiplyScalar(-1));

      group.children.forEach((child, i) => {
        spins.push(
          gsap.to(child.rotation, {
            y: 2 * Math.PI,
            duration: 5,
            repeat: -1,
            repeatDelay: 0,
            ease: 'expo.inOut',
            delay: i / 5,
          })
        );
      });
    },

    dispose(ctx) {
      spins.forEach((s) => s.kill());
      video?.pause();
      disposeTree(ctx.scene);
    },
  };
})();

/* ------------------------------------------------------------------ *
 * Home more — .more-canvas-1
 *   camera: fov 18, near 0.1, far 2, position [0, 0, 0]
 *   a spinning F1 wheel lit by a pink and a cyan point light
 * ------------------------------------------------------------------ */
export const homeMore: SceneModule = (() => {
  let cd: THREE.Group | null = null;
  let spinner: THREE.Object3D | null = null;
  const tweens: gsap.core.Timeline[] = [];

  function applyScale() {
    if (!cd) return;
    const t = (window.innerWidth / window.innerHeight) * 0.2;
    const s = t >= 0.2 ? 0.2 : t <= 0.05 ? 0.05 : t;
    cd.scale.set(s, s, s);
  }

  /** Moves the live canvas between the three .more-canvas-N slots. */
  function swapSlot(from: string, to: string) {
    const a = document.querySelector(from);
    const b = document.querySelector(to);
    const ca = from.split('.')[1]!;
    const cb = to.split('.')[1]!;
    a?.classList.remove(ca);
    a?.classList.add(cb);
    b?.classList.remove(cb);
    b?.classList.add(ca);
  }

  return {
    camera: { fov: 18, near: 0.1, far: 2, position: [0, 0, 0] },

    async init(ctx) {
      // The original ran on a pre-r155 three, where the renderer scaled punctual
      // light intensity by PI. Lighting is physically based now, so the authored
      // intensity of 1 has to carry that factor to match the original brightness.
      const LEGACY_INTENSITY = Math.PI;

      const pink = new THREE.PointLight(new THREE.Color(COLORS.pink), LEGACY_INTENSITY);
      pink.position.set(-1.5, 0.5, 0);
      const cyan = new THREE.PointLight(new THREE.Color(COLORS.cyan), LEGACY_INTENSITY);
      cyan.position.set(2, 0, 0);
      ctx.scene.add(pink, cyan);

      const model = await loadModel('/three/models/f1-wheel-draco.glb');
      if (!model) return;

      const mat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(COLORS.white),
        specular: new THREE.Color(COLORS.cyan),
        shininess: 75,
      });

      // The optimiser joins the wheel into a single primitive, but take whatever
      // meshes the file has so a re-export with a different split still works.
      const geometries = Object.values(model.nodes)
        .map((mesh) => mesh.geometry)
        .filter(Boolean);
      if (!geometries.length) {
        console.error('[three] wheel model has no meshes', Object.keys(model.nodes));
        return;
      }

      /* The group keeps the CD's transforms and timelines. Inside it, `axle`
         lays the wheel's axis (its own +Z, unit radius like the CD) onto the
         group's Y, so `spinner` turns about the axle exactly as the disc did. */
      cd = new THREE.Group();
      const axle = new THREE.Object3D();
      axle.rotation.x = -Math.PI / 2;
      // Both models are unit radius, but a 1.2-deep tyre carries far more
      // visual weight than the CD's paper-thin disc and overflowed the frame
      // at the same scale. Trimmed here so the group's own scaling, positions
      // and scroll timelines stay exactly as they were.
      axle.scale.setScalar(0.6);
      spinner = new THREE.Object3D();
      geometries.forEach((geo) => spinner!.add(new THREE.Mesh(geo, mat)));
      axle.add(spinner);
      cd.add(axle);

      cd.position.set(0, 0.01, -1.3);
      cd.rotation.set(-0.65 * Math.PI, 0, -0.5);
      ctx.scene.add(cd);

      applyScale();
      window.addEventListener('resize', applyScale);

      /* --- the CD hops between the three text blocks on scroll --- */
      let shift = 0.00025 * window.screen.width;
      if (shift <= 0.44) shift = 0.44;

      const t1 = gsap.timeline({
        scrollTrigger: {
          trigger: '#more-text-1',
          endTrigger: '#more-text-2',
          start: '25% center',
          end: '70% center',
          scrub: 1,
          fastScrollEnd: false,
          preventOverlaps: true,
        },
        defaults: { duration: 1.25 },
      });
      t1.to(cd.rotation, { z: Math.PI + 0.5, duration: 2.5, ease: 'power1.inOut' }, 0)
        .to(cd.position, { x: -shift, ease: 'power3.in' }, 0)
        .call(() => swapSlot('.more-canvas-1', '.more-canvas-2'), undefined, 1.25)
        .set(cd.position, { x: shift }, 1.25)
        .to(cd.position, { x: 0, ease: 'power3' }, 1.25);

      const t2 = gsap.timeline({
        scrollTrigger: {
          trigger: '#more-text-2',
          endTrigger: '#more-text-3',
          start: '75% center',
          end: '80% center',
          scrub: 1,
          fastScrollEnd: false,
          preventOverlaps: true,
        },
        defaults: { duration: 1.25 },
      });
      t2.to(cd.rotation, { x: 0.5 * Math.PI, y: Math.PI, z: Math.PI, duration: 2.5, ease: 'power4.inOut' }, 0)
        .to(cd.position, { x: shift, ease: 'power4.in' }, 0)
        .call(() => swapSlot('.more-canvas-2', '.more-canvas-3'), undefined, 1.25)
        .set(cd.position, { x: -shift }, 1.25)
        .to(cd.position, { z: -0.5, ease: 'back' }, 1.25)
        .to(cd.position, { x: 0, y: 0, ease: 'power4' }, 1.25);

      tweens.push(t1, t2);
    },

    update(_ctx, elapsed) {
      if (!spinner) return;
      spinner.rotation.z = elapsed;
    },

    dispose(ctx) {
      window.removeEventListener('resize', applyScale);
      tweens.forEach((t) => {
        t.scrollTrigger?.kill();
        t.kill();
      });
      disposeTree(ctx.scene);
    },
  };
})();

/* ------------------------------------------------------------------ *
 * Loader — a low-poly racecar running a neon grid road toward the sun.
 *
 * The road, the centre line and the underglow are drawn to canvases at
 * runtime rather than shipped as images: the loader has to be on screen
 * before anything else has downloaded, so it must not wait on a texture.
 * ------------------------------------------------------------------ */
export const loaderScene: SceneModule = (() => {
  let car: THREE.Group | null = null;
  let wheels: THREE.Mesh[] = [];
  let roadMat: THREE.MeshBasicMaterial | null = null;
  let lineMat: THREE.MeshBasicMaterial | null = null;
  let stars: THREE.Points | null = null;
  let sun: THREE.Mesh | null = null;
  let glow: THREE.Mesh | null = null;

  let speed = 4;
  let launched = false;
  let offFinish: (() => void) | null = null;
  let offProgress: (() => void) | null = null;
  const tweens: gsap.core.Tween[] = [];

  /** A repeating lattice cell: one horizontal rung and one lane rail. */
  function roadTexture(): THREE.CanvasTexture {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d')!;

    g.clearRect(0, 0, size, size);
    g.strokeStyle = COLORS.pink;
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(0, 4);
    g.lineTo(size, 4);
    g.stroke();

    g.strokeStyle = COLORS.cyan;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(4, 0);
    g.lineTo(4, size);
    g.stroke();

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  /** The dashed centre line, one dash per tile. */
  function centreTexture(): THREE.CanvasTexture {
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 128;
    const g = c.getContext('2d')!;
    g.clearRect(0, 0, 16, 128);
    g.fillStyle = COLORS.white;
    g.fillRect(4, 0, 8, 72);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  /** A soft radial falloff, used for the underglow pooled beneath the car. */
  function glowTexture(): THREE.CanvasTexture {
    const size = 128;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const g = c.getContext('2d')!;
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(246,1,157,0.85)');
    grad.addColorStop(0.45, 'rgba(246,1,157,0.30)');
    grad.addColorStop(1, 'rgba(246,1,157,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(c);
  }

  /** The car's side profile, nose at +X, extruded across its narrow body. */
  function bodyGeometry(): THREE.ExtrudeGeometry {
    const s = new THREE.Shape();
    s.moveTo(-1.05, 0.10);
    s.lineTo(-1.05, 0.44);
    s.lineTo(-0.72, 0.48);
    s.lineTo(-0.34, 0.50);
    s.lineTo(-0.20, 0.66); // airbox
    s.lineTo(0.02, 0.62);
    s.lineTo(0.10, 0.44); // cockpit lip
    s.lineTo(0.46, 0.36);
    s.lineTo(0.92, 0.26);
    s.lineTo(1.18, 0.20); // nose tip
    s.lineTo(1.18, 0.13);
    s.lineTo(0.60, 0.10);
    s.closePath();

    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.44, bevelEnabled: false });
    geo.translate(0, 0, -0.22);
    return geo;
  }

  function buildCar(): THREE.Group {
    const group = new THREE.Group();

    const shell = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#3b0a63'),
      metalness: 0.7,
      roughness: 0.25,
      emissive: new THREE.Color(COLORS.purple),
      emissiveIntensity: 0.35,
    });
    const wingMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#2a0637'),
      metalness: 0.5,
      roughness: 0.4,
      emissive: new THREE.Color(COLORS.purple),
      emissiveIntensity: 0.25,
    });
    const neon = new THREE.LineBasicMaterial({ color: new THREE.Color(COLORS.cyan) });
    const hot = new THREE.MeshBasicMaterial({ color: new THREE.Color(COLORS.pink) });

    /** Wraps a mesh's silhouette in neon so it reads against the dark road. */
    const traced = (mesh: THREE.Mesh) => {
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 20), neon));
      return mesh;
    };

    /* --- monocoque --- */
    const body = traced(new THREE.Mesh(bodyGeometry(), shell));
    body.rotation.y = Math.PI / 2; // nose down the road (-Z)
    group.add(body);

    /* --- rear wing, on twin posts --- */
    const rearWing = traced(new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.045, 0.3), wingMat));
    rearWing.position.set(0, 0.78, 0.94);
    group.add(rearWing);

    const rearFlap = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.03, 0.16), hot);
    rearFlap.position.set(0, 0.86, 1.02);
    group.add(rearFlap);

    [-0.3, 0.3].forEach((x) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.34, 0.06), wingMat);
      post.position.set(x, 0.6, 0.94);
      group.add(post);
    });

    /* --- front wing --- */
    const frontWing = traced(new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.04, 0.3), wingMat));
    frontWing.position.set(0, 0.12, -1.22);
    group.add(frontWing);

    [-0.66, 0.66].forEach((x) => {
      const endplate = traced(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.24, 0.34), wingMat));
      endplate.position.set(x, 0.2, -1.22);
      group.add(endplate);
    });

    /* --- halo over the cockpit --- */
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 6, 16, Math.PI), hot);
    halo.position.set(0, 0.5, 0.06);
    halo.rotation.y = Math.PI / 2;
    group.add(halo);

    /* --- open wheels, set well outboard --- */
    const tyre = new THREE.MeshStandardMaterial({
      color: new THREE.Color('#0b0118'),
      metalness: 0.1,
      roughness: 0.85,
    });

    const layout: Array<[number, number, number]> = [
      [0.62, 0.26, -0.78],
      [-0.62, 0.26, -0.78],
      [0.66, 0.29, 0.72],
      [-0.66, 0.29, 0.72],
    ];

    wheels = layout.map(([x, r, z]) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.24, 18), tyre);
      wheel.rotation.z = Math.PI / 2; // lay the axle across the car
      wheel.position.set(x, r, z);

      // Rim and spokes sit on the outboard face so the spin is visible.
      const face = x > 0 ? 0.125 : -0.125;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.6, 0.022, 6, 18), hot);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = face;
      wheel.add(rim);

      [0, Math.PI / 2].forEach((a) => {
        const spoke = new THREE.Mesh(new THREE.BoxGeometry(r * 1.2, 0.02, 0.03), hot);
        spoke.position.y = face;
        spoke.rotation.y = a;
        wheel.add(spoke);
      });

      group.add(wheel);
      return wheel;
    });

    /* --- tail lights --- */
    [-0.14, 0.14].forEach((x) => {
      const lamp = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.06), hot);
      lamp.position.set(x, 0.3, 1.06);
      group.add(lamp);
    });

    return group;
  }

  return {
    camera: { fov: 50, near: 0.1, far: 400, position: [2.3, 1.15, 3.9] },

    async init(ctx) {
      ctx.camera.lookAt(-0.1, 0.4, -1.4);
      ctx.scene.fog = new THREE.Fog(new THREE.Color(COLORS.black), 12, 70);

      /* --- road --- */
      const roadTex = roadTexture();
      roadTex.repeat.set(10, 150);
      roadMat = new THREE.MeshBasicMaterial({
        map: roadTex,
        transparent: true,
        fog: true,
        opacity: 0.85,
      });
      const road = new THREE.Mesh(new THREE.PlaneGeometry(9, 300), roadMat);
      road.rotation.x = -Math.PI / 2;
      road.position.z = -140;
      ctx.scene.add(road);

      const centreTex = centreTexture();
      centreTex.repeat.set(1, 150);
      lineMat = new THREE.MeshBasicMaterial({ map: centreTex, transparent: true, opacity: 0.4 });
      const centre = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 300), lineMat);
      centre.rotation.x = -Math.PI / 2;
      centre.position.set(0, 0.002, -140);
      ctx.scene.add(centre);

      /* --- sun on the horizon, banded like the hero's --- */
      const sunTex = await loadTexture('/three/general/retrosun.png');
      sun = new THREE.Mesh(
        new THREE.PlaneGeometry(34, 34),
        new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, fog: false })
      );
      sun.position.set(0, 6.5, -150);
      ctx.scene.add(sun);

      /* --- starfield --- */
      const count = 700;
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 120;
        positions[i * 3 + 1] = Math.random() * 40 + 2;
        positions[i * 3 + 2] = -Math.random() * 220 - 20;
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      stars = new THREE.Points(
        starGeo,
        new THREE.PointsMaterial({ size: 0.35, color: 0xffffff, sizeAttenuation: true, fog: false })
      );
      ctx.scene.add(stars);

      /* --- lighting: a pink key from behind, cyan fill from the front --- */
      ctx.scene.add(new THREE.AmbientLight(0xffffff, 1.1));
      const key = new THREE.PointLight(new THREE.Color(COLORS.pink), 14, 20);
      key.position.set(1.6, 2.4, 3);
      const fill = new THREE.PointLight(new THREE.Color(COLORS.cyan), 12, 20);
      fill.position.set(-2.2, 1.2, -2.4);
      const rim = new THREE.DirectionalLight(new THREE.Color(COLORS.white), 1.6);
      rim.position.set(-3, 2, 2);
      ctx.scene.add(key, fill, rim);

      /* --- car --- */
      car = buildCar();
      ctx.scene.add(car);

      glow = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 3.8),
        new THREE.MeshBasicMaterial({
          map: glowTexture(),
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
        })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.y = 0.012;
      car.add(glow);

      // Rolls in from behind the camera and settles into the frame.
      car.position.set(0.6, 0, 9);
      tweens.push(
        gsap.to(car.position, { x: 0, z: 0, duration: 1.6, ease: 'power3.out' }),
        gsap.fromTo(car.rotation, { y: 0.22 }, { y: 0, duration: 1.6, ease: 'power2.out' })
      );

      // Faster the closer the bar gets to full.
      offProgress = onProgress((pct) => {
        if (!launched) speed = 4 + (pct / 100) * 7;
      });

      offFinish = onFinish(() => {
        launched = true;

        if (car) {
          tweens.push(
            gsap.to(car.position, { z: -60, duration: 1.35, ease: 'power3.in' }),
            gsap.to(car.rotation, { y: -0.05, duration: 0.5, ease: 'power1.out' })
          );
        }

        // The world accelerates with the launch, not just the car.
        const ramp = { s: speed };
        tweens.push(
          gsap.to(ramp, {
            s: 42,
            duration: 1.2,
            ease: 'power3.in',
            onUpdate: () => {
              speed = ramp.s;
            },
          })
        );
      });
    },

    update(_ctx, elapsed, delta) {
      const d = Math.min(delta, 0.05);

      if (roadMat?.map) roadMat.map.offset.y -= speed * d * 0.06;
      if (lineMat?.map) lineMat.map.offset.y -= speed * d * 0.06;

      wheels.forEach((w) => w.rotateY(-speed * d * 4));

      if (car && !launched) {
        car.position.y = Math.sin(elapsed * 9) * 0.012;
        car.rotation.z = Math.sin(elapsed * 1.7) * 0.02;
        car.position.x += (Math.sin(elapsed * 0.8) * 0.12 - car.position.x) * 0.02;
      }

      if (stars) stars.position.z = (elapsed * speed * 0.6) % 40;
      if (sun) sun.position.y = 6.5 + Math.sin(elapsed * 0.5) * 0.25;
    },

    dispose(ctx) {
      offFinish?.();
      offProgress?.();
      tweens.forEach((t) => t.kill());
      disposeTree(ctx.scene);
    },
  };
})();

export const SCENES: Record<string, SceneModule> = {
  'home-hero': homeHero,
  'home-world': homeWorld,
  'home-services': homeServices,
  'home-more': homeMore,
  loader: loaderScene,
};
