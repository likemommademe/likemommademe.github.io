/* =========================================================
   LIKEMOMMADEME · CMS — Gestione social
   Calendario dei post, scelta del progetto (o di foto dal computer), grafiche 4:5 (1080×1350)
   rifatte in automatico dal pannello con la grafica del sito, testo del post e stato.
   I post sono file in _social/<id>.md; le grafiche finite vanno in assets/social/.
   La pubblicazione sui social per ora è a mano: si scaricano grafiche e testo, poi si segna "Pubblicato".
   Usa le funzioni di cms.js (h, icon, shell, commit…): questo file va caricato prima di cms.js.
   ========================================================= */

const SOCIAL_COLL = { name: 'social', folder: '_social' };
const SOCIAL_DIR = 'assets/social';
const SOCIALS = [['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['linkedin', 'LinkedIn']];
// Dove si crea un post a mano, dal computer.
const SOCIAL_WEB = {
  instagram: ['https://www.instagram.com/', 'Su Instagram premi + (Crea) e trascina le grafiche nell’ordine.'],
  tiktok: ['https://www.tiktok.com/tiktokstudio/upload', 'Su TikTok Studio scegli “Foto”, carica le grafiche e aggiungi la musica.'],
  linkedin: ['https://www.linkedin.com/feed/?shareActive=true', 'Su LinkedIn aggiungi le immagini con l’icona della foto e incolla il testo.'],
};
const STATI_POST = [['bozza', 'Bozza'], ['programmato', 'Programmato'], ['pubblicato', 'Pubblicato'], ['eliminato', 'Eliminato']];
const W45 = 1080;
const H45 = 1350;
const MAX_SLIDE = 10;
const HASHTAG = {
  branding: '#branding #brandidentity #graphicdesign',
  'generative-ai': '#generativeai #aiart #adobefirefly',
  illustration: '#illustration #illustrazione #drawing',
  'motion-design': '#motiondesign #animation #aftereffects',
  'web-design': '#webdesign #uidesign #uxdesign',
};
const SFONDI = { carta: { bg: '#F4EFE7', fg: '#121414', muted: '#5E5A54', dot: '#E0266F' }, nero: { bg: '#121414', fg: '#F5F5F2', muted: '#9A9A9A', dot: '#FF3D8B' } };

// ─── Date ───────────────────────────────────────────────────

const pad2 = (n) => String(n).padStart(2, '0');
const isoDay = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fromIso = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const monday = (d) => addDays(d, -((d.getDay() + 6) % 7));
const dayLabel = (s) => fromIso(s).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });

function hashParams() {
  const q = location.hash.split('?')[1] || '';
  return Object.fromEntries(new URLSearchParams(q));
}

// ─── Dati ───────────────────────────────────────────────────

async function loadPosts() {
  return (await loadCollection(SOCIAL_COLL)).filter((p) => !p.error);
}

// Tutte le immagini di un progetto, in ordine: copertina, poi la galleria (solo foto).
function projectImages(e) {
  const list = [e.data.copertina, ...(e.data.galleria || []).filter((g) => g.type === 'foto').map((g) => g.immagine)];
  return [...new Set(list.filter(Boolean))];
}

function defaultCaption(e, catTitle) {
  const d = e.data;
  const righe = [
    d.domanda,
    d.sottotitolo && `${d.sottotitolo.replace(/\.$/, '')}.`,
    `Il progetto completo è sul sito: likemommademe.github.io/progetti/${e.slug}/`,
    ['#likemommademe', HASHTAG[d.categoria], ...(d.altre_categorie || []).map((c) => HASHTAG[c])].filter(Boolean).join(' '),
  ];
  return righe.filter(Boolean).join('\n\n').replace(/\*/g, '');
}

// ─── Grafiche 4:5 ───────────────────────────────────────────

const bitmapCache = new Map();

// Le immagini si leggono dal sito o, se appena caricate, da GitHub: tutte e due permettono di usarle nel canvas.
async function loadBitmap(src) {
  if (src instanceof Blob) return createImageBitmap(src);
  if (bitmapCache.has(src)) return bitmapCache.get(src);
  const job = (async () => {
    for (const url of [mediaUrl(src), RAW + src]) {
      try {
        const res = await fetch(url, { mode: 'cors' });
        if (res.ok) return await createImageBitmap(await res.blob());
      } catch { /* si prova il prossimo indirizzo */ }
    }
    throw new Error(`Non riesco a leggere ${src}`);
  })();
  bitmapCache.set(src, job);
  job.catch(() => bitmapCache.delete(src));
  return job;
}

// Disegna l'immagine riempiendo il riquadro (taglia quello che avanza), centrata.
function drawCover(ctx, bmp, x, y, w, h) {
  const s = Math.max(w / bmp.width, h / bmp.height);
  const sw = w / s;
  const sh = h / s;
  ctx.drawImage(bmp, (bmp.width - sw) / 2, (bmp.height - sh) / 2, sw, sh, x, y, w, h);
}

// Disegna l'immagine intera dentro il riquadro, centrata.
function drawContain(ctx, bmp, x, y, w, h) {
  const s = Math.min(w / bmp.width, h / bmp.height);
  const dw = bmp.width * s;
  const dh = bmp.height * s;
  ctx.drawImage(bmp, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

// Se la forma della foto è vicina a quella del riquadro la riempie, altrimenti la mostra intera (niente tagli brutti).
function drawSmart(ctx, bmp, x, y, w, h) {
  const r = (bmp.width / bmp.height) / (w / h);
  if (r > 0.82 && r < 1.22) drawCover(ctx, bmp, x, y, w, h);
  else drawContain(ctx, bmp, x, y, w, h);
}

function wrapLines(ctx, text, maxW) {
  const words = String(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function drawWordmark(ctx, x, y, size, c) {
  ctx.font = `900 ${size}px "Cabinet Grotesk"`;
  ctx.fillStyle = c.fg;
  ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = '0px';
  ctx.fillText(BRAND, x, y);
  const w = ctx.measureText(BRAND).width;
  const q = Math.round(size * 0.3);
  ctx.fillStyle = c.dot;
  ctx.beginPath();
  ctx.roundRect(x + w + 3, y - q, q, q, 2);
  ctx.fill();
}

async function fontsReady() {
  try {
    await Promise.all(['500 80px "Cabinet Grotesk"', '900 30px "Cabinet Grotesk"', '600 24px "Clash Display"'].map((f) => document.fonts.load(f)));
  } catch { /* si usa il font di sistema */ }
}

// Una slide 1080×1350. opt: { stile: 'cornice'|'foto', sfondo: 'carta'|'nero', taglio: 'intera'|'riempi', titolo, etichetta, i, n }
async function renderSlide(src, opt) {
  await fontsReady();
  const bmp = await loadBitmap(src);
  const canvas = document.createElement('canvas');
  canvas.width = W45;
  canvas.height = H45;
  const ctx = canvas.getContext('2d');
  const c = SFONDI[opt.sfondo] || SFONDI.carta;
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, W45, H45);

  if (opt.stile === 'foto') {
    drawCover(ctx, bmp, 0, 0, W45, H45);
    return canvas;
  }

  const M = 64;
  if (opt.i === 0) {
    // Copertina: foto in alto, sotto etichetta, titolo grande e firma.
    drawCover(ctx, bmp, 0, 0, W45, 960);
    let y = 1036;
    if (opt.etichetta) {
      ctx.font = '600 24px "Clash Display"';
      ctx.letterSpacing = '3px';
      ctx.fillStyle = c.muted;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(opt.etichetta.toUpperCase(), M, y);
      ctx.letterSpacing = '0px';
      y += 24;
    }
    let size = 84;
    let lines;
    do {
      ctx.font = `500 ${size}px "Cabinet Grotesk"`;
      ctx.letterSpacing = `${-size * 0.03}px`;
      lines = wrapLines(ctx, opt.titolo || '', W45 - M * 2);
      size -= 4;
    } while (lines.length > 2 && size > 44);
    size += 4;
    ctx.fillStyle = c.fg;
    lines.slice(0, 2).forEach((l, k) => ctx.fillText(l, M, y + size * 0.95 + k * size * 0.98));
    ctx.letterSpacing = '0px';
    drawWordmark(ctx, M, H45 - 56, 28, c);
    if (opt.n > 1) {
      ctx.font = '600 22px "Clash Display"';
      ctx.letterSpacing = '2px';
      ctx.fillStyle = c.muted;
      ctx.textAlign = 'right';
      ctx.fillText('SCORRI →', W45 - M, H45 - 58);
      ctx.textAlign = 'left';
      ctx.letterSpacing = '0px';
    }
    return canvas;
  }

  // Slide interne: la foto con un margine di carta, la firma e il numero in basso.
  (opt.taglio === 'riempi' ? drawCover : drawSmart)(ctx, bmp, M, M, W45 - M * 2, H45 - M * 2 - 76);
  drawWordmark(ctx, M, H45 - 56, 24, c);
  ctx.font = '600 22px "Clash Display"';
  ctx.letterSpacing = '2px';
  ctx.fillStyle = c.muted;
  ctx.textAlign = 'right';
  ctx.fillText(`${opt.i + 1} / ${opt.n}`, W45 - M, H45 - 58);
  ctx.textAlign = 'left';
  ctx.letterSpacing = '0px';
  return canvas;
}

const canvasToBlob = (canvas) => new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));

// ─── Calendario ─────────────────────────────────────────────

async function socialView() {
  shell([['Social']], loading());
  const prog = findCollection('progetti');
  const [posts, progetti, categorie] = await Promise.all([loadPosts(), loadCollection(prog), loadCollection(findCollection('categorie'))]);
  const catTitle = Object.fromEntries(categorie.map((c) => [c.slug, c.data.title]));
  let from = read('cms.social.from') ? fromIso(read('cms.social.from')) : monday(new Date());
  const today = isoDay(new Date());

  const range = h('strong', { class: 'cal-range' });
  const grid = h('div', { class: 'cal' });
  const nav = (n) => { from = n === 0 ? monday(new Date()) : addDays(from, n * 7); write('cms.social.from', isoDay(from)); draw(); };

  function chipFor(p) {
    const d = p.data;
    return h('a', { class: `cal-post st-${d.stato || 'bozza'}`, href: `#/social/${p.slug}`, title: `${d.titolo || 'Post'} · ${(STATI_POST.find(([v]) => v === d.stato) || STATI_POST[0])[1]}` },
      d.grafiche?.[0] ? h('img', { src: mediaUrl(d.grafiche[0]), alt: '', loading: 'lazy' }) : h('span', { class: 'cal-post__ph' }, icon('image')),
      h('span', { class: 'cal-post__t' }, h('b', {}, d.ora || ''), ' ', d.titolo || 'Post'));
  }

  function draw() {
    const days = Array.from({ length: 14 }, (_, k) => addDays(from, k));
    const last = days[13];
    range.textContent = `${days[0].getDate()}${days[0].getMonth() !== last.getMonth() ? ` ${days[0].toLocaleDateString('it-IT', { month: 'short' })}` : ''}–${last.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    grid.replaceChildren(
      ...['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((d) => h('div', { class: 'cal-dow' }, d)),
      ...days.map((d, k) => {
        const iso = isoDay(d);
        const del = posts.filter((p) => p.data.data === iso).sort((a, b) => String(a.data.ora || '').localeCompare(String(b.data.ora || '')));
        return h('div', { class: `cal-day${iso === today ? ' is-today' : ''}${iso < today ? ' is-past' : ''}` },
          h('div', { class: 'cal-day__head' },
            h('span', { class: 'cal-day__n' }, d.getDate(), (k === 0 || d.getDate() === 1) && h('small', {}, d.toLocaleDateString('it-IT', { month: 'short' }))),
            h('a', { class: 'icon-btn cal-add', href: `#/social/nuovo?data=${iso}`, title: `Nuovo post il ${dayLabel(iso)}` }, icon('plus'))),
          h('div', { class: 'cal-day__posts' }, del.map(chipFor)));
      }));
  }

  // Progetti pubblicati sul sito che non sono mai finiti in un post.
  const inPost = new Set(posts.filter((p) => p.data.stato !== 'eliminato').map((p) => p.data.progetto).filter(Boolean));
  const daFare = sortEntries(prog, progetti).filter((e) => !isDraft(e) && !inPost.has(e.slug));
  const senzaData = posts.filter((p) => !p.data.data && p.data.stato !== 'eliminato');

  draw();
  shell([['Social']], h('div', {},
    pageHead('Social', 'Calendario dei post: grafiche 4:5 rifatte in automatico dai progetti',
      h('a', { class: 'btn primary', href: '#/social/nuovo' }, icon('plus'), h('span', {}, 'Nuovo post'))),
    h('div', { class: 'cal-bar' },
      h('button', { type: 'button', class: 'icon-btn', title: 'Due settimane prima', onclick: () => nav(-2) }, icon('back')),
      range,
      h('button', { type: 'button', class: 'icon-btn', title: 'Due settimane dopo', onclick: () => nav(2) }, icon('right')),
      h('button', { type: 'button', class: 'btn small', onclick: () => nav(0) }, 'Oggi'),
      h('span', { class: 'grow' }),
      h('div', { class: 'cal-legend' }, STATI_POST.map(([v, l]) => h('span', { class: `st-${v}` }, h('i'), l)))),
    h('section', { class: 'panel cal-wrap' }, grid),
    senzaData.length > 0 && h('section', { class: 'panel social-block' },
      h('div', { class: 'panel-head' }, h('div', {}, h('h2', {}, 'Bozze senza data'), h('p', { class: 'muted' }, 'Dagli un giorno per vederle nel calendario.'))),
      h('div', { class: 'cal-loose' }, senzaData.map(chipFor))),
    h('section', { class: 'panel social-block' },
      h('div', { class: 'panel-head' },
        h('div', {}, h('h2', {}, 'Da portare sui social'), h('p', { class: 'muted' }, daFare.length ? `${daFare.length} progetti pubblicati sul sito e mai usati in un post` : 'Tutti i progetti pubblicati hanno già un post.'))),
      daFare.length > 0 && h('div', { class: 'pick-grid' }, daFare.map((e) => projectCard(e, catTitle, `#/social/nuovo?progetto=${e.slug}`, true))))));
}

function projectCard(e, catTitle, href, nuovo) {
  const img = h('img', { src: mediaUrl(e.data.copertina), alt: '', loading: 'lazy' });
  img.onerror = () => { if (img.src.startsWith(SITE)) img.src = RAW + e.data.copertina; };
  return h('a', { class: 'pick-card', href },
    h('span', { class: 'pick-card__img' }, img, nuovo && h('span', { class: 'chip rose pick-card__new' }, 'Mai sui social')),
    h('span', { class: 'pick-card__t' }, e.data.title || e.slug),
    h('small', {}, [catTitle[e.data.categoria], e.data.anno].filter(Boolean).join(' · ')));
}

// ─── Nuovo post: scelta del progetto ────────────────────────

async function socialPick() {
  const params = hashParams();
  if (params.progetto || params.locale) return socialEditor(null, params);
  shell([['Social', '#/social'], ['Nuovo post']], loading());
  const prog = findCollection('progetti');
  const [posts, progetti, categorie] = await Promise.all([loadPosts(), loadCollection(prog), loadCollection(findCollection('categorie'))]);
  const catTitle = Object.fromEntries(categorie.map((c) => [c.slug, c.data.title]));
  const inPost = new Set(posts.filter((p) => p.data.stato !== 'eliminato').map((p) => p.data.progetto));
  const list = sortEntries(prog, progetti).filter((e) => !isDraft(e) && e.data.copertina);
  const keep = params.data ? `&data=${params.data}` : '';

  const search = h('input', { type: 'text', placeholder: 'Cerca per titolo…' });
  const cat = h('select', { class: 'compact' }, h('option', { value: '' }, 'Tutte le categorie'), categorie.map((c) => h('option', { value: c.slug }, c.data.title)));
  const grid = h('div', { class: 'pick-grid' });
  const draw = () => {
    const q = search.value.trim().toLowerCase();
    const shown = list.filter((e) => (!q || (e.data.title || '').toLowerCase().includes(q))
      && (!cat.value || e.data.categoria === cat.value || (e.data.altre_categorie || []).includes(cat.value)));
    // Prima quelli mai usati in un post.
    shown.sort((a, b) => Number(inPost.has(a.slug)) - Number(inPost.has(b.slug)));
    grid.replaceChildren(
      h('a', { class: 'pick-card pick-card--local', href: `#/social/nuovo?locale=1${keep}` },
        h('span', { class: 'pick-card__img' }, h('span', { class: 'pick-local' }, icon('upload'), h('b', {}, 'Dal computer'), h('small', {}, 'Foto che non sono in un progetto'))),
        h('span', { class: 'pick-card__t' }, 'Carica dal computer'),
        h('small', {}, 'Un post libero, senza progetto')),
      ...shown.map((e) => projectCard(e, catTitle, `#/social/nuovo?progetto=${e.slug}${keep}`, !inPost.has(e.slug))));
  };
  search.addEventListener('input', draw);
  cat.addEventListener('input', draw);
  draw();
  shell([['Social', '#/social'], ['Nuovo post']], h('div', {},
    pageHead('Nuovo post', params.data ? `Per ${dayLabel(params.data)} · scegli un progetto` : 'Scegli un progetto, oppure carica foto dal computer',
      h('a', { class: 'btn ghost', href: '#/social' }, icon('back'), h('span', {}, 'Torna al calendario'))),
    h('div', { class: 'toolbar' }, h('div', { class: 'input-icon search' }, icon('search'), search), cat),
    grid));
}

// ─── Editor del post ────────────────────────────────────────

async function socialEditor(slug, params = {}) {
  const isNew = !slug;
  shell([['Social', '#/social'], ['…']], loading());
  const prog = findCollection('progetti');
  const [posts, progetti, categorie] = await Promise.all([loadPosts(), loadCollection(prog), loadCollection(findCollection('categorie'))]);
  const catTitle = Object.fromEntries(categorie.map((c) => [c.slug, c.data.title]));
  const entry = isNew ? null : posts.find((p) => p.slug === slug);
  if (!isNew && !entry) return shell([['Social', '#/social']], h('p', { class: 'muted' }, 'Post non trovato.'));

  const progSlug = isNew ? params.progetto : entry.data.progetto;
  const project = progSlug ? progetti.find((e) => e.slug === progSlug) : null;
  const d = isNew ? {
    titolo: project ? project.data.title : 'Post',
    progetto: project?.slug,
    social: ['instagram'],
    data: params.data || '',
    ora: '18:00',
    stato: params.data ? 'programmato' : 'bozza',
    stile: 'cornice',
    sfondo: 'carta',
    titolo_grafica: project?.data.title || '',
    etichetta: project ? catTitle[project.data.categoria] || '' : '',
    testo: project ? defaultCaption(project, catTitle) : '',
    sorgenti: project ? projectImages(project).slice(0, 5) : [],
  } : { ...entry.data };

  // Foto disponibili: quelle del progetto più quelle caricate dal computer.
  const local = new Map();   // percorso → foto preparata (non ancora caricata)
  const available = [...new Set([...(project ? projectImages(project) : []), ...(d.sorgenti || [])])];
  let chosen = [...(d.sorgenti || [])];
  const srcOf = (p) => (local.has(p) ? local.get(p).blob : p);

  // Campi
  const titolo = h('input', { type: 'text', value: d.titolo_grafica || '' , placeholder: 'Il titolo grande sulla prima slide' });
  const etichetta = h('input', { type: 'text', value: d.etichetta || '', placeholder: 'Es. Branding' });
  const testo = h('textarea', { rows: 12, placeholder: 'Il testo del post' }, d.testo || '');
  const conta = h('span', { class: 'hint' });
  const dataIn = h('input', { type: 'date', value: d.data || '' });
  const oraIn = h('input', { type: 'time', value: d.ora || '18:00' });
  const stato = h('select', {}, STATI_POST.map(([v, l]) => h('option', { value: v, selected: (d.stato || 'bozza') === v }, l)));
  const socialBoxes = SOCIALS.map(([v, l]) => {
    const box = h('input', { type: 'checkbox', value: v, checked: (d.social || []).includes(v) });
    return [box, h('label', { class: 'check' }, box, l)];
  });
  let stile = d.stile || 'cornice';
  let sfondo = d.sfondo || 'carta';
  let taglio = d.taglio || 'intera';
  const segs = (opts, get, set) => {
    const btns = opts.map(([v, l]) => h('button', { type: 'button', class: 'seg-btn', 'data-v': v, onclick: () => { set(v); paint(); markDirty(); schedule(); } }, l));
    const paint = () => btns.forEach((b) => b.classList.toggle('active', b.dataset.v === get()));
    paint();
    return h('div', { class: 'seg' }, btns);
  };
  const stileSeg = segs([['cornice', 'Con titolo e firma'], ['foto', 'Solo foto']], () => stile, (v) => { stile = v; });
  const taglioSeg = segs([['intera', 'Foto intere'], ['riempi', 'Riempi la slide']], () => taglio, (v) => { taglio = v; });
  const sfondoSeg = segs([['carta', 'Carta'], ['nero', 'Nero']], () => sfondo, (v) => { sfondo = v; });

  // Anteprima
  const big = h('div', { class: 'sp-big' });
  const strip = h('div', { class: 'sp-strip' });
  const previewNote = h('p', { class: 'hint' });
  let slides = [];   // canvas
  let current = 0;
  let renderId = 0;
  let timer = null;
  const schedule = () => { clearTimeout(timer); timer = setTimeout(renderAll, 250); };
  const opts = (i) => ({ stile, sfondo, taglio, titolo: titolo.value.trim(), etichetta: etichetta.value.trim(), i, n: chosen.length });

  async function renderAll() {
    const id = ++renderId;
    if (!chosen.length) {
      slides = [];
      big.replaceChildren(h('div', { class: 'sp-empty' }, icon('image'), h('span', {}, 'Scegli almeno una foto qui sotto')));
      strip.replaceChildren();
      previewNote.textContent = '';
      return;
    }
    previewNote.textContent = 'Preparo le grafiche…';
    try {
      const out = [];
      for (let i = 0; i < chosen.length; i++) out.push(await renderSlide(srcOf(chosen[i]), opts(i)));
      if (id !== renderId) return;
      slides = out;
      current = Math.min(current, slides.length - 1);
      previewNote.textContent = `${slides.length} ${slides.length === 1 ? 'grafica' : 'grafiche'} 1080 × 1350 (4:5), pronte per Instagram, TikTok e LinkedIn.`;
      showSlides();
    } catch (e) {
      if (id === renderId) previewNote.textContent = e.message;
    }
  }
  function showSlides() {
    const c = slides[current];
    big.replaceChildren(h('img', { src: c.toDataURL('image/jpeg', 0.85), alt: `Grafica ${current + 1}` }));
    strip.replaceChildren(...slides.map((s, i) => h('button', {
      type: 'button', class: `sp-thumb${i === current ? ' active' : ''}`, onclick: () => { current = i; showSlides(); },
    }, h('img', { src: s.toDataURL('image/jpeg', 0.6), alt: '' }))));
  }

  // Scelta delle foto (ordine = ordine delle slide)
  const pickGrid = h('div', { class: 'sp-pick' });
  function drawPick() {
    pickGrid.replaceChildren(...available.map((p) => {
      const n = chosen.indexOf(p);
      const img = h('img', { src: local.has(p) ? local.get(p).preview : mediaUrl(p), alt: '', loading: 'lazy' });
      img.onerror = () => { if (img.src.startsWith(SITE)) img.src = RAW + p; };
      return h('button', {
        type: 'button', class: `sp-photo${n >= 0 ? ' on' : ''}`, title: n >= 0 ? 'Togli dal post' : 'Aggiungi al post',
        onclick: () => {
          if (n >= 0) chosen.splice(n, 1);
          else if (chosen.length >= MAX_SLIDE) return alert(`Al massimo ${MAX_SLIDE} grafiche per post.`);
          else chosen.push(p);
          markDirty(); drawPick(); schedule();
        },
      }, img, n >= 0 && h('b', { class: 'sp-photo__n' }, n + 1));
    }));
  }
  const fileIn = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true, onchange: () => { addLocal([...fileIn.files]); fileIn.value = ''; } });
  async function addLocal(files) {
    previewNote.textContent = 'Preparo le foto…';
    for (const f of files) {
      const p = await processImage(f);
      local.set(p.path, p);
      available.push(p.path);
      if (chosen.length < MAX_SLIDE) chosen.push(p.path);
    }
    markDirty(); drawPick(); schedule();
  }
  const pickZone = h('div', { class: 'sp-pickzone' },
    pickGrid,
    h('div', { class: 'row' },
      h('button', { type: 'button', class: 'btn small', onclick: () => fileIn.click() }, icon('upload'), h('span', {}, 'Dal computer')),
      h('button', { type: 'button', class: 'btn small', onclick: async () => { const p = await pickFromLibrary(); if (p && !available.includes(p)) { available.push(p); if (chosen.length < MAX_SLIDE) chosen.push(p); markDirty(); drawPick(); schedule(); } } }, icon('images'), h('span', {}, 'Dai media'))),
    h('p', { class: 'hint' }, 'Clicca le foto nell’ordine in cui vuoi le slide. La prima diventa la copertina del post. Puoi trascinare qui foto dal Finder.'),
    fileIn);
  dropzone(pickZone, addLocal);

  const countChars = () => { conta.textContent = `${testo.value.length} / 2200 caratteri (limite di Instagram)`; };
  testo.addEventListener('input', countChars);
  countChars();
  for (const el of [titolo, etichetta]) el.addEventListener('input', schedule);

  const status = h('span', { class: 'status' });
  const saveBtn = h('button', { type: 'button', class: 'btn' }, h('span', {}, 'Salva'));
  const saveLabel = () => { saveBtn.firstChild.textContent = { bozza: 'Salva bozza', programmato: 'Salva e programma', pubblicato: 'Salva', eliminato: 'Salva' }[stato.value] || 'Salva'; };
  stato.addEventListener('change', saveLabel);
  saveLabel();
  const pubBtn = h('button', { type: 'button', class: 'btn primary' }, icon('send'), h('span', {}, 'Pubblica ora'));
  const dlBtn = h('button', { type: 'button', class: 'btn' }, icon('download'), h('span', {}, 'Scarica grafiche'));
  const copyBtn = h('button', { type: 'button', class: 'btn small' }, icon('copy'), h('span', {}, 'Copia il testo'));
  copyBtn.onclick = async () => { try { await navigator.clipboard.writeText(testo.value); copyBtn.lastChild.textContent = 'Copiato!'; setTimeout(() => { copyBtn.lastChild.textContent = 'Copia il testo'; }, 1600); } catch { testo.select(); } };
  const baseName = () => slugify(titolo.value || d.titolo || 'post') || 'post';
  dlBtn.onclick = async () => {
    await renderAll();
    for (let i = 0; i < slides.length; i++) {
      const blob = await canvasToBlob(slides[i]);
      const a = h('a', { href: URL.createObjectURL(blob), download: `${baseName()}-${i + 1}.jpg` });
      document.body.append(a); a.click(); a.remove();
      await new Promise((r) => setTimeout(r, 350));
    }
  };

  // Pubblicazione a mano, finché gli account non sono collegati: condividi dal telefono,
  // oppure dal computer copia il testo, scarica le grafiche e apri il social. Poi si segna "Pubblicato".
  pubBtn.onclick = async () => {
    const scelti = socialBoxes.filter(([b]) => b.checked).map(([b]) => b.value);
    if (!chosen.length) { alert('Scegli almeno una foto.'); return; }
    if (!scelti.length) { alert('Scegli almeno un social in “Dove”.'); return; }
    await renderAll();
    const files = await Promise.all(slides.map(async (c, i) => new File([await canvasToBlob(c)], `${baseName()}-${i + 1}.jpg`, { type: 'image/jpeg' })));
    const canShare = !!(navigator.canShare && navigator.canShare({ files }));
    const copy = async (btn) => { try { await navigator.clipboard.writeText(testo.value); if (btn) btn.lastChild.textContent = 'Testo copiato!'; return true; } catch { return false; } };
    const step = (n, title, ...body) => h('div', { class: 'pub-step' }, h('b', { class: 'pub-n' }, n), h('div', {}, h('strong', {}, title), ...body));
    const copyB = h('button', { type: 'button', class: 'btn small' }, icon('copy'), h('span', {}, 'Copia il testo'));
    copyB.onclick = () => copy(copyB);
    const dlB = h('button', { type: 'button', class: 'btn small' }, icon('download'), h('span', {}, `Scarica ${files.length === 1 ? 'la grafica' : `le ${files.length} grafiche`}`));
    dlB.onclick = async () => {
      for (const f of files) {
        const a = h('a', { href: URL.createObjectURL(f), download: f.name });
        document.body.append(a); a.click(); a.remove();
        await new Promise((r) => setTimeout(r, 350));
      }
    };
    const shareB = canShare && h('button', { type: 'button', class: 'btn primary' }, icon('send'), h('span', {}, 'Condividi grafiche e testo'));
    if (shareB) shareB.onclick = async () => { await copy(); try { await navigator.share({ files, text: testo.value, title: titolo.value || 'Post' }); } catch { /* condivisione annullata */ } };
    const done = h('button', { type: 'button', class: 'btn primary' }, icon('ok'), h('span', {}, 'Fatto: segna come pubblicato'));
    const body = h('div', { class: 'pub' },
      shareB && h('div', { class: 'pub-share' }, shareB, h('p', { class: 'hint' }, 'Si apre il menu di condivisione: scegli Instagram, TikTok o LinkedIn. Il testo è già copiato: incollalo nella didascalia.')),
      step(1, 'Copia il testo', h('div', { class: 'row' }, copyB)),
      step(2, 'Scarica le grafiche', h('div', { class: 'row' }, dlB)),
      step(3, 'Apri il social e crea il post',
        h('div', { class: 'pub-links' }, scelti.map((v) => h('a', { class: 'btn small', href: SOCIAL_WEB[v][0], target: '_blank', rel: 'noopener' }, icon('external'), h('span', {}, SOCIALS.find(([k]) => k === v)[1])))),
        ...scelti.map((v) => h('p', { class: 'hint' }, SOCIAL_WEB[v][1]))),
      step(4, 'Quando è online', h('p', { class: 'hint' }, 'Segna il post come pubblicato: nel calendario diventa blu, con il giorno e l’ora di adesso.'), h('div', { class: 'row' }, done)));
    done.onclick = () => {
      const now = new Date();
      stato.value = 'pubblicato';
      dataIn.value = isoDay(now);
      oraIn.value = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
      saveLabel();
      closeSheet();
      saveBtn.click();
    };
    const closeSheet = openSheet(`Pubblica su ${scelti.map((v) => SOCIALS.find(([k]) => k === v)[1]).join(', ')}`, body, null,
      'Quando gli account saranno collegati (Social → Account social), il post partirà da solo all’ora programmata.', 'Chiudi');
  };

  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    try {
      const social = socialBoxes.filter(([b]) => b.checked).map(([b]) => b.value);
      if (!chosen.length) throw new Error('Scegli almeno una foto.');
      status.textContent = 'Preparo le grafiche…';
      await renderAll();
      const id = isNew ? `${dataIn.value || isoDay(new Date())}-${baseName()}`.slice(0, 80) : slug;
      if (isNew && posts.some((p) => p.slug === id)) throw new Error('Esiste già un post con questo titolo in questo giorno: cambia il titolo.');
      const stamp = Date.now().toString(36);
      const changes = [];
      // Foto caricate dal computer e usate: vanno in assets/uploads come le altre.
      for (const p of chosen) if (local.has(p)) changes.push(await toUpload(local.get(p)));
      const grafiche = [];
      for (let i = 0; i < slides.length; i++) {
        const path = `${SOCIAL_DIR}/${id}-${stamp}-${i + 1}.jpg`;
        const blob = await canvasToBlob(slides[i]);
        changes.push({ path, base64: bytesToB64(new Uint8Array(await blob.arrayBuffer())) });
        grafiche.push(`/${path}`);
      }
      for (const old of (isNew ? [] : entry.data.grafiche || [])) changes.push({ path: old.replace(/^\//, ''), remove: true });
      const data = {
        titolo: titolo.value.trim() || d.titolo || 'Post',
        progetto: project?.slug,
        social,
        data: dataIn.value || undefined,
        ora: oraIn.value || undefined,
        stato: stato.value,
        stile,
        sfondo,
        taglio,
        titolo_grafica: titolo.value.trim() || undefined,
        etichetta: etichetta.value.trim() || undefined,
        testo: testo.value.replace(/\s+$/, ''),
        sorgenti: [...chosen],
        grafiche,
      };
      Object.keys(data).forEach((k) => (data[k] === undefined || data[k] === '') && delete data[k]);
      const path = `${SOCIAL_COLL.folder}/${id}.md`;
      changes.push({ path, text: serialize(SOCIAL_COLL, data, '') });
      status.textContent = 'Salvataggio…';
      await commit(changes, `${isNew ? 'Nuovo' : 'Aggiorna'} post social “${data.titolo}”`);
      if (isNew) state.cache.social?.push({ slug: id, path, data, body: '' });
      else Object.assign(entry, { data });
      state.dirty = false;
      state.flash = { type: 'ok', text: 'Post salvato. Scarica le grafiche e copia il testo quando lo pubblichi, poi segnalo come “Pubblicato”.' };
      if (isNew) location.hash = `#/social/${id}`; else route();
    } catch (e) {
      status.textContent = e.message;
      status.className = 'status error';
      saveBtn.disabled = false;
    }
  };

  const delBtn = !isNew && h('button', {
    type: 'button', class: 'btn ghost danger',
    onclick: async () => {
      if (!confirm('Eliminare questo post e le sue grafiche? Non si può annullare.')) return;
      try {
        await commit([{ path: entry.path, remove: true }, ...(entry.data.grafiche || []).map((g) => ({ path: g.replace(/^\//, ''), remove: true }))], `Elimina post social “${entry.data.titolo}”`);
        state.cache.social = (state.cache.social || []).filter((p) => p !== entry);
        state.dirty = false;
        state.flash = { type: 'ok', text: 'Post eliminato.' };
        location.hash = '#/social';
      } catch (e) { status.textContent = e.message; }
    },
  }, icon('trash'), h('span', {}, 'Elimina'));

  const field = (label, el, hint) => h('div', {}, h('label', { class: 'label' }, label), el, hint && h('p', { class: 'hint' }, hint));
  const form = h('div', { class: 'form has-side', oninput: markDirty, onchange: markDirty },
    h('section', { class: 'form-main panel padded' },
      h('div', { class: 'sp-preview' }, big, strip, previewNote),
      h('h3', { class: 'form-group' }, 'Foto del post'),
      pickZone,
      h('h3', { class: 'form-group' }, 'Grafica'),
      field('Stile', stileSeg),
      field('Sfondo', sfondoSeg),
      field('Foto nelle slide interne', taglioSeg, 'Intere: si vede tutta la foto, con il margine. Riempi: la foto occupa tutto il riquadro e si taglia ai bordi.'),
      field('Titolo sulla copertina', titolo),
      field('Etichetta sopra il titolo', etichetta, 'Di solito la categoria del progetto.')),
    h('aside', { class: 'form-side' },
      h('section', { class: 'panel padded side-card' },
        field('Stato', stato),
        h('div', { class: 'sp-when' }, field('Giorno', dataIn), field('Ora', oraIn)),
        h('div', {}, h('span', { class: 'label' }, 'Dove'), h('div', { class: 'check-items' }, socialBoxes.map(([, l]) => l))),
        project && h('p', { class: 'hint' }, 'Progetto: ', h('a', { class: 'lnk', href: `#/c/progetti/${project.slug}` }, project.data.title))),
      h('section', { class: 'panel padded side-card' },
        field('Testo del post', testo),
        conta,
        h('div', { class: 'row' }, copyBtn))));

  drawPick();
  renderAll();
  const title = isNew ? 'Nuovo post' : d.titolo || 'Post';
  shell([['Social', '#/social'], [title]], h('div', { class: 'editor' },
    h('div', { class: 'page-head' },
      h('div', {}, h('div', { class: 'title-row' }, h('h1', {}, title), !isNew && chip((STATI_POST.find(([v]) => v === d.stato) || STATI_POST[0])[1], `st-${d.stato || 'bozza'}`)),
        h('p', { class: 'muted' }, project ? `Dal progetto ${project.data.title}` : 'Post libero, con foto dal computer')),
      h('div', { class: 'actions' }, h('a', { class: 'btn ghost', href: '#/social' }, icon('back'), h('span', {}, 'Calendario')), dlBtn)),
    form,
    h('div', { class: 'savebar' }, status, h('span', { class: 'grow' }), delBtn, saveBtn, pubBtn)));
}

// ─── Account collegati ──────────────────────────────────────
// Instagram, TikTok e LinkedIn si collegano con le loro API. Serve un'app sviluppatore per ognuno (la si crea una volta,
// insieme a Claude), con le chiavi salvate sul server su Cloudflare; poi qui si preme "Collega" e si accede al social.

const ACCOUNTS = [
  {
    id: 'instagram', nome: 'Instagram', colore: '#E1306C',
    fa: 'Pubblica da solo, all’ora programmata, foto singole e caroselli fino a 10 grafiche 4:5, con il testo del post.',
    limiti: 'Serve un account professionale (Business o Creator): è gratis e si cambia dall’app. Fino a 50 post al giorno via API. Il collegamento dura 60 giorni e il server lo rinnova da solo.',
    passi: [
      'Nell’app Instagram: Impostazioni → Tipo di account e strumenti → Passa a un account professionale (Creator va bene).',
      'Su developers.facebook.com crei un account sviluppatore e un’app di tipo Business, con il prodotto “Instagram API with Instagram Login”. Lo facciamo insieme.',
      'Le chiavi dell’app (App ID e App Secret) vanno salvate su Cloudflare, nelle impostazioni del server, come INSTAGRAM_APP_ID e INSTAGRAM_APP_SECRET.',
      'Torni qui e premi “Collega”: entri con Instagram e autorizzi la pubblicazione.',
    ],
  },
  {
    id: 'tiktok', nome: 'TikTok', colore: '#121414',
    fa: 'Manda le grafiche nelle bozze di TikTok come post di foto: dal telefono aggiungi la musica e pubblichi.',
    limiti: 'TikTok permette la pubblicazione diretta e pubblica solo alle app che superano la sua revisione (audit); finché non c’è, i post via API possono essere solo privati. Per questo la strada consigliata è mandarli nelle bozze. Per TikTok conviene anche il formato verticale 9:16.',
    passi: [
      'Su developers.tiktok.com crei un account sviluppatore e un’app con i prodotti “Login Kit” e “Content Posting API”. Lo facciamo insieme.',
      'Si verifica il dominio likemommademe.github.io nel portale di TikTok (serve perché TikTok prenda le grafiche dal sito).',
      'Le chiavi (Client key e Client secret) vanno su Cloudflare come TIKTOK_CLIENT_KEY e TIKTOK_CLIENT_SECRET.',
      'Torni qui e premi “Collega”: entri con TikTok e autorizzi.',
    ],
  },
  {
    id: 'linkedin', nome: 'LinkedIn', colore: '#0A66C2',
    fa: 'Pubblica da solo sul tuo profilo personale, all’ora programmata, il testo e le grafiche (anche più di una).',
    limiti: 'Va bene il profilo personale, senza revisione. Per creare l’app LinkedIn chiede di collegarla a una pagina aziendale (si può creare la pagina LIKEMOMMADEME). Il collegamento dura 60 giorni: dopo va rifatto, il pannello te lo ricorda.',
    passi: [
      'Se non c’è ancora, crei la pagina LinkedIn di LIKEMOMMADEME (anche vuota).',
      'Su linkedin.com/developers crei un’app collegata a quella pagina e aggiungi i prodotti “Sign In with LinkedIn using OpenID Connect” e “Share on LinkedIn”. Lo facciamo insieme.',
      'Le chiavi (Client ID e Client Secret) vanno su Cloudflare come LINKEDIN_CLIENT_ID e LINKEDIN_CLIENT_SECRET.',
      'Torni qui e premi “Collega”: entri con LinkedIn e autorizzi.',
    ],
  },
];

async function socialAccounts() {
  shell([['Social', '#/social'], ['Account social']], loading());
  // Il server dirà quali account sono collegati; finché non risponde, risultano tutti da collegare.
  let stato = {};
  try { stato = (await request('/social/stato')) || {}; } catch { stato = {}; }
  const card = (a) => {
    const s = stato[a.id] || {};
    const pronto = !!s.configurato;
    return h('section', { class: 'panel acc-card', style: `--brand:${a.colore}` },
      h('div', { class: 'acc-head' },
        h('span', { class: 'acc-logo' }, a.nome[0]),
        h('div', { class: 'grow' }, h('h2', {}, a.nome), h('p', { class: 'muted' }, s.collegato ? `Collegato come ${s.nome || ''}` : 'Non collegato')),
        s.collegato ? chip('Collegato', 'st-programmato') : chip(pronto ? 'Pronto da collegare' : 'Da configurare', pronto ? 'st-pubblicato' : 'st-bozza')),
      h('div', { class: 'acc-body' },
        h('p', {}, h('strong', {}, 'Cosa farà: '), a.fa),
        h('p', { class: 'hint' }, a.limiti),
        h('ol', { class: 'acc-steps' }, a.passi.map((p) => h('li', {}, p)))),
      h('div', { class: 'acc-foot' },
        h('button', {
          type: 'button', class: 'btn primary', disabled: !pronto,
          title: pronto ? '' : 'Prima vanno fatti i passi 1–3',
          onclick: () => { location.href = `${API}/social/collega/${a.id}`; },
        }, h('span', {}, s.collegato ? 'Ricollega' : 'Collega')),
        !pronto && h('span', { class: 'hint' }, 'Il pulsante si attiva quando le chiavi sono su Cloudflare.')));
  };
  shell([['Social', '#/social'], ['Account social']], h('div', {},
    pageHead('Account social', 'Instagram, TikTok e LinkedIn: si collegano una volta, poi i post programmati partono da soli',
      h('a', { class: 'btn ghost', href: '#/social' }, icon('back'), h('span', {}, 'Calendario'))),
    h('div', { class: 'banner info' }, icon('alert'), h('span', {}, 'Finché un account non è collegato, i post di quel social si pubblicano a mano: “Scarica grafiche”, poi segni il post come Pubblicato.')),
    h('div', { class: 'acc-grid' }, ACCOUNTS.map(card))));
}

async function socialRoute() {
  const path = location.hash.split('?')[0];
  if (path === '#/social') return socialView();
  if (path === '#/social/account') return socialAccounts();
  if (path === '#/social/nuovo') return socialPick();
  return socialEditor(decodeURIComponent(path.replace('#/social/', '')));
}
