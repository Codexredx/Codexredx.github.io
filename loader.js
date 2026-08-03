(function () {
  'use strict';

  var screen = document.getElementById('ls');
  if (!screen) return;

  /* ── Helper: one animated smoke/particle element ─────────────── */
  function particle(cx, cy, r, op, begin, fill, dur) {
    return '<circle r="0" fill="' + fill + '">'
      + '<animate attributeName="cx"      values="' + cx + '" dur="' + dur + '" begin="' + begin + '" repeatCount="indefinite"/>'
      + '<animate attributeName="cy"      values="' + cy + '" dur="' + dur + '" begin="' + begin + '" repeatCount="indefinite"/>'
      + '<animate attributeName="r"       values="' + r  + '" dur="' + dur + '" begin="' + begin + '" repeatCount="indefinite"/>'
      + '<animate attributeName="opacity" values="' + op + '" dur="' + dur + '" begin="' + begin + '" repeatCount="indefinite"/>'
      + '</circle>';
  }

  function particles(count, cx, cy, r, op, fill, dur) {
    var out  = '';
    var step = parseFloat(dur) / count;
    for (var i = 0; i < count; i++) {
      out += particle(cx, cy, r, op, (step * i).toFixed(2) + 's', fill, dur);
    }
    return out;
  }

  var scene = screen.querySelector('.ls-car-scene');
  if (scene) {

    /* Exhaust smoke */
    var exhaustSmoke = particles(3,
      '304;322;342', '68;50;30',
      '3;8;16',      '0.75;0.35;0',
      'rgba(200,195,188,0.78)', '1.7s'
    );

    /* Front-tyre smoke */
    var frontSmoke = particles(2,
      '82;100;120',  '128;108;86',
      '2;6;12',      '0.65;0.3;0',
      'rgba(212,212,224,0.82)', '1.45s'
    );

    /* Rear-tyre smoke  */
    var rearSmoke = particles(4,
      '294;316;344', '128;102;74',
      '4;12;24',     '0.85;0.45;0',
      'rgba(218,218,232,0.92)', '1.9s'
    );

    /* Exhaust flame flicker */
    var flame = '<ellipse cx="309" cy="70" rx="5" ry="3" fill="rgba(255,115,25,0.78)">'
      + '<animate attributeName="rx"      values="5;3;6;4;5"             dur="0.45s" repeatCount="indefinite"/>'
      + '<animate attributeName="ry"      values="3;5;2;4;3"             dur="0.45s" repeatCount="indefinite"/>'
      + '<animate attributeName="opacity" values="0.78;0.3;0.92;0.5;0.78" dur="0.45s" repeatCount="indefinite"/>'
      + '</ellipse>';

    var frontSpokes = '<g class="wheel-spokes">'
      + '<line x1="82"  y1="93"  x2="82"  y2="119" stroke="#ff2a6d" stroke-width="1.7"/>'
      + '<line x1="69"  y1="106" x2="95"  y2="106" stroke="#ff2a6d" stroke-width="1.7"/>'
      + '<line x1="73"  y1="96"  x2="91"  y2="116" stroke="#ff2a6d" stroke-width="1.1"/>'
      + '<line x1="73"  y1="116" x2="91"  y2="96"  stroke="#ff2a6d" stroke-width="1.1"/>'
      + '</g>';

    var rearSpokes = '<g class="wheel-spokes">'
      + '<line x1="294" y1="93"  x2="294" y2="119" stroke="#ff2a6d" stroke-width="1.7"/>'
      + '<line x1="281" y1="106" x2="307" y2="106" stroke="#ff2a6d" stroke-width="1.7"/>'
      + '<line x1="285" y1="96"  x2="303" y2="116" stroke="#ff2a6d" stroke-width="1.1"/>'
      + '<line x1="285" y1="116" x2="303" y2="96"  stroke="#ff2a6d" stroke-width="1.1"/>'
      + '</g>';

    scene.innerHTML = [
      '<svg class="ls-car-svg" viewBox="0 0 380 128" xmlns="http://www.w3.org/2000/svg">',
      '<defs>',
      '  <filter id="gp" x="-50%" y="-50%" width="200%" height="200%">',
      '    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/>',
      '    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>',
      '  </filter>',
      '  <filter id="gc" x="-50%" y="-50%" width="200%" height="200%">',
      '    <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b"/>',
      '    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>',
      '  </filter>',
      '</defs>',

      /* Ground glow */
      '<ellipse cx="185" cy="122" rx="172" ry="5" fill="rgba(255,42,109,0.10)"/>',

      /* Speed lines */
      '<line x1="0" y1="57" x2="13" y2="57" stroke="#05d9e8" stroke-width="2.0" opacity="0.90"/>',
      '<line x1="0" y1="67" x2="9"  y2="67" stroke="#05d9e8" stroke-width="1.5" opacity="0.65"/>',
      '<line x1="0" y1="76" x2="7"  y2="76" stroke="#05d9e8" stroke-width="1.0" opacity="0.40"/>',
      '<line x1="0" y1="85" x2="5"  y2="85" stroke="#05d9e8" stroke-width="0.7" opacity="0.22"/>',

      /* ── FRONT WING */
      '<rect x="13"  y="91"  width="5"   height="21" rx="1" fill="#ff2a6d" filter="url(#gp)"/>',
      '<rect x="118" y="91"  width="5"   height="21" rx="1" fill="#ff2a6d" filter="url(#gp)"/>',
      '<rect x="20"  y="93"  width="98"  height="5"  rx="1" fill="#0d0d2b" stroke="#ff2a6d" stroke-width="0.9"/>',
      '<rect x="15"  y="98"  width="108" height="6"  rx="1" fill="#0d0d2b" stroke="#ff2a6d" stroke-width="1.2"/>',
      '<rect x="13"  y="104" width="112" height="7"  rx="1" fill="#0d0d2b" stroke="#ff2a6d" stroke-width="1.7" filter="url(#gp)"/>',

      /* ── NOSE CONE ────────────────────────────────────────────── */
      '<path d="M 13 109 L 13 99 L 100 71 L 100 85 Z" fill="#0d0d2b" stroke="#ff2a6d" stroke-width="1.7" filter="url(#gp)"/>',
      '<path d="M 13 105 L 13 101 L 100 73 L 100 79 Z" fill="rgba(5,217,232,0.22)"/>',
      '<path d="M 32 107 L 32 103 L 100 75 L 100 79 Z" fill="rgba(255,215,0,0.22)"/>',

      /* ── MAIN BODY ────────────────────────────────────────────── */
      '<path d="M 96 85 L 96 55 L 150 47 L 170 29 L 230 29 L 250 47 L 305 57 L 320 73 L 320 85 Z"',
      '      fill="#0d0d2b" stroke="#ff2a6d" stroke-width="1.7" filter="url(#gp)"/>',
      '<path d="M 252 59 L 308 61 L 318 79 L 252 77 Z" fill="#090918" stroke="rgba(5,217,232,0.22)" stroke-width="0.7"/>',
      '<rect x="96"  y="81" width="224" height="4" fill="rgba(5,217,232,0.12)"/>',
      '<rect x="96"  y="67" width="224" height="3" fill="rgba(255,42,109,0.28)"/>',

      /* ── COCKPIT ──────────────────────────────────────────────── */
      '<path d="M 170 29 L 230 29 L 230 51 L 170 51 Z" fill="#090918" stroke="#ff2a6d" stroke-width="1"/>',
      '<path d="M 174 31 L 226 31 L 226 49 L 174 49 Z" fill="#05d9e8" fill-opacity="0.18" stroke="#05d9e8" stroke-width="0.7" stroke-opacity="0.55"/>',
      '<ellipse cx="200" cy="39" rx="15" ry="11" fill="#0a0a1a" stroke="#ff2a6d" stroke-width="0.7"/>',
      '<ellipse cx="200" cy="37" rx="10" ry="6"  fill="#05d9e8" fill-opacity="0.14"/>',

      /* ── HALO ─────────────────────────────────────────────────── */
      '<path d="M 176 31 L 176 21 Q 200 13 224 21 L 224 31" fill="none" stroke="#ff2a6d" stroke-width="4" stroke-linejoin="round" filter="url(#gp)"/>',
      '<line x1="200" y1="13" x2="200" y2="31" stroke="#ff2a6d" stroke-width="2.2" filter="url(#gp)"/>',

      /* ── REAR WING PYLONS ─────────────────────────────────────── */
      '<rect x="316" y="51" width="5" height="34" rx="1" fill="#1a1a3e" stroke="#ff2a6d" stroke-width="0.8"/>',
      '<rect x="342" y="51" width="5" height="34" rx="1" fill="#1a1a3e" stroke="#ff2a6d" stroke-width="0.8"/>',

      /* ── REAR WING ────────────────────────────────────────────── */
      '<rect x="310" y="27" width="63" height="10" rx="2" fill="#0d0d2b" stroke="#ff2a6d" stroke-width="1.8" filter="url(#gp)"/>',
      '<rect x="312" y="37" width="59" height="7"  rx="1" fill="#0d0d2b" stroke="#ff2a6d" stroke-width="1.2"/>',
      '<rect x="314" y="33" width="55" height="2"  rx="1" fill="rgba(5,217,232,0.38)"/>',
      '<rect x="369" y="23" width="5"  height="62" rx="1" fill="#ff2a6d" filter="url(#gp)"/>',
      '<rect x="308" y="27" width="4"  height="58" rx="1" fill="#ff2a6d" opacity="0.45"/>',

      /* ── DIFFUSER ─────────────────────────────────────────────── */
      '<path d="M 318 85 L 358 85 L 372 110 L 314 110 Z" fill="#090918" stroke="#ff2a6d" stroke-width="1.2"/>',
      '<line x1="328" y1="85" x2="336" y2="110" stroke="rgba(255,42,109,0.38)" stroke-width="0.8"/>',
      '<line x1="342" y1="85" x2="350" y2="110" stroke="rgba(255,42,109,0.38)" stroke-width="0.8"/>',

      /* ── EXHAUST ──────────────────────────────────────────────── */
      '<ellipse cx="304" cy="70" rx="7.5" ry="4.5" fill="#0d0005" stroke="#ff2a6d" stroke-width="0.9"/>',
      '<ellipse cx="304" cy="70" rx="4.5" ry="2.8"  fill="#180000"/>',
      flame,

      /* ── FRONT WHEEL ──────────────────────────────────────────── */
      '<rect  x="59"  y="85"  width="15" height="7" rx="1" fill="#1a1a3e" stroke="#05d9e8" stroke-width="0.6" filter="url(#gc)"/>',
      '<circle cx="82"  cy="106" r="22" fill="#050510" stroke="#ff2a6d" stroke-width="2.3" filter="url(#gp)"/>',
      '<circle cx="82"  cy="106" r="18" fill="none"   stroke="#ff2a6d" stroke-width="0.5" opacity="0.32"/>',
      '<circle cx="82"  cy="106" r="13" fill="#0d0d1a" stroke="#ff2a6d" stroke-width="1.8"/>',
      frontSpokes,
      '<circle cx="82"  cy="106" r="5"   fill="#ff2a6d" filter="url(#gp)"/>',
      '<circle cx="82"  cy="106" r="2.5" fill="#0d0d1a"/>',

      /* ── REAR WHEEL ───────────────────────────────────────────── */
      '<rect  x="272" y="85"  width="15" height="7" rx="1" fill="#1a1a3e" stroke="#05d9e8" stroke-width="0.6" filter="url(#gc)"/>',
      '<circle cx="294" cy="106" r="23" fill="#050510" stroke="#ff2a6d" stroke-width="2.3" filter="url(#gp)"/>',
      '<circle cx="294" cy="106" r="19" fill="none"   stroke="#ff2a6d" stroke-width="0.5" opacity="0.32"/>',
      '<circle cx="294" cy="106" r="13" fill="#0d0d1a" stroke="#ff2a6d" stroke-width="1.8"/>',
      rearSpokes,
      '<circle cx="294" cy="106" r="5"   fill="#ff2a6d" filter="url(#gp)"/>',
      '<circle cx="294" cy="106" r="2.5" fill="#0d0d1a"/>',

      /* ── SMOKE ────────────────────────────────────────────────── */
      exhaustSmoke,
      frontSmoke,
      rearSmoke,

      '</svg>'
    ].join('');
  }

  /* ── Progress bar animation ───────────────────────────────────── */
  var fill   = document.getElementById('ls-fill');
  var pctEl  = document.getElementById('ls-pct');
  var start  = Date.now();
  var MIN_MS = 2800;
  var ready  = false;
  var raf;

  function tick() {
    var elapsed = (Date.now() - start) / 1000;
    var target  = ready
      ? 1
      : Math.min(0.92, 1 - Math.pow(1 - Math.min(elapsed / 2.8, 1), 1.9));

    var cur = (parseFloat(fill.style.width) || 0) / 100;
    cur     = cur + (target - cur) * 0.055;

    fill.style.width  = (cur * 100).toFixed(2) + '%';
    pctEl.textContent = Math.floor(cur * 100);

    if (cur < 0.999) {
      raf = requestAnimationFrame(tick);
    } else {
      dismiss();
    }
  }

  function dismiss() {
    cancelAnimationFrame(raf);
    fill.style.width  = '100%';
    pctEl.textContent = '100';
    setTimeout(function () {
      screen.classList.add('ls-out');
      setTimeout(function () { screen.style.display = 'none'; }, 780);
    }, 280);
  }

  window.addEventListener('load', function () {
    var elapsed = Date.now() - start;
    setTimeout(function () { ready = true; }, Math.max(0, MIN_MS - elapsed));
  });

  /* Safety net */
  setTimeout(function () { ready = true; }, 8000);
  requestAnimationFrame(tick);

}());
