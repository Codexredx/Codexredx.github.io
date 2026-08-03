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

    /* Car body silhouette — drawn facing RIGHT (nose on the right).
       Reused for the livery clip so paint bands never bleed outside. */
    var bodyPath = 'M 382 108 L 260 76 L 252 70 L 210 70 L 202 46 '
      + 'Q 196 42 190 46 Q 140 56 100 74 L 80 82 L 74 96 L 74 118 '
      + 'L 300 118 L 382 112 Z';

    /* Exhaust smoke — trails off to the LEFT, behind the car */
    var exhaustSmoke = particles(3,
      '68;46;22',   '88;70;48',
      '3;8;16',     '0.75;0.35;0',
      'rgba(200,195,188,0.78)', '1.7s'
    );

    /* Front-tyre smoke */
    var frontSmoke = particles(2,
      '302;282;260', '130;110;90',
      '2;6;12',      '0.65;0.3;0',
      'rgba(212,212,224,0.82)', '1.45s'
    );

    /* Rear-tyre smoke */
    var rearSmoke = particles(4,
      '92;64;34',   '130;104;76',
      '4;12;24',    '0.85;0.45;0',
      'rgba(218,218,232,0.92)', '1.9s'
    );

    /* Exhaust flame flicker */
    var flame = '<ellipse cx="63" cy="88" rx="5" ry="3" fill="rgba(255,115,25,0.85)">'
      + '<animate attributeName="rx"      values="5;3;7;4;5"              dur="0.45s" repeatCount="indefinite"/>'
      + '<animate attributeName="ry"      values="3;5;2;4;3"              dur="0.45s" repeatCount="indefinite"/>'
      + '<animate attributeName="opacity" values="0.85;0.35;0.95;0.5;0.85" dur="0.45s" repeatCount="indefinite"/>'
      + '</ellipse>';

    var rearSpokes = '<g class="wheel-spokes">'
      + '<line x1="102" y1="96"  x2="102" y2="118" stroke="#c084fc" stroke-width="1.7"/>'
      + '<line x1="91"  y1="107" x2="113" y2="107" stroke="#c084fc" stroke-width="1.7"/>'
      + '<line x1="94"  y1="100" x2="110" y2="114" stroke="#c084fc" stroke-width="1.1"/>'
      + '<line x1="94"  y1="114" x2="110" y2="100" stroke="#c084fc" stroke-width="1.1"/>'
      + '</g>';

    var frontSpokes = '<g class="wheel-spokes">'
      + '<line x1="312" y1="100" x2="312" y2="118" stroke="#c084fc" stroke-width="1.7"/>'
      + '<line x1="303" y1="109" x2="321" y2="109" stroke="#c084fc" stroke-width="1.7"/>'
      + '<line x1="306" y1="103" x2="318" y2="115" stroke="#c084fc" stroke-width="1.1"/>'
      + '<line x1="306" y1="115" x2="318" y2="103" stroke="#c084fc" stroke-width="1.1"/>'
      + '</g>';

    scene.innerHTML = [
      '<svg class="ls-car-svg" viewBox="0 0 400 132" xmlns="http://www.w3.org/2000/svg">',
      '<defs>',
      '  <filter id="gp" x="-50%" y="-50%" width="200%" height="200%">',
      '    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b"/>',
      '    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>',
      '  </filter>',
      '  <filter id="gc" x="-50%" y="-50%" width="200%" height="200%">',
      '    <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b"/>',
      '    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>',
      '  </filter>',
      '  <linearGradient id="lgB" x1="0" y1="0" x2="1" y2="0">',
      '    <stop offset="0" stop-color="#0a3fb8"/><stop offset="1" stop-color="#2f7bff"/>',
      '  </linearGradient>',
      '  <linearGradient id="lgP" x1="0" y1="0" x2="1" y2="0">',
      '    <stop offset="0" stop-color="#8b2fd6"/><stop offset="1" stop-color="#e04cff"/>',
      '  </linearGradient>',
      '  <linearGradient id="lgD" x1="0" y1="0" x2="0" y2="1">',
      '    <stop offset="0" stop-color="#232334"/><stop offset="0.5" stop-color="#101018"/><stop offset="1" stop-color="#05050b"/>',
      '  </linearGradient>',
      '  <clipPath id="bc"><path d="' + bodyPath + '"/></clipPath>',
      '</defs>',

      /* Ground shadow + glow */
      '<ellipse cx="200" cy="128" rx="180" ry="4" fill="rgba(8,8,18,0.55)"/>',
      '<ellipse cx="200" cy="128" rx="150" ry="3" fill="rgba(139,47,214,0.22)"/>',

      /* Speed lines trailing behind the car (hidden while idling) */
      '<g class="ls-speed">',
      '<line x1="0" y1="70"  x2="16" y2="70"  stroke="#2f7bff" stroke-width="2.0" opacity="0.90"/>',
      '<line x1="0" y1="82"  x2="11" y2="82"  stroke="#a855f7" stroke-width="1.5" opacity="0.65"/>',
      '<line x1="0" y1="94"  x2="8"  y2="94"  stroke="#2f7bff" stroke-width="1.0" opacity="0.40"/>',
      '<line x1="0" y1="104" x2="5"  y2="104" stroke="#a855f7" stroke-width="0.7" opacity="0.22"/>',
      '</g>',

      /* ── REAR WING (over the rear wheel) ──────────────────────── */
      '<rect x="106" y="52" width="6"  height="22" rx="1" fill="#10101c" stroke="rgba(47,123,255,0.45)" stroke-width="0.8"/>',
      '<rect x="64" y="26" width="62" height="8"  rx="2" fill="url(#lgP)" filter="url(#gp)"/>',
      '<rect x="62" y="36" width="66" height="11" rx="2" fill="#0a0a14" stroke="#2f7bff" stroke-width="1.4" filter="url(#gc)"/>',
      '<rect x="66" y="39" width="58" height="2"  rx="1" fill="rgba(47,123,255,0.55)"/>',
      '<rect x="66" y="49" width="62" height="6"  rx="1" fill="#0a0a14" stroke="rgba(47,123,255,0.6)" stroke-width="1"/>',
      '<rect x="60" y="74" width="50" height="5"  rx="1" fill="#0a0a14" stroke="rgba(168,85,247,0.55)" stroke-width="0.9"/>',
      '<rect x="56" y="24" width="6"  height="58" rx="1" fill="url(#lgP)" filter="url(#gp)"/>',

      /* ── DIFFUSER ─────────────────────────────────────────────── */
      '<path d="M 74 100 L 74 118 L 50 118 L 60 98 Z" fill="#08080f" stroke="rgba(168,85,247,0.55)" stroke-width="1.1"/>',
      '<line x1="64" y1="102" x2="56" y2="118" stroke="rgba(168,85,247,0.35)" stroke-width="0.8"/>',
      '<line x1="69" y1="106" x2="63" y2="118" stroke="rgba(168,85,247,0.35)" stroke-width="0.8"/>',

      /* ── BODY (solid, filled) ─────────────────────────────────── */
      '<path d="' + bodyPath + '" fill="url(#lgD)" stroke="#2f7bff" stroke-width="1.4" filter="url(#gc)"/>',

      /* ── LIVERY — bold bands clipped to the body ──────────────── */
      '<g clip-path="url(#bc)">',
      '  <path d="M 74 40 L 215 40 L 165 122 L 74 122 Z"   fill="url(#lgB)" opacity="0.95"/>',
      '  <path d="M 235 40 L 262 40 L 202 122 L 175 122 Z" fill="url(#lgP)" opacity="0.95"/>',
      '  <path d="M 262 40 L 270 40 L 210 122 L 202 122 Z" fill="rgba(255,255,255,0.85)"/>',
      '  <path d="M 285 57 L 300 57 L 255 122 L 240 122 Z" fill="url(#lgP)" opacity="0.6"/>',
      '  <rect x="74" y="112" width="250" height="3" fill="rgba(5,217,232,0.5)"/>',
      '</g>',

      /* Nose top highlight */
      '<line x1="264" y1="79" x2="376" y2="108" stroke="rgba(255,255,255,0.22)" stroke-width="1.2"/>',

      /* ── COCKPIT + DRIVER ─────────────────────────────────────── */
      '<rect x="210" y="64" width="42" height="7" rx="3" fill="#04040a"/>',
      '<circle cx="228" cy="66" r="7" fill="#f5f5fa" stroke="#8b2fd6" stroke-width="1.4"/>',
      '<rect x="229.5" y="62.5" width="6" height="4" rx="2" fill="#05d9e8" opacity="0.9"/>',

      /* Airbox intake */
      '<ellipse cx="197" cy="47" rx="4.5" ry="3" fill="#03030a" stroke="rgba(47,123,255,0.6)" stroke-width="0.7"/>',

      /* ── HALO ─────────────────────────────────────────────────── */
      '<path d="M 208 68 Q 229 46 250 68" fill="none" stroke="#a855f7" stroke-width="4" stroke-linecap="round" filter="url(#gp)"/>',
      '<line x1="229" y1="51" x2="229" y2="67" stroke="#a855f7" stroke-width="2" filter="url(#gp)"/>',

      /* ── EXHAUST ──────────────────────────────────────────────── */
      '<ellipse cx="76" cy="88" rx="6"   ry="4"   fill="#0d0005" stroke="#a855f7" stroke-width="0.9"/>',
      '<ellipse cx="76" cy="88" rx="3.5" ry="2.2" fill="#180000"/>',
      flame,

      /* ── SUSPENSION ───────────────────────────────────────────── */
      '<line x1="128" y1="92"  x2="104" y2="104" stroke="#10101a" stroke-width="3"/>',
      '<line x1="128" y1="108" x2="104" y2="112" stroke="#10101a" stroke-width="3"/>',
      '<line x1="268" y1="90"  x2="306" y2="102" stroke="#10101a" stroke-width="3"/>',
      '<line x1="268" y1="108" x2="306" y2="110" stroke="#10101a" stroke-width="3"/>',

      /* Race number */
      '<text x="270" y="104" text-anchor="middle" font-family="Orbitron, sans-serif" font-size="15" font-weight="900" font-style="italic" fill="#ffffff" opacity="0.92">10</text>',

      /* ── FRONT WING (right) ───────────────────────────────────── */
      '<rect x="322" y="104" width="50" height="3" rx="1" fill="url(#lgB)" opacity="0.8"/>',
      '<rect x="324" y="108" width="56" height="4" rx="1" fill="#0a0a14" stroke="rgba(47,123,255,0.8)" stroke-width="0.8"/>',
      '<rect x="320" y="113" width="62" height="5" rx="1" fill="#0a0a14" stroke="#2f7bff" stroke-width="1"/>',
      '<rect x="316" y="119" width="70" height="6" rx="1" fill="#0a0a14" stroke="#a855f7" stroke-width="1.4" filter="url(#gp)"/>',
      '<rect x="384" y="98" width="6"  height="30" rx="1" fill="url(#lgP)" filter="url(#gp)"/>',

      /* ── REAR WHEEL ───────────────────────────────────────────── */
      '<circle cx="102" cy="107" r="23"   fill="#0b0b12" stroke="#1e1e2c" stroke-width="2.5"/>',
      '<circle cx="102" cy="107" r="23"   fill="none" stroke="rgba(168,85,247,0.4)" stroke-width="1.5" filter="url(#gp)"/>',
      '<circle cx="102" cy="107" r="18.5" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="4"/>',
      '<circle cx="102" cy="107" r="12.5" fill="#140a22" stroke="#a855f7" stroke-width="2" filter="url(#gp)"/>',
      rearSpokes,
      '<circle cx="102" cy="107" r="4.5" fill="#a855f7" filter="url(#gp)"/>',
      '<circle cx="102" cy="107" r="2.2" fill="#0b0b12"/>',

      /* ── FRONT WHEEL ──────────────────────────────────────────── */
      '<circle cx="312" cy="109" r="21"   fill="#0b0b12" stroke="#1e1e2c" stroke-width="2.5"/>',
      '<circle cx="312" cy="109" r="21"   fill="none" stroke="rgba(168,85,247,0.4)" stroke-width="1.5" filter="url(#gp)"/>',
      '<circle cx="312" cy="109" r="16.5" fill="none" stroke="rgba(255,255,255,0.07)" stroke-width="4"/>',
      '<circle cx="312" cy="109" r="11.5" fill="#140a22" stroke="#a855f7" stroke-width="2" filter="url(#gp)"/>',
      frontSpokes,
      '<circle cx="312" cy="109" r="4" fill="#a855f7" filter="url(#gp)"/>',
      '<circle cx="312" cy="109" r="2" fill="#0b0b12"/>',

      /* ── SMOKE (tyre smoke hidden while idling) ───────────────── */
      exhaustSmoke,
      '<g class="ls-tsmoke">',
      frontSmoke,
      rearSmoke,
      '</g>',

      '</svg>'
    ].join('');

    /* Enter idle state once the drive-in animation finishes */
    var carSvg = scene.querySelector('.ls-car-svg');
    var idleTimer = setTimeout(startIdle, 1700); /* fallback */
    function startIdle() {
      clearTimeout(idleTimer);
      screen.classList.add('ls-idle');
    }
    carSvg.addEventListener('animationend', function (e) {
      if (e.animationName === 'driveIn') startIdle();
    });
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
      /* Car accelerates off the right edge of the screen… */
      screen.classList.remove('ls-idle');
      screen.classList.add('ls-drive');
      setTimeout(function () {
        /* …then the loader fades out */
        screen.classList.add('ls-out');
        setTimeout(function () { screen.style.display = 'none'; }, 780);
      }, 1250);
    }, 300);
  }

  window.addEventListener('load', function () {
    var elapsed = Date.now() - start;
    setTimeout(function () { ready = true; }, Math.max(0, MIN_MS - elapsed));
  });

  /* Safety net */
  setTimeout(function () { ready = true; }, 8000);
  requestAnimationFrame(tick);

}());
