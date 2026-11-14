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
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  download: '<path d="M12 15V3"/><path d="m7 10 5 5 5-5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
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

const countryNames = new Intl.DisplayNames(['it'], { type: 'region' });
const flag = (code) => (/^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '🌐');
const COUNTRIES = ('AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ '
  + 'DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KI '
  + 'KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NR NZ OM PA PE '
  + 'PG PH PK PL PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY '
  + 'UZ VA VC VE VN VU WS XK YE ZA ZM ZW').split(' ').sort((a, b) => countryNames.of(a).localeCompare(countryNames.of(b), 'it'));
const countryLabel = (code) => `${flag(code)} ${countryNames.of(code)}`;
// Le opzioni di un campo a scelta possono essere scritte come testo semplice o come { value, label }.
const optionsOf = (field) => field.options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));

// Come mostrare il valore di un campo negli elenchi (titolo per le relazioni, nome per i paesi…).
function displayValue(field, value, titles) {
  if (isEmpty(value)) return null;
  if (field?.type === 'relation') return titles?.[field.name]?.[value] || value;
  if (field?.type === 'country') return countryLabel(value);
  if (field?.type === 'select') return optionsOf(field).find((o) => o.value === value)?.label ?? value;
  return value;
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
      const slug = f.name.replace(/\.md$/, '');
      // Un file scritto male blocca solo sé stesso: gli altri si vedono e si modificano lo stesso.
      try { return { slug, path: f.path, ...parse(coll, text) }; }
      catch (err) { return { slug, path: f.path, data: { title: slug }, body: '', error: err.message }; }
    }));
  return (state.cache[coll.name] = entries);
}

async function loadPage(page) {
  const key = `page:${page.name}`;
  if (state.cache[key]) return state.cache[key];
  const text = await readFile(page.file);
  if (text == null) return (state.cache[key] = { data: {}, body: '' });
  try { return (state.cache[key] = parse(page, text)); }
  catch (err) { return (state.cache[key] = { data: {}, body: '', error: err.message }); }
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
  return (coll.subtitle || [])
    .map((key) => {
      const v = displayValue(coll.fields.find((f) => f.name === key), entry.data[key], titles);
      if (key !== coll.orderWithin || !coll.alsoIn || v == null) return v;
      const extra = (entry.data[coll.alsoIn] || []).map((s) => titles?.[key]?.[s] || s);
      return [v, ...extra].join(' + ');
    })
    .filter((v) => v != null).join(' · ');
}

// Il progetto sta in questa categoria? Sì se è la principale o una di quelle in "Anche in".
function inGroup(coll, entry, value) {
  return entry.data[coll.orderWithin] === value || (!!coll.alsoIn && (entry.data[coll.alsoIn] || []).includes(value));
}

// Posizione del progetto dentro una categoria: "ordine" per la principale, "ordini.<categoria>" per le altre.
function groupRank(coll, entry, value) {
  const n = entry.data[coll.orderWithin] === value ? entry.data[coll.orderField] : entry.data[coll.orderMap]?.[value];
  return typeof n === 'number' ? n : Infinity;
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

// Media divisi per progetto: le foto restano tutte in assets/uploads, qui si raggruppano secondo dove sono usate.
// Un'immagine usata in due progetti compare in tutti e due.
async function mediaGroups(files) {
  const known = new Set(files.map((f) => f.path));
  const find = (text) => [...new Set(text.match(/\/assets\/uploads\/[^"'\s)\\]+/g) || [])].filter((p) => known.has(p));
  const groups = [];
  const used = new Set();
  const push = (g) => { if (g.paths.length) { g.paths.forEach((p) => used.add(p)); groups.push(g); } };
  const prog = findCollection('progetti');
  for (const e of sortEntries(prog, await loadCollection(prog))) {
    push({ key: `p:${e.slug}`, kind: 'Progetto', title: e.data.title || e.slug, href: `#/c/progetti/${e.slug}`, draft: isDraft(e), paths: find(JSON.stringify(e.data) + e.body) });
  }
  for (const coll of collections.filter((c) => c !== prog)) {
    const entries = await loadCollection(coll);
    push({ key: `c:${coll.name}`, kind: 'Sezione', title: coll.label, href: `#/c/${coll.name}`, paths: [...new Set(entries.flatMap((e) => find(JSON.stringify(e.data) + e.body)))] });
  }
  for (const page of [...pages, ...settings]) {
    const pg = await loadPage(page);
    push({ key: `g:${page.name}`, kind: 'Pagina', title: page.label, href: `#/p/${page.name}`, paths: find(JSON.stringify(pg.data) + pg.body) });
  }
  const social = await loadCollection(SOCIAL_COLL);
  push({ key: 'social', kind: 'Social', title: 'Post social', href: '#/social', paths: [...new Set(social.flatMap((e) => find(JSON.stringify(e.data))))] });
  push({ key: 'unused', kind: '', title: 'Non usate', paths: files.filter((f) => !used.has(f.path)).map((f) => f.path) });
  return groups;
}

// Finestra per scegliere un'immagine già caricata.
function pickFromLibrary() {
  return new Promise((resolve) => {
    const grid = h('div', { class: 'lib-grid' }, h('p', { class: 'muted loading' }, 'Caricamento…'));
    const pickGroup = h('select', { class: 'compact' });
    const overlay = h('div', { class: 'modal' },
      h('div', { class: 'modal-box' },
        h('div', { class: 'modal-head' }, h('h2', {}, 'Media'), h('span', { class: 'grow' }), pickGroup, h('button', { type: 'button', class: 'icon-btn', onclick: () => close(null) }, icon('x'))),
        grid));
    const close = (value) => { overlay.remove(); resolve(value); };
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(null); });
    document.body.append(overlay);
    loadLibrary().then(async (files) => {
      const groups = await mediaGroups(files);
      const byPath = Object.fromEntries(files.map((f) => [f.path, f]));
      pickGroup.replaceChildren(h('option', { value: '' }, 'Tutti i progetti'),
        ...groups.map((g) => h('option', { value: g.key, selected: read('cms.pick') === g.key }, `${g.title} (${g.paths.length})`)));
      const draw = () => {
        write('cms.pick', pickGroup.value || null);
        const shown = groups.filter((g) => !pickGroup.value || g.key === pickGroup.value);
        grid.replaceChildren(...(shown.length ? shown.flatMap((g) => [
          h('h3', { class: 'lib-group' }, g.title, h('small', {}, ` · ${g.paths.length}`)),
          ...g.paths.map((p) => h('button', { type: 'button', class: 'lib-item', onclick: () => close(p) }, libThumb(p), h('span', {}, byPath[p].name))),
        ]) : [h('p', { class: 'empty-state' }, 'Nessuna immagine caricata.')]));
      };
      pickGroup.addEventListener('input', draw);
      draw();
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
      if (list.classList.contains('grid-sort')) {
        // Griglia: l'elemento va prima o dopo quello sotto il puntatore, a seconda della metà in cui si trova.
        const over = [...list.children].find((c) => {
          if (c === item) return false;
          const r = c.getBoundingClientRect();
          return ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
        });
        if (over) {
          const r = over.getBoundingClientRect();
          const after = over.classList.contains('g-sez') ? ev.clientY > r.top + r.height / 2 : ev.clientX > r.left + r.width / 2;
          list.insertBefore(item, after ? over.nextElementSibling : over);
        }
        return;
      }
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
      const el = h('textarea', { rows: field.rows || 3, value: value ?? '', placeholder: field.placeholder || '' });
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
      const options = optionsOf(field);
      const el = h('select', {},
        field.default === undefined && h('option', { value: '' }, field.required ? 'Scegli…' : '— nessuno —'),
        options.map((o, i) => h('option', { value: i, selected: o.value === current }, o.label)));
      return { el, get: () => (el.value === '' ? undefined : options[el.value]?.value) };
    }
    case 'country': {
      const el = h('select', {},
        h('option', { value: '' }, field.required ? 'Scegli…' : '— nessuno —'),
        COUNTRIES.map((code) => h('option', { value: code, selected: code === value }, countryLabel(code))));
      return { el, get: () => el.value };
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
    case 'checklist':
      return checklistWidget(field, value);
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
  }, icon('images'), h('span', {}, 'Dai media'));
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
  const listeners = [];
  function draw() {
    img.hidden = !path;
    empty.hidden = !!path;
    if (path) img.src = prepared ? prepared.preview : mediaUrl(path);
    remove.hidden = !path;
    listeners.forEach((fn) => fn());
  }
  draw();
  return {
    el: h('div', { class: 'image-field' }, preview, h('div', { class: 'row' }, choose, library, remove), note, input),
    pick,
    src: () => (path ? (prepared ? prepared.preview : mediaUrl(path)) : ''),
    onChange: (fn) => listeners.push(fn),
    get: () => path,
    files: async () => {
      await working;
      return prepared ? [await toUpload(prepared)] : [];
    },
  };
}

// Finestra sopra la pagina (per i dettagli di un elemento della galleria).
function openSheet(title, body, onClose) {
  const done = h('button', { type: 'button', class: 'btn primary' }, h('span', {}, 'Fatto'));
  const overlay = h('div', { class: 'modal' },
    h('div', { class: 'modal-box sheet' },
      h('div', { class: 'modal-head' }, h('h2', {}, title), h('button', { type: 'button', class: 'icon-btn', title: 'Chiudi', onclick: () => close() }, icon('x'))),
      h('div', { class: 'sheet-body', oninput: markDirty, onchange: markDirty }, body),
      h('div', { class: 'sheet-foot' }, h('span', { class: 'hint' }, 'Le modifiche vanno online quando salvi il progetto.'), h('span', { class: 'grow' }), done)));
  const key = (e) => { if (e.key === 'Escape') close(); };
  function close() { overlay.remove(); document.removeEventListener('keydown', key); onClose?.(); }
  done.onclick = close;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', key);
  document.body.append(overlay);
}

// Galleria: una griglia di miniature. Si trascinano dalla maniglia per riordinarle; un clic apre la scheda
// con titolo, didascalia (italiano e inglese) e larghezza sul sito.
const FORMATI = [['intera', 'Tutta larghezza'], ['meta', 'Metà'], ['sola', 'Da sola'], ['grande', 'Grande']];

function galleryWidget(value) {
  const items = new Map();
  const list = h('div', { class: 'g-grid grid-sort' });
  const counter = h('span', { class: 'hint g-count' });
  const files = h('input', {
    type: 'file', accept: 'image/*', multiple: true, hidden: true,
    onchange: () => { addFiles([...files.files]); files.value = ''; },
  });
  const addFiles = (chosen) => { for (const f of chosen) add({ type: 'foto' }, f); markDirty(); };
  const count = () => {
    const n = items.size;
    counter.textContent = n ? `${n} ${n === 1 ? 'elemento' : 'elementi'} · trascina ⋮⋮ per riordinare, clicca per titolo e didascalia` : '';
  };
  const field = (label, input) => h('div', {}, h('label', { class: 'label' }, label), input);
  const del = (el) => h('button', {
    type: 'button', class: 'icon-btn danger g-del', title: 'Elimina',
    onclick: (e) => { e.stopPropagation(); if (!confirm('Togliere questo elemento dalla galleria?')) return; items.delete(el); el.remove(); count(); markDirty(); },
  }, icon('trash'));

  function add(item, file) {
    const entry = { type: item.type };
    const el = h('div', { class: `g-tile sort-item${item.type === 'sezione' ? ' g-sez' : ''}` });
    items.set(el, entry);
    list.append(el);

    if (item.type === 'sezione') {
      // Titolo di sezione: divide la galleria in parti, con due righe di testo.
      entry.title = h('input', { type: 'text', value: item.titolo || '', placeholder: 'Titolo della sezione' });
      entry.titleEn = h('input', { type: 'text', value: item.titolo_en || '', placeholder: 'Section title in English' });
      entry.text = h('textarea', { rows: 2, placeholder: 'Due righe su cosa hai fatto' }, item.testo || '');
      entry.textEn = h('textarea', { rows: 2, placeholder: 'Two lines on what you did' }, item.testo_en || '');
      const label = h('span', { class: 'g-sez__t' });
      const draw = () => { label.textContent = entry.title.value.trim() || 'Titolo di sezione senza nome'; };
      const open = () => openSheet('Titolo di sezione', h('div', { class: 'sheet-fields' },
        field('Titolo 🇮🇹', entry.title), field('Title 🇬🇧', entry.titleEn),
        field('Testo 🇮🇹', entry.text), field('Text 🇬🇧', entry.textEn)), draw);
      el.append(grip(), h('button', { type: 'button', class: 'g-sez__open', onclick: open }, icon('tag'), label, h('span', { class: 'g-sez__k' }, 'Sezione')), del(el));
      draw();
      count();
      if (!item.titolo) open();
      return;
    }

    if (item.type === 'foto') {
      entry.image = imageWidget(item.immagine);
      if (file) entry.image.pick(file);
    } else {
      entry.link = h('input', { type: 'url', value: item.link || '', placeholder: 'Link YouTube, Vimeo, prototipo Figma o file .mp4' });
    }
    entry.title = h('input', { type: 'text', value: item.titolo || '', placeholder: 'Facoltativo' });
    entry.titleEn = h('input', { type: 'text', value: item.titolo_en || '', placeholder: item.titolo ? `In italiano: ${item.titolo}` : 'Optional' });
    entry.caption = h('textarea', { rows: 2, placeholder: 'Una riga che spiega la foto (facoltativa)' }, item.didascalia || '');
    entry.captionEn = h('textarea', { rows: 2, placeholder: item.didascalia ? `In italiano: ${item.didascalia}` : 'Optional' }, item.didascalia_en || '');
    entry.format = item.formato && FORMATI.some(([v]) => v === item.formato) ? item.formato : 'intera';

    const media = h('span', { class: 'g-media' });
    const badge = h('span', { class: 'g-badge' });
    const cap = h('span', { class: 'g-cap' });
    const warn = h('span', { class: 'g-warn', title: 'Manca la traduzione inglese' }, 'EN');
    const segs = FORMATI.map(([v, l]) => h('button', {
      type: 'button', class: 'seg-btn', 'data-v': v,
      onclick: () => { entry.format = v; draw(); markDirty(); },
    }, l));

    function draw() {
      const src = entry.image?.src();
      const vid = entry.link && entry.link.value.trim();
      if (!src && vid && /\.(mp4|webm|mov)$/i.test(vid)) {
        media.replaceChildren(h('video', { src: `${mediaUrl(vid)}#t=0.5`, muted: true, playsInline: true, preload: 'metadata' }));
      } else media.replaceChildren(src ? h('img', { src, alt: '', loading: 'lazy', onerror: (e) => { const p = entry.image.get(); if (e.target.src.startsWith(SITE)) e.target.src = RAW + p; } })
        : h('span', { class: 'g-ph' }, icon(entry.type === 'foto' ? 'image' : 'video'), entry.type === 'video' && h('small', {}, (entry.link.value.match(/\/\/(?:www\.)?([^/]+)/) || [])[1] || 'Video')));
      badge.textContent = FORMATI.find(([v]) => v === entry.format)[1];
      el.classList.toggle('g-wide', entry.format === 'intera' || entry.format === 'grande');
      cap.textContent = entry.title.value.trim() || entry.caption.value.trim() || (entry.type === 'video' ? 'Video' : '');
      warn.hidden = !((entry.title.value.trim() && !entry.titleEn.value.trim()) || (entry.caption.value.trim() && !entry.captionEn.value.trim()));
      segs.forEach((b) => b.classList.toggle('active', b.dataset.v === entry.format));
    }
    entry.image?.onChange(draw);

    const open = () => openSheet(entry.type === 'foto' ? 'Foto' : 'Video', h('div', { class: 'sheet-grid' },
      h('div', { class: 'sheet-media' }, entry.image ? entry.image.el : field('Link del video', entry.link)),
      h('div', { class: 'sheet-fields' },
        h('div', {}, h('span', { class: 'label' }, 'Larghezza sul sito'), h('div', { class: 'seg' }, segs)),
        field('Titolo 🇮🇹', entry.title), field('Title 🇬🇧', entry.titleEn),
        field('Didascalia 🇮🇹', entry.caption), field('Caption 🇬🇧', entry.captionEn))), draw);

    el.append(
      grip(),
      h('button', { type: 'button', class: 'g-open', title: 'Titolo, didascalia e larghezza', onclick: open }, media, h('span', { class: 'g-info' }, badge, warn, cap)),
      del(el));
    draw();
    count();
    if (entry.type === 'video' && !item.link) open();
  }

  for (const item of value || []) add(item);
  sortable(list, markDirty);
  const zone = h('div', { class: 'gallery-zone' },
    counter,
    list,
    h('div', { class: 'gallery-drop' },
      icon('upload'),
      h('span', {}, 'Trascina qui le foto dal Finder, anche tante insieme'),
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn small', onclick: () => files.click() }, icon('plus'), 'Foto'),
        h('button', {
          type: 'button', class: 'btn small',
          onclick: async () => { const p = await pickFromLibrary(); if (p) { add({ type: 'foto', immagine: p }); markDirty(); } },
        }, icon('images'), 'Dai media'),
        h('button', { type: 'button', class: 'btn small', onclick: () => { add({ type: 'video' }); markDirty(); } }, icon('video'), 'Video'),
        h('button', { type: 'button', class: 'btn small', onclick: () => { add({ type: 'sezione' }); markDirty(); } }, icon('tag'), 'Titolo di sezione'))),
    files);
  dropzone(zone, addFiles);
  count();

  const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => !isEmpty(v)));
  const ordered = () => [...list.children].map((el) => items.get(el)).filter(Boolean);
  return {
    el: zone,
    get: () => ordered()
      .map((i) => i.type === 'sezione' ? clean({
        type: 'sezione',
        titolo: i.title.value.trim(), titolo_en: i.titleEn.value.trim(),
        testo: i.text.value.trim(), testo_en: i.textEn.value.trim(),
      }) : clean({
        type: i.type,
        immagine: i.image?.get(),
        link: i.link?.value.trim(),
        titolo: i.title.value.trim(),
        titolo_en: i.titleEn.value.trim(),
        didascalia: i.caption.value.trim(),
        didascalia_en: i.captionEn.value.trim(),
        formato: i.format !== 'intera' ? i.format : undefined,
      }))
      .filter((i) => i.immagine || i.link || i.titolo),
    files: async () => (await Promise.all(ordered().filter((i) => i.image).map((i) => i.image.files()))).flat(),
  };
}

// Caselle da spuntare divise in gruppi (es. gli strumenti usati), più un campo libero per quelli non in elenco.
// Nel file diventa un elenco: [Photoshop, Figma, …].
function checklistWidget(field, value) {
  const chosen = new Set(value || []);
  const known = new Set(field.options.flatMap((g) => g.items));
  const boxes = [];
  const groups = field.options.map((g) => h('div', { class: 'check-group' },
    h('span', { class: 'check-title' }, g.group),
    h('div', { class: 'check-items' }, g.items.map((item) => {
      const input = h('input', { type: 'checkbox', value: item, checked: chosen.has(item) });
      boxes.push(input);
      return h('label', { class: 'check' }, input, h('span', {}, item));
    }))));
  const other = h('input', {
    type: 'text', placeholder: 'Altri, separati da virgola',
    value: [...chosen].filter((v) => !known.has(v)).join(', '),
  });
  return {
    el: h('div', { class: 'checklist' }, groups, field.other && h('div', { class: 'check-group' }, h('span', { class: 'check-title' }, 'Altri'), other)),
    // Tiene l'ordine già salvato; quelli spuntati adesso vanno in fondo.
    get: () => {
      const now = [
        ...boxes.filter((b) => b.checked).map((b) => b.value),
        ...other.value.split(',').map((s) => s.trim()).filter(Boolean),
      ];
      return [...(value || []).filter((v) => now.includes(v)), ...now.filter((v) => !(value || []).includes(v))];
    },
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
        h('small', {}, !e ? 'Non esiste più' : isDraft(e) ? 'Bozza: non compare finché non lo pubblichi' : '')),
      h('button', { type: 'button', class: 'icon-btn danger', title: field.removeTitle || 'Togli dalla home', onclick: () => { el.remove(); refresh(); markDirty(); } }, icon('x')));
    list.append(el);
    refresh();
  }
  function refresh() {
    const chosen = new Set([...list.children].map((el) => el.dataset.slug));
    select.replaceChildren(
      h('option', { value: '' }, field.addLabel || '+ Aggiungi un progetto…'),
      entries.filter((e) => !chosen.has(e.slug)).map((e) => h('option', { value: e.slug }, e.data.title || e.slug)));
  }
  for (const slug of value || []) add(slug);
  refresh();
  sortable(list, markDirty);
  return { el: h('div', {}, list, select), get: () => [...list.children].map((el) => el.dataset.slug) };
}

// I campi con "i18n: true" hanno due versioni: italiano (nome normale, es. "title" o il testo della pagina)
// e inglese (stesso nome con "_en", es. "title_en" o "body_en"). L'interruttore in alto mostra una lingua alla volta.
function expandLanguages(fields, entry) {
  return fields.flatMap((f) => {
    if (!f.i18n) return [f];
    const itValue = f.name === 'body' ? entry.body : entry.data[f.name];
    return [
      { ...f, lang: 'it' },
      {
        ...f, lang: 'en', name: `${f.name}_en`, required: false, default: undefined, it: f.name,
        placeholder: typeof itValue === 'string' && itValue && !itValue.includes('\n') ? `In italiano: ${itValue}` : f.placeholder,
      },
    ];
  });
}

function languageSwitch(form, widgets) {
  const LANGS = [['it', '🇮🇹', 'Italiano'], ['en', '🇬🇧', 'English']];
  const missing = h('span', { class: 'lang-missing' });
  const buttons = LANGS.map(([code, flagIcon, label]) => h('button', {
    type: 'button', class: 'lang-btn', 'data-lang': code,
    onclick: () => { write('cms.lang', code); set(code); },
  }, `${flagIcon} ${label}`));
  function set(code) {
    form.dataset.lang = code;
    for (const b of buttons) b.classList.toggle('active', b.dataset.lang === code);
  }
  // Conta i testi scritti in italiano che non hanno ancora la versione inglese.
  function count() {
    const byName = Object.fromEntries(widgets.map(([f, w]) => [f.name, w]));
    const n = widgets.filter(([f, w]) => f.lang === 'en' && isEmpty(w.get()) && !isEmpty(byName[f.it]?.get())).length;
    missing.textContent = n ? `${n} da tradurre` : '';
    buttons[1].append(missing);
  }
  set(read('cms.lang') === 'en' ? 'en' : 'it');
  count();
  form.addEventListener('input', count);
  form.addEventListener('change', count);
  return h('div', { class: 'lang-bar' }, h('span', { class: 'lang-label' }, 'Lingua dei testi'), h('div', { class: 'lang-seg' }, buttons));
}

async function buildForm(fields, entry, extra = []) {
  const widgets = [];
  const el = h('div', { class: 'form', oninput: markDirty, onchange: markDirty });
  const all = expandLanguages([...fields, ...extra], entry);
  // Campi "side": vanno nella colonna a destra (pubblicazione, categoria, cliente, anno, copertina…).
  const hasSide = all.some((f) => f.side);
  const main = hasSide ? h('section', { class: 'form-main panel padded' }) : el;
  const side = hasSide && h('aside', { class: 'form-side' }, h('section', { class: 'panel padded side-card' }));
  if (hasSide) { el.classList.add('has-side'); el.append(main, side); }
  let group = null;
  for (const field of all) {
    const value = field.name === 'body' ? entry.body : entry.data[field.name];
    const w = await widget(field, value);
    widgets.push([field, w]);
    if (!w.el) continue;
    const box = field.side && side ? side.lastChild : main;
    if (!field.side && field.group && field.group !== group) {
      group = field.group;
      main.append(h('h3', { class: 'form-group' }, group));
    }
    const cls = `field${field.lang ? ` lang-${field.lang}` : ''}`;
    const badge = field.lang && h('span', { class: 'lang-tag' }, field.lang.toUpperCase());
    box.append(w.inline
      ? h('div', { class: cls }, w.el, field.hint && h('p', { class: 'hint' }, field.hint))
      : h('div', { class: cls },
        h('label', { class: 'label' }, field.label, field.required && h('span', { class: 'req' }, ' *'), badge),
        w.el,
        field.hint && h('p', { class: 'hint' }, field.hint)));
  }
  if (all.some((f) => f.lang)) (side || main).prepend(languageSwitch(el, widgets));

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
      if (!all.some((f) => f.name === k)) data[k] = v;
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
    h('a', { class: 'side-brand', href: '#/' },
      h('span', { class: 'wordmark' }, BRAND, h('i', { 'aria-hidden': 'true' })),
      h('small', { class: 'brand-cms' }, 'CMS')),
    h('nav', { class: 'nav' },
      navGroup('generale', 'Generale', [navLink('#/', 'Dashboard', 'gauge'), navLink('#/richieste', 'Richieste', 'mail')]),
      navGroup('contenuti', 'Contenuti', [
        ...collections.map((c) => navLink(`#/c/${c.name}`, c.label, c.icon)),
        navLink('#/media', 'Media', 'images'),
      ]),
      navGroup('social', 'Social', [navLink('#/social', 'Calendario post', 'calendar')]),
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

// ─── Richieste dal form «Raccontami un progetto» ───────────

const STATI = [['nuova', 'Nuova', 'rose'], ['letta', 'Letta', ''], ['risposta', 'Risposta', 'green'], ['archiviata', 'Archiviata', '']];
const quando = (iso) => new Date(iso).toLocaleString('it-IT', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const linkify = (text) => String(text || '').split(/(https?:\/\/\S+)/g).map((p, i) => i % 2 ? h('a', { href: p, target: '_blank', rel: 'noopener' }, p) : p);

async function richiesteView() {
  shell([['Richieste']], loading());
  let lista;
  try { const r = await request('/richieste'); if (!r) { const e = new Error('non attivo'); e.status = 404; throw e; } lista = r.richieste; }
  catch (e) {
    return shell([['Richieste']], h('div', {}, pageHead('Richieste', 'Le persone che ti scrivono dal form del sito'),
      h('section', { class: 'panel' }, h('p', { class: 'empty-state' }, e.status === 503 || e.status === 404
        ? 'Il form non è ancora attivo: va aggiornato il Worker su Cloudflare (vedi riassunto-cms.md).'
        : e.message))));
  }
  let filtro = read('cms.richieste.filtro') || 'aperte';
  const conta = (s) => lista.filter((r) => r.stato === s).length;
  const tabs = h('div', { class: 'chips richieste-tabs' });
  const body = h('div', {});

  function disegna() {
    write('cms.richieste.filtro', filtro);
    const viste = lista.filter((r) => filtro === 'tutte' || (filtro === 'aperte' ? r.stato !== 'archiviata' : r.stato === filtro));
    tabs.replaceChildren(...[['aperte', 'Da gestire'], ['nuova', `Nuove (${conta('nuova')})`], ['risposta', 'Risposte'], ['archiviata', 'Archiviate'], ['tutte', `Tutte (${lista.length})`]]
      .map(([k, l]) => h('button', { type: 'button', class: `btn small ${filtro === k ? 'primary' : ''}`, onclick: () => { filtro = k; disegna(); } }, l)));
    body.replaceChildren(viste.length
      ? h('div', { class: 'richieste' }, viste.map(card))
      : h('section', { class: 'panel' }, h('p', { class: 'empty-state' }, lista.length ? 'Niente qui, con questo filtro.' : 'Ancora nessuna richiesta. Arriveranno dal pulsante Scrivimi del sito.')));
  }

  function card(r) {
    const st = STATI.find((s) => s[0] === r.stato) || STATI[0];
    const sel = h('select', { class: 'compact', 'aria-label': 'Stato' }, STATI.map(([v, l]) => h('option', { value: v, selected: v === r.stato }, l)));
    sel.addEventListener('input', async () => {
      try { await request('/richieste', { method: 'PATCH', body: { id: r.id, stato: sel.value } }); r.stato = sel.value; disegna(); }
      catch (e) { alert(e.message); }
    });
    const del = h('button', { type: 'button', class: 'icon-btn', title: 'Elimina', onclick: async () => {
      if (!confirm(`Eliminare la richiesta di ${r.nome}? Non si può annullare.`)) return;
      try { await request('/richieste', { method: 'DELETE', body: { id: r.id } }); lista = lista.filter((x) => x.id !== r.id); disegna(); }
      catch (e) { alert(e.message); }
    } }, icon('trash'));
    const segna = () => { if (r.stato === 'nuova') { sel.value = 'letta'; sel.dispatchEvent(new Event('input')); } };
    return h('section', { class: `panel richiesta ${r.stato === 'nuova' ? 'is-nuova' : ''}` },
      h('div', { class: 'panel-head' },
        h('div', {},
          h('div', { class: 'title-row' }, h('h2', {}, r.nome), chip(st[1], st[2])),
          h('p', { class: 'muted small' }, quando(r.quando), r.paese ? ` · ${countryNames.of(r.paese)}` : '', r.pagina ? ` · da ${r.pagina}` : '')),
        h('div', { class: 'actions' }, sel, del)),
      h('div', { class: 'richiesta-body' },
        h('dl', { class: 'richiesta-dati' },
          h('div', {}, h('dt', {}, 'Email'), h('dd', {}, h('a', { href: `mailto:${r.email}?subject=${encodeURIComponent('Il tuo progetto')}`, onclick: segna }, r.email))),
          r.telefono && h('div', {}, h('dt', {}, 'Telefono'), h('dd', {}, h('a', { href: `tel:${r.telefono.replace(/\s/g, '')}` }, r.telefono))),
          h('div', {}, h('dt', {}, 'Budget'), h('dd', {}, r.budget || '—'))),
        h('div', { class: 'richiesta-testo' }, h('h3', {}, 'Il progetto'), h('p', {}, r.progetto)),
        r.reference && h('div', { class: 'richiesta-testo' }, h('h3', {}, 'Reference'), h('p', {}, linkify(r.reference)))));
  }

  shell([['Richieste']], h('div', {},
    pageHead('Richieste', 'Le persone che ti scrivono dal form «Raccontami un progetto»'),
    tabs, body));
  disegna();
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
      h('span', { class: 'wordmark big' }, BRAND, h('i', { 'aria-hidden': 'true' })),
      h('h1', {}, 'Pannello'),
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
  const nuove = await request('/richieste').then((r) => (r ? r.richieste : []).filter((x) => x.stato === 'nuova').length).catch(() => 0);
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
      stat(nuove, nuove === 1 ? 'Richiesta nuova' : 'Richieste nuove', '#/richieste', 'mail', 'rose'),
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
      const keys = [e.data[coll.count.field]].concat(coll.count.alsoField ? (e.data[coll.count.alsoField] || []) : []);
      new Set(keys.filter(Boolean)).forEach((key) => { counts[key] = (counts[key] || 0) + 1; });
    }
  }

  let saved = {};
  try { saved = JSON.parse(read(`cms.filters.${coll.name}`) || '{}'); } catch {}
  const search = h('input', { type: 'text', placeholder: 'Cerca…', value: saved.q || '' });
  const selects = (coll.filters || []).map((name) => {
    const field = coll.fields.find((f) => f.name === name);
    // Per relazioni e liste fisse tutte le scelte; per i paesi solo quelli usati.
    const options = (field.type === 'relation' ? Object.keys(titles[name] || {})
      : field.type === 'select' ? optionsOf(field).map((o) => o.value)
        : [...new Set(entries.map((e) => e.data[name]).filter(Boolean))])
      .map((v) => [v, displayValue(field, v, titles)])
      .sort((a, b) => String(a[1]).replace(/^\S+ /, '').localeCompare(String(b[1]).replace(/^\S+ /, ''), 'it'));
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
      && selects.every(([name]) => !f[name] || (name === coll.orderWithin ? inGroup(coll, e, f[name]) : e.data[name] === f[name]))
      && (!f.stato || (f.stato === 'off') === isDraft(e)));
    // Con una categoria scelta, i progetti si vedono nell'ordine che hanno in quella categoria.
    const group = coll.orderWithin && f[coll.orderWithin];
    if (group) {
      shown.sort((a, b) => (groupRank(coll, a, group) - groupRank(coll, b, group)) || 0
        || String(a.data.title || a.slug).localeCompare(String(b.data.title || b.slug), 'it'));
    }
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
          h('span', { class: 'chips' }, e.error && chip('Errore nel file', 'err'),
            group && coll.alsoIn && e.data[coll.orderWithin] !== group && chip('Anche in questa categoria'), isDraft(e) && chip('Bozza', 'amber'), home.includes(e.slug) && chip('In home', 'rose')),
          icon('right'))))
      : [h('p', { class: 'empty-state' }, entries.length ? 'Nessun risultato con questi filtri.' : `Ancora nessun ${coll.singular}. Clicca “Aggiungi” per crearne uno.`)]));
  }

  sortable(list, () => { orderBar.hidden = false; status.textContent = 'Ordine cambiato, non ancora salvato.'; });
  saveOrder.onclick = async () => {
    saveOrder.disabled = true;
    status.textContent = 'Salvataggio…';
    const changes = [];
    const group = coll.orderWithin && current()[coll.orderWithin];
    [...list.children].forEach((el, i) => {
      const e = entries.find((x) => x.slug === el.dataset.slug);
      // Nella categoria principale si salva "ordine", in una categoria in più "ordini.<categoria>".
      const extra = group && coll.orderMap && e.data[coll.orderWithin] !== group;
      if ((extra ? e.data[coll.orderMap]?.[group] : e.data[coll.orderField]) === i + 1) return;
      e.data = extra
        ? { ...e.data, [coll.orderMap]: { ...(e.data[coll.orderMap] || {}), [group]: i + 1 } }
        : { ...e.data, [coll.orderField]: i + 1 };
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
  const extra = coll.home ? [{ side: true, name: '_home', label: 'Mostra in home', type: 'boolean', virtual: true, hint: 'L’ordine dei progetti in home si decide in Pagine → Home.' }] : [];
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
      const used = coll.count ? (await loadCollection(findCollection(coll.count.collection))).filter((e) => e.data[coll.count.field] === slug || (coll.count.alsoField && (e.data[coll.count.alsoField] || []).includes(slug))) : [];
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
  // File rotto: niente modulo, così un salvataggio non può cancellarne il contenuto.
  if (entry.error) {
    return shell(crumbs, h('div', { class: 'editor' },
      pageHead(title, 'Questo file contiene un errore e non si può aprire dal pannello.'),
      h('div', { class: 'banner error' }, icon('alert'), h('div', {},
        h('strong', {}, 'Errore nel file'),
        h('pre', { class: 'err-pre' }, entry.error),
        h('p', {}, 'Chiedi a Claude di sistemarlo: gli altri contenuti funzionano normalmente.')))));
  }
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
    form.el.classList.contains('has-side') ? form.el : h('section', { class: 'panel padded' }, form.el),
    h('div', { class: 'savebar' }, status, h('span', { class: 'grow' }), deleteBtn, saveBtn)));
}

async function libraryView() {
  shell([['Media']], loading());
  const files = await loadLibrary();
  const groups = await mediaGroups(files);
  const byPath = Object.fromEntries(files.map((f) => [f.path, f]));
  const where = {};
  for (const g of groups) for (const p of g.paths) (where[p] ||= []).push(g);

  const search = h('input', { type: 'text', placeholder: 'Cerca un progetto o un file…' });
  const pick = h('select', { class: 'compact' }, h('option', { value: '' }, 'Tutti i progetti'),
    groups.map((g) => h('option', { value: g.key }, `${g.title} (${g.paths.length})`)));
  const body = h('div', { class: 'media-groups' });
  const status = h('span', { class: 'status' });
  const input = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true, onchange: () => upload([...input.files]) });
  const nProj = groups.filter((g) => g.kind === 'Progetto').length;

  async function upload(chosen) {
    if (!chosen.length) return;
    status.textContent = `Preparo ${chosen.length} foto…`;
    try {
      const prepared = await Promise.all(chosen.map(processImage));
      status.textContent = 'Caricamento…';
      await commit(await Promise.all(prepared.map(toUpload)), `Carica ${chosen.length} immagini nei media`);
      state.flash = { type: 'ok', text: `${chosen.length === 1 ? 'Immagine caricata' : `${chosen.length} immagini caricate`}: le trovi in “Non usate” finché non le metti in un progetto.` };
      route();
    } catch (e) {
      status.textContent = e.message;
    }
  }

  function card(path, g) {
    const f = byPath[path];
    const others = where[path].filter((x) => x !== g);
    const unused = g.key === 'unused';
    return h('div', { class: 'lib-card' },
      h('a', { href: mediaUrl(path), target: '_blank', rel: 'noopener', title: 'Apri a grandezza piena' }, libThumb(path)),
      h('div', { class: 'lib-info' },
        h('strong', { title: f.name }, f.name),
        h('small', {}, sizeLabel(f.size)),
        others.length > 0 && h('small', { title: others.map((x) => x.title).join('\n') }, `Anche in: ${others.map((x) => x.title).join(', ')}`)),
      unused && h('button', {
        type: 'button', class: 'icon-btn danger', title: 'Elimina',
        onclick: async () => {
          if (!confirm(`Eliminare ${f.name}? Non è usata da nessuna parte.`)) return;
          status.textContent = 'Eliminazione…';
          try {
            await commit([{ path: f.path, remove: true }], `Elimina immagine ${f.name}`);
            g.paths.splice(g.paths.indexOf(path), 1);
            status.textContent = '';
            draw();
          } catch (e) {
            status.textContent = e.message;
          }
        },
      }, icon('trash')));
  }

  function draw() {
    const q = search.value.trim().toLowerCase();
    const shown = groups
      .filter((g) => !pick.value || g.key === pick.value)
      .map((g) => ({ g, paths: !q || g.title.toLowerCase().includes(q) ? g.paths : g.paths.filter((p) => byPath[p].name.toLowerCase().includes(q)) }))
      .filter((x) => x.paths.length);
    body.replaceChildren(...(shown.length ? shown.map(({ g, paths }) => h('section', { class: `panel media-group${g.key === 'unused' ? ' is-unused' : ''}` },
      h('div', { class: 'panel-head' },
        h('div', {},
          h('div', { class: 'title-row' }, h('h2', {}, g.title), g.draft && chip('Bozza', 'amber'), g.key === 'unused' && chip('Si possono eliminare', 'amber')),
          h('p', { class: 'muted' }, [g.kind, `${paths.length} ${paths.length === 1 ? 'immagine' : 'immagini'}`].filter(Boolean).join(' · '))),
        g.href && h('a', { href: g.href }, g.kind === 'Progetto' ? 'Apri il progetto' : 'Apri')),
      h('div', { class: 'lib-grid' }, paths.map((p) => card(p, g)))))
      : [h('p', { class: 'empty-state' }, 'Nessuna immagine trovata.')]));
  }

  search.addEventListener('input', draw);
  pick.addEventListener('input', draw);
  dropzone(body, upload);
  shell([['Media']], h('div', {},
    pageHead('Media', `${files.length} immagini in ${nProj} progetti · trascina qui le foto per caricarle`,
      h('button', { type: 'button', class: 'btn primary', onclick: () => input.click() }, icon('upload'), h('span', {}, 'Carica foto'))),
    h('div', { class: 'toolbar' }, h('div', { class: 'input-icon search' }, icon('search'), search), pick, status),
    body,
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
    if (location.hash === '#/media' || location.hash === '#/immagini') return await libraryView();
    if (location.hash === '#/richieste') return await richiesteView();
    if (location.hash.startsWith('#/social')) return await socialRoute();
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
