// Pannello del portfolio.
// Legge e salva i file del sito nella repo GitHub passando dal Worker "portfolio-login" su Cloudflare,
// che custodisce la chiave GitHub e manda i magic link. Sezioni e campi sono in schema.js.

const API = 'https://portfolio-login.calfa63.workers.dev';
const SITE = 'https://likemommademe.github.io';
const GOOGLE_CLIENT_ID = '821581591121-dp0scd35mtevlv0m07fhqi39d2nmo9gu.apps.googleusercontent.com';
const RAW = 'https://raw.githubusercontent.com/likemommademe/likemommademe.github.io/main';

const { collections, pages, settings } = window.CMS;
const app = document.getElementById('app');
const state = {
  session: read('cms.session'),
  email: read('cms.email'),
  cache: {},
  dirty: false,
  flash: null,
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
  video: '<path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
  up: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  dn: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  back: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
};

function icon(name) {
  const span = h('span', { class: 'icon', 'aria-hidden': 'true' });
  span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  return span;
}

const slugify = (s) => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length);

function bytesToB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
const textToB64 = (text) => bytesToB64(new TextEncoder().encode(text));
const b64ToText = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

function mediaUrl(path) {
  if (!path) return '';
  return /^https?:/.test(path) ? path : SITE + path;
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

// ─── GitHub (tramite il Worker) ─────────────────────────────

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}/github${path}`, {
    method,
    cache: 'no-store',
    headers: { Authorization: `Bearer ${state.session}`, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  if (res.status === 401) {
    logout('La sessione è scaduta: chiedi un nuovo link.');
    throw new Error('Sessione scaduta.');
  }
  if (res.status === 404 && method === 'GET') return null;
  const data = await res.json().catch(() => ({}));
  if (res.status === 409) throw new Error('Il file è stato modificato nel frattempo: ricarica la pagina e riprova.');
  if (!res.ok) throw new Error(data.error || data.message || `Errore ${res.status}`);
  return data;
}

const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');

async function readFile(path) {
  const file = await api(`/contents/${encodePath(path)}?ref=main`);
  return file && { sha: file.sha, text: b64ToText(file.content) };
}

async function writeFile(path, base64, sha, message) {
  const out = await api(`/contents/${encodePath(path)}`, {
    method: 'PUT',
    body: { message, content: base64, sha, branch: 'main' },
  });
  return out.content.sha;
}

async function deleteFile(path, sha, message) {
  await api(`/contents/${encodePath(path)}`, { method: 'DELETE', body: { message, sha, branch: 'main' } });
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
  const list = (await api(`/contents/${coll.folder}?ref=main`)) || [];
  const entries = await Promise.all(list
    .filter((f) => f.type === 'file' && f.name.endsWith('.md'))
    .map(async (f) => {
      const file = await readFile(f.path);
      return { slug: f.name.replace(/\.md$/, ''), path: f.path, sha: file.sha, ...parse(coll, file.text) };
    }));
  return (state.cache[coll.name] = entries);
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
    if (isEmpty(v) || v === false) return null;
    if (f?.type === 'relation') return titles[key]?.[v] || v;
    if (f?.type === 'boolean') return f.short || f.label;
    if (key === 'ordine') return `Ordine ${v}`;
    return v;
  }).filter((v) => v != null).join(' · ');
}

// ─── Immagini ───────────────────────────────────────────────

function uploadPath(name) {
  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase() : 'jpg';
  const base = slugify(dot > 0 ? name.slice(0, dot) : name) || 'immagine';
  return `/assets/uploads/${base}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
}

// Le foto molto grandi vengono rimpicciolite (max 2400 px) prima del caricamento.
async function shrink(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 1.5e6) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = h('canvas', { width: Math.round(bitmap.width * scale), height: Math.round(bitmap.height * scale) });
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob && blob.size < file.size ? blob : file), file.type, 0.86);
  });
}

async function uploadImage(file, path) {
  const blob = await shrink(file);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  await writeFile(path.slice(1), bytesToB64(bytes), undefined, `Carica immagine ${path.split('/').pop()}`);
}

// ─── Campi del modulo ───────────────────────────────────────

const markDirty = () => { state.dirty = true; };

async function widget(field, value) {
  switch (field.type) {
    case 'hidden':
      return { get: () => value ?? field.default };
    case 'string': {
      const el = h('input', { type: 'text', value: value ?? '', placeholder: field.placeholder || '' });
      return { el, get: () => el.value.trim() };
    }
    case 'text':
    case 'markdown': {
      const rows = field.rows || (field.type === 'text' ? 3 : 10);
      const el = h('textarea', { rows, value: value ?? '' });
      return { el, get: () => el.value.replace(/\s+$/, '') };
    }
    case 'number': {
      const el = h('input', { type: 'number', step: 1, value: value ?? '', class: 'narrow' });
      return { el, get: () => (el.value === '' ? undefined : Number(el.value)) };
    }
    case 'boolean': {
      const input = h('input', { type: 'checkbox', checked: !!value });
      return { el: h('label', { class: 'switch' }, input, h('span', { class: 'track' }), h('span', {}, field.label)), get: () => input.checked, inline: true };
    }
    case 'relation': {
      const coll = findCollection(field.collection);
      const entries = sortEntries(coll, await loadCollection(coll));
      const el = h('select', {},
        h('option', { value: '' }, field.required ? 'Scegli…' : '— nessuno —'),
        entries.map((e) => h('option', { value: e.slug, selected: e.slug === value }, e.data.title || e.slug)));
      return { el, get: () => el.value };
    }
    case 'image':
      return imageWidget(value);
    case 'gallery':
      return galleryWidget(value);
    default:
      throw new Error(`Tipo di campo sconosciuto: ${field.type}`);
  }
}

function imageWidget(value) {
  let path = value || '';
  let file = null;
  const img = h('img', { alt: '', onerror: () => { if (img.src.startsWith(SITE)) img.src = RAW + path; } });
  const empty = h('div', { class: 'image-empty' }, icon('image'), h('span', {}, 'Nessuna immagine'));
  const input = h('input', { type: 'file', accept: 'image/*', hidden: true, onchange: () => input.files[0] && pick(input.files[0]) });
  const choose = h('button', { type: 'button', class: 'btn small', onclick: () => input.click() });
  const remove = h('button', { type: 'button', class: 'btn small ghost', onclick: () => { path = ''; file = null; draw(); markDirty(); } }, 'Rimuovi');
  const el = h('div', { class: 'image-field' }, h('div', { class: 'image-preview' }, img, empty), h('div', { class: 'row' }, choose, remove), input);

  function pick(f) {
    file = f;
    path = uploadPath(f.name);
    draw();
    markDirty();
  }
  function draw() {
    img.hidden = !path;
    empty.hidden = !!path;
    if (path) img.src = file ? URL.createObjectURL(file) : mediaUrl(path);
    choose.textContent = path ? 'Cambia immagine' : 'Carica immagine';
    remove.hidden = !path;
  }
  draw();
  return {
    el,
    pick,
    get: () => path,
    upload: async () => {
      if (!file) return;
      await uploadImage(file, path);
      file = null;
    },
  };
}

function galleryWidget(value) {
  const items = [];
  const list = h('div', { class: 'gallery' });
  const files = h('input', {
    type: 'file', accept: 'image/*', multiple: true, hidden: true,
    onchange: () => {
      for (const f of files.files) add({ type: 'foto' }, f);
      files.value = '';
      markDirty();
    },
  });

  function add(item, file) {
    const entry = { type: item.type };
    const move = (d, name, title) => h('button', {
      type: 'button', class: 'icon-btn', title,
      onclick: () => {
        const i = items.indexOf(entry);
        const j = i + d;
        if (j < 0 || j >= items.length) return;
        [items[i], items[j]] = [items[j], items[i]];
        draw();
        markDirty();
      },
    }, icon(name));
    if (item.type === 'foto') {
      entry.image = imageWidget(item.immagine);
      if (file) entry.image.pick(file);
    } else {
      entry.link = h('input', { type: 'url', value: item.link || '', placeholder: 'Link YouTube o Vimeo' });
    }
    entry.caption = h('input', { type: 'text', value: item.didascalia || '', placeholder: 'Didascalia (facoltativa)' });
    entry.el = h('div', { class: 'gallery-item' },
      h('div', { class: 'gallery-head' },
        icon(item.type === 'foto' ? 'image' : 'video'),
        h('strong', {}, item.type === 'foto' ? 'Foto' : 'Video'),
        h('span', { class: 'grow' }),
        move(-1, 'up', 'Sposta su'),
        move(1, 'dn', 'Sposta giù'),
        h('button', { type: 'button', class: 'icon-btn danger', title: 'Elimina', onclick: () => { items.splice(items.indexOf(entry), 1); draw(); markDirty(); } }, icon('trash'))),
      entry.image ? entry.image.el : entry.link,
      entry.caption);
    items.push(entry);
    draw();
  }
  function draw() {
    list.replaceChildren(...items.map((i) => i.el));
    list.hidden = !items.length;
  }

  for (const item of value || []) add(item);
  draw();

  const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => !isEmpty(v)));
  return {
    el: h('div', {},
      list,
      h('div', { class: 'row' },
        h('button', { type: 'button', class: 'btn small', onclick: () => files.click() }, icon('plus'), 'Aggiungi foto'),
        h('button', { type: 'button', class: 'btn small', onclick: () => { add({ type: 'video' }); markDirty(); } }, icon('plus'), 'Aggiungi video')),
      files),
    get: () => items
      .map((i) => clean(i.type === 'foto'
        ? { type: 'foto', immagine: i.image.get(), didascalia: i.caption.value.trim() }
        : { type: 'video', link: i.link.value.trim(), didascalia: i.caption.value.trim() }))
      .filter((i) => i.immagine || i.link),
    upload: async () => {
      for (const i of items) if (i.image) await i.image.upload();
    },
  };
}

async function buildForm(fields, entry) {
  const widgets = [];
  const el = h('div', { class: 'form', oninput: markDirty, onchange: markDirty });
  for (const field of fields) {
    const value = field.name === 'body' ? entry.body : entry.data[field.name];
    const w = await widget(field, value);
    widgets.push([field, w]);
    if (!w.el) continue;
    el.append(w.inline
      ? h('div', { class: 'field' }, w.el, field.hint && h('p', { class: 'hint' }, field.hint))
      : h('div', { class: 'field' },
        h('label', { class: 'label' }, field.label, field.required && h('span', { class: 'req' }, ' *')),
        w.el,
        field.hint && h('p', { class: 'hint' }, field.hint)));
  }

  // Raccoglie i valori, controlla i campi obbligatori e solo dopo carica le immagini nuove.
  async function collect() {
    const data = {};
    let body = entry.body || '';
    for (const [field, w] of widgets) {
      const v = w.get();
      if (field.required && isEmpty(v)) throw new Error(`Manca “${field.label}”.`);
      if (field.name === 'body') body = v;
      else if (!isEmpty(v)) data[field.name] = v;
    }
    for (const [k, v] of Object.entries(entry.data)) {
      if (!fields.some((f) => f.name === k)) data[k] = v;
    }
    for (const [, w] of widgets) if (w.upload) await w.upload();
    return { data, body };
  }

  return { el, collect };
}

// ─── Struttura della pagina ─────────────────────────────────

function siteName() {
  return state.cache.impostazioni?.data.nome || 'Portfolio';
}

function navLink(href, label, iconName) {
  const active = location.hash === href || location.hash.startsWith(`${href}/`);
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
  const name = siteName();
  const sidebar = h('aside', { class: 'sidebar' },
    h('div', { class: 'brand' },
      h('span', { class: 'logo' }, name[0].toUpperCase()),
      h('div', {}, h('strong', {}, name), h('small', {}, 'Pannello'))),
    h('nav', { class: 'nav' },
      navGroup('generale', 'Generale', [navLink('#/', 'Dashboard', 'gauge')]),
      navGroup('contenuti', 'Contenuti', collections.map((c) => navLink(`#/c/${c.name}`, c.label, c.icon))),
      navGroup('pagine', 'Pagine', pages.map((p) => navLink(`#/p/${p.name}`, p.label, p.icon))),
      navGroup('sistema', 'Sistema', settings.map((p) => navLink(`#/p/${p.name}`, p.label, p.icon)))),
    h('div', { class: 'me' },
      h('span', { class: 'avatar' }, (state.email || '?')[0].toUpperCase()),
      h('div', { class: 'me-text' }, h('strong', {}, name), h('small', {}, state.email || '')),
      h('button', { type: 'button', class: 'icon-btn', title: 'Esci', onclick: () => logout() }, icon('logout'))));

  const topbar = h('header', { class: 'topbar' },
    h('button', { type: 'button', class: 'icon-btn menu', title: 'Menu', onclick: () => document.body.classList.toggle('nav-open') }, icon('menu')),
    h('nav', { class: 'crumbs' },
      h('a', { href: '#/', title: 'Dashboard' }, icon('home')),
      crumbs.map(([label, href]) => [icon('right'), href ? h('a', { href }, label) : h('span', {}, label)])),
    h('span', { class: 'grow' }),
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
  const drawGoogle = () => {
    if (!window.google?.accounts?.id) return setTimeout(drawGoogle, 200);
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
      h('span', { class: 'logo big' }, 'L'),
      h('h1', {}, 'Pannello del portfolio'),
      h('p', { class: 'muted' }, 'Accesso al pannello di amministrazione')),
    banner,
    form,
    h('p', { class: 'login-foot' }, `© ${new Date().getFullYear()} likemommademe · Pannello`)));
  if (message) say(message, type);
  drawGoogle();
}

async function dashboard() {
  shell([['Dashboard']], loading());
  const [progetti, categorie, clienti, commits] = await Promise.all([
    loadCollection(findCollection('progetti')),
    loadCollection(findCollection('categorie')),
    loadCollection(findCollection('clienti')),
    api('/commits?per_page=6').catch(() => []),
  ]);
  const progettiColl = findCollection('progetti');
  const titles = await relationTitles(progettiColl);
  const stat = (n, label, href, iconName, tone) => h('a', { href, class: 'stat' },
    h('div', { class: 'stat-top' }, h('span', { class: `stat-icon ${tone}` }, icon(iconName)), icon('right')),
    h('strong', {}, n.toLocaleString('it-IT')),
    h('span', {}, label));
  const recent = [...progetti].sort((a, b) => (b.data.anno || 0) - (a.data.anno || 0)).slice(0, 5);

  shell([['Dashboard']], h('div', {},
    pageHead('Dashboard', 'Panoramica dei contenuti del portfolio'),
    h('div', { class: 'stats' },
      stat(progetti.length, 'Progetti', '#/c/progetti', 'folder', 'brand'),
      stat(progetti.filter((p) => p.data.in_evidenza).length, 'In evidenza in home', '#/c/progetti', 'star', 'amber'),
      stat(categorie.length, 'Categorie', '#/c/categorie', 'tag', 'blue'),
      stat(clienti.length, 'Clienti', '#/c/clienti', 'briefcase', 'violet')),
    h('div', { class: 'panels' },
      h('section', { class: 'panel' },
        h('div', { class: 'panel-head' },
          h('div', {}, h('h2', {}, 'Ultimi progetti'), h('p', { class: 'muted' }, 'I più recenti per anno')),
          h('a', { href: '#/c/progetti' }, 'Tutti')),
        recent.length
          ? h('ul', { class: 'rows' }, recent.map((e) => h('li', {}, h('a', { href: `#/c/progetti/${e.slug}` },
            thumb(e.data.copertina),
            h('span', { class: 'row-text' }, h('strong', {}, e.data.title || e.slug), h('small', {}, subtitle(progettiColl, e, titles)))))))
          : h('p', { class: 'empty-state' }, 'Nessun progetto ancora.')),
      h('section', { class: 'panel' },
        h('div', { class: 'panel-head' },
          h('div', {}, h('h2', {}, 'Ultime modifiche'), h('p', { class: 'muted' }, 'Ogni salvataggio va online in 1–2 minuti'))),
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
  shell([[coll.label]], h('div', {},
    pageHead(coll.label, `${entries.length} ${entries.length === 1 ? 'elemento' : 'elementi'}`,
      h('a', { class: 'btn primary', href: `#/c/${coll.name}/nuovo` }, icon('plus'), h('span', {}, 'Aggiungi'))),
    h('section', { class: 'panel' },
      entries.length
        ? h('ul', { class: 'rows' }, entries.map((e) => h('li', {}, h('a', { href: `#/c/${coll.name}/${e.slug}` },
          coll.thumb ? thumb(e.data[coll.thumb]) : null,
          h('span', { class: 'row-text' }, h('strong', {}, e.data.title || e.slug), h('small', {}, subtitle(coll, e, titles))),
          icon('right')))))
        : h('p', { class: 'empty-state' }, `Ancora nessun ${coll.singular}. Clicca “Aggiungi” per crearne uno.`))));
}

async function collectionEditor(coll, slug) {
  const isNew = slug === 'nuovo';
  const crumbs = [[coll.label, `#/c/${coll.name}`], [isNew ? 'Nuovo' : '…']];
  shell(crumbs, loading());
  const entries = await loadCollection(coll);
  let entry = isNew
    ? { data: Object.fromEntries(coll.fields.filter((f) => f.default !== undefined).map((f) => [f.name, f.default])), body: '' }
    : entries.find((e) => e.slug === slug);
  if (!entry) return shell(crumbs, h('p', { class: 'muted' }, 'Elemento non trovato.'));

  await editor({
    schema: coll,
    entry,
    crumbs: [[coll.label, `#/c/${coll.name}`], [isNew ? `Nuovo ${coll.singular}` : entry.data.title || slug]],
    title: isNew ? `Nuovo ${coll.singular}` : entry.data.title || slug,
    back: `#/c/${coll.name}`,
    async save({ data, body }) {
      const title = data.title || '';
      if (isNew) {
        const newSlug = slugify(title);
        if (!newSlug) throw new Error('Scrivi un titolo.');
        if (entries.some((e) => e.slug === newSlug)) throw new Error('Esiste già un elemento con questo titolo.');
        const path = `${coll.folder}/${newSlug}.md`;
        const sha = await writeFile(path, textToB64(serialize(coll, data, body)), undefined, `Aggiunge ${coll.singular} “${title}”`);
        entry = { slug: newSlug, path, sha, data, body };
        entries.push(entry);
        return `#/c/${coll.name}/${newSlug}`;
      }
      entry.sha = await writeFile(entry.path, textToB64(serialize(coll, data, body)), entry.sha, `Aggiorna ${coll.singular} “${title}”`);
      Object.assign(entry, { data, body });
      return null;
    },
    remove: isNew ? null : async () => {
      await deleteFile(entry.path, entry.sha, `Elimina ${coll.singular} “${entry.data.title || slug}”`);
      entries.splice(entries.indexOf(entry), 1);
    },
  });
}

async function pageEditor(page) {
  shell([[page.label]], loading());
  const file = await readFile(page.file);
  const entry = file ? { sha: file.sha, ...parse(page, file.text) } : { data: {}, body: '' };
  await editor({
    schema: page,
    entry,
    crumbs: [[page.label]],
    title: page.label,
    async save({ data, body }) {
      entry.sha = await writeFile(page.file, textToB64(serialize(page, data, body)), entry.sha, `Aggiorna ${page.label}`);
      Object.assign(entry, { data, body });
      if (page.name === 'impostazioni') state.cache.impostazioni = entry;
      return null;
    },
  });
}

async function editor({ schema, entry, crumbs, title, back, save, remove }) {
  const form = await buildForm(schema.fields, entry);
  const status = h('span', { class: 'status' });
  const saveBtn = h('button', { type: 'button', class: 'btn primary' }, h('span', {}, 'Salva'));
  const busy = (on) => { saveBtn.disabled = on; if (deleteBtn) deleteBtn.disabled = on; };
  const show = (text, kind) => { status.className = `status ${kind || ''}`; status.textContent = text; };

  saveBtn.onclick = async () => {
    busy(true);
    show('Salvataggio…');
    try {
      const go = await save(await form.collect());
      state.dirty = false;
      state.flash = { type: 'ok', text: 'Salvato! Le modifiche saranno sul sito tra 1–2 minuti.' };
      if (go) location.hash = go;
      else route();
    } catch (e) {
      show(e.message, 'error');
      busy(false);
    }
  };

  const deleteBtn = remove && h('button', {
    type: 'button', class: 'btn ghost danger',
    onclick: async () => {
      if (!confirm(`Vuoi eliminare “${title}”? Non si può annullare.`)) return;
      busy(true);
      show('Eliminazione…');
      try {
        await remove();
        state.dirty = false;
        state.flash = { type: 'ok', text: `“${title}” eliminato.` };
        location.hash = back;
      } catch (e) {
        show(e.message, 'error');
        busy(false);
      }
    },
  }, icon('trash'), h('span', {}, 'Elimina'));

  shell(crumbs, h('div', { class: 'editor' },
    pageHead(title, null, back && h('a', { class: 'btn ghost', href: back }, icon('back'), h('span', {}, 'Indietro'))),
    h('section', { class: 'panel padded' }, form.el),
    h('div', { class: 'savebar' }, status, h('span', { class: 'grow' }), deleteBtn, saveBtn)));
}

// ─── Navigazione ────────────────────────────────────────────

async function route() {
  if (!state.session) return showLogin();
  const [, kind, name, slug] = location.hash.match(/^#\/(c|p)\/([^/]+)(?:\/(.+))?$/) || [];
  try {
    if (!state.cache.impostazioni) {
      const file = await readFile('_data/impostazioni.yml').catch(() => null);
      if (file) state.cache.impostazioni = { sha: file.sha, ...parse({ format: 'yaml' }, file.text) };
    }
    if (kind === 'c' && findCollection(name)) {
      return slug ? collectionEditor(findCollection(name), decodeURIComponent(slug)) : listView(findCollection(name));
    }
    if (kind === 'p' && findPage(name)) return pageEditor(findPage(name));
    return dashboard();
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
}

async function start() {
  const m = location.hash.match(/^#login=(.+)$/);
  if (!m) {
    currentHash = location.hash;
    return route();
  }
  history.replaceState(null, '', location.pathname);
  app.replaceChildren(h('p', { class: 'muted loading' }, 'Accesso in corso…'));
  signIn('/login', { token: m[1] }).catch((e) => showLogin(e.message));
}

start();
