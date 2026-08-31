/* =====================================================================
 * SUNLIGHT SPECTRUM  ·  "Sunlight is not one thing."   (about.html)
 * ---------------------------------------------------------------------
 * No dependencies. Progressive enhancement — without JS the markup
 * still shows the copy, the car and a readable Ultraviolet state.
 *
 * ┌─ WHERE TO ADJUST THINGS ─────────────────────────────────────────┐
 * │  CONFIG.windshield  the film / clip polygon, as [x%, y%] of the   │
 * │                     car box. The ONE place the windshield mask is │
 * │                     defined — it drives the CSS clip-path on      │
 * │                     .sss__film / .sss__windglow AND the           │
 * │                     <clipPath> inside the FX <svg>.               │
 * │  CONFIG.ticks       wavelength labels + vertical position         │
 * │                     (0 = top / 280 nm, 100 = bottom / infrared).  │
 * │  CONFIG.bands       accent, cabin temperature, film opacity, heat │
 * │                     intensity, ray colours, spectrum marker.      │
 * │  CONFIG.baseTempC   the "48°C BARE GLASS" baseline.               │
 * └──────────────────────────────────────────────────────────────────┘
 * ===================================================================== */
(function () {
  'use strict';

  var root = document.getElementById('sunlight-spectrum');
  if (!root) return;

  /* ================================================================= *
   *  CONFIG — single source of truth
   * ================================================================= */
  var CONFIG = {

    /* Windshield outline, clockwise from top-left, [x%, y%] of the car
       box. Re-trace against /uv99/assets/NEWCAR.png (shown with
       object-fit:cover, object-position:10% 50%) if the art changes.
       MAIN front windscreen only. */
    windshield: [
      [43.5, 33],
      [71.0, 22],
      [74.0, 38],
      [43.0, 46]
    ],

    /* FX <svg> viewBox — the clip polygon is scaled into this space.
       Its ratio matches .sss__carbox (1600/950 ≈ 1.684). */
    fxViewBox: [1600, 950],

    baseTempC: 48,

    ticks: [
      { label: '280 nm',        pos: 2  },
      { label: '400 nm',        pos: 22 },
      { label: '780 nm',        pos: 74 },
      { label: 'Beyond 780 nm', pos: 97 }
    ],

    bands: {
      uv: {
        label: 'Ultraviolet',
        accent: '#b06bff',
        accentSoft: 'rgba(176, 107, 255, .16)',
        tempC: 38.0,
        filmOpacity: 0.40,
        heat: 0.10,
        rayIn: '#e463ff',
        rayRefl: '#a78bfa',
        spark: '#d7b3ff',
        filmTint: 'linear-gradient(150deg, rgba(150,90,255,.5), rgba(90,50,200,.26))',
        marker: 22,
        bracket: [0, 22]
      },
      visible: {
        label: 'Visible light',
        accent: '#37e0c8',
        accentSoft: 'rgba(55, 224, 200, .16)',
        tempC: 36.2,
        filmOpacity: 0.10,
        heat: 0.05,
        rayIn: '#eaf4ff',
        rayRefl: '#9fe9ff',
        spark: '#dff6ff',
        filmTint: 'linear-gradient(150deg, rgba(230,244,255,.34), rgba(180,210,255,.12))',
        marker: 48,
        bracket: [22, 74]
      },
      infrared: {
        label: 'Infrared',
        accent: '#ff8a3d',
        accentSoft: 'rgba(255, 138, 61, .18)',
        tempC: 41.8,
        filmOpacity: 0.24,
        heat: 0.85,
        rayIn: '#ff7a2a',
        rayRefl: '#ffb066',
        spark: '#ffd0a0',
        filmTint: 'linear-gradient(150deg, rgba(255,150,70,.46), rgba(200,90,40,.24))',
        marker: 86,
        bracket: [74, 100]
      }
    }
  };

  var ORDER = ['uv', 'visible', 'infrared'];

  /* ================================================================= *
   *  Element handles
   * ================================================================= */
  var $  = function (s, c) { return (c || root).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || root).querySelectorAll(s)); };

  var stage     = $('.sss__stage');
  var film      = $('.sss__film');
  var windGlow  = $('.sss__windglow');
  var clipPoly  = $('#sssWindPoly');
  var cards     = $$('.sss__card');
  var marker    = $('.sss__marker');
  var bracket   = $('.sss__bracket');
  var tickWrap  = $('.sss__ticks');
  var tempValue = $('.sss__temp-value');
  var tempGraph = $('.sss__temp-graph polyline');
  var tempDot   = $('.sss__temp-graph circle');
  var sr        = $('.sss__sr');
  var legends   = {};
  $$('.sss__leg').forEach(function (el) { legends[el.dataset.band] = el; });

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  /* ================================================================= *
   *  Windshield mask — write the ONE polygon into all three consumers
   * ================================================================= */
  function applyWindshield() {
    var pts = CONFIG.windshield;
    var css = 'polygon(' + pts.map(function (p) { return p[0] + '% ' + p[1] + '%'; }).join(', ') + ')';
    if (film)     film.style.clipPath = css;
    if (windGlow) windGlow.style.clipPath = css;
    if (clipPoly) {
      var vb = CONFIG.fxViewBox;
      clipPoly.setAttribute('points', pts.map(function (p) {
        return (p[0] / 100 * vb[0]).toFixed(1) + ',' + (p[1] / 100 * vb[1]).toFixed(1);
      }).join(' '));
    }
  }

  /* ================================================================= *
   *  Wavelength ticks — positioned from CONFIG so labels + marker agree
   * ================================================================= */
  function applyTicks() {
    if (!tickWrap) return;
    tickWrap.innerHTML = '';
    CONFIG.ticks.forEach(function (t) {
      var d = document.createElement('div');
      d.className = 'sss__tick';
      d.style.top = t.pos + '%';
      d.textContent = t.label;
      tickWrap.appendChild(d);
    });
  }

  /* ================================================================= *
   *  Temperature — animate the number + redraw the trend line
   * ================================================================= */
  var tempRAF = 0;
  var shownTemp = CONFIG.bands.uv.tempC;

  function drawGraph(tempC) {
    if (!tempGraph) return;
    var drop = CONFIG.baseTempC - tempC;                 /* 6–12 typically */
    var pts = [
      [4,   24 - drop * 0.2],
      [30,  22 - drop * 0.5],
      [58,  20 - drop * 0.95],
      [86,  18 - drop * 1.45],
      [112, 16 - drop * 1.95]
    ].map(function (p) { return [p[0], Math.max(2, Math.min(30, p[1]))]; });
    tempGraph.setAttribute('points', pts.map(function (p) { return p.join(','); }).join(' '));
    if (tempDot) { tempDot.setAttribute('cx', pts[4][0]); tempDot.setAttribute('cy', pts[4][1]); }
  }

  function animateTemp(toTemp) {
    if (tempRAF) cancelAnimationFrame(tempRAF);
    var from = shownTemp, start = 0, dur = reduceMotion ? 0 : 560;
    function step(ts) {
      if (!start) start = ts;
      var k = dur ? Math.min(1, (ts - start) / dur) : 1;
      var e = 1 - Math.pow(1 - k, 3);
      shownTemp = from + (toTemp - from) * e;
      if (tempValue) tempValue.textContent = shownTemp.toFixed(1);
      if (k < 1) tempRAF = requestAnimationFrame(step);
    }
    tempRAF = requestAnimationFrame(step);
    drawGraph(toTemp);
  }

  /* ================================================================= *
   *  Band selection — never remounts the visualisation
   * ================================================================= */
  var activeBand = 'uv';

  function setBand(id, viaUser) {
    var band = CONFIG.bands[id];
    if (!band || id === activeBand && viaUser) { /* still allow first call */ }
    if (!band) return;
    activeBand = id;

    stage.setAttribute('data-band', id);
    root.style.setProperty('--sss-accent', band.accent);
    root.style.setProperty('--sss-accent-soft', band.accentSoft);
    root.style.setProperty('--sss-film-opacity', band.filmOpacity);
    root.style.setProperty('--sss-heat', band.heat);
    root.style.setProperty('--sss-ray-in', band.rayIn);
    root.style.setProperty('--sss-ray-refl', band.rayRefl);
    root.style.setProperty('--sss-spark', band.spark);
    if (film) film.style.background = band.filmTint;

    /* spectrum marker + bracket */
    marker.style.top = band.marker + '%';
    bracket.style.top = band.bracket[0] + '%';
    bracket.style.height = (band.bracket[1] - band.bracket[0]) + '%';

    /* legend emphasis */
    ORDER.forEach(function (k) {
      if (legends[k]) legends[k].classList.toggle('is-dim', k !== id);
    });

    /* cards */
    cards.forEach(function (c) {
      var on = c.dataset.band === id;
      c.setAttribute('aria-pressed', String(on));
      c.setAttribute('aria-selected', String(on));
      c.tabIndex = on ? 0 : -1;
      c.style.setProperty('--card-accent', CONFIG.bands[c.dataset.band].accent);
    });

    animateTemp(band.tempC);

    if (!reduceMotion) {
      stage.classList.remove('is-scanning');
      void stage.offsetWidth;
      stage.classList.add('is-scanning');
    }

    if (viaUser && sr) {
      sr.textContent = band.label + ' selected. Modelled cabin temperature ' +
        band.tempC.toFixed(1) + ' degrees Celsius against a ' +
        CONFIG.baseTempC + ' degree bare-glass baseline.';
    }
  }

  /* --- card interaction: behave as a tablist --- */
  cards.forEach(function (c, i) {
    c.addEventListener('click', function () { setBand(c.dataset.band, true); c.focus(); });
    c.addEventListener('keydown', function (ev) {
      var k = ev.key, dir = 0;
      if (k === 'ArrowRight' || k === 'ArrowDown') dir = 1;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') dir = -1;
      else if (k === 'Home') { ev.preventDefault(); cards[0].focus(); setBand(cards[0].dataset.band, true); return; }
      else if (k === 'End') { ev.preventDefault(); cards[cards.length - 1].focus(); setBand(cards[cards.length - 1].dataset.band, true); return; }
      else return;
      ev.preventDefault();
      var next = cards[(i + dir + cards.length) % cards.length];
      next.focus();
      setBand(next.dataset.band, true);
    });
  });

  /* ================================================================= *
   *  Pause the ambient motion when the section is off-screen
   * ================================================================= */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { root.classList.toggle('is-offscreen', !e.isIntersecting); });
    }, { threshold: 0.02 }).observe(root);
  }

  /* ================================================================= *
   *  Go
   * ================================================================= */
  applyWindshield();
  applyTicks();
  drawGraph(CONFIG.bands.uv.tempC);
  setBand('uv', false);
  window.addEventListener('resize', applyWindshield);
})();
