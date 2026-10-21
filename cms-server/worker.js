// Server del pannello /admin. Gira su Cloudflare Workers (gratis), nel Worker "portfolio-login".
// Fa due cose:
//   1. accesso con Google o con magic link: controlla che sia la tua email e apre una sessione di 30 giorni;
//   2. fa da ponte verso GitHub: il pannello chiede di leggere/salvare i file e questo Worker
//      lo fa con la chiave GitHub, che così non esce mai da Cloudflare.
//
// Da impostare nel Worker, in Settings → Variables and Secrets:
//   EMAIL           l'unica email che può entrare (la stessa dell'account Resend)
//   GITHUB_TOKEN    token GitHub con permesso Contents: Read and write sulla repo del sito
//   RESEND_API_KEY  chiave di resend.com (serve a spedire la mail)

const REPO = 'likemommademe/likemommademe.github.io';
// ID client di Google Cloud (progetto "portfolio"): non è segreto.
const GOOGLE_CLIENT_ID = '821581591121-dp0scd35mtevlv0m07fhqi39d2nmo9gu.apps.googleusercontent.com';
const ALLOWED_ORIGINS = ['https://likemommademe.github.io', 'http://localhost:8080'];
const LINK_MINUTES = 15;
const SESSION_DAYS = 30;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin');
    const cors = ALLOWED_ORIGINS.includes(origin)
      ? {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
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
      else if (url.pathname.startsWith('/github/')) res = await github(request, env, url);
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
  if (String(email || '').trim().toLowerCase() !== env.EMAIL.trim().toLowerCase()) {
    return json({ error: 'Questa email non è autorizzata ad accedere.' }, 403);
  }

  const token = await sign(env, { use: 'link', exp: Date.now() + LINK_MINUTES * 60_000 });
  const link = `${back}#login=${token}`;
  const when = new Date().toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit' });
  const where = [request.cf?.city, request.cf?.country].filter(Boolean).join(', ');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Portfolio <onboarding@resend.dev>',
      to: env.EMAIL,
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
  return startSession(env);
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
  if (data.email.toLowerCase() !== env.EMAIL.trim().toLowerCase()) {
    return json({ error: `L'account ${data.email} non è autorizzato ad accedere.` }, 403);
  }
  return startSession(env);
}

async function startSession(env) {
  const session = await sign(env, { use: 'session', exp: Date.now() + SESSION_DAYS * 86_400_000 });
  return json({ session, email: env.EMAIL });
}

// Inoltra a GitHub le richieste del pannello, solo per la repo del sito.
async function github(request, env, url) {
  const auth = request.headers.get('Authorization') || '';
  const data = await verify(env, auth.replace(/^Bearer /, ''));
  if (!data || data.use !== 'session') return json({ error: 'Sessione scaduta: rientra con un nuovo link.' }, 401);

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
