# Portfolio LIKEMOMMADEME: GitHub e collegamento del Mac

Tutto quello che riguarda GitHub per il sito portfolio: la repository, la pubblicazione con GitHub Pages, il collegamento del Mac, le chiavi e come risolvere i problemi.

Il pannello (CMS), il server su Cloudflare e il resto del sito sono descritti in `riassunto-cms.md`, nella stessa cartella.

> **Per Claude, in un'altra chat**: il progetto è nella cartella `~/Desktop/Claude/portfolio` del Mac. Prima di lavorare lancia `git pull`, perché anche il pannello pubblica modifiche. Ogni modifica richiesta va pubblicata subito su `main` (commit + push), senza chiedere conferma. Scrivi in italiano. Questo file è pubblico come tutta la repo: niente chiavi né password, qui o in chat.

---

## 1. In breve

- **Account GitHub**: `likemommademe`.
- **Repo**: `likemommademe/likemommademe.github.io`, **pubblica**.
- **Sito**: https://likemommademe.github.io, pubblicato da **GitHub Pages** con Jekyll.
- **Branch**: `main`. Tutto quello che finisce su `main` va online in 1–2 minuti.
- **Dal Mac** si pubblica con **GitHub CLI** (`~/.local/bin/gh`), già collegato all'account.

---

## 2. La repository

- Creata come `PORTFOLIO`, poi **rinominata `likemommademe.github.io`**. Con questo nome speciale GitHub pubblica il sito all'indirizzo principale https://likemommademe.github.io, senza niente dopo.
- **Pubblica** perché GitHub Pages con l'account gratuito lo richiede. Di conseguenza, nella repo e nel pannello vanno solo informazioni da mostrare sul sito. I dati privati dei clienti (contatti, preventivi, contratti) vanno tenuti altrove.
- I file della repo sono anche il database dei contenuti: ogni modifica, dal pannello o dal Mac, resta nella cronologia di GitHub.
- Sull'account c'è anche la repo **Dieta**, separata: non va toccata. Anche lei è **pubblica**, quindi chiunque può leggerne i file.
- Il branch `main` **non è protetto**: va bene così, perché ci scrivono sia il pannello sia il Mac.

---

## 3. GitHub Pages

- Si è attivato da solo grazie al nome `likemommademe.github.io`: non c'è niente da impostare.
- **Impostazioni attuali**: Settings → Pages → Source = **GitHub Actions**. **HTTPS obbligatorio** già attivo.
- A ogni modifica su `main` (anche quelle del pannello), il workflow `.github/workflows/pages.yml` ("Pubblica il sito") ricostruisce il sito con **Jekyll** e lo pubblica, in 1–2 minuti. Si vede nella scheda **Actions** della repo: se una pubblicazione fallisce, l'errore compare lì. Si può rilanciare a mano da Actions → Pubblica il sito → Run workflow.
- Prima dell'11/11/2026 si usava la modalità classica "Deploy from a branch" (processo automatico `pages-build-deployment`). Per tornarci: Settings → Pages → Source = Deploy from a branch, `main`, `/`.
- Il file `admin/stato.json` dice quale versione è online. Il pannello lo usa per mostrare "Sito aggiornato" oppure "In pubblicazione…".
- **Dominio**: per ora nessuno. Se un giorno lo vorrai (per esempio da SiteGround), si collega da **Settings → Pages → Custom domain**: https://github.com/likemommademe/likemommademe.github.io/settings/pages

---

## 4. Il collegamento del Mac

- **Cartella**: `~/Desktop/Claude/portfolio`, collegata alla repo (`origin` → https://github.com/likemommademe/likemommademe.github.io.git). Il branch `main` segue `origin/main`.
- **Installati sul Mac**: git 2.50 (quello di Apple, già presente) e **GitHub CLI** 2.103 (`~/.local/bin/gh`). Niente Homebrew né Node.
- **Accesso**: in `~/.gitconfig` git è impostato per usare GitHub CLI come chiave a ogni pubblicazione. Vale per tutte le repo dell'account. GitHub CLI ha i permessi `repo`, `workflow`, `gist` e `read:org`: può quindi scrivere su **tutte** le repo dell'account, anche Dieta.
- **Firma delle modifiche**: nome `likemommademe`, email privata di GitHub `332392784+likemommademe@users.noreply.github.com`. La tua email personale non compare. La firma è impostata **solo in questa cartella** (`.git/config`), non in generale: un'altra repo sul Mac non l'avrebbe.
- **Ultima verifica**: 11/11/2026. GitHub CLI collegato, cartella allineata con GitHub, ultima pubblicazione di Pages riuscita.

### Come si pubblica
1. `git pull` per scaricare le modifiche fatte dal pannello.
2. Modifiche ai file.
3. Commit e push su `main`. Il sito si aggiorna in 1–2 minuti.
4. Se sono cambiati i file del pannello (`admin/cms.js`, `admin/cms.css`, `admin/schema.js`), aumentare il numero `?v=` in `admin/index.html` (ora è `?v=23`).

Per provare il sito prima di pubblicarlo, Claude usa una copia temporanea di Jekyll, che non resta installata sul Mac.

### Le due strade per modificare il sito
- **Dal pannello** (`/admin`): ogni salvataggio diventa una modifica su GitHub, fatta dal server su Cloudflare con la chiave **CMS**.
- **Da Claude, sul Mac**: per codice, grafica e struttura, con GitHub CLI. Il `git pull` iniziale evita che le due strade si pestino i piedi.

---

## 5. Chiavi e app autorizzate

| Nome | Dove si vede su GitHub | A cosa serve | Cosa fare |
|---|---|---|---|
| **CMS** | Fine-grained tokens: https://github.com/settings/personal-access-tokens | La usa il pannello. È salvata su Cloudflare come `GITHUB_TOKEN` | **Non cancellarla** |
| **GitHub CLI** | App autorizzate: https://github.com/settings/applications | La usa Claude dal Mac per pubblicare | **Non revocarla** |
| **Visual Studio Code** | App autorizzate (Authorized OAuth Apps) | Collegamento di VS Code a GitHub | Si può lasciare |
| **Portfolio likemommademe** | Non c'è più | Vecchia chiave del Mac, finita in chat | Cancellata l'11/11/2026 |
| **decapbridge** | Non c'è più | Resto della prova con Decap CMS | Già assente (verificato l'11/11/2026) |

**CMS** è l'unica chiave creata a mano. In Tokens (classic) non ce ne sono.

---

## 6. Come si fa…

**…ricollegare il Mac a GitHub** (se la pubblicazione dal Mac smette di funzionare)
1. In VS Code apri il terminale (**Terminale → Nuovo terminale**) e lancia:
   ```bash
   ~/.local/bin/gh auth login --hostname github.com --git-protocol https --web
   ```
2. Copia il codice che compare, premi Invio, incollalo nella pagina di GitHub che si apre nel browser e autorizza.
3. Non serve creare chiavi a mano né incollare niente in chat.

Per controllare il collegamento: `~/.local/bin/gh auth status` deve dire "Logged in to github.com account likemommademe".

**…sostituire la chiave CMS** (se il pannello dice "La chiave GitHub salvata su Cloudflare non funziona più")
1. Crea una chiave nuova: https://github.com/settings/personal-access-tokens/new. Nome `CMS`, scadenza **No expiration**, solo la repo **likemommademe.github.io**, permesso **Contents: Read and write**.
2. Su Cloudflare, nelle impostazioni del Worker `portfolio-login`, sostituisci `GITHUB_TOKEN` e clicca **Deploy**: https://dash.cloudflare.com/?to=/:account/workers/services/view/portfolio-login/production/settings
3. Rientra nel pannello: dopo il cambio della chiave te lo chiede, è normale.

**…collegare un dominio**
1. Compra il dominio (per esempio da SiteGround).
2. Su GitHub: **Settings → Pages → Custom domain**, scrivi il dominio e salva.
3. Dal fornitore del dominio imposta i record DNS indicati da GitHub, poi attiva **Enforce HTTPS**.

---

## 7. Cose facoltative ancora da fare

- **Portachiavi del Mac**: togliere la copia della chiave cancellata. Apri **Accesso Portachiavi**, cerca `github.com` ed elimina la voce con utente `likemommademe`. Non dà problemi se resta. Attenzione a non toccare GitHub CLI, che usa una voce sua.
- **DecapBridge**: eliminare il sito del portfolio su https://decapbridge.com. Su GitHub non c'è più niente collegato.
- **README.md da riscrivere**: è la prima cosa che si vede aprendo la repo su GitHub, ma descrive ancora il vecchio pannello Sveltia con l'accesso tramite token.
- **Skill e connettori** per Claude e GitHub utili per UI, UX e animazioni del sito, richiesti "alla fine di tutto".

---

## 8. Cronologia

| Data | Cosa |
|---|---|
| 21/10/2026 | Repo creata come `PORTFOLIO`, poi rinominata `likemommademe.github.io`. GitHub Pages attivo |
| 21/10/2026 | Chiave **CMS** creata per il pannello, salvata su Cloudflare |
| 11/11/2026 | Progetto spostato in `~/Desktop/Claude/portfolio`. Pubblicazione dal Mac tramite GitHub CLI, chiave "Portfolio likemommademe" cancellata |
| 11/11/2026 | Verificato che la chiave decapbridge non esiste più. Collegamento del Mac ricontrollato: funziona |
| 11/11/2026 | Istruzioni di GitHub spostate in questo file |
| 11/11/2026 | Tutto ricontrollato su GitHub: impostazioni di Pages, permessi di GitHub CLI, firma solo nella cartella del portfolio, Dieta pubblica, README superato |
| 11/11/2026 | Pubblicazioni bloccate dalle 20:35 per un guasto di GitHub (incidente ufficiale su Actions e Pages). Pages passato al workflow `pages.yml` nella repo |

---

## 9. Link utili

- Repo: https://github.com/likemommademe/likemommademe.github.io
- Impostazioni di GitHub Pages: https://github.com/likemommademe/likemommademe.github.io/settings/pages
- Chiavi (fine-grained tokens): https://github.com/settings/personal-access-tokens
- App autorizzate: https://github.com/settings/applications
- Pubblicazioni del sito (Actions): https://github.com/likemommademe/likemommademe.github.io/actions
- Sito: https://likemommademe.github.io
