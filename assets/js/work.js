// Pagina Progetti: filtri a tendina, vista Mosaico / Griglia, card che si spostano animate (View Transitions).
(() => {
  'use strict';
  const root = document.querySelector('[data-rea]');
  if (!root) return;
  const list = root.querySelector('[data-list]');
  const cards = Array.from(list.querySelectorAll('[data-card]'));
  const vuoto = root.querySelector('[data-vuoto]');
  const stato = root.querySelector('[data-stato]');
  const raz = root.querySelector('[data-raz]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const KEY = 'lmm-vista';
  const dds = Array.from(root.querySelectorAll('[data-dd]')).map(g => ({
    g, k: g.dataset.dd, b: g.querySelector('.dd__b'), n: g.querySelector('.dd__n'),
    boxes: Array.from(g.querySelectorAll('input[type=checkbox]'))
  }));
  // i paesi arrivano dal pannello come codici (SE, IT…): li mostro col nome in italiano
  try {
    const nomi = new Intl.DisplayNames([document.documentElement.lang || 'it'], { type: 'region' });
    root.querySelectorAll('[data-paese]').forEach(s => { if (s.tagName === 'SPAN') s.textContent = nomi.of(s.dataset.paese) || s.dataset.paese; });
  } catch (e) {}
  const sel = {};
  dds.forEach(d => { sel[d.k] = new Set(); });

  let vista = 'mosaico';
  try { if (localStorage.getItem(KEY) === 'griglia') vista = 'griglia'; } catch (e) {}

  // filtri scritti nell'indirizzo (?cat=branding,motion-design)
  const qs = new URLSearchParams(location.search);
  dds.forEach(d => (qs.get(d.k) || '').split(',').filter(Boolean).forEach(v => sel[d.k].add(v)));
  dds.forEach(d => d.boxes.forEach(x => { x.checked = sel[d.k].has(x.value); }));

  function animate(update) {
    if (!document.startViewTransition || reduce.matches) { update(); return; }
    cards.forEach((c, i) => { c.style.viewTransitionName = 'card-' + i; });
    const t = document.startViewTransition(update);
    t.finished.finally(() => cards.forEach(c => { c.style.viewTransitionName = ''; }));
  }

  function apply() {
    let n = 0;
    cards.forEach(c => {
      const ok = dds.every(d => !sel[d.k].size || (c.dataset[d.k] || '').split(' ').some(v => sel[d.k].has(v)));
      c.hidden = !ok;
      if (ok) { c.dataset.m = (n % 3) + 1; n++; }
    });
    list.dataset.vista = vista;
    vuoto.hidden = n > 0;
    dds.forEach(d => {
      const k = sel[d.k].size;
      d.n.textContent = k ? ' · ' + k : '';
      d.b.classList.toggle('is-actif', k > 0);
    });
    raz.hidden = !dds.some(d => sel[d.k].size);
    root.querySelectorAll('[data-vista]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.vista === vista)));
    stato.textContent = n + ' ' + (n === 1 ? stato.dataset.uno : stato.dataset.piu);
    const q = new URLSearchParams();
    dds.forEach(d => { if (sel[d.k].size) q.set(d.k, Array.from(sel[d.k]).join(',')); });
    history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
  }

  const open = (d, on) => { d.g.classList.toggle('is-open', on); d.b.setAttribute('aria-expanded', String(on)); };
  dds.forEach(d => {
    d.b.addEventListener('click', () => { dds.forEach(o => { if (o !== d) open(o, false); }); open(d, !d.g.classList.contains('is-open')); });
    d.boxes.forEach(x => x.addEventListener('change', () => {
      x.checked ? sel[d.k].add(x.value) : sel[d.k].delete(x.value);
      animate(apply);
    }));
    d.g.addEventListener('keydown', e => { if (e.key === 'Escape') { open(d, false); d.b.focus(); } });
  });
  document.addEventListener('click', e => { dds.forEach(d => { if (!d.g.contains(e.target)) open(d, false); }); });

  raz.addEventListener('click', () => {
    dds.forEach(d => { sel[d.k].clear(); d.boxes.forEach(x => { x.checked = false; }); });
    animate(apply);
  });

  root.querySelectorAll('[data-vista]').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.vista === vista) return;
    vista = b.dataset.vista;
    try { localStorage.setItem(KEY, vista); } catch (e) {}
    animate(apply);
  }));

  apply();
})();
