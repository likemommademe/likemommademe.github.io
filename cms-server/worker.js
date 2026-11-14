// Server del pannello /admin. Gira su Cloudflare Workers (gratis), nel Worker "portfolio-login".
// Fa tre cose:
//   1. accesso con Google o con magic link: controlla che sia la tua email e apre una sessione di 30 giorni;
//   2. fa da ponte verso GitHub: il pannello chiede di leggere/salvare i file e questo Worker
//      lo fa con la chiave GitHub, che così non esce mai da Cloudflare;
//   3. conta le visite al sito pubblico (senza cookie) e le mostra nella dashboard del pannello;
//   4. riceve le richieste del form «Raccontami un progetto» e le mostra nel pannello, in Richieste;
//   5. collega Instagram, TikTok e LinkedIn e pubblica i post social dal pannello (Social → Account social).
//
// Da impostare nel Worker, in Settings → Variables and Secrets:
//   EMAIL           le email che possono entrare, separate da virgola (es. tu@gmail.com, amica@gmail.com).
//                   Con Resend gratuito il magic link arriva solo all'email dell'account Resend;
//                   gli altri entrano con Google.
//   GITHUB_TOKEN    token GitHub con permesso Contents: Read and write sulla repo del sito
//   RESEND_API_KEY  chiave di resend.com (serve a spedire la mail)
// e in Settings → Bindings un database D1 con nome DB (per le statistiche delle visite, le richieste e gli account social).
//
// Per i social (facoltativo: ogni social si attiva quando ci sono le sue due chiavi):
//   INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET     app Meta con "Instagram API with Instagram Login"
//   LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET app LinkedIn con "Share on LinkedIn" e "Sign In with LinkedIn using OpenID Connect"
//   TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET    app TikTok con "Login Kit" e "Content Posting API"
//   LINKEDIN_VERSION                           facoltativo, versione delle API di LinkedIn (es. 202510)

const REPO = 'likemommademe/likemommademe.github.io';
// ID client di Google Cloud (progetto "portfolio"): non è segreto.
const GOOGLE_CLIENT_ID = '821581591121-dp0scd35mtevlv0m07fhqi39d2nmo9gu.apps.googleusercontent.com';
const ALLOWED_ORIGINS = ['https://likemommademe.github.io', 'http://localhost:8080'];
const LINK_MINUTES = 15;

const allowed = (env) => env.EMAIL.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
const SESSION_DAYS = 30;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const cors = ALLOWED_ORIGINS.includes(origin)
      ? {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE',
          Vary: 'Origin',
        }
      : {};
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });

    const url = new URL(request.url);
    let res;
    try {
      if (url.pathname === '/send' && request.method === 'POST') res = await send(request, env);
      else if (url.pathname === '/login' && request.method === 'POST') res = await login(request, env);
      else if (url.pathname === '/google' && request.method === 'POST') res = await google(request, env);
      else if (url.pathname === '/hit' && request.method === 'POST') res = await hit(request, env);
      else if (url.pathname === '/stats') res = await stats(request, env, url);
      else if (url.pathname === '/richiesta' && request.method === 'POST') res = await nuovaRichiesta(request, env);
      else if (url.pathname === '/richieste') res = await richieste(request, env, url);
      else if (url.pathname.startsWith('/github/')) res = await github(request, env, url);
      else if (url.pathname.startsWith('/social/')) res = await social(request, env, url);
      else res = json({ error: 'Not found' }, 404);
    } catch (e) {
      res = json({ error: `Errore del server: ${e.message}` }, 500);
    }
    const out = new Response(res.body, res);
    for (const [k, v] of Object.entries(cors)) out.headers.set(k, v);
    return out;
  },
};

// Manda la mail con il magic link. `back` è l'indirizzo del pannello a cui deve riportare il link.
async function send(request, env) {
  const { email, back } = await request.json().catch(() => ({}));
  if (typeof back !== 'string' || !ALLOWED_ORIGINS.some((o) => back.startsWith(`${o}/`))) {
    return json({ error: 'Richiesta non valida.' }, 400);
  }
  const to = String(email || '').trim().toLowerCase();
  if (!allowed(env).includes(to)) return json({ error: 'Questa email non è autorizzata ad accedere.' }, 403);

  const token = await sign(env, { use: 'link', email: to, exp: Date.now() + LINK_MINUTES * 60_000 });
  const link = `${back}#login=${token}`;
  const when = new Date().toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });
  const where = [request.cf?.city, request.cf?.country].filter(Boolean).join(', ');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Portfolio <onboarding@resend.dev>',
      to,
      subject: 'Il tuo link per entrare nel pannello',
      html: `<div style="font-family:system-ui,sans-serif;max-width:440px">
<p>Clicca qui per entrare nel pannello del portfolio:</p>
<p><a href="${link}" style="display:inline-block;padding:12px 22px;background:#5f6041;color:#fff;text-decoration:none;border-radius:10px">Entra nel pannello</a></p>
<p style="color:#777;font-size:13px">Richiesta alle ${when}${where ? ` da ${where}` : ''}. Il link vale ${LINK_MINUTES} minuti.<br>
Se non l'hai chiesto tu, ignora questa mail.</p></div>`,
    }),
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => ({}));
    return json({ error: `Non sono riuscito a mandare la mail. (Resend: ${detail.message || res.status})` }, 502);
  }
  return json({ ok: true });
}

// Il pannello, aperto dal link della mail, scambia il link con una sessione.
async function login(request, env) {
  const { token } = await request.json().catch(() => ({}));
  const data = await verify(env, token);
  if (!data || data.use !== 'link') {
    return json({ error: 'Il link non è valido o è scaduto: chiedine uno nuovo.' }, 401);
  }
  return startSession(env, data.email);
}

// Il pulsante "Accedi con Google" manda un attestato firmato da Google: controlliamo firma, scadenza
// e che sia proprio la tua email.
async function google(request, env) {
  const { credential } = await request.json().catch(() => ({}));
  const [header, payload, sig] = String(credential || '').split('.');
  if (!header || !payload || !sig) return json({ error: 'Accesso con Google non valido.' }, 400);

  const { kid } = JSON.parse(new TextDecoder().decode(fromB64url(header)));
  const { keys } = await (await fetch('https://www.googleapis.com/oauth2/v3/certs')).json();
  const jwk = keys.find((k) => k.kid === kid);
  if (!jwk) return json({ error: 'Accesso con Google non valido. Riprova.' }, 401);
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, fromB64url(sig), new TextEncoder().encode(`${header}.${payload}`));
  const data = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
  if (!valid || data.aud !== GOOGLE_CLIENT_ID || !['accounts.google.com', 'https://accounts.google.com'].includes(data.iss)
      || data.exp * 1000 < Date.now() || !data.email_verified) {
    return json({ error: 'Accesso con Google non valido. Riprova.' }, 401);
  }
  if (!allowed(env).includes(data.email.toLowerCase())) {
    return json({ error: `L'account ${data.email} non è autorizzato ad accedere.` }, 403);
  }
  return startSession(env, data.email.toLowerCase());
}

async function startSession(env, email) {
  const session = await sign(env, { use: 'session', email, exp: Date.now() + SESSION_DAYS * 86_400_000 });
  return json({ session, email });
}

// Inoltra a GitHub le richieste del pannello, solo per la repo del sito.
async function github(request, env, url) {
  if (!(await session(request, env))) return json({ error: 'Sessione scaduta: accedi di nuovo.' }, 401);

  const path = url.pathname.slice('/github'.length);
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}${url.search}`, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'portfolio-cms',
    },
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  });
  if (res.status === 401) return json({ error: 'La chiave GitHub salvata su Cloudflare non funziona più.' }, 502);
  return res;
}

async function session(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const data = await verify(env, auth.replace(/^Bearer /, ''));
  return data && data.use === 'session' && allowed(env).includes(data.email) ? data : null;
}

// ─── Statistiche delle visite ───

let tableReady = false;
async function ensureTable(env) {
  if (tableReady) return;
  await env.DB.prepare('CREATE TABLE IF NOT EXISTS hits (day TEXT, path TEXT, country TEXT, ref TEXT, device TEXT, visitor TEXT)').run();
  await env.DB.prepare('CREATE INDEX IF NOT EXISTS hits_day ON hits (day)').run();
  tableReady = true;
}

// Ogni pagina del sito pubblico manda qui una riga. Niente cookie: il "visitatore" è un codice
// ricavato da indirizzo e browser che cambia ogni giorno, quindi non permette di riconoscere nessuno.
async function hit(request, env) {
  const ua = request.headers.get('User-Agent') || '';
  if (!env.DB || /bot|crawl|spider|slurp|preview|headless|lighthouse/i.test(ua)) return new Response(null, { status: 204 });
  let body = {};
  try { body = JSON.parse(await request.text()); } catch {}
  const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${day}|${ip}|${ua}|${env.GITHUB_TOKEN}`));
  const visitor = b64url(new Uint8Array(digest)).slice(0, 16);
  let ref = '';
  try {
    const host = new URL(body.r).hostname.replace(/^www\./, '');
    if (!ALLOWED_ORIGINS.some((o) => new URL(o).hostname === host)) ref = host;
  } catch {}
  const device = /iPad|Tablet/i.test(ua) ? 'Tablet' : /Mobi|Android|iPhone/i.test(ua) ? 'Telefono' : 'Computer';
  await ensureTable(env);
  await env.DB.prepare('INSERT INTO hits (day, path, country, ref, device, visitor) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(day, String(body.p || '/').slice(0, 200), request.cf?.country || '', ref, device, visitor).run();
  return new Response(null, { status: 204 });
}

async function stats(request, env, url) {
  if (!(await session(request, env))) return json({ error: 'Sessione scaduta: accedi di nuovo.' }, 401);
  if (!env.DB) return json({ error: 'Statistiche non attive: manca il database.' }, 503);
  await ensureTable(env);
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days')) || 30));
  const from = new Date(Date.now() - (days - 1) * 86_400_000).toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
  const q = (sql) => env.DB.prepare(sql).bind(from);
  const [daily, total, countries, pages, refs, devices] = await env.DB.batch([
    q('SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM hits WHERE day >= ? GROUP BY day ORDER BY day'),
    q("SELECT COUNT(*) AS views, COUNT(DISTINCT visitor || day) AS visitors FROM hits WHERE day >= ?"),
    q('SELECT country, COUNT(*) AS views FROM hits WHERE day >= ? GROUP BY country ORDER BY views DESC LIMIT 8'),
    q('SELECT path, COUNT(*) AS views FROM hits WHERE day >= ? GROUP BY path ORDER BY views DESC LIMIT 8'),
    q('SELECT ref, COUNT(*) AS views FROM hits WHERE day >= ? GROUP BY ref ORDER BY views DESC LIMIT 8'),
    q('SELECT device, COUNT(*) AS views FROM hits WHERE day >= ? GROUP BY device ORDER BY views DESC'),
  ]);
  return json({
    days: daily.results,
    total: total.results[0],
    countries: countries.results,
    pages: pages.results,
    refs: refs.results,
    devices: devices.results,
  });
}

// ─── Richieste dal form «Raccontami un progetto» ───

let richiesteReady = false;
async function ensureRichieste(env) {
  if (richiesteReady) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS richieste (
    id INTEGER PRIMARY KEY AUTOINCREMENT, quando TEXT, nome TEXT, email TEXT, telefono TEXT,
    progetto TEXT, budget TEXT, reference TEXT, stato TEXT DEFAULT 'nuova', paese TEXT, pagina TEXT, chi TEXT)`).run();
  richiesteReady = true;
}

// Dal sito pubblico: chiunque può mandare una richiesta, ma con dei limiti (campi controllati,
// campo trappola per i bot, al massimo 5 richieste al giorno dalla stessa connessione).
async function nuovaRichiesta(request, env) {
  if (!env.DB) return json({ error: 'Il modulo non è ancora attivo. Scrivimi per email.' }, 503);
  const b = await request.json().catch(() => ({}));
  if (b.sito_web) return json({ ok: true });   // campo trappola: lo compilano solo i bot
  const t = (v, n) => String(v || '').trim().slice(0, n);
  const r = { nome: t(b.nome, 120), email: t(b.email, 160).toLowerCase(), telefono: t(b.telefono, 40),
    progetto: t(b.progetto, 4000), budget: t(b.budget, 60), reference: t(b.reference, 1500), pagina: t(b.pagina, 200) };
  if (!r.nome || !r.progetto) return json({ error: 'Mancano il nome o la descrizione del progetto.' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) return json({ error: "L'email non sembra giusta: controllala." }, 400);
  await ensureRichieste(env);
  const day = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Rome' });
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const chi = b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${day}|${ip}|${env.GITHUB_TOKEN}`)))).slice(0, 16);
  const tante = await env.DB.prepare('SELECT COUNT(*) AS n FROM richieste WHERE chi = ? AND quando >= ?').bind(chi, day).first();
  if (tante && tante.n >= 5) return json({ error: 'Hai già mandato diverse richieste oggi: ti rispondo presto.' }, 429);
  await env.DB.prepare('INSERT INTO richieste (quando, nome, email, telefono, progetto, budget, reference, stato, paese, pagina, chi) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(new Date().toISOString(), r.nome, r.email, r.telefono, r.progetto, r.budget, r.reference, 'nuova', request.cf?.country || '', r.pagina, chi).run();
  // un avviso per email (se non parte, la richiesta resta comunque salvata nel pannello)
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Portfolio <onboarding@resend.dev>', to: allowed(env)[0], reply_to: r.email,
        subject: `Nuova richiesta da ${r.nome}`,
        html: `<div style="font-family:system-ui,sans-serif;max-width:520px"><p><b>${esc(r.nome)}</b> · ${esc(r.email)}${r.telefono ? ` · ${esc(r.telefono)}` : ''}</p>
<p style="white-space:pre-wrap">${esc(r.progetto)}</p><p>Budget: ${esc(r.budget || '—')}<br>Reference: ${esc(r.reference || '—')}</p>
<p style="color:#777;font-size:13px">La trovi anche nel pannello, in Richieste.</p></div>`,
      }),
    });
  } catch {}
  return json({ ok: true });
}

// Dal pannello: elenco (GET), cambio di stato (PATCH) ed eliminazione (DELETE).
async function richieste(request, env, url) {
  if (!(await session(request, env))) return json({ error: 'Sessione scaduta: accedi di nuovo.' }, 401);
  if (!env.DB) return json({ error: 'Richieste non attive: manca il database.' }, 503);
  await ensureRichieste(env);
  if (request.method === 'GET') {
    const { results } = await env.DB.prepare('SELECT id, quando, nome, email, telefono, progetto, budget, reference, stato, paese, pagina FROM richieste ORDER BY id DESC LIMIT 500').all();
    return json({ richieste: results });
  }
  const { id, stato } = await request.json().catch(() => ({}));
  if (!Number.isInteger(id)) return json({ error: 'Richiesta non valida.' }, 400);
  if (request.method === 'PATCH') {
    if (!['nuova', 'letta', 'risposta', 'archiviata'].includes(stato)) return json({ error: 'Stato non valido.' }, 400);
    await env.DB.prepare('UPDATE richieste SET stato = ? WHERE id = ?').bind(stato, id).run();
    return json({ ok: true });
  }
  if (request.method === 'DELETE') {
    await env.DB.prepare('DELETE FROM richieste WHERE id = ?').bind(id).run();
    return json({ ok: true });
  }
  return json({ error: 'Not found' }, 404);
}

// Link e sessioni sono firmati con una chiave ricavata dal token GitHub:
// così non serve un'altra impostazione, e nessuno può fabbricarli.
async function sign(env, data) {
  const body = b64url(new TextEncoder().encode(JSON.stringify(data)));
  return `${body}.${await hmac(env, body)}`;
}

async function verify(env, token) {
  if (typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = new TextEncoder().encode(await hmac(env, body));
  const given = new TextEncoder().encode(sig);
  if (expected.length !== given.length || !crypto.subtle.timingSafeEqual(expected, given)) return null;
  const data = JSON.parse(new TextDecoder().decode(fromB64url(body)));
  return data.exp > Date.now() ? data : null;
}

async function hmac(env, text) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(`portfolio-cms:${env.GITHUB_TOKEN}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  return b64url(new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text))));
}

function b64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(text) {
  const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4)), (c) => c.charCodeAt(0));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

// ─── Social: Instagram, TikTok, LinkedIn ───
// Il pannello chiede di collegare un account: il Worker manda al login del social con un "state" firmato,
// il social torna qui con un codice, il Worker lo scambia con la chiave dell'account e la salva nel database D1.
// Pubblicare: il pannello manda testo e percorsi delle grafiche o del video, già online sul sito (il pannello aspetta che lo siano).

const PANEL = 'https://likemommademe.github.io/admin/';
const SITE_URL = 'https://likemommademe.github.io';
const IG = 'https://graph.instagram.com/v23.0';

const RETI = {
  instagram: {
    configurato: (env) => !!(env.INSTAGRAM_APP_ID && env.INSTAGRAM_APP_SECRET),
    authorize: (env, redirect, state) => `https://www.instagram.com/oauth/authorize?${new URLSearchParams({
      enable_fb_login: '0', force_authentication: '1', client_id: env.INSTAGRAM_APP_ID, redirect_uri: redirect, response_type: 'code',
      scope: 'instagram_business_basic,instagram_business_content_publish', state,
    })}`,
    async scambia(env, code, redirect) {
      const short = await form('https://api.instagram.com/oauth/access_token', {
        client_id: env.INSTAGRAM_APP_ID, client_secret: env.INSTAGRAM_APP_SECRET, grant_type: 'authorization_code', redirect_uri: redirect, code,
      });
      const long = await getJson(`https://graph.instagram.com/access_token?${new URLSearchParams({ grant_type: 'ig_exchange_token', client_secret: env.INSTAGRAM_APP_SECRET, access_token: short.access_token })}`);
      const me = await getJson(`${IG}/me?fields=user_id,username&access_token=${encodeURIComponent(long.access_token)}`);
      return { utente: String(me.user_id || short.user_id), nome: `@${me.username}`, token: long.access_token, scade: Date.now() + (long.expires_in || 5184000) * 1000 };
    },
    // La chiave dura 60 giorni: quando ne mancano meno di 10 si rinnova da sola.
    async rinnova(env, acc) {
      if (acc.scade - Date.now() > 10 * 86_400_000) return acc;
      const r = await getJson(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(acc.token)}`);
      return { ...acc, token: r.access_token, scade: Date.now() + (r.expires_in || 5184000) * 1000 };
    },
    async pubblica(env, acc, { immagini, video, testo }) {
      const t = encodeURIComponent(acc.token);
      const post = (path, params) => form(`${IG}/${path}?access_token=${t}`, params);
      const urls = immagini.map((p) => SITE_URL + p);
      let container;
      if (video) {
        // Video: va come Reel, e compare anche nella griglia del profilo.
        container = (await post(`${acc.utente}/media`, { media_type: 'REELS', video_url: SITE_URL + video, caption: testo, share_to_feed: 'true' })).id;
      } else if (urls.length === 1) {
        container = (await post(`${acc.utente}/media`, { image_url: urls[0], caption: testo })).id;
      } else {
        const children = [];
        for (const u of urls.slice(0, 10)) children.push((await post(`${acc.utente}/media`, { image_url: u, is_carousel_item: 'true' })).id);
        container = (await post(`${acc.utente}/media`, { media_type: 'CAROUSEL', children: children.join(','), caption: testo })).id;
      }
      // Instagram prepara i file (i video ci mettono di più): si aspetta finché non sono pronti.
      for (let i = 0; i < (video ? 35 : 15); i++) {
        const st = await getJson(`${IG}/${container}?fields=status_code&access_token=${t}`);
        if (st.status_code === 'FINISHED') break;
        if (st.status_code === 'ERROR') throw new Error(video ? 'Instagram non accetta questo video (serve un MP4 H.264, meglio verticale 9:16, fino a 15 minuti).' : 'Instagram non è riuscito a preparare le immagini.');
        if (i === (video ? 34 : 14)) throw new Error('Instagram ci mette troppo a preparare il post: riprova tra qualche minuto.');
        await new Promise((r) => setTimeout(r, video ? 6000 : 2000));
      }
      const media = await post(`${acc.utente}/media_publish`, { creation_id: container });
      const info = await getJson(`${IG}/${media.id}?fields=permalink&access_token=${t}`).catch(() => ({}));
      return { link: info.permalink || 'https://www.instagram.com/', nota: 'Pubblicato su Instagram.' };
    },
  },

  linkedin: {
    configurato: (env) => !!(env.LINKEDIN_CLIENT_ID && env.LINKEDIN_CLIENT_SECRET),
    authorize: (env, redirect, state) => `https://www.linkedin.com/oauth/v2/authorization?${new URLSearchParams({
      response_type: 'code', client_id: env.LINKEDIN_CLIENT_ID, redirect_uri: redirect, state, scope: 'openid profile w_member_social',
    })}`,
    async scambia(env, code, redirect) {
      const tok = await form('https://www.linkedin.com/oauth/v2/accessToken', {
        grant_type: 'authorization_code', code, redirect_uri: redirect, client_id: env.LINKEDIN_CLIENT_ID, client_secret: env.LINKEDIN_CLIENT_SECRET,
      });
      const me = await getJson('https://api.linkedin.com/v2/userinfo', { Authorization: `Bearer ${tok.access_token}` });
      return { utente: me.sub, nome: me.name || 'LinkedIn', token: tok.access_token, scade: Date.now() + (tok.expires_in || 5184000) * 1000 };
    },
    async rinnova(env, acc) {
      if (acc.scade < Date.now()) throw new Error('Il collegamento con LinkedIn è scaduto: ricollegalo da Social → Account social.');
      return acc;
    },
    async pubblica(env, acc, { immagini, video, testo, titolo }) {
      const author = `urn:li:person:${acc.utente}`;
      const headers = {
        Authorization: `Bearer ${acc.token}`, 'Content-Type': 'application/json',
        'LinkedIn-Version': env.LINKEDIN_VERSION || '202510', 'X-Restli-Protocol-Version': '2.0.0',
      };
      const ids = [];
      if (video) {
        const file = await fetch(SITE_URL + video);
        if (!file.ok) throw new Error('Non trovo il video sul sito.');
        const bytes = await file.arrayBuffer();
        const init = await fetch('https://api.linkedin.com/rest/videos?action=initializeUpload', {
          method: 'POST', headers,
          body: JSON.stringify({ initializeUploadRequest: { owner: author, fileSizeBytes: bytes.byteLength, uploadCaptions: false, uploadThumbnail: false } }),
        });
        const data = await init.json().catch(() => ({}));
        if (!init.ok) throw new Error(`LinkedIn: ${data.message || `errore ${init.status}`}`);
        // Il video si carica a pezzi; ogni pezzo restituisce un codice (ETag) che serve per chiudere il caricamento.
        const parti = [];
        for (const u of data.value.uploadInstructions) {
          const put = await fetch(u.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/octet-stream' }, body: bytes.slice(u.firstByte, u.lastByte + 1) });
          if (!put.ok) throw new Error(`LinkedIn non ha accettato il video (${put.status}).`);
          parti.push(put.headers.get('etag'));
        }
        const fine = await fetch('https://api.linkedin.com/rest/videos?action=finalizeUpload', {
          method: 'POST', headers,
          body: JSON.stringify({ finalizeUploadRequest: { video: data.value.video, uploadToken: data.value.uploadToken || '', uploadedPartIds: parti } }),
        });
        if (!fine.ok) throw new Error(`LinkedIn non è riuscito a chiudere il caricamento del video (${fine.status}).`);
        ids.push(data.value.video);
      }
      for (const p of video ? [] : immagini.slice(0, 10)) {
        const init = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
          method: 'POST', headers, body: JSON.stringify({ initializeUploadRequest: { owner: author } }),
        });
        const data = await init.json().catch(() => ({}));
        if (!init.ok) throw new Error(`LinkedIn: ${data.message || `errore ${init.status}`}`);
        const img = await fetch(SITE_URL + p);
        if (!img.ok) throw new Error(`Non trovo la grafica ${p}.`);
        const up = await fetch(data.value.uploadUrl, { method: 'PUT', headers: { Authorization: `Bearer ${acc.token}` }, body: await img.arrayBuffer() });
        if (!up.ok) throw new Error(`LinkedIn non ha accettato l'immagine (${up.status}).`);
        ids.push(data.value.image);
      }
      const content = video ? { media: { id: ids[0], title: String(titolo || '').slice(0, 200) } }
        : ids.length === 1 ? { media: { id: ids[0] } } : { multiImage: { images: ids.map((id) => ({ id })) } };
      const res = await fetch('https://api.linkedin.com/rest/posts', {
        method: 'POST', headers,
        body: JSON.stringify({
          author, commentary: linkedinText(testo), visibility: 'PUBLIC',
          distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] },
          content, lifecycleState: 'PUBLISHED', isReshareDisabledByAuthor: false,
        }),
      });
      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(`LinkedIn: ${e.message || `errore ${res.status}`}`);
      }
      const urn = res.headers.get('x-restli-id');
      return { link: urn ? `https://www.linkedin.com/feed/update/${urn}/` : 'https://www.linkedin.com/feed/', nota: 'Pubblicato su LinkedIn.' };
    },
  },

  tiktok: {
    configurato: (env) => !!(env.TIKTOK_CLIENT_KEY && env.TIKTOK_CLIENT_SECRET),
    authorize: (env, redirect, state) => `https://www.tiktok.com/v2/auth/authorize/?${new URLSearchParams({
      client_key: env.TIKTOK_CLIENT_KEY, response_type: 'code', scope: 'user.info.basic,video.upload', redirect_uri: redirect, state,
    })}`,
    async scambia(env, code, redirect) {
      const tok = await form('https://open.tiktokapis.com/v2/oauth/token/', {
        client_key: env.TIKTOK_CLIENT_KEY, client_secret: env.TIKTOK_CLIENT_SECRET, code, grant_type: 'authorization_code', redirect_uri: redirect,
      });
      const me = await getJson('https://open.tiktokapis.com/v2/user/info/?fields=display_name', { Authorization: `Bearer ${tok.access_token}` }).catch(() => ({}));
      return {
        utente: tok.open_id, nome: me.data?.user?.display_name || 'TikTok', token: tok.access_token, scade: Date.now() + (tok.expires_in || 86400) * 1000,
        refresh: tok.refresh_token, refresh_scade: Date.now() + (tok.refresh_expires_in || 31536000) * 1000,
      };
    },
    // La chiave di TikTok dura un giorno: si rinnova con quella di riserva, che dura un anno.
    async rinnova(env, acc) {
      if (acc.scade - Date.now() > 10 * 60_000) return acc;
      const tok = await form('https://open.tiktokapis.com/v2/oauth/token/', {
        client_key: env.TIKTOK_CLIENT_KEY, client_secret: env.TIKTOK_CLIENT_SECRET, grant_type: 'refresh_token', refresh_token: acc.refresh,
      });
      return { ...acc, token: tok.access_token, scade: Date.now() + (tok.expires_in || 86400) * 1000, refresh: tok.refresh_token || acc.refresh };
    },
    // Le foto vanno nelle bozze di TikTok (dall'app si aggiunge la musica e si pubblica).
    // TikTok prende le immagini solo dal dominio verificato, cioè dal sito: devono essere già online.
    async pubblica(env, acc, { immagini, video, testo, titolo }) {
      if (video) {
        // Video: va nelle bozze (inbox) di TikTok; testo e musica si aggiungono dall'app.
        const res = await fetch('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', {
          method: 'POST',
          headers: { Authorization: `Bearer ${acc.token}`, 'Content-Type': 'application/json; charset=UTF-8' },
          body: JSON.stringify({ source_info: { source: 'PULL_FROM_URL', video_url: SITE_URL + video } }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || (data.error && data.error.code !== 'ok')) throw new Error(`TikTok: ${data.error?.message || `errore ${res.status}`}`);
        return { link: 'https://www.tiktok.com/', nota: 'Video mandato nelle bozze di TikTok: apri l’app, incolla il testo e pubblica.' };
      }
      const urls = immagini.slice(0, 35).map((p) => SITE_URL + p);
      const res = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
        method: 'POST',
        headers: { Authorization: `Bearer ${acc.token}`, 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({
          post_info: { title: String(titolo || '').slice(0, 90), description: String(testo || '').slice(0, 4000) },
          source_info: { source: 'PULL_FROM_URL', photo_cover_index: 0, photo_images: urls },
          post_mode: 'MEDIA_UPLOAD', media_type: 'PHOTO',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || (data.error && data.error.code !== 'ok')) throw new Error(`TikTok: ${data.error?.message || `errore ${res.status}`}`);
      return { link: 'https://www.tiktok.com/', nota: 'Mandato nelle bozze di TikTok: apri l’app, aggiungi la musica e pubblica.' };
    },
  },
};

async function social(request, env, url) {
  const [, , azione, rete] = url.pathname.split('/');
  const redirect = `${url.origin}/social/callback/${rete}`;

  // Ritorno dal login del social: niente sessione del pannello, vale lo "state" firmato.
  if (azione === 'callback') {
    const back = (q) => Response.redirect(`${PANEL}#/social/account?${new URLSearchParams(q)}`, 302);
    const st = await verify(env, url.searchParams.get('state'));
    if (!st || st.use !== 'social' || st.rete !== rete || !RETI[rete]) return back({ errore: 'Collegamento non valido o scaduto: riprova.' });
    const code = (url.searchParams.get('code') || '').replace(/#_$/, '');
    if (!code) return back({ errore: url.searchParams.get('error_description') || 'Accesso annullato.' });
    try {
      const acc = await RETI[rete].scambia(env, code, redirect);
      await salvaAccount(env, rete, acc);
      return back({ collegato: rete });
    } catch (e) {
      return back({ errore: e.message });
    }
  }

  if (!(await session(request, env))) return json({ error: 'Sessione scaduta: accedi di nuovo.' }, 401);
  if (!env.DB) return json({ error: 'Manca il database D1 nel Worker.' }, 503);
  await ensureSocial(env);

  if (azione === 'stato') {
    const { results } = await env.DB.prepare('SELECT rete, nome, scade FROM social_account').all();
    const per = Object.fromEntries(results.map((r) => [r.rete, r]));
    return json(Object.fromEntries(Object.entries(RETI).map(([id, r]) => [id, {
      configurato: r.configurato(env),
      collegato: !!per[id] && (id !== 'linkedin' || per[id].scade > Date.now()),
      nome: per[id]?.nome || null,
      scade: per[id]?.scade || null,
      ritorno: `${url.origin}/social/callback/${id}`,
    }])));
  }
  if (azione === 'inizia' && RETI[rete]) {
    if (!RETI[rete].configurato(env)) return json({ error: 'Mancano le chiavi di questo social su Cloudflare.' }, 400);
    const state = await sign(env, { use: 'social', rete, exp: Date.now() + 10 * 60_000 });
    return json({ url: RETI[rete].authorize(env, redirect, state) });
  }
  if (azione === 'scollega' && RETI[rete]) {
    await env.DB.prepare('DELETE FROM social_account WHERE rete = ?').bind(rete).run();
    return json({ ok: true });
  }
  if (azione === 'pubblica' && request.method === 'POST') {
    const { reti, immagini = [], video, testo, titolo } = await request.json().catch(() => ({}));
    const ok = (p, ext) => typeof p === 'string' && new RegExp(`^/assets/(social|uploads)/[\\w.-]+\\.(${ext})$`, 'i').test(p);
    if (!Array.isArray(reti) || !Array.isArray(immagini) || (video ? !ok(video, 'mp4|mov') : !immagini.length || !immagini.every((p) => ok(p, 'jpe?g')))) {
      return json({ error: 'Richiesta non valida.' }, 400);
    }
    // Un social per volta: Cloudflare gratuito permette al massimo 50 richieste esterne per chiamata.
    if (reti.length !== 1) return json({ error: 'Pubblica un social per volta.' }, 400);
    const esiti = {};
    for (const rete of reti.filter((r) => RETI[r])) {
      try {
        let acc = await env.DB.prepare('SELECT * FROM social_account WHERE rete = ?').bind(rete).first();
        if (!acc) throw new Error('Account non collegato.');
        const nuovo = await RETI[rete].rinnova(env, acc);
        if (nuovo.token !== acc.token) await salvaAccount(env, rete, nuovo);
        acc = nuovo;
        esiti[rete] = { ok: true, ...(await RETI[rete].pubblica(env, acc, { immagini, video: video || null, testo: String(testo || ''), titolo })) };
      } catch (e) {
        esiti[rete] = { ok: false, errore: e.message };
      }
    }
    return json({ esiti });
  }
  return json({ error: 'Not found' }, 404);
}

let socialReady = false;
async function ensureSocial(env) {
  if (socialReady) return;
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS social_account (
    rete TEXT PRIMARY KEY, utente TEXT, nome TEXT, token TEXT, scade INTEGER, refresh TEXT, refresh_scade INTEGER, aggiornato INTEGER
  )`).run();
  socialReady = true;
}

async function salvaAccount(env, rete, a) {
  await ensureSocial(env);
  await env.DB.prepare(`INSERT INTO social_account (rete, utente, nome, token, scade, refresh, refresh_scade, aggiornato)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(rete) DO UPDATE SET utente = excluded.utente, nome = excluded.nome, token = excluded.token,
    scade = excluded.scade, refresh = excluded.refresh, refresh_scade = excluded.refresh_scade, aggiornato = excluded.aggiornato`)
    .bind(rete, a.utente || '', a.nome || '', a.token, a.scade || 0, a.refresh || null, a.refresh_scade || null, Date.now()).run();
}

// LinkedIn legge alcuni simboli come comandi: vanno "protetti" con la barra, altrimenti il testo si tronca.
function linkedinText(text) {
  return String(text).replace(/[\\|{}@[\]()<>#*_~]/g, (c) => `\\${c}`);
}

async function form(url, params) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(params) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(socialError(data, res.status));
  return data.data && data.data.access_token ? data.data : data;
}

async function getJson(url, headers = {}) {
  const res = await fetch(url, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) throw new Error(socialError(data, res.status));
  return data;
}

function socialError(data, status) {
  const e = data.error;
  return (typeof e === 'object' ? e.message || e.error_user_msg : null) || data.error_description || data.error_message || data.message || (typeof e === 'string' ? e : null) || `errore ${status}`;
}
