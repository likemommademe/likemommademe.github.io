// Pannello del portfolio.
// Legge e salva i file del sito nella repo GitHub passando dal Worker "portfolio-login" su Cloudflare,
// che custodisce la chiave GitHub, gestisce l'accesso e conta le visite. Sezioni e campi sono in schema.js.

const API = 'https://portfolio-login.calfa63.workers.dev';
const GOOGLE_CLIENT_ID = '821581591121-dp0scd35mtevlv0m07fhqi39d2nmo9gu.apps.googleusercontent.com';
const BRAND = 'LIKEMOMMADEME';
const SITE = 'https://likemommademe.github.io';
const RAW = 'https://raw.githubusercontent.com/likemommademe/likemommademe.github.io/main';
const UPLOADS = 'assets/uploads';
const IMAGE_DEFAULTS = { webp: true, qualita: 92, lato_max: 2560 };

const { collections, pages, settings } = window.CMS;
const app = document.getElementById('app');
const state = {
  session: read('cms.session'),
  email: read('cms.email'),
  cache: {},
  dirty: false,
  flash: null,
  site: null,
  duplicate: null,
};
let currentHash = location.hash;

// ─── Utilità ────────────────────────────────────────────────

function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}

function write(key, value) {
  try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch {}
}

function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'class') el.className = v;
    else if (k in el && !['list', 'form'].includes(k)) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat(Infinity)) {
    if (c != null && c !== false) el.append(c instanceof Node ? c : String(c));
  }
  return el;
}

function svg(tag, attrs, ...children) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  el.append(...children);
  return el;
}

const ICONS = {
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/>',
  briefcase: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
  home: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  send: '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  ok: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  alert: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  images: '<path d="M18 22H4a2 2 0 0 1-2-2V6"/><path d="m22 13-1.296-1.296a2.41 2.41 0 0 0-3.408 0L11 18"/><circle cx="12" cy="8" r="2"/><rect width="16" height="16" x="6" y="2" rx="2"/>',
  video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
  grip: '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  edit: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  chart: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
};

function icon(name) {
  const span = h('span', { class: 'icon', 'aria-hidden': 'true' });
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return span;
}

const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length);
const clone = (v) => JSON.parse(JSON.stringify(v));

function bytesToB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
const b64ToText = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

function mediaUrl(path) {
  if (!path) return '';
  return /^(https?:|blob:)/.test(path) ? path : SITE + path;
}

function sizeLabel(bytes) {
  return bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

function timeAgo(date) {
  const min = Math.round((Date.now() - new Date(date)) / 60000);
  if (min < 1) return 'adesso';
  if (min < 60) return `${min} min fa`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? 'ora' : 'ore'} fa`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? 'giorno' : 'giorni'} fa`;
  return new Date(date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

const findCollection = (name) => collections.find((c) => c.name === name);
const findPage = (name) => [...pages, ...settings].find((p) => p.name === name);
const markDirty = () => { state.dirty = true; };
const isDraft = (entry) => entry.data.published === false;

// ─── Server (Worker su Cloudflare) ──────────────────────────

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    cache: 'no-store',
    headers: { Authorization: `Bearer ${state.session}`, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  if (res.status === 401) {
    logout('La sessione è scaduta: accedi di nuovo.');
    throw new Error('Sessione scaduta.');
  }
  if (res.status === 404 && method === 'GET') return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || `Errore ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const api = (path, opts) => request(`/github${path}`, opts);
const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');

async function readFile(path) {
  const file = await api(`/contents/${encodePath(path)}?ref=main`);
  return file && b64ToText(file.content);
}

async function listFolder(path) {
  return (await api(`/contents/${encodePath(path)}?ref=main`)) || [];
}

// Salva più file insieme in un unico salvataggio (commit): così il sito si aggiorna una volta sola.
// changes: [{ path, text }] per i testi, [{ path, base64 }] per le immagini, [{ path, remove: true }] per cancellare.
async function commit(changes, message) {
  for (let attempt = 0; ; attempt++) {
    try {
      const ref = await api('/git/ref/heads/main');
      const head = await api(`/git/commits/${ref.object.sha}`);
      const tree = [];
      for (const c of changes) {
        const path = c.path.replace(/^\//, '');
        if (c.remove) tree.push({ path, mode: '100644', type: 'blob', sha: null });
        else if (c.base64) {
          const blob = await api('/git/blobs', { method: 'POST', body: { content: c.base64, encoding: 'base64' } });
          tree.push({ path, mode: '100644', type: 'blob', sha: blob.sha });
        } else tree.push({ path, mode: '100644', type: 'blob', content: c.text });
      }
      const newTree = await api('/git/trees', { method: 'POST', body: { base_tree: head.tree.sha, tree } });
      const created = await api('/git/commits', { method: 'POST', body: { message, tree: newTree.sha, parents: [ref.object.sha] } });
      await api('/git/refs/heads/main', { method: 'PATCH', body: { sha: created.sha } });
      watchSite();
      return created.sha;
    } catch (e) {
      // Se nel frattempo è arrivato un altro salvataggio, riprova sopra a quello.
      if (e.status === 422 && attempt < 2) continue;
      throw e;
    }
  }
}

// ─── File di contenuto (front matter + testo, oppure YAML) ──

function parse(schema, text) {
  if (schema.format === 'yaml') return { data: jsyaml.load(text) || {}, body: '' };
  const m = text.match(/^---\r?\n([\s\S]*?\r?\n)?---\r?\n?([\s\S]*)$/);
  return m ? { data: jsyaml.load(m[1] || '') || {}, body: m[2] } : { data: {}, body: text };
}

function serialize(schema, data, body) {
  const yaml = Object.keys(data).length ? jsyaml.dump(data, { lineWidth: -1 }) : '';
  if (schema.format === 'yaml') return yaml;
  return `---\n${yaml}---\n${body ? body.replace(/\s*$/, '\n') : ''}`;
}

async function loadCollection(coll) {
  if (state.cache[coll.name]) return state.cache[coll.name];
  const list = await listFolder(coll.folder);
  const entries = await Promise.all(list
    .filter((f) => f.type === 'file' && f.name.endsWith('.md'))
    .map(async (f) => {
      const text = await readFile(f.path);
      return { slug: f.name.replace(/\.md$/, ''), path: f.path, ...parse(coll, text) };
    }));
  return (state.cache[coll.name] = entries);
}

async function loadPage(page) {
  const key = `page:${page.name}`;
  if (state.cache[key]) return state.cache[key];
  const text = await readFile(page.file);
  return (state.cache[key] = text == null ? { data: {}, body: '' } : parse(page, text));
}

async function imageSettings() {
  const page = await loadPage(findPage('immagini'));
  return { ...IMAGE_DEFAULTS, ...page.data };
}

function sortEntries(coll, entries) {
  const value = (e, key) => (key === 'title' ? e.data.title || e.slug : e.data[key]);
  return [...entries].sort((a, b) => {
    for (const key of coll.sort || ['title']) {
      const x = value(a, key);
      const y = value(b, key);
      if (x === y) continue;
      if (x == null) return 1;
      if (y == null) return -1;
      return typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'it');
    }
    return 0;
  });
}

// Mappa slug → titolo per i campi che puntano ad altre sezioni (es. categoria, cliente).
async function relationTitles(coll) {
  const titles = {};
  for (const f of coll.fields.filter((f) => f.type === 'relation')) {
    const entries = await loadCollection(findCollection(f.collection));
    titles[f.name] = Object.fromEntries(entries.map((e) => [e.slug, e.data.title || e.slug]));
  }
  return titles;
}

function subtitle(coll, entry, titles) {
  return (coll.subtitle || []).map((key) => {
    const f = coll.fields.find((f) => f.name === key);
    const v = entry.data[key];
    if (isEmpty(v)) return null;
    return f?.type === 'relation' ? titles[key]?.[v] || v : v;
  }).filter((v) => v != null).join(' · ');
}

async function homeSlugs() {
  return (await loadPage(findPage('home'))).data.progetti || [];
}

function siteUrl(coll, slug) {
  return coll.permalink ? SITE + coll.permalink.replace(':slug', slug) : null;
}

// ─── Stato del sito (è già online l'ultimo salvataggio?) ───

let siteTimer = null;

async function watchSite() {
  clearTimeout(siteTimer);
  try {
    const [latest, live] = await Promise.all([
      api('/commits/main'),
      fetch(`${SITE}/admin/stato.json?t=${Date.now()}`, { cache: 'no-store' }).then((r) => r.json()).catch(() => null),
    ]);
    const online = live && (live.commit
      ? live.commit === latest.sha
      : new Date(live.time) >= new Date(latest.commit.committer.date));
    setSite(online ? 'ok' : 'pending');
    if (!online) siteTimer = setTimeout(watchSite, 8000);
  } catch {
    setSite(null);
  }
}

function setSite(status) {
  state.site = status;
  for (const el of document.querySelectorAll('[data-site-status]')) el.replaceWith(sitePill());
}

function sitePill() {
  if (!state.site) return h('span', { 'data-site-status': '' });
  const ok = state.site === 'ok';
  return h('span', { class: `pill ${ok ? 'ok' : 'pending'}`, 'data-site-status': '', title: ok ? 'Tutte le modifiche sono online' : 'GitHub sta aggiornando il sito: di solito ci vogliono 1–2 minuti' },
    h('span', { class: 'dot' }), ok ? 'Sito aggiornato' : 'In pubblicazione…');
}

// ─── Immagini ───────────────────────────────────────────────

// Prepara la foto da caricare: la converte in WebP e la riduce secondo Sistema → Immagini.
async function processImage(file) {
  const opts = await imageSettings();
  const raster = /^image\/(jpeg|png|webp)$/.test(file.type);
  const dot = file.name.lastIndexOf('.');
  const base = slugify(dot > 0 ? file.name.slice(0, dot) : file.name) || 'immagine';
  let blob = file;
  let ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : 'jpg';

  if (raster) {
    const bitmap = await createImageBitmap(file);
    const max = Number(opts.lato_max) || 0;
    const scale = max ? Math.min(1, max / Math.max(bitmap.width, bitmap.height)) : 1;
    const toWebp = opts.webp && file.type !== 'image/webp';
    if (toWebp || scale < 1) {
      const canvas = h('canvas', { width: Math.round(bitmap.width * scale), height: Math.round(bitmap.height * scale) });
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const type = opts.webp ? 'image/webp' : file.type;
      const out = await new Promise((resolve) => { canvas.toBlob(resolve, type, Number(opts.qualita) / 100); });
      // Alcuni browser (Safari) non sanno creare WebP: in quel caso resta il formato originale.
      if (out && out.type === type) {
        blob = out;
        if (type === 'image/webp') ext = 'webp';
      }
    }
  }
  const path = `/${UPLOADS}/${base}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
  return { blob, path, preview: URL.createObjectURL(blob) };
}

async function toUpload(prepared) {
  return { path: prepared.path, base64: bytesToB64(new Uint8Array(await prepared.blob.arrayBuffer())) };
}

function dropzone(el, onFiles) {
  el.addEventListener('dragover', (e) => {
    if (![...e.dataTransfer.types].includes('Files')) return;
    e.preventDefault();
    el.classList.add('drop');
  });
  el.addEventListener('dragleave', () => el.classList.remove('drop'));
  el.addEventListener('drop', (e) => {
    el.classList.remove('drop');
    const files = [...e.dataTransfer.files].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    e.stopPropagation();
    onFiles(files);
  });
}

async function loadLibrary() {
  const files = await listFolder(UPLOADS);
  return files
    .filter((f) => f.type === 'file' && /\.(jpe?g|png|webp|gif|svg|avif)$/i.test(f.name))
    .map((f) => ({ name: f.name, path: `/${f.path}`, size: f.size }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Tutti i testi del sito, per sapere quali immagini sono usate e dove.
async function usageIndex() {
  const where = [];
  for (const coll of collections) {
    for (const e of await loadCollection(coll)) where.push({ label: `${coll.label} › ${e.data.title || e.slug}`, text: JSON.stringify(e.data) + e.body });
  }
  for (const page of [...pages, ...settings]) {
    const p = await loadPage(page);
    where.push({ label: page.label, text: JSON.stringify(p.data) + p.body });
  }
  return (path) => where.filter((w) => w.text.includes(path)).map((w) => w.label);
}

function libThumb(path) {
  const img = h('img', { src: mediaUrl(path), alt: '', loading: 'lazy' });
  img.onerror = () => { if (img.src.startsWith(SITE)) img.src = RAW + path; };
  return h('span', { class: 'lib-img' }, img);
}

// Finestra per scegliere un'immagine già caricata.
function pickFromLibrary() {
  return new Promise((resolve) => {
    const grid = h('div', { class: 'lib-grid' }, h('p', { class: 'muted loading' }, 'Caricamento…'));
    const overlay = h('div', { class: 'modal' },
      h('div', { class: 'modal-box' },
        h('div', { class: 'modal-head' }, h('h2', {}, 'Libreria immagini'), h('button', { type: 'button', class: 'icon-btn', onclick: () => close(null) }, icon('x'))),
        grid));
    const close = (value) => { overlay.remove(); resolve(value); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
    document.body.append(overlay);
    loadLibrary().then((files) => {
      grid.replaceChildren(...(files.length
        ? files.map((f) => h('button', { type: 'button', class: 'lib-item', onclick: () => close(f.path) }, libThumb(f.path), h('span', {}, f.name)))
        : [h('p', { class: 'empty-state' }, 'Nessuna immagine caricata.')]));
    }).catch((e) => grid.replaceChildren(h('p', { class: 'empty-state' }, e.message)));
  });
}

// ─── Trascinamento per riordinare ───────────────────────────

// Rende riordinabili gli elementi `.sort-item` di `list` trascinandoli dalla maniglia `.grip`.
function sortable(list, onChange) {
  list.addEventListener('pointerdown', (e) => {
    const handle = e.target.closest('.grip');
    const item = handle?.closest('.sort-item');
    if (!item || item.parentElement !== list) return;
    e.preventDefault();
    handle.setPointerCapture(e.pointerId);
    item.classList.add('dragging');
    const move = (ev) => {
      if (ev.clientY < 70) window.scrollBy(0, -14);
      else if (ev.clientY > window.innerHeight - 70) window.scrollBy(0, 14);
      const next = [...list.children].find((c) => c !== item && ev.clientY < c.getBoundingClientRect().top + c.offsetHeight / 2);
      if (next) { if (item.nextElementSibling !== next) list.insertBefore(item, next); } else if (list.lastElementChild !== item) list.append(item);
    };
    const up = () => {
      item.classList.remove('dragging');
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', up);
      handle.removeEventListener('pointercancel', up);
      onChange();
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', up);
    handle.addEventListener('pointercancel', up);
  });
}

const grip = () => h('span', { class: 'grip', title: 'Trascina per riordinare' }, icon('grip'));

// ─── Campi del modulo ───────────────────────────────────────

async function widget(field, value) {
  switch (field.type) {
    case 'hidden':
      return { get: () => value ?? field.default };
    case 'string': {
      const el = h('input', { type: 'text', value: value ?? '', placeholder: field.placeholder || '' });
      return { el, get: () => el.value.trim() };
    }
    case 'text': {
      const el = h('textarea', { rows: field.rows || 3, value: value ?? '' });
      return { el, get: () => el.value.replace(/\s+$/, '') };
    }
    case 'markdown':
      return richText(value, field.rows);
    case 'number': {
      const el = h('input', { type: 'number', step: 1, value: value ?? '', class: 'narrow' });
      return { el, get: () => (el.value === '' ? undefined : Number(el.value)) };
    }
    case 'boolean':
    case 'publish': {
      // "publish": acceso = pubblicato. Nel file si scrive solo "published: false" per le bozze.
      const on = field.type === 'publish' ? value !== false : !!value;
      const input = h('input', { type: 'checkbox', checked: on });
      return {
        el: h('label', { class: 'switch' }, input, h('span', { class: 'track' }), h('span', {}, field.label)),
        inline: true,
        get: () => (field.type === 'publish' ? (input.checked ? undefined : false) : input.checked),
      };
    }
    case 'select': {
      const current = value ?? field.default;
      const el = h('select', {}, field.options.map((o, i) => h('option', { value: i, selected: o.value === current }, o.label)));
      return { el, get: () => field.options[el.value]?.value };
    }
    case 'relation': {
      const coll = findCollection(field.collection);
      const entries = sortEntries(coll, await loadCollection(coll));
      const el = h('select', {},
        h('option', { value: '' }, field.required ? 'Scegli…' : '— nessuno —'),
        entries.map((e) => h('option', { value: e.slug, selected: e.slug === value }, e.data.title || e.slug)));
      return { el, get: () => el.value };
    }
    case 'relationList':
      return relationListWidget(field, value);
    case 'image':
      return imageWidget(value);
    case 'gallery':
      return galleryWidget(value);
    default:
      throw new Error(`Tipo di campo sconosciuto: ${field.type}`);
  }
}

// Testo formattato con i pulsanti (grassetto, corsivo, link…). Nel file resta in Markdown.
function richText(value, rows) {
  const area = h('div', { class: 'rt-area', contentEditable: 'true' });
  area.innerHTML = value ? marked.parse(value) : '';
  area.style.minHeight = `${(rows || 8) * 1.6}em`;
  let touched = false;
  area.addEventListener('input', () => { touched = true; });
  area.addEventListener('paste', (e) => {
    e.preventDefault();
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
  });
  const run = (command, arg) => {
    area.focus();
    document.execCommand(command, false, arg);
    touched = true;
    markDirty();
  };
  const tool = (label, title, action, cls) => h('button', {
    type: 'button', class: `rt-btn ${cls || ''}`, title,
    onmousedown: (e) => e.preventDefault(),
    onclick: action,
  }, label);
  const bar = h('div', { class: 'rt-bar' },
    tool('B', 'Grassetto', () => run('bold'), 'b'),
    tool('I', 'Corsivo', () => run('italic'), 'i'),
    h('span', { class: 'rt-sep' }),
    tool('Titolo', 'Titolo di paragrafo', () => run('formatBlock', 'H3')),
    tool('Testo', 'Testo normale', () => run('formatBlock', 'P')),
    tool('• Elenco', 'Elenco puntato', () => run('insertUnorderedList')),
    h('span', { class: 'rt-sep' }),
    tool('Link', 'Aggiungi un link al testo selezionato', () => {
      const url = prompt('Indirizzo del link (https://…)');
      if (url) run('createLink', url);
    }),
    tool('Togli link', 'Togli il link', () => run('unlink')));
  const turndown = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', emDelimiter: '*' });
  return {
    el: h('div', { class: 'rt' }, bar, area),
    get: () => (touched ? turndown.turndown(area.innerHTML).trim() : (value || '').replace(/\s+$/, '')),
  };
}

function imageWidget(value) {
  let path = value || '';
  let prepared = null;
  let working = null;
  const img = h('img', { alt: '', onerror: () => { if (img.src.startsWith(SITE)) img.src = RAW + path; } });
  const empty = h('div', { class: 'image-empty' }, icon('upload'), h('span', {}, 'Trascina qui una foto'));
  const note = h('p', { class: 'hint' });
  const preview = h('div', { class: 'image-preview' }, img, empty);
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: () => input.files[0] && pick(input.files[0]) });
  const choose = h('button', { type: 'button', class: 'btn small', onclick: () => input.click() }, icon('upload'), h('span', {}, 'Carica'));
  const library = h('button', {
    type: 'button', class: 'btn small',
    onclick: async () => {
      const chosen = await pickFromLibrary();
      if (!chosen) return;
      path = chosen;
      prepared = null;
      note.textContent = '';
      draw();
      markDirty();
    },
  }, icon('images'), h('span', {}, 'Dalla libreria'));
  const remove = h('button', { type: 'button', class: 'btn small ghost', onclick: () => { path = ''; prepared = null; note.textContent = ''; draw(); markDirty(); } }, 'Rimuovi');
  dropzone(preview, (files) => pick(files[0]));

  function pick(file) {
    markDirty();
    note.textContent = 'Preparo la foto…';
    working = processImage(file).then((p) => {
      prepared = p;
      path = p.path;
      note.textContent = `${p.path.split('.').pop().toUpperCase()} · ${sizeLabel(p.blob.size)} (originale ${sizeLabel(file.size)}) · verrà caricata quando salvi`;
      draw();
    }).catch(() => { note.textContent = 'Non riesco a leggere questa immagine.'; });
    return working;
  }
  function draw() {
    img.hidden = !path;
    empty.hidden = !!path;
    if (path) img.src = prepared ? prepared.preview : mediaUrl(path);
    remove.hidden = !path;
  }
  draw();
  return {
    el: h('div', { class: 'image-field' }, preview, h('div', { class: 'row' }, choose, library, remove), note, input),
    pick,
    get: () => path,
    files: async () => {
      await working;
      return prepared ? [await toUpload(prepared)] : [];
    },
  };
}

function galleryWidget(value) {
  const items = new Map();
  const list = h('div', { class: 'gallery' });
  const files = h('input', {
    type: 'file', accept: 'image/*', multiple: true, hidden: true,
    onchange: () => { addFiles([...files.files]); files.value = ''; },
  });
  const addFiles = (chosen) => { for (const f of chosen) add({ type: 'foto' }, f); markDirty(); };

  function add(item, file) {
    const entry = { type: item.type };
    if (item.type === 'foto') {
      entry.image = imageWidget(item.immagine);
      if (file) entry.image.pick(file);
    } else {
      entry.link = h('input', { type: 'url', value: item.link || '', placeholder: 'Link YouTube o Vimeo' });
    }
    entry.caption = h('input', { type: 'text', value: item.didascalia || '', placeholder: 'Didascalia (facoltativa)' });
    entry.format = h('select', { class: 'compact', title: 'Larghezza sul sito' },
      h('option', { value: 'intera', selected: item.formato !== 'meta' }, 'Tutta larghezza'),
      h('option', { value: 'meta', selected: item.formato === 'meta' }, 'Metà'));
    const el = h('div', { class: 'gallery-item sort-item' },
      h('div', { class: 'gallery-head' },
        grip(),
        icon(item.type === 'foto' ? 'image' : 'video'),
        h('strong', {}, item.type === 'foto' ? 'Foto' : 'Video'),
        h('span', { class: 'grow' }),
        entry.format,
        h('button', { type: 'button', class: 'icon-btn danger', title: 'Elimina', onclick: () => { items.delete(el); el.remove(); markDirty(); } }, icon('trash'))),
      entry.image ? entry.image.el : entry.link,
      entry.caption);
    items.set(el, entry);
    list.append(el);
  }

  for (const item of value || []) add(item);
  sortable(list, markDirty);
  const zone = h('div', { class: 'gallery-zone' },
    list,
    h('div', { class: 'gallery-drop' },
      icon('upload'),
      h('span', {}, 'Trascina qui le foto, anche tante insieme'),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn small', onclick: () => files.click() }, icon('plus'), 'Aggiungi foto'),
        h('button', {
          type: 'button', class: 'btn small',
          onclick: async () => { const p = await pickFromLibrary(); if (p) { add({ type: 'foto', immagine: p }); markDirty(); } },
        }, icon('images'), 'Dalla libreria'),
        h('button', { type: 'button', class: 'btn small', onclick: () => { add({ type: 'video' }); markDirty(); } }, icon('plus'), 'Aggiungi video'))),
    files);
  dropzone(zone, addFiles);

  const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => !isEmpty(v)));
  const ordered = () => [...list.children].map((el) => items.get(el)).filter(Boolean);
  return {
    el: zone,
    get: () => ordered()
      .map((i) => clean({
        type: i.type,
        immagine: i.image?.get(),
        link: i.link?.value.trim(),
        didascalia: i.caption.value.trim(),
        formato: i.format.value === 'meta' ? 'meta' : undefined,
      }))
      .filter((i) => i.immagine || i.link),
    files: async () => (await Promise.all(ordered().filter((i) => i.image).map((i) => i.image.files()))).flat(),
  };
}

// Lista ordinata di elementi di un'altra sezione (es. i progetti da mostrare in home).
async function relationListWidget(field, value) {
  const coll = findCollection(field.collection);
  const entries = sortEntries(coll, await loadCollection(coll));
  const bySlug = Object.fromEntries(entries.map((e) => [e.slug, e]));
  const list = h('div', { class: 'pick-list' });
  const select = h('select', { onchange: () => { if (select.value) { add(select.value); markDirty(); } } });

  function add(slug) {
    const e = bySlug[slug];
    const el = h('div', { class: 'pick-item sort-item', 'data-slug': slug },
      grip(),
      thumb(e?.data[coll.thumb]),
      h('span', { class: 'row-text' },
        h('strong', {}, e?.data.title || slug),
        h('small', {}, !e ? 'Progetto non più esistente' : isDraft(e) ? 'Bozza: non compare finché non lo pubblichi' : '')),
      h('button', { type: 'button', class: 'icon-btn danger', title: 'Togli dalla home', onclick: () => { el.remove(); refresh(); markDirty(); } }, icon('x')));
    list.append(el);
    refresh();
  }
  function refresh() {
    const chosen = new Set([...list.children].map((el) => el.dataset.slug));
    select.replaceChildren(
      h('option', { value: '' }, '+ Aggiungi un progetto…'),
      entries.filter((e) => !chosen.has(e.slug)).map((e) => h('option', { value: e.slug }, e.data.title || e.slug)));
  }
  for (const slug of value || []) add(slug);
  refresh();
  sortable(list, markDirty);
  return { el: h('div', {}, list, select), get: () => [...list.children].map((el) => el.dataset.slug) };
}

async function buildForm(fields, entry, extra = []) {
  const widgets = [];
  const el = h('div', { class: 'form', oninput: markDirty, onchange: markDirty });
  let group = null;
  for (const field of [...fields, ...extra]) {
    const value = field.name === 'body' ? entry.body : entry.data[field.name];
    const w = await widget(field, value);
    widgets.push([field, w]);
    if (!w.el) continue;
    if (field.group && field.group !== group) {
      group = field.group;
      el.append(h('h3', { class: 'form-group' }, group));
    }
    el.append(w.inline
      ? h('div', { class: 'field' }, w.el, field.hint && h('p', { class: 'hint' }, field.hint))
      : h('div', { class: 'field' },
        h('label', { class: 'label' }, field.label, field.required && h('span', { class: 'req' }, ' *')),
        w.el,
        field.hint && h('p', { class: 'hint' }, field.hint)));
  }

  // Raccoglie i valori, controlla i campi obbligatori e prepara le immagini nuove da caricare.
  async function collect() {
    const data = {};
    const virtual = {};
    let body = entry.body || '';
    for (const [field, w] of widgets) {
      const v = w.get();
      if (field.required && isEmpty(v)) throw new Error(`Manca “${field.label}”.`);
      if (field.virtual) virtual[field.name] = v;
      else if (field.name === 'body') body = v;
      else if (!isEmpty(v)) data[field.name] = v;
    }
    for (const [k, v] of Object.entries(entry.data)) {
      if (![...fields, ...extra].some((f) => f.name === k)) data[k] = v;
    }
    const uploads = (await Promise.all(widgets.filter(([, w]) => w.files).map(([, w]) => w.files()))).flat();
    return { data, body, uploads, virtual };
  }

  return { el, collect };
}

// ─── Struttura della pagina ─────────────────────────────────

function navLink(href, label, iconName) {
  const active = location.hash === href || location.hash.startsWith(`${href}/`) || (href === '#/' && !location.hash);
  return h('a', { href, class: active ? 'nav-link active' : 'nav-link' }, icon(iconName), h('span', {}, label));
}

function navGroup(key, title, links) {
  const open = read(`cms.nav.${key}`) !== 'closed';
  const body = h('div', { class: 'nav-items', hidden: !open }, links);
  const toggle = h('button', {
    type: 'button', class: 'nav-group',
    onclick: () => {
      body.hidden = !body.hidden;
      write(`cms.nav.${key}`, body.hidden ? 'closed' : null);
      toggle.replaceChildren(h('span', {}, title), icon(body.hidden ? 'right' : 'down'));
    },
  }, h('span', {}, title), icon(open ? 'down' : 'right'));
  return h('div', {}, toggle, body);
}

function shell(crumbs, content) {
  const sidebar = h('aside', { class: 'sidebar' },
    h('div', { class: 'brand' },
      h('span', { class: 'logo' }, BRAND[0]),
      h('div', {}, h('strong', {}, BRAND), h('small', {}, 'CMS'))),
    h('nav', { class: 'nav' },
      navGroup('generale', 'Generale', [navLink('#/', 'Dashboard', 'gauge')]),
      navGroup('contenuti', 'Contenuti', [
        ...collections.map((c) => navLink(`#/c/${c.name}`, c.label, c.icon)),
        navLink('#/immagini', 'Libreria immagini', 'images'),
      ]),
      navGroup('pagine', 'Pagine', pages.map((p) => navLink(`#/p/${p.name}`, p.label, p.icon))),
      navGroup('sistema', 'Sistema', settings.map((p) => navLink(`#/p/${p.name}`, p.label, p.icon)))),
    h('div', { class: 'me' },
      h('span', { class: 'avatar' }, (state.email || '?')[0].toUpperCase()),
      h('div', { class: 'me-text' }, h('strong', {}, (state.email || '').split('@')[0]), h('small', {}, state.email || '')),
      h('button', { type: 'button', class: 'icon-btn', title: 'Esci', onclick: () => logout() }, icon('logout'))));

  const topbar = h('header', { class: 'topbar' },
    h('button', { type: 'button', class: 'icon-btn menu', title: 'Menu', onclick: () => document.body.classList.toggle('nav-open') }, icon('menu')),
    h('nav', { class: 'crumbs' },
      h('a', { href: '#/', title: 'Dashboard' }, icon('home')),
      crumbs.map(([label, href]) => [icon('right'), href ? h('a', { href }, label) : h('span', {}, label)])),
    h('span', { class: 'grow' }),
    sitePill(),
    h('a', { href: SITE, target: '_blank', rel: 'noopener', class: 'top-link' }, icon('external'), h('span', {}, 'Vai al sito')));

  const flash = state.flash && h('div', { class: `banner ${state.flash.type}` }, icon(state.flash.type === 'ok' ? 'ok' : 'alert'), h('span', {}, state.flash.text));
  state.flash = null;

  document.body.classList.remove('nav-open');
  app.replaceChildren(h('div', { class: 'layout' },
    sidebar,
    h('div', { class: 'scrim', onclick: () => document.body.classList.remove('nav-open') }),
    h('div', { class: 'content' }, topbar, h('main', { class: 'main' }, flash, content))));
}

const loading = () => h('p', { class: 'muted loading' }, 'Caricamento…');

function pageHead(title, sub, ...actions) {
  return h('div', { class: 'page-head' },
    h('div', {}, h('h1', {}, title), sub && h('p', { class: 'muted' }, sub)),
    h('div', { class: 'actions' }, actions));
}

function thumb(path) {
  if (!path) return h('span', { class: 'thumb empty' }, icon('image'));
  const img = h('img', { class: 'thumb', src: mediaUrl(path), alt: '', loading: 'lazy' });
  img.onerror = () => { if (img.src.startsWith(SITE)) img.src = RAW + path; };
  return img;
}

const chip = (text, tone) => h('span', { class: `chip ${tone || ''}` }, text);

// ─── Statistiche delle visite al sito ──────────────────────

const countryNames = new Intl.DisplayNames(['it'], { type: 'region' });
const flag = (code) => (/^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '🌐');
const shortDate = (day) => new Date(`${day}T12:00:00`).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

function niceMax(n) {
  const p = 10 ** Math.floor(Math.log10(Math.max(1, n)));
  return [1, 2, 5, 10].map((m) => m * p).find((v) => v >= n) || 10 * p;
}

// Grafico a barre delle visite giorno per giorno, con il dettaglio passando sopra a ogni barra.
function visitsChart(days) {
  const W = 720;
  const H = 220;
  const pad = { l: 36, r: 8, t: 12, b: 26 };
  const top = niceMax(Math.max(...days.map((d) => d.views)));
  const plotH = H - pad.t - pad.b;
  const step = (W - pad.l - pad.r) / days.length;
  const y = (v) => pad.t + plotH - (v / top) * plotH;
  const tip = h('div', { class: 'chart-tip', hidden: true });
  const chart = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'chart', role: 'img', 'aria-label': `Visite al giorno: ${days.map((d) => `${shortDate(d.day)} ${d.views}`).join(', ')}` });

  for (const v of [0, top / 2, top]) {
    chart.append(
      svg('line', { x1: pad.l, x2: W - pad.r, y1: y(v), y2: y(v), class: v ? 'grid' : 'axis' }),
      svg('text', { x: pad.l - 8, y: y(v) + 4, 'text-anchor': 'end', class: 'tick' }, String(v)));
  }
  const labelAt = new Set([0, Math.floor((days.length - 1) / 2), days.length - 1]);
  days.forEach((d, i) => {
    const x = pad.l + i * step + 1;
    const w = Math.max(1, step - 2);
    const bh = (d.views / top) * plotH;
    const base = pad.t + plotH;
    if (bh > 0) {
      const r = Math.min(4, w / 2, bh);
      chart.append(svg('path', {
        class: 'bar',
        d: `M${x},${base} V${base - bh + r} Q${x},${base - bh} ${x + r},${base - bh} H${x + w - r} Q${x + w},${base - bh} ${x + w},${base - bh + r} V${base} Z`,
      }));
    }
    if (labelAt.has(i)) chart.append(svg('text', { x: x + w / 2, y: H - 6, 'text-anchor': i === 0 ? 'start' : i === days.length - 1 ? 'end' : 'middle', class: 'tick' }, shortDate(d.day)));
    chart.append(svg('rect', {
      x: pad.l + i * step, y: pad.t, width: step, height: plotH, class: 'hit',
      onmouseenter: () => {
        tip.hidden = false;
        tip.replaceChildren(h('strong', {}, new Date(`${d.day}T12:00:00`).toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'long' })),
          h('span', {}, `${d.views} visite · ${d.visitors} visitatori`));
        tip.style.left = `${((x + w / 2) / W) * 100}%`;
      },
      onmouseleave: () => { tip.hidden = true; },
    }));
  });
  return h('div', { class: 'chart-wrap' }, chart, tip);
}

// Classifica orizzontale (nazioni, pagine, provenienza…).
function rankList(title, rows, label) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  return h('div', { class: 'rank' },
    h('h3', {}, title),
    rows.length
      ? h('ul', {}, rows.map((r) => h('li', {},
        h('div', { class: 'rank-row' }, h('span', { class: 'rank-label' }, label(r)), h('strong', {}, r.views.toLocaleString('it-IT'))),
        h('span', { class: 'rank-bar' }, h('span', { style: `width:${(r.views / max) * 100}%` })))))
      : h('p', { class: 'muted small' }, 'Ancora nessun dato.'));
}

function statsPanel() {
  const period = h('select', { class: 'compact' }, [7, 30, 90].map((d) => h('option', { value: d, selected: d === Number(read('cms.stats.days') || 30) }, `Ultimi ${d} giorni`)));
  const body = h('div', { class: 'stats-body' }, loading());

  async function load() {
    write('cms.stats.days', period.value);
    body.replaceChildren(loading());
    try {
      const s = await request(`/stats?days=${period.value}`);
      // Riempie i giorni senza visite, così il grafico non ha buchi.
      const byDay = Object.fromEntries(s.days.map((d) => [d.day, d]));
      const days = [];
      for (let i = Number(period.value) - 1; i >= 0; i--) {
        const day = new Date(Date.now() - i * 86400000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
        days.push(byDay[day] || { day, views: 0, visitors: 0 });
      }
      body.replaceChildren(
        h('div', { class: 'kpis' },
          h('div', {}, h('strong', {}, s.total.views.toLocaleString('it-IT')), h('span', {}, 'Visite')),
          h('div', {}, h('strong', {}, s.total.visitors.toLocaleString('it-IT')), h('span', {}, 'Visitatori unici'))),
        visitsChart(days),
        h('div', { class: 'ranks' },
          rankList('Nazioni', s.countries, (r) => [h('span', { class: 'flag' }, flag(r.country)), r.country ? countryNames.of(r.country) : 'Sconosciuta']),
          rankList('Pagine più viste', s.pages, (r) => r.path),
          rankList('Da dove arrivano', s.refs, (r) => r.ref || 'Link diretto o app'),
          rankList('Dispositivi', s.devices, (r) => r.device)));
    } catch (e) {
      body.replaceChildren(h('p', { class: 'empty-state' }, e.status === 503
        ? 'Le statistiche non sono ancora attive: manca il database su Cloudflare.'
        : e.message));
    }
  }

  period.addEventListener('input', load);
  load();
  return h('section', { class: 'panel stats-panel' },
    h('div', { class: 'panel-head' },
      h('div', {}, h('h2', {}, 'Visite al sito'), h('p', { class: 'muted' }, 'Solo il sito pubblico, il pannello non conta. Senza cookie.')),
      period),
    body);
}

// ─── Schermate ──────────────────────────────────────────────

function showLogin(message, type = 'error') {
  const email = h('input', { type: 'email', id: 'email', required: true, autocomplete: 'email', placeholder: 'nome@email.com', value: read('cms.last-email') || '' });
  const button = h('button', { class: 'btn primary wide' }, icon('send'), h('span', {}, 'Invia magic link'));
  const banner = h('div', { class: 'banner', hidden: true });
  const say = (text, kind) => {
    banner.className = `banner ${kind}`;
    banner.replaceChildren(icon(kind === 'ok' ? 'ok' : 'alert'), h('span', {}, text));
    banner.hidden = !text;
  };

  // Pulsante "Accedi con Google" (lo disegna Google: compare quando il suo script è caricato).
  const googleBox = h('div', { class: 'google-box' });
  let tries = 0;
  const drawGoogle = () => {
    if (!window.google?.accounts?.id) {
      if (tries++ < 50) setTimeout(drawGoogle, 200);
      return;
    }
    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: ({ credential }) => {
        say('Accesso in corso…', 'info');
        signIn('/google', { credential }).catch((e) => say(e.message, 'error'));
      },
    });
    google.accounts.id.renderButton(googleBox, {
      theme: 'outline', size: 'large', shape: 'pill', text: 'signin_with', locale: 'it', width: googleBox.clientWidth || 320,
    });
  };

  const form = h('form', {
    class: 'login-card',
    onsubmit: async (e) => {
      e.preventDefault();
      button.disabled = true;
      say('Invio in corso…', 'info');
      write('cms.last-email', email.value.trim());
      const res = await fetch(`${API}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), back: location.origin + location.pathname }),
      }).catch(() => null);
      const out = res ? await res.json().catch(() => ({})) : {};
      button.disabled = false;
      if (res?.ok) say('Fatto! Controlla la posta (guarda anche nello spam) e clicca il link.', 'ok');
      else say(out.error || 'Non riesco a contattare il server. Riprova tra poco.', 'error');
    },
  },
  googleBox,
  h('div', { class: 'or' }, h('span', {}, 'oppure')),
  h('label', { class: 'label', for: 'email' }, 'Email'),
  h('div', { class: 'input-icon' }, icon('mail'), email),
  button,
  h('p', { class: 'login-note' }, icon('shield'), h('span', {}, 'Accesso protetto via link monouso (valido 15 minuti)')));

  app.replaceChildren(h('div', { class: 'login' },
    h('div', { class: 'login-brand' },
      h('span', { class: 'logo big' }, BRAND[0]),
      h('h1', {}, `${BRAND} CMS`),
      h('p', { class: 'muted' }, 'Accesso al pannello di amministrazione')),
    banner,
    form,
    h('p', { class: 'login-foot' }, `© ${new Date().getFullYear()} ${BRAND.toLowerCase()} · CMS`)));
  if (message) say(message, type);
  drawGoogle();
}

async function dashboard() {
  shell([['Dashboard']], loading());
  const progettiColl = findCollection('progetti');
  const [progetti, categorie, clienti, home, commits] = await Promise.all([
    loadCollection(progettiColl),
    loadCollection(findCollection('categorie')),
    loadCollection(findCollection('clienti')),
    homeSlugs(),
    api('/commits?per_page=6').catch(() => []),
  ]);
  const titles = await relationTitles(progettiColl);
  const stat = (n, label, href, iconName, tone) => h('a', { href, class: 'stat' },
    h('div', { class: 'stat-top' }, h('span', { class: `stat-icon ${tone}` }, icon(iconName)), icon('right')),
    h('strong', {}, n.toLocaleString('it-IT')),
    h('span', {}, label));
  const active = progetti.filter((p) => !isDraft(p));
  const recent = [...progetti].sort((a, b) => (b.data.anno || 0) - (a.data.anno || 0)).slice(0, 5);

  shell([['Dashboard']], h('div', {},
    pageHead('Dashboard', 'Panoramica dei contenuti del portfolio'),
    h('div', { class: 'stats' },
      stat(active.length, 'Progetti attivi', '#/c/progetti', 'folder', 'brand'),
      stat(progetti.length - active.length, 'Bozze', '#/c/progetti', 'edit', 'amber'),
      stat(home.length, 'Progetti in home', '#/p/home', 'star', 'rose'),
      stat(categorie.length, 'Categorie', '#/c/categorie', 'tag', 'blue'),
      stat(clienti.length, 'Clienti', '#/c/clienti', 'briefcase', 'violet')),
    statsPanel(),
    h('div', { class: 'panels' },
      h('section', { class: 'panel' },
        h('div', { class: 'panel-head' },
          h('div', {}, h('h2', {}, 'Ultimi progetti'), h('p', { class: 'muted' }, 'I più recenti per anno')),
          h('a', { href: '#/c/progetti' }, 'Tutti')),
        recent.length
          ? h('ul', { class: 'rows' }, recent.map((e) => h('li', {}, h('a', { href: `#/c/progetti/${e.slug}` },
            thumb(e.data.copertina),
            h('span', { class: 'row-text' }, h('strong', {}, e.data.title || e.slug), h('small', {}, subtitle(progettiColl, e, titles))),
            isDraft(e) && chip('Bozza', 'amber')))))
          : h('p', { class: 'empty-state' }, 'Nessun progetto ancora.')),
      h('section', { class: 'panel' },
        h('div', { class: 'panel-head' },
          h('div', {}, h('h2', {}, 'Ultime modifiche'), h('p', { class: 'muted' }, 'Ogni salvataggio va online in 1–2 minuti')),
          sitePill()),
        commits?.length
          ? h('ul', { class: 'rows' }, commits.map((c) => h('li', {}, h('div', { class: 'row-plain' },
            h('span', { class: 'thumb empty' }, icon('clock')),
            h('span', { class: 'row-text' }, h('strong', {}, c.commit.message.split('\n')[0]), h('small', {}, timeAgo(c.commit.author.date)))))))
          : h('p', { class: 'empty-state' }, 'Nessuna modifica recente.')))));
}

async function listView(coll) {
  shell([[coll.label]], loading());
  const entries = sortEntries(coll, await loadCollection(coll));
  const titles = await relationTitles(coll);
  const home = coll.home ? await homeSlugs() : [];
  const counts = {};
  if (coll.count) {
    for (const e of await loadCollection(findCollection(coll.count.collection))) {
      const key = e.data[coll.count.field];
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  let saved = {};
  try { saved = JSON.parse(read(`cms.filters.${coll.name}`) || '{}'); } catch {}
  const search = h('input', { type: 'text', placeholder: 'Cerca…', value: saved.q || '' });
  const selects = (coll.filters || []).map((name) => {
    const field = coll.fields.find((f) => f.name === name);
    const options = Object.entries(titles[name] || {}).sort((a, b) => a[1].localeCompare(b[1], 'it'));
    return [name, h('select', { class: 'compact' },
      h('option', { value: '' }, `Ogni ${field.label.toLowerCase()}`),
      options.map(([slug, title]) => h('option', { value: slug, selected: saved[name] === slug }, title)))];
  });
  const stato = coll.fields.some((f) => f.type === 'publish') && h('select', { class: 'compact' },
    [['', 'Tutti gli stati'], ['on', 'Pubblicati'], ['off', 'Bozze']].map(([v, l]) => h('option', { value: v, selected: saved.stato === v }, l)));

  const list = h('div', { class: 'rows sort-list' });
  const hint = h('p', { class: 'hint list-hint' });
  const status = h('span', { class: 'status' });
  const saveOrder = h('button', { type: 'button', class: 'btn primary' }, h('span', {}, 'Salva ordine'));
  const cancelOrder = h('button', { type: 'button', class: 'btn ghost', onclick: () => draw() }, 'Annulla');
  const orderBar = h('div', { class: 'savebar', hidden: true }, status, h('span', { class: 'grow' }), cancelOrder, saveOrder);

  const current = () => ({
    q: search.value.trim().toLowerCase(),
    ...Object.fromEntries(selects.map(([name, s]) => [name, s.value])),
    stato: stato ? stato.value : '',
  });

  function draw() {
    const f = current();
    write(`cms.filters.${coll.name}`, JSON.stringify(f));
    const shown = entries.filter((e) => (!f.q || (e.data.title || e.slug).toLowerCase().includes(f.q))
      && selects.every(([name]) => !f[name] || e.data[name] === f[name])
      && (!f.stato || (f.stato === 'off') === isDraft(e)));
    // Si riordina tutta la lista, oppure (per i progetti) dentro la categoria scelta nel filtro.
    const groupField = coll.orderWithin && coll.fields.find((x) => x.name === coll.orderWithin);
    const canOrder = !!coll.orderField && !f.q && !f.stato
      && selects.every(([name]) => name === coll.orderWithin || !f[name])
      && (!coll.orderWithin || !!f[coll.orderWithin]);
    hint.textContent = !coll.orderField ? ''
      : canOrder ? 'Trascina le righe dalla maniglia ⋮⋮ per decidere l’ordine in cui compaiono sul sito.'
        : groupField ? `Per decidere l’ordine dei progetti scegli una ${groupField.label.toLowerCase()} qui sopra (senza altri filtri).` : '';
    orderBar.hidden = true;
    list.replaceChildren(...(shown.length
      ? shown.map((e) => h('div', { class: 'sort-item list-row', 'data-slug': e.slug },
        canOrder && grip(),
        h('a', { href: `#/c/${coll.name}/${e.slug}` },
          coll.thumb ? thumb(e.data[coll.thumb]) : null,
          h('span', { class: 'row-text' },
            h('strong', {}, e.data.title || e.slug),
            h('small', {}, [subtitle(coll, e, titles), coll.count && `${counts[e.slug] || 0} progetti`].filter(Boolean).join(' · '))),
          h('span', { class: 'chips' }, isDraft(e) && chip('Bozza', 'amber'), home.includes(e.slug) && chip('In home', 'rose')),
          icon('right'))))
      : [h('p', { class: 'empty-state' }, entries.length ? 'Nessun risultato con questi filtri.' : `Ancora nessun ${coll.singular}. Clicca “Aggiungi” per crearne uno.`)]));
  }

  sortable(list, () => { orderBar.hidden = false; status.textContent = 'Ordine cambiato, non ancora salvato.'; });
  saveOrder.onclick = async () => {
    saveOrder.disabled = true;
    status.textContent = 'Salvataggio…';
    const changes = [];
    [...list.children].forEach((el, i) => {
      const e = entries.find((x) => x.slug === el.dataset.slug);
      if (e.data[coll.orderField] === i + 1) return;
      e.data = { ...e.data, [coll.orderField]: i + 1 };
      changes.push({ path: e.path, text: serialize(coll, e.data, e.body) });
    });
    try {
      if (changes.length) await commit(changes, `Riordina ${coll.label.toLowerCase()}`);
      state.flash = { type: 'ok', text: 'Ordine salvato! Sul sito tra 1–2 minuti.' };
      route();
    } catch (e) {
      status.textContent = e.message;
      saveOrder.disabled = false;
    }
  };

  for (const el of [search, ...selects.map(([, s]) => s), stato].filter(Boolean)) el.addEventListener('input', draw);
  shell([[coll.label]], h('div', {},
    pageHead(coll.label, `${entries.length} ${entries.length === 1 ? 'elemento' : 'elementi'}`,
      h('a', { class: 'btn primary', href: `#/c/${coll.name}/nuovo` }, icon('plus'), h('span', {}, 'Aggiungi'))),
    h('div', { class: 'toolbar' },
      h('div', { class: 'input-icon search' }, icon('search'), search),
      selects.map(([, s]) => s),
      stato),
    hint,
    h('section', { class: 'panel' }, list),
    orderBar));
  draw();
}

async function collectionEditor(coll, slug) {
  const isNew = slug === 'nuovo';
  shell([[coll.label, `#/c/${coll.name}`], ['…']], loading());
  const entries = await loadCollection(coll);
  let entry;
  if (isNew) {
    const base = state.duplicate?.coll === coll.name ? state.duplicate : null;
    state.duplicate = null;
    entry = base
      ? { data: { ...clone(base.data), title: `${base.data.title} (copia)`, published: false }, body: base.body }
      : { data: Object.fromEntries(coll.fields.filter((f) => f.default !== undefined).map((f) => [f.name, f.default])), body: '' };
  } else {
    entry = entries.find((e) => e.slug === slug);
  }
  if (!entry) return shell([[coll.label, `#/c/${coll.name}`]], h('p', { class: 'muted' }, 'Elemento non trovato.'));

  const homePage = coll.home && findPage('home');
  const home = coll.home ? await homeSlugs() : [];
  const extra = coll.home ? [{ name: '_home', label: 'Mostra in home', type: 'boolean', virtual: true, hint: 'L’ordine dei progetti in home si decide in Pagine → Home.' }] : [];
  const form = { ...entry, data: { ...entry.data, _home: !isNew && home.includes(slug) } };
  const title = isNew ? `Nuovo ${coll.singular}` : entry.data.title || slug;

  await editor({
    schema: coll,
    entry: form,
    extra,
    crumbs: [[coll.label, `#/c/${coll.name}`], [title]],
    title,
    chips: [!isNew && isDraft(entry) && chip('Bozza', 'amber'), !isNew && home.includes(slug) && chip('In home', 'rose')],
    back: `#/c/${coll.name}`,
    view: !isNew && !isDraft(entry) && siteUrl(coll, slug),
    duplicate: !isNew && coll.name === 'progetti' && (() => {
      state.duplicate = { coll: coll.name, data: entry.data, body: entry.body };
      location.hash = `#/c/${coll.name}/nuovo`;
    }),
    async save({ data, body, uploads, virtual }) {
      const newSlug = isNew ? slugify(data.title || '') : slug;
      if (isNew) {
        if (!newSlug) throw new Error('Scrivi un titolo.');
        if (entries.some((e) => e.slug === newSlug)) throw new Error('Esiste già un elemento con questo titolo.');
        // Il nuovo elemento va in fondo (alla sua categoria, per i progetti).
        if (coll.orderField) {
          const same = entries.filter((e) => !coll.orderWithin || e.data[coll.orderWithin] === data[coll.orderWithin]);
          data[coll.orderField] = Math.max(0, ...same.map((e) => Number(e.data[coll.orderField]) || 0)) + 1;
        }
      }
      const path = isNew ? `${coll.folder}/${newSlug}.md` : entry.path;
      const changes = [...uploads, { path, text: serialize(coll, data, body) }];
      if (coll.home && virtual._home !== home.includes(newSlug)) {
        const page = await loadPage(homePage);
        page.data = { ...page.data, [coll.home.field]: virtual._home ? [...home, newSlug] : home.filter((s) => s !== newSlug) };
        changes.push({ path: homePage.file, text: serialize(homePage, page.data, page.body) });
      }
      await commit(changes, `${isNew ? 'Aggiunge' : 'Aggiorna'} ${coll.singular} “${data.title}”`);
      if (isNew) entries.push({ slug: newSlug, path, data, body });
      else Object.assign(entry, { data, body });
      return {
        go: isNew ? `#/c/${coll.name}/${newSlug}` : null,
        message: data.published === false ? 'Salvato come bozza: non è visibile sul sito.' : null,
      };
    },
    remove: !isNew && (async () => {
      const used = coll.count ? (await loadCollection(findCollection(coll.count.collection))).filter((e) => e.data[coll.count.field] === slug) : [];
      if (used.length && !confirm(`Attenzione: “${title}” è usato da ${used.length} progetti. Eliminarlo lo stesso?`)) return false;
      if (!used.length && !confirm(`Vuoi eliminare “${title}”? Non si può annullare.`)) return false;
      const changes = [{ path: entry.path, remove: true }];
      if (coll.home && home.includes(slug)) {
        const page = await loadPage(homePage);
        page.data = { ...page.data, [coll.home.field]: home.filter((s) => s !== slug) };
        changes.push({ path: homePage.file, text: serialize(homePage, page.data, page.body) });
      }
      await commit(changes, `Elimina ${coll.singular} “${title}”`);
      entries.splice(entries.indexOf(entry), 1);
      return true;
    }),
  });
}

async function pageEditor(page) {
  shell([[page.label]], loading());
  const entry = await loadPage(page);
  await editor({
    schema: page,
    entry,
    crumbs: [[page.label]],
    title: page.label,
    intro: page.intro,
    view: page.url && SITE + page.url,
    async save({ data, body, uploads }) {
      await commit([...uploads, { path: page.file, text: serialize(page, data, body) }], `Aggiorna ${page.label}`);
      Object.assign(entry, { data, body });
      return {};
    },
  });
}

async function editor({ schema, entry, extra, crumbs, title, chips, intro, back, view, duplicate, save, remove }) {
  const form = await buildForm(schema.fields, entry, extra);
  const status = h('span', { class: 'status' });
  const saveBtn = h('button', { type: 'button', class: 'btn primary' }, h('span', {}, 'Salva'));
  const deleteBtn = remove && h('button', { type: 'button', class: 'btn ghost danger' }, icon('trash'), h('span', {}, 'Elimina'));
  const busy = (on) => { saveBtn.disabled = on; if (deleteBtn) deleteBtn.disabled = on; };
  const show = (text, kind) => { status.className = `status ${kind || ''}`; status.textContent = text; };

  saveBtn.onclick = async () => {
    busy(true);
    show('Salvataggio…');
    try {
      const out = await save(await form.collect());
      state.dirty = false;
      state.flash = { type: 'ok', text: out.message || 'Salvato! Le modifiche saranno sul sito tra 1–2 minuti.' };
      if (out.go) location.hash = out.go;
      else route();
    } catch (e) {
      show(e.message, 'error');
      busy(false);
    }
  };

  if (deleteBtn) {
    deleteBtn.onclick = async () => {
      busy(true);
      show('Eliminazione…');
      try {
        if (!(await remove())) {
          show('');
          busy(false);
          return;
        }
        state.dirty = false;
        state.flash = { type: 'ok', text: `“${title}” eliminato.` };
        location.hash = back;
      } catch (e) {
        show(e.message, 'error');
        busy(false);
      }
    };
  }

  shell(crumbs, h('div', { class: 'editor' },
    h('div', { class: 'page-head' },
      h('div', {}, h('div', { class: 'title-row' }, h('h1', {}, title), chips), intro && h('p', { class: 'muted' }, intro)),
      h('div', { class: 'actions' },
        back && h('a', { class: 'btn ghost', href: back }, icon('back'), h('span', {}, 'Indietro')),
        duplicate && h('button', { type: 'button', class: 'btn', onclick: duplicate }, icon('copy'), h('span', {}, 'Duplica')),
        view && h('a', { class: 'btn', href: view, target: '_blank', rel: 'noopener' }, icon('external'), h('span', {}, 'Vedi sul sito')))),
    h('section', { class: 'panel padded' }, form.el),
    h('div', { class: 'savebar' }, status, h('span', { class: 'grow' }), deleteBtn, saveBtn)));
}

async function libraryView() {
  shell([['Libreria immagini']], loading());
  const [files, usedIn] = await Promise.all([loadLibrary(), usageIndex()]);
  const filter = h('select', { class: 'compact' }, h('option', { value: '' }, 'Tutte le immagini'), h('option', { value: 'unused' }, 'Solo quelle non usate'));
  const grid = h('div', { class: 'lib-grid big' });
  const status = h('span', { class: 'status' });
  const input = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true, onchange: () => upload([...input.files]) });

  async function upload(chosen) {
    if (!chosen.length) return;
    status.textContent = `Preparo ${chosen.length} foto…`;
    try {
      const prepared = await Promise.all(chosen.map(processImage));
      status.textContent = 'Caricamento…';
      await commit(await Promise.all(prepared.map(toUpload)), `Carica ${chosen.length} immagini nella libreria`);
      state.flash = { type: 'ok', text: `${chosen.length === 1 ? 'Immagine caricata' : `${chosen.length} immagini caricate`}. Saranno visibili tra 1–2 minuti.` };
      route();
    } catch (e) {
      status.textContent = e.message;
    }
  }

  function draw() {
    const shown = files.filter((f) => !filter.value || !usedIn(f.path).length);
    grid.replaceChildren(...(shown.length ? shown.map((f) => {
      const used = usedIn(f.path);
      return h('div', { class: 'lib-card' },
        libThumb(f.path),
        h('div', { class: 'lib-info' },
          h('strong', { title: f.name }, f.name),
          h('small', {}, sizeLabel(f.size)),
          used.length ? h('small', { class: 'used', title: used.join('\n') }, `Usata in: ${used.join(', ')}`) : chip('Non usata', 'amber')),
        !used.length && h('button', {
          type: 'button', class: 'icon-btn danger', title: 'Elimina',
          onclick: async () => {
            if (!confirm(`Eliminare ${f.name}?`)) return;
            status.textContent = 'Eliminazione…';
            try {
              await commit([{ path: f.path, remove: true }], `Elimina immagine ${f.name}`);
              files.splice(files.indexOf(f), 1);
              status.textContent = '';
              draw();
            } catch (e) {
              status.textContent = e.message;
            }
          },
        }, icon('trash')));
    }) : [h('p', { class: 'empty-state' }, 'Nessuna immagine.')]));
  }

  filter.addEventListener('input', draw);
  const zone = h('section', { class: 'panel padded' }, grid);
  dropzone(zone, upload);
  shell([['Libreria immagini']], h('div', {},
    pageHead('Libreria immagini', `${files.length} immagini · trascina qui le foto per caricarle`,
      h('button', { type: 'button', class: 'btn primary', onclick: () => input.click() }, icon('upload'), h('span', {}, 'Carica foto'))),
    h('div', { class: 'toolbar' }, filter, status),
    zone,
    input));
  draw();
}

// ─── Navigazione ────────────────────────────────────────────

async function route() {
  if (!state.session) return showLogin();
  const [, kind, name, slug] = location.hash.match(/^#\/(c|p)\/([^/]+)(?:\/(.+))?$/) || [];
  try {
    if (kind === 'c' && findCollection(name)) {
      return await (slug ? collectionEditor(findCollection(name), decodeURIComponent(slug)) : listView(findCollection(name)));
    }
    if (kind === 'p' && findPage(name)) return await pageEditor(findPage(name));
    if (location.hash === '#/immagini') return await libraryView();
    return await dashboard();
  } catch (e) {
    if (state.session) shell([['Errore']], h('div', { class: 'banner error' }, icon('alert'), h('span', {}, e.message)));
  }
}

function logout(message) {
  state.session = null;
  state.cache = {};
  state.dirty = false;
  write('cms.session', null);
  history.replaceState(null, '', location.pathname);
  currentHash = '';
  showLogin(message, 'error');
}

window.addEventListener('hashchange', () => {
  if (state.dirty && !confirm('Hai modifiche non salvate. Vuoi uscire lo stesso?')) {
    history.replaceState(null, '', currentHash || location.pathname);
    return;
  }
  state.dirty = false;
  currentHash = location.hash;
  route();
});

window.addEventListener('beforeunload', (e) => {
  if (state.dirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});

// Scambia il link della mail (o l'accesso Google) con una sessione ed entra.
async function signIn(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(() => null);
  const out = res ? await res.json().catch(() => ({})) : {};
  if (!out.session) throw new Error(out.error || 'Non riesco a contattare il server. Riprova tra poco.');
  state.session = out.session;
  state.email = out.email;
  write('cms.session', out.session);
  write('cms.email', out.email);
  state.flash = { type: 'ok', text: 'Benvenuta/o! Sei dentro.' };
  currentHash = location.hash;
  route();
  watchSite();
}

async function start() {
  const m = location.hash.match(/^#login=(.+)$/);
  if (!m) {
    currentHash = location.hash;
    if (state.session) watchSite();
    return route();
  }
  history.replaceState(null, '', location.pathname);
  app.replaceChildren(h('p', { class: 'muted loading' }, 'Accesso in corso…'));
  signIn('/login', { token: m[1] }).catch((e) => showLogin(e.message));
}

start();
