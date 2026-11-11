// Musica della home: lo stesso suono del video di riferimento, generato dal codice (nessun file audio).
// I browser non permettono di far partire l'audio senza un gesto: parte dal pulsante "Suono"
// (o al primo tocco/tasto, se nella visita precedente era stata accesa). Si abbassa quando non si scorre,
// si ferma fuori dallo showreel o quando la scheda è nascosta.
(() => {
  'use strict';
  const btn = document.querySelector('[data-suono]');
  const reel = document.getElementById('reel');
  if (!btn || !reel || !window.AudioContext) return;
  const KEY = 'lmm-suono';
  let ctx = null, master = null, bus = null, noise = null, on = false, timer = 0, lastScroll = 0;

  // Il suono del video di riferimento (_materiali/Showreel/index.html), ricetta identica:
  // cassa con click a ogni battito, charleston in levare, colpi con accordo in La minore e sub, riser.
  // Lo schema dura 10 secondi (20 battiti a 120 BPM) e va in loop.
  const LOOP = 10;
  let loopAt = 0;

  function init() {
    ctx = new AudioContext();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4; comp.attack.value = .003; comp.release.value = .12;
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    const out = ctx.createGain(); out.gain.value = .85; comp.connect(out); out.connect(master); bus = comp;
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = noise.getChannelData(0); let s = 12345;
    for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = s / 0x3fffffff - 1; }
  }
  const rumore = (t, dur) => { const n = ctx.createBufferSource(); n.buffer = noise; n.start(t); n.stop(t + dur); return n; };
  const env = (g, t, a, peak, dec) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(.0008, t + a + dec); };

  function cassa(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(165, t); o.frequency.exponentialRampToValueAtTime(44, t + .11);
    env(g, t, .002, 1, .32); o.connect(g); g.connect(bus); o.start(t); o.stop(t + .4);
    const n = rumore(t, .02), hp = ctx.createBiquadFilter(), g2 = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 3000; env(g2, t, .0005, .25, .012); n.connect(hp); hp.connect(g2); g2.connect(bus);
  }
  function hat(t, v) {
    const n = rumore(t, .08), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    hp.type = 'highpass'; hp.frequency.value = 8500; env(g, t, .001, v, .045); n.connect(hp); hp.connect(g); g.connect(bus);
  }
  function colpo(t, v) {
    const n = rumore(t, .6), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(5000, t); lp.frequency.exponentialRampToValueAtTime(300, t + .4);
    env(g, t, .001, .42 * v, .38); n.connect(lp); lp.connect(g); g.connect(bus);
    [110, 164.81, 220, 261.63, 329.63].forEach((f, i) => {
      const o = ctx.createOscillator(), og = ctx.createGain(), f2 = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.value = f * (1 + (i % 2 ? .004 : -.004));
      f2.type = 'lowpass'; f2.frequency.setValueAtTime(3200, t); f2.frequency.exponentialRampToValueAtTime(260, t + .32);
      env(og, t, .003, .07 * v, .34); o.connect(f2); f2.connect(og); og.connect(bus); o.start(t); o.stop(t + .4);
    });
    const sub = ctx.createOscillator(), sg = ctx.createGain();
    sub.frequency.setValueAtTime(70, t); sub.frequency.exponentialRampToValueAtTime(48, t + .3);
    env(sg, t, .002, .6 * v, .45); sub.connect(sg); sg.connect(bus); sub.start(t); sub.stop(t + .5);
  }
  function riser(t0, t1) {
    const n = rumore(t0, t1 - t0), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = 'bandpass'; bp.Q.value = 2.5; bp.frequency.setValueAtTime(300, t0); bp.frequency.exponentialRampToValueAtTime(7000, t1);
    g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(.5, t1 - .01); g.gain.linearRampToValueAtTime(0, t1);
    n.connect(bp); bp.connect(g); g.connect(bus);
    const o = ctx.createOscillator(), og = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t0); o.frequency.exponentialRampToValueAtTime(880, t1);
    lp.type = 'lowpass'; lp.frequency.setValueAtTime(400, t0); lp.frequency.exponentialRampToValueAtTime(5000, t1);
    og.gain.setValueAtTime(.0001, t0); og.gain.exponentialRampToValueAtTime(.12, t1 - .01); og.gain.linearRampToValueAtTime(0, t1);
    o.connect(lp); lp.connect(og); og.connect(bus); o.start(t0); o.stop(t1);
  }
  function giro(L) {   // uno schema intero di 10 secondi a partire da L
    for (let k = 0; k < 20; k++) { cassa(L + k * .5); hat(L + k * .5 + .25, .13); }
    riser(L + 4, L + 6);
    [2, 4, 6, 8].forEach(x => colpo(L + x, 1)); colpo(L + 7.5, .8); colpo(L + 9, .55);
  }
  function scheduler() {
    if (ctx.currentTime > loopAt - 1) { giro(loopAt); loopAt += LOOP; }
    // volume: pieno mentre si scorre dentro lo showreel, più basso da fermi, spento fuori
    const r = reel.getBoundingClientRect(), dentro = r.bottom > innerHeight * .3 && r.top < innerHeight * .7;
    const fermo = performance.now() - lastScroll > 1200;
    const vol = !dentro || document.hidden ? 0 : fermo ? .25 : .7;
    master.gain.setTargetAtTime(vol, ctx.currentTime, .35);
  }

  function accendi() {
    if (!ctx) init();
    ctx.resume().then(() => {
      if (on) return;
      on = true; loopAt = ctx.currentTime + .05; lastScroll = performance.now();
      timer = setInterval(scheduler, 25);
      btn.setAttribute('aria-pressed', 'true'); btn.classList.add('is-on');
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
    }).catch(() => {});
  }
  function spegni(ricorda) {
    on = false; clearInterval(timer);
    if (ctx) { const c = ctx; master.gain.setTargetAtTime(0, c.currentTime, .06); setTimeout(() => c.close(), 250); ctx = null; }   // niente suoni già programmati alla riaccensione
    btn.setAttribute('aria-pressed', 'false'); btn.classList.remove('is-on');
    if (ricorda) { try { localStorage.setItem(KEY, '0'); } catch (e) {} }
  }

  btn.addEventListener('click', () => (on ? spegni(true) : accendi()));
  addEventListener('scroll', () => { lastScroll = performance.now(); }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (ctx && on) { document.hidden ? ctx.suspend() : ctx.resume(); } });

  // se era accesa nella visita precedente, riparte al primo gesto che il browser accetta
  let pref = null; try { pref = localStorage.getItem(KEY); } catch (e) {}
  if (pref === '1') {
    const primo = e => { if (e.target.closest && e.target.closest('[data-suono]')) return; accendi(); ['pointerdown', 'keydown', 'touchend'].forEach(ev => removeEventListener(ev, primo, true)); };
    ['pointerdown', 'keydown', 'touchend'].forEach(ev => addEventListener(ev, primo, true));
  }
})();
