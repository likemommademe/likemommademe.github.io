// Musica della home: house a 120 BPM generata dal codice (nessun file audio), nello stile del video di riferimento.
// I browser non permettono di far partire l'audio senza un gesto: parte dal pulsante "Suono"
// (o al primo tocco/tasto, se nella visita precedente era stata accesa). Si abbassa quando non si scorre,
// si ferma fuori dallo showreel o quando la scheda è nascosta.
(() => {
  'use strict';
  const btn = document.querySelector('[data-suono]');
  const reel = document.getElementById('reel');
  if (!btn || !reel || !window.AudioContext) return;
  const KEY = 'lmm-suono', BPM = 120, BEAT = 60 / BPM, STEP = BEAT / 4;
  let ctx = null, master = null, bus = null, noise = null, on = false, timer = 0, step = 0, nextT = 0, lastScroll = 0;

  // Am – F – C – G, una battuta per accordo
  const ACC = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]];
  const BASSO = [45, 41, 36, 43];
  const hz = n => 440 * Math.pow(2, (n - 69) / 12);

  function init() {
    ctx = new AudioContext();
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
    comp.connect(master); bus = comp;
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noise.getChannelData(0); let s = 12345;
    for (let i = 0; i < d.length; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; d[i] = s / 0x3fffffff - 1; }
  }
  const env = (g, t, peak, dec) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .003); g.gain.exponentialRampToValueAtTime(.0008, t + dec); };
  const rumore = (t, dur) => { const n = ctx.createBufferSource(); n.buffer = noise; n.start(t); n.stop(t + dur); return n; };

  function cassa(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(45, t + .11);
    env(g, t, .95, .32); o.connect(g).connect(bus); o.start(t); o.stop(t + .4);
  }
  function hat(t, v) {
    const n = rumore(t, .08), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'highpass'; f.frequency.value = 8000; env(g, t, v, .06); n.connect(f).connect(g).connect(bus);
  }
  function clap(t) {
    const n = rumore(t, .2), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'bandpass'; f.frequency.value = 1500; f.Q.value = .8; env(g, t, .32, .16); n.connect(f).connect(g).connect(bus);
  }
  function basso(t, nota) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.value = hz(nota);
    f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(180, t + .18);
    env(g, t, .22, .22); o.connect(f).connect(g).connect(bus); o.start(t); o.stop(t + .25);
  }
  function accordo(t, note) {
    note.forEach((n, i) => {
      const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = hz(n + 12) * (1 + (i - 1) * .002);
      f.type = 'lowpass'; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(500, t + .5);
      env(g, t, .05, .55); o.connect(f).connect(g).connect(bus); o.start(t); o.stop(t + .6);
    });
  }

  // un passo = una semicroma; 16 passi = una battuta
  function suona(s, t) {
    const b = Math.floor(s / 16) % 4, p = s % 16;
    if (p % 4 === 0) cassa(t);
    if (p % 4 === 2) hat(t, .14);
    if (p % 2 === 1) hat(t, .05);
    if (p === 4 || p === 12) clap(t);
    if (p % 4 === 2 || p === 15) basso(t, BASSO[b] + (p === 15 ? 12 : 0));
    if (p === 0 || p === 10) accordo(t, ACC[b]);
  }
  function scheduler() {
    while (nextT < ctx.currentTime + .12) { suona(step, nextT); step++; nextT += STEP; }
    // volume: pieno mentre si scorre dentro lo showreel, più basso da fermi, spento fuori
    const r = reel.getBoundingClientRect(), dentro = r.bottom > innerHeight * .3 && r.top < innerHeight * .7;
    const fermo = performance.now() - lastScroll > 1200;
    const vol = !dentro || document.hidden ? 0 : fermo ? .22 : .6;
    master.gain.setTargetAtTime(vol, ctx.currentTime, .35);
  }

  function accendi() {
    if (!ctx) init();
    ctx.resume().then(() => {
      if (on) return;
      on = true; step = 0; nextT = ctx.currentTime + .05; lastScroll = performance.now();
      timer = setInterval(scheduler, 25);
      btn.setAttribute('aria-pressed', 'true'); btn.classList.add('is-on');
      try { localStorage.setItem(KEY, '1'); } catch (e) {}
    }).catch(() => {});
  }
  function spegni(ricorda) {
    on = false; clearInterval(timer);
    if (master) master.gain.setTargetAtTime(0, ctx.currentTime, .08);
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
