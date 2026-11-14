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
const STATI_POST = [['bozza', 'Bozza'], ['programmato', 'Programmato'], ['pubblicato', 'Pubblicato'], ['fallito', 'Non riuscito'], ['eliminato', 'Eliminato']];
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

// I video del progetto caricati sul sito (file .mp4/.mov/.webm nella galleria).
function projectVideos(e) {
  return [...new Set((e.data.galleria || []).filter((g) => g.type === 'video' && /^\/assets\/.+\.(mp4|mov|webm)$/i.test(g.link || '')).map((g) => g.link))];
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
      d.grafiche?.[0] ? h('img', { src: mediaUrl(d.grafiche[0]), alt: '', loading: 'lazy' }) : h('span', { class: 'cal-post__ph' }, icon(d.tipo === 'video' ? 'video' : 'image')),
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
    tipo: 'foto',
  } : { ...entry.data };

  // Foto disponibili: quelle del progetto più quelle caricate dal computer.
  const local = new Map();   // percorso → foto preparata (non ancora caricata)
  const available = [...new Set([...(project ? projectImages(project) : []), ...(d.sorgenti || [])])];
  let chosen = [...(d.sorgenti || [])];
  const srcOf = (p) => (local.has(p) ? local.get(p).blob : p);

  // Video: quelli del progetto (file .mp4 sul sito) più uno dal computer.
  let tipo = d.tipo || 'foto';
  const videos = [...new Set([...(project ? projectVideos(project) : []), ...(d.video ? [d.video] : [])])];
  let video = d.video || (tipo === 'video' ? videos[0] : '') || '';
  let localVideo = null;   // { file, url }

  // Campi
  const titolo = h('input', { type: 'text', value: d.titolo_grafica || d.titolo || '', placeholder: 'Il titolo grande sulla prima slide' });
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
  const tipoSeg = segs([['foto', 'Foto (carosello)'], ['video', 'Video']], () => tipo, (v) => { tipo = v; if (v === 'video' && !video && !localVideo) video = videos[0] || ''; showMode(); });
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
  const videoSrc = () => (localVideo ? localVideo.url : video ? mediaUrl(video) : '');

  async function renderAll() {
    const id = ++renderId;
    if (tipo === 'video') {
      slides = [];
      strip.replaceChildren();
      const src = videoSrc();
      big.replaceChildren(src ? h('video', { src, controls: true, playsInline: true, preload: 'metadata' })
        : h('div', { class: 'sp-empty' }, icon('video'), h('span', {}, 'Scegli un video qui sotto')));
      previewNote.textContent = src ? 'Il video va com’è. Per Instagram e TikTok rende meglio verticale (9:16).' : '';
      return;
    }
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

  // Scelta del video
  const vidGrid = h('div', { class: 'sp-pick sp-vids' });
  function drawVids() {
    const tiles = videos.map((p) => h('button', {
      type: 'button', class: `sp-photo${!localVideo && video === p ? ' on' : ''}`, title: p.split('/').pop(),
      onclick: () => { video = p; localVideo = null; markDirty(); drawVids(); renderAll(); },
    }, h('video', { src: `${mediaUrl(p)}#t=0.5`, muted: true, playsInline: true, preload: 'metadata' })));
    if (localVideo) tiles.push(h('button', { type: 'button', class: 'sp-photo on', title: localVideo.file.name }, h('video', { src: `${localVideo.url}#t=0.5`, muted: true, preload: 'metadata' })));
    vidGrid.replaceChildren(...tiles);
    if (!tiles.length) vidGrid.replaceChildren(h('p', { class: 'hint' }, project ? 'Questo progetto non ha video caricati sul sito: caricane uno dal computer.' : 'Carica un video dal computer.'));
  }
  const vidIn = h('input', { type: 'file', accept: 'video/mp4,video/quicktime,video/*', hidden: true, onchange: () => { if (vidIn.files[0]) pickVideo(vidIn.files[0]); vidIn.value = ''; } });
  function pickVideo(file) {
    if (file.size > 95e6) { alert('Il video è troppo pesante: massimo 95 MB (limite di GitHub). Esportalo più leggero, per esempio 1080p H.264.'); return; }
    if (localVideo) URL.revokeObjectURL(localVideo.url);
    localVideo = { file, url: URL.createObjectURL(file) };
    markDirty(); drawVids(); renderAll();
  }
  const vidZone = h('div', { class: 'sp-pickzone' },
    vidGrid,
    h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn small', onclick: () => vidIn.click() }, icon('upload'), h('span', {}, 'Video dal computer'))),
    h('p', { class: 'hint' }, 'MP4 (H.264), meglio verticale 9:16, fino a 95 MB. Su Instagram va come Reel, su TikTok nelle bozze, su LinkedIn come video.'),
    vidIn);
  vidZone.addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('Files')) { e.preventDefault(); vidZone.classList.add('drop'); } });
  vidZone.addEventListener('dragleave', () => vidZone.classList.remove('drop'));
  vidZone.addEventListener('drop', (e) => { vidZone.classList.remove('drop'); const f = [...e.dataTransfer.files].find((x) => x.type.startsWith('video/')); if (f) { e.preventDefault(); pickVideo(f); } });

  const countChars = () => { conta.textContent = `${testo.value.length} / 2200 caratteri (limite di Instagram)`; };
  testo.addEventListener('input', countChars);
  countChars();
  for (const el of [titolo, etichetta]) el.addEventListener('input', schedule);

  const status = h('span', { class: 'status' });
  const saveBtn = h('button', { type: 'button', class: 'btn' }, h('span', {}, 'Salva'));
  const saveLabel = () => { saveBtn.firstChild.textContent = { bozza: 'Salva bozza', programmato: 'Salva e programma' }[stato.value] || 'Salva'; };
  stato.addEventListener('change', saveLabel);
  saveLabel();
  const pubBtn = h('button', { type: 'button', class: 'btn primary' }, icon('send'), h('span', {}, 'Pubblica ora'));
  const dlBtn = h('button', { type: 'button', class: 'btn' }, icon('download'), h('span', {}, 'Esporta (ZIP)'));
  const copyBtn = h('button', { type: 'button', class: 'btn small' }, icon('copy'), h('span', {}, 'Copia il testo'));
  copyBtn.onclick = async () => { try { await navigator.clipboard.writeText(testo.value); copyBtn.lastChild.textContent = 'Copiato!'; setTimeout(() => { copyBtn.lastChild.textContent = 'Copia il testo'; }, 1600); } catch { testo.select(); } };
  const baseName = () => slugify(titolo.value || d.titolo || 'post') || 'post';
  const scelti = () => socialBoxes.filter(([b]) => b.checked).map(([b]) => b.value);
  const nomeRete = (v) => SOCIALS.find(([k]) => k === v)[1];

  // I file del post, pronti da scaricare o condividere: le grafiche, oppure il video.
  async function mediaFiles() {
    if (tipo === 'video') {
      if (localVideo) return [localVideo.file];
      if (!video) return [];
      const blob = await (await fetch(mediaUrl(video))).blob();
      return [new File([blob], video.split('/').pop(), { type: blob.type || 'video/mp4' })];
    }
    await renderAll();
    return Promise.all(slides.map(async (c, i) => new File([await canvasToBlob(c)], `${baseName()}-${i + 1}.jpg`, { type: 'image/jpeg' })));
  }
  async function downloadAll(files) {
    for (const f of files) {
      const a = h('a', { href: URL.createObjectURL(f), download: f.name });
      document.body.append(a); a.click(); a.remove();
      await new Promise((r) => setTimeout(r, 350));
    }
  }
  // Esporta tutto in un file solo: le grafiche numerate (o il video) e il testo del post in testo.txt.
  async function exportZip(btn) {
    const label = btn?.lastChild;
    const prima = label?.textContent;
    try {
      if (label) label.textContent = 'Preparo lo ZIP…';
      const files = await mediaFiles();
      if (!files.length) throw new Error(tipo === 'video' ? 'Scegli un video.' : 'Scegli almeno una foto.');
      const zip = new JSZip();
      for (const f of files) zip.file(f.name, f);
      const reti = scelti().map(nomeRete).join(', ');
      zip.file('testo.txt', `${testo.value.replace(/\s+$/, '')}\n`);
      zip.file('leggimi.txt', [
        titolo.value || d.titolo || 'Post',
        reti && `Social: ${reti}`,
        dataIn.value && `Quando: ${dayLabel(dataIn.value)}${oraIn.value ? ` alle ${oraIn.value}` : ''}`,
        tipo === 'video' ? 'Video: carica il file video.' : `Grafiche: ${files.length}, 1080 × 1350 (4:5). Caricale nell’ordine dei numeri.`,
        'Il testo del post è in testo.txt.',
      ].filter(Boolean).join('\n'));
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      const a = h('a', { href: URL.createObjectURL(blob), download: `${baseName()}.zip` });
      document.body.append(a); a.click(); a.remove();
    } catch (e) {
      alert(e.message);
    } finally {
      if (label) label.textContent = prima;
    }
  }
  dlBtn.onclick = () => exportZip(dlBtn);

  // Salva il post su GitHub (file del post + grafiche o video). Lo usano "Salva" e "Pubblica ora".
  let saved = isNew ? null : { id: slug, path: entry.path, data: entry.data };
  async function persist(overrides = {}) {
    const social = scelti();
    if (tipo === 'foto' && !chosen.length) throw new Error('Scegli almeno una foto.');
    if (tipo === 'video' && !video && !localVideo) throw new Error('Scegli un video.');
    const id = saved ? saved.id : `${dataIn.value || isoDay(new Date())}-${baseName()}`.slice(0, 80);
    if (!saved && posts.some((p) => p.slug === id)) throw new Error('Esiste già un post con questo titolo in questo giorno: cambia il titolo.');
    const prev = saved ? saved.data : {};
    const stamp = Date.now().toString(36);
    const changes = [];
    const data = {
      titolo: titolo.value.trim() || d.titolo || 'Post',
      tipo,
      progetto: project?.slug,
      social,
      data: dataIn.value || undefined,
      ora: oraIn.value || undefined,
      stato: stato.value,
      testo: testo.value.replace(/\s+$/, ''),
      ...overrides,
    };
    const ownVideo = (v) => v && v.startsWith(`/${SOCIAL_DIR}/`);
    if (tipo === 'foto') {
      status.textContent = 'Preparo le grafiche…';
      await renderAll();
      for (const p of chosen) if (local.has(p)) changes.push(await toUpload(local.get(p)));
      const grafiche = [];
      for (let i = 0; i < slides.length; i++) {
        const path = `${SOCIAL_DIR}/${id}-${stamp}-${i + 1}.jpg`;
        const blob = await canvasToBlob(slides[i]);
        changes.push({ path, base64: bytesToB64(new Uint8Array(await blob.arrayBuffer())) });
        grafiche.push(`/${path}`);
      }
      Object.assign(data, {
        stile, sfondo, taglio,
        titolo_grafica: titolo.value.trim() || undefined,
        etichetta: etichetta.value.trim() || undefined,
        sorgenti: [...chosen],
        grafiche,
      });
      if (ownVideo(prev.video)) changes.push({ path: prev.video.slice(1), remove: true });
    } else {
      let path = video;
      if (localVideo) {
        status.textContent = 'Preparo il video…';
        const ext = (localVideo.file.name.split('.').pop() || 'mp4').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp4';
        const rel = `${SOCIAL_DIR}/${id}-${stamp}.${ext}`;
        changes.push({ path: rel, base64: bytesToB64(new Uint8Array(await localVideo.file.arrayBuffer())) });
        path = `/${rel}`;
      }
      data.video = path;
      if (ownVideo(prev.video) && prev.video !== path) changes.push({ path: prev.video.slice(1), remove: true });
    }
    for (const old of prev.grafiche || []) changes.push({ path: old.replace(/^\//, ''), remove: true });
    Object.keys(data).forEach((k) => (data[k] === undefined || data[k] === '') && delete data[k]);
    const path = `${SOCIAL_COLL.folder}/${id}.md`;
    changes.push({ path, text: serialize(SOCIAL_COLL, data, '') });
    status.textContent = 'Salvataggio…';
    await commit(changes, `${saved ? 'Aggiorna' : 'Nuovo'} post social “${data.titolo}”`);
    const cache = state.cache.social;
    const hit = cache && cache.find((p) => p.slug === id);
    if (hit) Object.assign(hit, { data }); else if (cache) cache.push({ slug: id, path, data, body: '' });
    if (localVideo) { video = data.video; videos.push(video); localVideo = null; }
    saved = { id, path, data };
    return saved;
  }
  // Aggiorna solo il file del post (stato, esiti), senza rifare le grafiche.
  async function updatePost(extra) {
    const data = { ...saved.data, ...extra };
    await commit([{ path: saved.path, text: serialize(SOCIAL_COLL, data, '') }], `Post social “${data.titolo}”: ${data.stato}`);
    saved.data = data;
    const hit = state.cache.social?.find((p) => p.slug === saved.id);
    if (hit) hit.data = data;
  }
  // Le grafiche appena salvate vanno online sul sito in 1–2 minuti: i social le prendono da lì.
  async function waitOnline(paths, show) {
    for (let i = 0; i < 40; i++) {
      const ok = await Promise.all(paths.map((p) => fetch(`${mediaUrl(p)}?t=${Date.now()}`, { method: 'HEAD', cache: 'no-store' }).then((r) => r.ok).catch(() => false)));
      if (ok.every(Boolean)) return;
      show(`Aspetto che ${paths.length === 1 ? 'il file sia online' : 'i file siano online'} sul sito… (di solito 1–2 minuti)`);
      await new Promise((r) => setTimeout(r, 8000));
    }
    throw new Error('Il sito ci mette troppo ad aggiornarsi: riprova tra qualche minuto.');
  }

  saveBtn.onclick = async () => {
    saveBtn.disabled = true;
    pubBtn.disabled = true;
    try {
      const out = await persist();
      state.dirty = false;
      state.flash = { type: 'ok', text: out.data.stato === 'programmato' ? 'Post salvato e programmato.' : 'Post salvato.' };
      if (isNew) location.hash = `#/social/${out.id}`; else route();
    } catch (e) {
      status.textContent = e.message;
      status.className = 'status error';
      saveBtn.disabled = false;
      pubBtn.disabled = false;
    }
  };

  // Pubblica ora: sugli account collegati pubblica davvero (tramite il server); per gli altri restano gli strumenti a mano.
  pubBtn.onclick = async () => {
    const reti = scelti();
    if (!reti.length) { alert('Scegli almeno un social in “Dove”.'); return; }
    if (tipo === 'foto' && !chosen.length) { alert('Scegli almeno una foto.'); return; }
    if (tipo === 'video' && !video && !localVideo) { alert('Scegli un video.'); return; }
    let acc = {};
    try { acc = (await request('/social/stato')) || {}; } catch { acc = {}; }
    const auto = reti.filter((r) => acc[r]?.collegato);
    const mano = reti.filter((r) => !acc[r]?.collegato);
    const step = (n, title, ...body) => h('div', { class: 'pub-step' }, h('b', { class: 'pub-n' }, n), h('div', {}, h('strong', {}, title), ...body));

    // Automatico
    const autoMsg = h('p', { class: 'hint pub-msg' });
    const esitiBox = h('div', { class: 'pub-esiti' });
    const goBtn = h('button', { type: 'button', class: 'btn primary' }, icon('send'), h('span', {}, `Pubblica adesso su ${auto.map(nomeRete).join(' e ')}`));
    goBtn.onclick = async () => {
      goBtn.disabled = true; saveBtn.disabled = true; pubBtn.disabled = true;
      const show = (t) => { autoMsg.textContent = t; };
      try {
        show('Salvo il post…');
        const out = await persist();
        state.dirty = false;
        await waitOnline(out.data.tipo === 'video' ? [out.data.video] : out.data.grafiche, show);
        // Un social per volta (limite del server gratuito).
        const esiti = {};
        for (const r of auto) {
          show(`Pubblico su ${nomeRete(r)}…${out.data.tipo === 'video' ? ' (i video possono metterci qualche minuto)' : ''}`);
          try {
            const res = await request('/social/pubblica', { method: 'POST', body: {
              reti: [r], immagini: out.data.grafiche || [], video: out.data.video, testo: out.data.testo, titolo: out.data.titolo,
            } });
            esiti[r] = res.esiti?.[r] || { ok: false, errore: 'Nessuna risposta.' };
          } catch (e) { esiti[r] = { ok: false, errore: e.message }; }
        }
        esitiBox.replaceChildren(...auto.map((r) => {
          const e = esiti[r] || { ok: false, errore: 'Nessuna risposta.' };
          return h('div', { class: `pub-esito ${e.ok ? 'ok' : 'ko'}` }, icon(e.ok ? 'ok' : 'alert'),
            h('div', {}, h('strong', {}, nomeRete(r)), h('p', {}, e.ok ? e.nota : e.errore),
              e.ok && e.link && h('a', { class: 'lnk', href: e.link, target: '_blank', rel: 'noopener' }, 'Apri il post')));
        }));
        const tuttiOk = auto.every((r) => esiti[r]?.ok);
        const nessuno = auto.every((r) => !esiti[r]?.ok);
        const now = new Date();
        await updatePost({
          stato: nessuno ? 'fallito' : 'pubblicato',
          data: isoDay(now), ora: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
          esiti: Object.fromEntries(auto.map((r) => [r, esiti[r]?.ok ? (esiti[r].link || 'ok') : `errore: ${esiti[r]?.errore || ''}`])),
        });
        show(tuttiOk ? 'Fatto!' : nessuno ? 'Non è andato: leggi qui sotto cosa dice il social.' : 'Fatto in parte: leggi qui sotto.');
        state.flash = { type: nessuno ? 'error' : 'ok', text: tuttiOk ? `Pubblicato su ${auto.map(nomeRete).join(', ')}.` : 'Pubblicazione non riuscita su tutti i social: i dettagli sono nel post.' };
      } catch (e) {
        show(e.message);
        goBtn.disabled = false;
      } finally {
        saveBtn.disabled = false; pubBtn.disabled = false;
      }
    };
    const autoBlock = auto.length
      ? h('div', { class: 'pub-share' },
        h('p', {}, 'Account collegati: ', auto.map((r) => `${nomeRete(r)}${acc[r].nome ? ` (${acc[r].nome})` : ''}`).join(', '), '.'),
        goBtn, autoMsg, esitiBox,
        auto.includes('tiktok') && h('p', { class: 'hint' }, 'Su TikTok il post arriva nelle bozze: dall’app aggiungi la musica e pubblichi.'))
      : null;

    // A mano
    const files = await mediaFiles();
    const canShare = !!(navigator.canShare && files.length && navigator.canShare({ files }));
    const copy = async (btn) => { try { await navigator.clipboard.writeText(testo.value); if (btn) btn.lastChild.textContent = 'Testo copiato!'; return true; } catch { return false; } };
    const copyB = h('button', { type: 'button', class: 'btn small' }, icon('copy'), h('span', {}, 'Copia il testo'));
    copyB.onclick = () => copy(copyB);
    const zipB = h('button', { type: 'button', class: 'btn primary' }, icon('download'), h('span', {}, 'Esporta tutto (ZIP)'));
    zipB.onclick = () => exportZip(zipB);
    const dlB = h('button', { type: 'button', class: 'btn small' }, icon('download'), h('span', {}, tipo === 'video' ? 'Solo il video' : `Solo ${files.length === 1 ? 'la grafica' : `le ${files.length} grafiche`}`));
    dlB.onclick = () => downloadAll(files);
    const shareB = canShare && h('button', { type: 'button', class: 'btn small' }, icon('send'), h('span', {}, 'Condividi dal telefono'));
    if (shareB) shareB.onclick = async () => { await copy(); try { await navigator.share({ files, text: testo.value, title: titolo.value || 'Post' }); } catch { /* annullato */ } };
    const done = h('button', { type: 'button', class: 'btn small' }, icon('ok'), h('span', {}, 'Segna come pubblicato'));
    done.onclick = async () => {
      done.disabled = true;
      try {
        if (!saved) await persist();
        const now = new Date();
        await updatePost({ stato: 'pubblicato', data: isoDay(now), ora: `${pad2(now.getHours())}:${pad2(now.getMinutes())}` });
        state.dirty = false;
        state.flash = { type: 'ok', text: 'Post segnato come pubblicato.' };
        closeSheet();
      } catch (e) { done.disabled = false; alert(e.message); }
    };
    const manoReti = mano.length ? mano : reti;
    const manual = h('details', { class: 'pub-mano', open: !auto.length },
      h('summary', {}, auto.length ? `A mano su ${mano.length ? mano.map(nomeRete).join(', ') : 'tutti i social'}` : 'Esporta e pubblica'),
      h('div', { class: 'pub' },
        step(1, 'Esporta', h('div', { class: 'row' }, zipB, dlB, copyB), h('p', { class: 'hint' }, `Lo ZIP contiene ${tipo === 'video' ? 'il video' : 'le grafiche numerate in ordine'} e il testo del post (testo.txt).`)),
        step(2, 'Dal telefono', shareB ? h('div', { class: 'row' }, shareB) : h('p', { class: 'hint' }, 'Apri questo post dal telefono e premi “Condividi dal telefono”: le grafiche vanno dritte nell’app del social, con il testo già copiato.')),
        step(3, 'Apri il social e crea il post',
          h('div', { class: 'pub-links' }, manoReti.map((v) => h('a', { class: 'btn small', href: SOCIAL_WEB[v][0], target: '_blank', rel: 'noopener' }, icon('external'), h('span', {}, nomeRete(v))))),
          ...manoReti.map((v) => h('p', { class: 'hint' }, SOCIAL_WEB[v][1]))),
        step(4, 'Quando è online', h('div', { class: 'row' }, done))));

    const closeSheet = openSheet(`Pubblica su ${reti.map(nomeRete).join(', ')}`, h('div', { class: 'pub' }, autoBlock, manual), () => { if (saved && isNew) location.hash = `#/social/${saved.id}`; else if (saved) route(); },
      auto.length ? 'I post programmati partiranno da soli quando sarà attiva la pubblicazione all’ora scelta.' : 'Pubblicazione automatica non attiva: si accende collegando gli account in Social → Account social.', 'Chiudi');
  };

  const delBtn = !isNew && h('button', {
    type: 'button', class: 'btn ghost danger',
    onclick: async () => {
      if (!confirm('Eliminare questo post e i suoi file? Non si può annullare. (Sui social, se era già pubblicato, resta.)')) return;
      try {
        const own = [...(entry.data.grafiche || []), ...(entry.data.video?.startsWith(`/${SOCIAL_DIR}/`) ? [entry.data.video] : [])];
        await commit([{ path: entry.path, remove: true }, ...own.map((g) => ({ path: g.replace(/^\//, ''), remove: true }))], `Elimina post social “${entry.data.titolo}”`);
        state.cache.social = (state.cache.social || []).filter((p) => p !== entry);
        state.dirty = false;
        state.flash = { type: 'ok', text: 'Post eliminato.' };
        location.hash = '#/social';
      } catch (e) { status.textContent = e.message; }
    },
  }, icon('trash'), h('span', {}, 'Elimina'));

  const field = (label, el, hint) => h('div', {}, h('label', { class: 'label' }, label), el, hint && h('p', { class: 'hint' }, hint));
  const fotoParts = [
    h('h3', { class: 'form-group' }, 'Foto del post'),
    pickZone,
    h('h3', { class: 'form-group' }, 'Grafica'),
    field('Stile', stileSeg),
    field('Sfondo', sfondoSeg),
    field('Foto nelle slide interne', taglioSeg, 'Intere: si vede tutta la foto, con il margine. Riempi: la foto occupa tutto il riquadro e si taglia ai bordi.'),
    field('Titolo sulla copertina', titolo),
    field('Etichetta sopra il titolo', etichetta, 'Di solito la categoria del progetto.'),
  ];
  const videoParts = [h('h3', { class: 'form-group' }, 'Video del post'), vidZone];
  function showMode() {
    fotoParts.forEach((el) => { el.hidden = tipo !== 'foto'; });
    videoParts.forEach((el) => { el.hidden = tipo !== 'video'; });
    drawVids();
    renderAll();
  }
  const esiti = d.esiti && h('section', { class: 'panel padded side-card' },
    h('span', { class: 'label' }, 'Ultima pubblicazione'),
    Object.entries(d.esiti).map(([r, v]) => h('p', { class: 'hint' }, h('strong', {}, `${nomeRete(r) || r}: `),
      String(v).startsWith('http') ? h('a', { class: 'lnk', href: v, target: '_blank', rel: 'noopener' }, 'apri il post') : String(v))));
  const form = h('div', { class: 'form has-side', oninput: markDirty, onchange: markDirty },
    h('section', { class: 'form-main panel padded' },
      field('Tipo di post', tipoSeg),
      h('div', { class: 'sp-preview' }, big, strip, previewNote),
      ...videoParts,
      ...fotoParts),
    h('aside', { class: 'form-side' },
      h('section', { class: 'panel padded side-card' },
        field('Stato', stato),
        h('div', { class: 'sp-when' }, field('Giorno', dataIn), field('Ora', oraIn)),
        h('div', {}, h('span', { class: 'label' }, 'Dove'), h('div', { class: 'check-items' }, socialBoxes.map(([, l]) => l))),
        h('p', { class: 'hint' }, h('a', { class: 'lnk', href: '#/social/account' }, 'Account collegati')),
        project && h('p', { class: 'hint' }, 'Progetto: ', h('a', { class: 'lnk', href: `#/c/progetti/${project.slug}` }, project.data.title))),
      esiti,
      h('section', { class: 'panel padded side-card' },
        field('Testo del post', testo),
        conta,
        h('div', { class: 'row' }, copyBtn))));

  drawPick();
  showMode();
  const title = isNew ? 'Nuovo post' : d.titolo || 'Post';
  shell([['Social', '#/social'], [title]], h('div', { class: 'editor' },
    h('div', { class: 'page-head' },
      h('div', {}, h('div', { class: 'title-row' }, h('h1', {}, title), !isNew && chip((STATI_POST.find(([v]) => v === d.stato) || STATI_POST[0])[1], `st-${d.stato || 'bozza'}`)),
        h('p', { class: 'muted' }, project ? `Dal progetto ${project.data.title}` : 'Post libero, con foto o video dal computer')),
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
    fa: 'Pubblica foto singole, caroselli fino a 10 grafiche 4:5 e video (come Reel), con il testo del post.',
    limiti: 'Serve un account professionale (Business o Creator): è gratis e si cambia dall’app. Fino a 50 post al giorno via API. Il collegamento dura 60 giorni e il server lo rinnova da solo.',
    passi: [
      'Nell’app Instagram: Impostazioni → Tipo di account e strumenti → Passa a un account professionale (Creator va bene).',
      'Su developers.facebook.com crei un account sviluppatore e un’app di tipo Business, con il prodotto “Instagram API with Instagram Login”. Lo facciamo insieme.',
      'Le chiavi dell’app (App ID e App Secret) vanno salvate su Cloudflare, nelle impostazioni del server, come INSTAGRAM_APP_ID e INSTAGRAM_APP_SECRET.',
      'Nell’app Meta, alla voce dell’accesso con Instagram, incolli l’indirizzo di ritorno qui sotto. Poi premi “Collega”, entri con Instagram e autorizzi.',
    ],
  },
  {
    id: 'tiktok', nome: 'TikTok', colore: '#121414',
    fa: 'Manda grafiche (post di foto) o video nelle bozze di TikTok: dal telefono aggiungi la musica e pubblichi.',
    limiti: 'TikTok permette la pubblicazione diretta e pubblica solo alle app che superano la sua revisione (audit); finché non c’è, i post via API possono essere solo privati. Per questo la strada consigliata è mandarli nelle bozze. Per TikTok conviene anche il formato verticale 9:16.',
    passi: [
      'Su developers.tiktok.com crei un account sviluppatore e un’app con i prodotti “Login Kit” e “Content Posting API”. Lo facciamo insieme.',
      'Si verifica il dominio likemommademe.github.io nel portale di TikTok (serve perché TikTok prenda le grafiche dal sito).',
      'Le chiavi (Client key e Client secret) vanno su Cloudflare come TIKTOK_CLIENT_KEY e TIKTOK_CLIENT_SECRET.',
      'Nell’app TikTok incolli l’indirizzo di ritorno qui sotto (Login Kit → Redirect URI). Poi premi “Collega”, entri con TikTok e autorizzi.',
    ],
  },
  {
    id: 'linkedin', nome: 'LinkedIn', colore: '#0A66C2',
    fa: 'Pubblica sul tuo profilo personale il testo con le grafiche (anche più di una) o con un video.',
    limiti: 'Va bene il profilo personale, senza revisione. Per creare l’app LinkedIn chiede di collegarla a una pagina aziendale (si può creare la pagina LIKEMOMMADEME). Il collegamento dura 60 giorni: dopo va rifatto, il pannello te lo ricorda.',
    passi: [
      'Se non c’è ancora, crei la pagina LinkedIn di LIKEMOMMADEME (anche vuota).',
      'Su linkedin.com/developers crei un’app collegata a quella pagina e aggiungi i prodotti “Sign In with LinkedIn using OpenID Connect” e “Share on LinkedIn”. Lo facciamo insieme.',
      'Le chiavi (Client ID e Client Secret) vanno su Cloudflare come LINKEDIN_CLIENT_ID e LINKEDIN_CLIENT_SECRET.',
      'Nell’app LinkedIn (Auth → Authorized redirect URLs) incolli l’indirizzo di ritorno qui sotto. Poi premi “Collega”, entri con LinkedIn e autorizzi.',
    ],
  },
];

async function socialAccounts() {
  shell([['Social', '#/social'], ['Account social']], loading());
  const params = hashParams();
  let stato = {};
  let problema = '';
  try { stato = (await request('/social/stato')) || {}; } catch (e) { problema = e.message; }
  // Server non ancora aggiornato su Cloudflare: la pagina lo dice invece di far finta di niente.
  const serverVecchio = !problema && !Object.keys(stato).length;
  const card = (a) => {
    const s = stato[a.id] || {};
    const pronto = !!s.configurato;
    const ritorno = s.ritorno || `${API}/social/callback/${a.id}`;
    const collega = h('button', { type: 'button', class: 'btn primary', disabled: !pronto, title: pronto ? '' : 'Prima vanno fatti i passi 1–3' }, h('span', {}, s.collegato ? 'Ricollega' : 'Collega'));
    collega.onclick = async () => {
      collega.disabled = true;
      try { location.href = (await request(`/social/inizia/${a.id}`, { method: 'POST' })).url; } catch (e) { alert(e.message); collega.disabled = false; }
    };
    const scollega = s.collegato && h('button', { type: 'button', class: 'btn ghost danger' }, h('span', {}, 'Scollega'));
    if (scollega) scollega.onclick = async () => {
      if (!confirm(`Scollegare ${a.nome}? I post non partiranno più da soli finché non lo ricolleghi.`)) return;
      await request(`/social/scollega/${a.id}`, { method: 'POST' });
      route();
    };
    const copia = h('button', { type: 'button', class: 'btn small' }, icon('copy'), h('span', {}, 'Copia'));
    copia.onclick = async () => { try { await navigator.clipboard.writeText(ritorno); copia.lastChild.textContent = 'Copiato!'; } catch { /* niente */ } };
    const scade = s.collegato && s.scade && a.id === 'linkedin' ? ` · da ricollegare entro il ${new Date(s.scade).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })}` : '';
    return h('section', { class: 'panel acc-card', style: `--brand:${a.colore}` },
      h('div', { class: 'acc-head' },
        h('span', { class: 'acc-logo' }, a.nome[0]),
        h('div', { class: 'grow' }, h('h2', {}, a.nome), h('p', { class: 'muted' }, s.collegato ? `Collegato: ${s.nome || ''}${scade}` : 'Non collegato')),
        s.collegato ? chip('Collegato', 'st-programmato') : chip(pronto ? 'Pronto da collegare' : 'Da configurare', pronto ? 'st-pubblicato' : 'st-bozza')),
      h('div', { class: 'acc-body' },
        h('p', {}, h('strong', {}, 'Cosa fa: '), a.fa),
        h('p', { class: 'hint' }, a.limiti),
        !s.collegato && h('ol', { class: 'acc-steps' }, a.passi.map((p) => h('li', {}, p))),
        !s.collegato && h('div', { class: 'acc-uri' }, h('span', { class: 'label' }, 'Indirizzo di ritorno (da incollare nell’app del social)'), h('code', {}, ritorno), copia)),
      h('div', { class: 'acc-foot' }, collega, scollega,
        !pronto && h('span', { class: 'hint' }, 'Il pulsante si attiva quando le chiavi sono su Cloudflare.')));
  };
  shell([['Social', '#/social'], ['Account social']], h('div', {},
    pageHead('Account social', 'Collega Instagram, TikTok e LinkedIn: poi “Pubblica ora” pubblica davvero',
      h('a', { class: 'btn ghost', href: '#/social' }, icon('back'), h('span', {}, 'Calendario'))),
    params.collegato && h('div', { class: 'banner ok' }, icon('ok'), h('span', {}, `${(ACCOUNTS.find((x) => x.id === params.collegato) || {}).nome || 'Account'} collegato! Da ora “Pubblica ora” pubblica davvero.`)),
    params.errore && h('div', { class: 'banner error' }, icon('alert'), h('span', {}, `Collegamento non riuscito: ${params.errore}`)),
    problema && h('div', { class: 'banner error' }, icon('alert'), h('span', {}, problema)),
    serverVecchio && h('div', { class: 'banner error' }, icon('alert'), h('span', {}, 'Il server su Cloudflare non ha ancora il codice dei social: va incollato il nuovo cms-server/worker.js (vedi il riassunto, “aggiornare il codice del server”).')),
    h('div', { class: 'acc-grid' }, ACCOUNTS.map(card))));
}

async function socialRoute() {
  const path = location.hash.split('?')[0];
  if (path === '#/social') return socialView();
  if (path === '#/social/account') return socialAccounts();
  if (path === '#/social/nuovo') return socialPick();
  return socialEditor(decodeURIComponent(path.replace('#/social/', '')));
}
