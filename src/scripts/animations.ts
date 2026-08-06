import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { prefersReducedMotion } from './settings';
import { COLORS } from './palette';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

export function getLenis() {
  return lenis;
}

/** Lenis smooth scroll, driven by GSAP's ticker and synced to ScrollTrigger. */
export function initSmoothScroll() {
  if (prefersReducedMotion()) return;

  lenis = new Lenis({
    duration: 1.1,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    // Panels marked data-lenis-prevent scroll natively (the menu and the
    // projects terminal both rely on this).
    prevent: (node: Element) => node.hasAttribute?.('data-lenis-prevent'),
  });

  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Programmatic jumps (hash links, restored scroll position) bypass Lenis's
  // own event, so keep ScrollTrigger honest on native scrolls too.
  window.addEventListener('scroll', () => ScrollTrigger.update(), { passive: true });
}

/**
 * Every element this file reveals, paired with its pre-reveal state.
 *
 * The timelines below cannot apply these themselves: they are built once the
 * loader has cleared, and anything already on screen by then would paint in
 * its final position first and then visibly snap back out to animate in.
 * Priming at boot means the text is never seen before its reveal.
 */
const HIDDEN: Array<[string, gsap.TweenVars]> = [
  ['.intro-title-container .title > span > span', { yPercent: 150 }],
  ['.scroll-text-container .scroll-text .text-title span span', { yPercent: 100 }],
  ['.scroll-text-container .scroll-text .text-container .container-col button', { autoAlpha: 0 }],
  ['.scroll-text-container .scroll-text .text-container .col-title', { autoAlpha: 0 }],
  ['.services-section-titles .title > span > span', { yPercent: 100 }],
  ['.services-section-titles .subtitle', { autoAlpha: 0 }],
  ['#more-text-1 .title span span', { yPercent: 100 }],
  ['#more-text-2 .title span', { yPercent: 100 }],
  ['#more-text-3 .title span span', { yPercent: 100 }],
];

/** Hide everything that gets revealed later, as early in the page's life as possible. */
export function primeAnimations() {
  if (prefersReducedMotion()) return;
  HIDDEN.forEach(([selector, vars]) => gsap.set(selector, vars));
}

/**
 * Safety net: nothing this file hides may stay hidden.
 *
 * The check is deliberately narrow. Only text the visitor can actually see is
 * rescued, and only while its timeline has not run — forcing an off-screen
 * element to its final state leaves its ScrollTrigger free to play the reveal
 * from the top later, which reads as the text jumping in a second time. A
 * rescue therefore also takes the timeline and its trigger down with it.
 *
 * Polling stops the moment the reveal runs, so the common case costs one
 * timeout and one sweep.
 */
function guard(tl: gsap.core.Timeline, selector: string, to: gsap.TweenVars, delay = 12000) {
  let timer = 0;

  const sweep = () => {
    // The reveal ran (or is running): the timeline owns these elements now.
    if (tl.progress() > 0) {
      window.clearInterval(timer);
      return;
    }

    const els = [...document.querySelectorAll<HTMLElement>(selector)];
    const stuck = els.filter((el) => {
      if (!ScrollTrigger.isInViewport(el, 0.1)) return false;
      const cs = getComputedStyle(el);
      const hidden = cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.05;
      const shifted = cs.transform !== 'none' && !cs.transform.includes('matrix(1, 0, 0, 1, 0, 0)');
      return hidden || shifted;
    });
    if (!stuck.length) return;

    window.clearInterval(timer);
    tl.scrollTrigger?.kill();
    tl.kill();
    gsap.to(stuck, { ...to, duration: 0.3, overwrite: 'auto' });
  };

  window.setTimeout(() => {
    timer = window.setInterval(sweep, 4000);
    sweep();
  }, delay);
}

/* ---- home: intro title -------------------------------------------- */
function introTitle() {
  const container = document.querySelector('.intro-title-container');
  if (!container) return;

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.intro-title-container',
      start: 'top center',
      once: true,
      id: 'introTitle',
    },
  });

  tl.fromTo(
    '.intro-title-container .title > span > span',
    { yPercent: 150 },
    { yPercent: 0, stagger: { amount: 1 }, ease: 'expo.out' }
  );
  // The trailing glyph lands in pink.
  tl.to('.intro-title-container .title > span:last-of-type > span', {
    color: COLORS.pink,
    ease: 'bounce.inOut',
  });

  guard(tl, '.intro-title-container .title > span > span', { yPercent: 0 });
}

/* ---- home: world section text ------------------------------------- */
function worldText() {
  if (!document.querySelector('.world-notice-container')) return;

  // A zero-length range (start === end) toggled on every wobble of the smooth
  // scroll's momentum, replaying the reveal against itself. One forward pass.
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.world-notice-container',
      start: 'top-=100 bottom',
      once: true,
    },
  });

  tl.fromTo(
    '.scroll-text-container .scroll-text .text-title span span',
    { yPercent: 100 },
    { yPercent: 0, duration: 1.25, stagger: { amount: 0.25 }, ease: 'expo.out' }
  )
    .to(
      [
        '.scroll-text-container .scroll-text .text-title',
        '.scroll-text-container .scroll-text .col-title',
      ],
      { borderColor: COLORS.white, ease: 'bounce.inOut' },
      0.25
    )
    .fromTo(
      [
        '.scroll-text-container .scroll-text .text-container .container-col button',
        '.scroll-text-container .scroll-text .text-container .col-title',
      ],
      { autoAlpha: 0 },
      { autoAlpha: 1, stagger: { amount: 0.25 }, ease: 'bounce.inOut' },
      0.25
    );

  guard(tl, '.scroll-text-container .scroll-text .text-title span span', { yPercent: 0 });
  guard(tl, '.scroll-text-container .scroll-text .text-container .col-title', { autoAlpha: 1 });
}

/* ---- home: services ------------------------------------------------ */
function servicesSection() {
  const title = document.querySelector('.services-section-titles .title');
  if (title) {
    const tl = gsap.timeline({
      scrollTrigger: { trigger: '.services-section-titles .title', start: 'top 65%', once: true },
    });
    tl.fromTo(
      '.services-section-titles .title > span > span',
      { yPercent: 100 },
      { yPercent: 0, duration: 1.25, stagger: { amount: 0.25 }, ease: 'expo.out' }
    ).fromTo('.services-section-titles .subtitle', { autoAlpha: 0 }, { autoAlpha: 1, ease: 'bounce.inOut' }, 0.5);

    guard(tl, '.services-section-titles .title > span > span', { yPercent: 0 });
    guard(tl, '.services-section-titles .subtitle', { autoAlpha: 1 });
  }

}

/* ---- home: more sections ------------------------------------------ */
function moreSections() {
  const specs: Array<[string, string, number]> = [
    ['#more-text-1', '#more-text-1 .title span span', 0.25],
    ['#more-text-2', '#more-text-2 .title span', 0.25],
    ['#more-text-3', '#more-text-3 .title span span', 0.75],
  ];

  specs.forEach(([trigger, targets, amount]) => {
    if (!document.querySelector(trigger)) return;
    const tl = gsap
      .timeline({ scrollTrigger: { trigger, start: 'top 80%', once: true } })
      .fromTo(targets, { yPercent: 100 }, { yPercent: 0, duration: 1.25, ease: 'expo.inOut', stagger: { amount } });
    guard(tl, targets, { yPercent: 0 });
  });
}

/* ---- the "Unlimited offer /" ticker -------------------------------- */
function initMarquee() {
  document.querySelectorAll<HTMLElement>('.marquee_container__FvUH_').forEach((el) => {
    const first = el.querySelector<HTMLElement>('div:first-of-type');
    const second = el.querySelector<HTMLElement>('div:last-of-type');
    const span = el.querySelector('span');
    if (!first || !second || !span) return;

    const html = span.innerHTML;
    const unit = (span as HTMLElement).offsetWidth || 1;
    let tl: gsap.core.Timeline | null = null;

    const build = () => {
      const width = el.offsetWidth;
      // Refill the first track, then mirror it into the second.
      first.querySelectorAll('span').forEach((s, i) => i > 0 && s.remove());
      second.innerHTML = '';
      for (let w = unit; w <= width; w += unit) {
        const s = document.createElement('span');
        s.innerHTML = html;
        first.appendChild(s);
      }
      first.childNodes.forEach((n) => second.appendChild(n.cloneNode(true)));

      tl?.kill();
      tl = gsap.timeline({ defaults: { repeat: -1, duration: 10, ease: 'none' } });
      tl.to(first, { xPercent: -100 }, 0);
      tl.to(second, { xPercent: -100 }, 0);
    };

    build();
    let last = el.offsetWidth;
    window.addEventListener('resize', () => {
      if (el.offsetWidth > last) {
        last = el.offsetWidth;
        build();
      }
    });
  });
}

let started = false;

export function initAnimations() {
  // A second pass would rebuild every trigger over the top of the first set,
  // and each reveal would run again.
  if (started) return;
  started = true;

  if (prefersReducedMotion()) {
    gsap.set('.title span > span, .subtitle-text', { clearProps: 'all' });
    initMarquee();
    return;
  }

  introTitle();
  worldText();
  servicesSection();
  moreSections();
  initMarquee();

  ScrollTrigger.refresh();

  // Headings are measured before the web fonts arrive, so their triggers sit
  // at stale positions until the real metrics land.
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
