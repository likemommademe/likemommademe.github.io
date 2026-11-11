# Portfolio LIKEMOMMADEME: riassunto di sito, CMS e GitHub

Riassunto di tutto quello che abbiamo deciso e costruito per il sito portfolio e il suo pannello (CMS): struttura, file, servizi usati e prossimi passi. GitHub e il collegamento del Mac sono in `riassunto-github.md`.

---

## 1. In breve

- **Sito**: https://likemommademe.github.io, costruito con Jekyll e pubblicato da GitHub Pages.
- **Pannello (CMS)**: https://likemommademe.github.io/admin/, fatto su misura da zero.
- **Accesso al pannello**: con **Accedi con Google** oppure con il **magic link** via email. Entrano solo le email autorizzate.
- **Dove stanno i contenuti**: nella repo GitHub `likemommademe/likemommademe.github.io`. Una copia è sul Mac, in `~/Desktop/Claude/portfolio`.
- **Server del pannello**: il Worker **portfolio-login** su Cloudflare (gratis). Custodisce la chiave GitHub, gestisce l'accesso e conta le visite.

---

## 2. GitHub e collegamento del Mac

Repository, GitHub Pages, pubblicazione dal Mac, chiavi e istruzioni sono in un file a parte: **`riassunto-github.md`**, nella stessa cartella.

### Le due strade per modificare i contenuti
- **Dal pannello** (`/admin`): ogni salvataggio diventa una modifica su GitHub, fatta dal server su Cloudflare.
- **Da Claude, sul Mac**: per codice, grafica e struttura. Prima di lavorare Claude scarica le modifiche fatte dal pannello, così le due strade non si pestano i piedi.

---

## 3. Decisioni prese (e strade scartate)

- **Solo GitHub per sito e contenuti**: niente Vercel, Sanity o altri servizi complicati.
- **Login col token GitHub**: scartato, troppo complicato da usare ogni volta.
- **Sveltia CMS e Decap CMS**, pannelli già pronti: scartati perché non piacevano e non offrivano un accesso con Google senza passare da GitHub.
- **DecapBridge**: dava l'accesso con Google, ma solo insieme a Decap. Scartato insieme a Decap.
- **Magic link con la "finestrella"** (la prima versione): non funzionava bene, sostituito.
- **Scelta finale: un CMS fatto su misura**, nello stile del pannello di esempio (login con logo ed email, barra laterale a gruppi, dashboard a riquadri), con accesso Google più magic link e server su Cloudflare.
- **Grafica del pannello**: accento con sfumatura viola → fucsia → arancio al posto del verde oliva. In alto a sinistra **LIKEMOMMADEME** con sotto **CMS**.
- **Categorie con i nomi del marketing**: Illustration, Motion Design, Generative AI, Branding, Web Design.
- **Clienti divisi per settore e paese.**
- **Niente database a parte per i contenuti**: i file su GitHub sono già il database, con la cronologia di ogni modifica. Un database vero (D1 su Cloudflare) serve solo per le visite al sito.
- **Statistiche senza cookie** al posto di Google Analytics, così non serve il banner dei cookie. Contro: **l'età dei visitatori non si può avere**.
- **Foto convertite automaticamente in WebP** al caricamento, con impostazioni modificabili da Sistema → Immagini.
- **La repo è pubblica**: nel pannello vanno solo informazioni da mostrare sul sito. I dati privati dei clienti (contatti, preventivi, contratti) vanno tenuti altrove, in un gestionale privato.
- **Ogni modifica richiesta viene messa online subito**, senza chiedere conferma.

---

## 4. Struttura del sito

| Pagina | Indirizzo | Contenuto |
|---|---|---|
| Home | `/` | Header animato (lo showreel, che avanza con lo scroll), poi frase di apertura e progetti scelti, nell'ordine deciso nel pannello |
| Work | `/work/` | Elenco delle categorie |
| Categoria | `/work/<categoria>/` | Progetti della categoria, nell'ordine deciso nel pannello |
| Progetto | `/progetti/<progetto>/` | Copertina, descrizione, galleria di foto e video, crediti |
| About | `/about/` | Testo, foto, loghi dei clienti, contatti |
| Privacy | `/privacy/` | Richiesta da Google per l'accesso con Google |
| Showreel | `/lab/showreel.html` | L'animazione dell'header, anche da sola: guidata dallo scroll, `?play` la fa partire da sola. La home la carica con `?embed` e le passa la posizione dello scroll |

I progetti in **bozza** non compaiono da nessuna parte sul sito.

---

## 5. Il pannello (CMS)

### Accesso
- **Accedi con Google**, oppure **magic link**: scrivi l'email e ricevi un link valido 15 minuti. La mail spesso finisce nello **spam**, perché parte da un indirizzo di prova di Resend: conviene segnarla come "Non è spam".
- Una volta dentro resti collegata/o **30 giorni** su quel browser.
- **Chi può entrare**: le email scritte in `EMAIL` su Cloudflare, separate da virgola. Chi viene tolto dalla lista viene buttato fuori subito. Il magic link arriva solo all'email dell'account Resend: le altre persone entrano con Google.

### Menu
- **Generale** → Dashboard
- **Contenuti** → Progetti, Categorie, Clienti, Libreria immagini
- **Pagine** → Home, About me
- **Sistema** → Nome e contatti, Immagini

### Dashboard
- Numeri: progetti attivi, bozze, progetti in home, categorie, clienti.
- **Visite al sito** (ultimi 7, 30 o 90 giorni): grafico giorno per giorno, visitatori unici, nazioni, pagine più viste, da dove arrivano i visitatori, dispositivi. Conta solo il sito pubblico, non il pannello.
- Ultimi progetti e ultime modifiche.
- **Stato del sito**: "Sito aggiornato" oppure "In pubblicazione…". Ogni salvataggio va online in 1–2 minuti.

### Progetti
- Campi: titolo, **Pubblicato sul sito** (spento = bozza), categoria, cliente, anno, copertina, descrizione breve, **SEO** (descrizione per Google e immagine di anteprima per i link condivisi), **Mostra in home**.
- **Case study**, sezioni fisse: **Brief e obiettivo**, **Concept**, **Execution**, **Galleria**, **Coordinamento e processo**, **Risultato**, **Strumenti usati** (caselle da spuntare divise in Adobe, Creative AI e UI/UX, più un campo per gli altri), **Crediti**. Sul sito compaiono solo le sezioni compilate, e in fondo c'è il link al progetto successivo della stessa categoria.
- I progetti nuovi partono come bozza.
- **Galleria**: si trascinano le foto dal Finder (anche tante insieme), si aggiungono video YouTube o Vimeo, si riordinano con la maniglia ⋮⋮, e per ogni elemento si sceglie **Tutta larghezza** o **Metà**.
- **Testo con pulsanti**: grassetto, corsivo, titolo, elenco, link.
- Pulsanti **Duplica**, **Vedi sul sito**, **Elimina**.
- **Ordine dentro ogni categoria**: nella lista scegli la categoria nel filtro e trascini le righe.
- **Ricerca e filtri** per categoria, cliente e stato.

### Lingue (italiano e inglese)
- In cima a ogni modulo con testi c'è l'interruttore **🇮🇹 Italiano / 🇬🇧 English**: mostra i campi di una lingua alla volta. Accanto a English compare quanti testi italiani non hanno ancora la traduzione.
- Hanno la versione inglese: titoli, descrizioni, sezioni del case study, crediti, didascalie della galleria, SEO, nomi e descrizioni delle categorie, Home e About. Nomi dei clienti, immagini, anni e strumenti valgono per tutte e due le lingue.
- Nei file la versione inglese ha lo stesso nome con `_en` in fondo (`title_en`, `body_en`, `didascalia_en`…).
- **Per ora il sito pubblico è solo in italiano**: i testi inglesi restano salvati e compariranno quando faremo le pagine `/en/`.

### Home
- In **Pagine → Home** scegli quali progetti mostrare e li trascini nell'ordine che vuoi.

### Categorie
- Nome, immagine, descrizione. Si riordinano trascinandole, e su ogni riga vedi quanti progetti ha ogni categoria.

### Clienti
- Nome, logo, **settore**, **paese** (con bandiera), sito web.
- Settori: Food & Beverage, Fashion & Luxury, Beauty & Cosmetics, Home & Interior Design, Retail & E-commerce, Tech & Digital, Media & Entertainment, Music, Publishing, Art & Culture, Travel & Hospitality, Sport & Wellness, Automotive, Healthcare & Pharma, Finance & Insurance, Education, Non-profit & Public Sector, Agency & Studio, Altro.
- Filtri per settore e paese, e su ogni riga quanti progetti hai fatto con quel cliente.

### Immagini
- **Libreria immagini**: tutte le foto caricate, dove sono usate, ed eliminazione di quelle non usate.
- **Conversione automatica in WebP** di JPG e PNG, mantenendo la trasparenza.
- **Sistema → Immagini**: attivi o spegni la conversione, scegli la qualità (92% consigliata) e la dimensione massima (2560 px consigliata).
- La conversione funziona da **Chrome**. Da Safari la foto resta nel formato originale.

---

## 6. File del progetto

### Sito (Jekyll)
| File | A cosa serve |
|---|---|
| `_config.yml` | Impostazioni tecniche: indirizzi delle pagine, sezioni, file esclusi |
| `index.html` | Home |
| `work.html` | Pagina Work (elenco categorie) |
| `about.md` | Pagina About (testo modificabile dal pannello) |
| `privacy.md` | Pagina privacy |
| `_layouts/default.html` | Struttura comune: intestazione, piè di pagina, tag SEO e contatore visite |
| `_layouts/progetto.html` | Pagina di un progetto (galleria con formato intera o metà) |
| `_layouts/categoria.html` | Pagina di una categoria |
| `_layouts/about.html` | Pagina About |
| `_includes/card.html` | Riquadro di un progetto negli elenchi |
| `_includes/contatti.html` | Elenco dei contatti |
| `_includes/video.html` | Trasforma un link YouTube o Vimeo in video incorporato |
| `assets/css/style.css` | Grafica del sito |
| `assets/uploads/` | Immagini caricate (per ora 3 immagini SVG di esempio) |

### Contenuti (modificati dal pannello)
| File | Contenuto |
|---|---|
| `_progetti/*.md` | Un file per progetto (per ora: `materia-viva`, `progetto-di-esempio`) |
| `_categorie/*.md` | Un file per categoria: `illustration`, `motion-design`, `generative-ai`, `branding`, `web-design` |
| `_clienti/*.md` | Un file per cliente (per ora: `ikea`, `cliente-di-esempio`) |
| `_data/home.yml` | Frase della home e progetti in home (in ordine) |
| `_data/impostazioni.yml` | Nome e contatti |
| `_data/cms.yml` | Impostazioni delle immagini. Viene creato la prima volta che salvi Sistema → Immagini |

### Pannello
| File | A cosa serve |
|---|---|
| `admin/index.html` | Pagina del pannello. Il numero `?v=` va aumentato a ogni aggiornamento, così il browser carica i file nuovi (ora è `?v=10`) |
| `admin/cms.js` | Tutto il funzionamento del pannello |
| `admin/cms.css` | Grafica del pannello |
| `admin/schema.js` | Elenco di sezioni e campi: per aggiungere un campo si parte da qui |
| `admin/stato.json` | Dice quale versione del sito è online (per "Sito aggiornato / In pubblicazione…") |

### Server
| File | A cosa serve |
|---|---|
| `cms-server/worker.js` | Codice del Worker `portfolio-login` su Cloudflare. **Va incollato a mano su Cloudflare** ogni volta che cambia |

### Altri file
| File | A cosa serve |
|---|---|
| `README.md`, `.gitignore` | File di servizio della repo |
| `riassunto-github.md` | Riassunto di GitHub e del collegamento del Mac. Escluso dal sito |
| `riassunto-cms.md` | Questo riassunto. È escluso dal sito, ma la repo è pubblica: per questo qui non ci sono chiavi né password |

---

## 7. Servizi e account usati

| Servizio | A cosa serve | Note |
|---|---|---|
| **GitHub** | Contenuti e pubblicazione del sito (GitHub Pages) | Repo `likemommademe/likemommademe.github.io`, pubblica |
| **Cloudflare**: Worker `portfolio-login` | Server del pannello: accesso, ponte verso GitHub, statistiche | https://portfolio-login.calfa63.workers.dev |
| **Cloudflare**: database D1 `statistiche` | Visite al sito | Collegato al Worker con il nome `DB` |
| **Resend** | Spedisce la mail del magic link | Piano gratuito: manda mail solo all'email dell'account |
| **Google Cloud**: progetto `portfolio` | Pulsante "Accedi con Google" | App pubblicata |
| **DecapBridge** | Non serve più | Resto della prova con Decap |

### Impostazioni del Worker su Cloudflare
- **Variables and Secrets**: `EMAIL` (email autorizzate, separate da virgola), `GITHUB_TOKEN` (chiave GitHub del pannello), `RESEND_API_KEY` (chiave di Resend).
- **Bindings**: `DB` → D1 **statistiche**. (Il KV `login` della prima versione è stato cancellato l'11/11/2026.)

### Chiavi GitHub
- Vedi `riassunto-github.md`. In breve: la chiave **CMS** è quella del pannello, salvata su Cloudflare come `GITHUB_TOKEN`. **Non cancellarla.**

---

## 8. Come si fa…

**…aggiungere o togliere chi può entrare nel pannello**
1. Apri https://dash.cloudflare.com/?to=/:account/workers/services/view/portfolio-login/production/settings
2. In **Variables and Secrets** clicca la matita accanto a `EMAIL`.
3. Scrivi le email separate da virgola e clicca **Deploy**.

**…aggiornare il codice del server** (quando Claude lo cambia)
1. Claude copia `cms-server/worker.js` negli appunti del Mac.
2. Apri https://dash.cloudflare.com/?to=/:account/workers/services/edit/portfolio-login/production
3. Clicca dentro il codice, poi **Cmd + A**, **Cmd + V** e **Deploy**.

**…sostituire la chiave GitHub** o **ricollegare il Mac a GitHub**
- Le istruzioni sono in `riassunto-github.md`, sezione "Come si fa".

**…vedere la versione nuova del pannello subito**
- Aggiungi `?v=` e un numero in fondo all'indirizzo, per esempio https://likemommademe.github.io/admin/?v=10, oppure premi **Cmd + Shift + R**.

---

## 9. Cronologia

| Data | Cosa |
|---|---|
| 21/10/2026 | Prima bozza del sito con pannello Sveltia |
| 21/10/2026 | Prove di login: token, magic link con finestrella, DecapBridge con Decap |
| 21/10/2026 | Pannello fatto su misura con magic link, poi accesso con Google |
| 21/10/2026 | Pagina privacy, più email autorizzate, nome LIKEMOMMADEME · CMS |
| 21–22/10/2026 | Bozze, riordino, progetti in home, libreria immagini, WebP, SEO, statistiche delle visite, nuove categorie |
| 22/10/2026 | Clienti con settore e paese |
| 11/11/2026 | Questo riassunto. Cartella spostata in `~/Desktop/Claude/portfolio`, KV login cancellato |
| 11/11/2026 | Pannello: testi in italiano e inglese, case study a sezioni, strumenti da spuntare |
| 11/11/2026 | Progetto spostato in `~/Desktop/Claude/portfolio`. Pubblicazione dal Mac tramite GitHub CLI, chiave "Portfolio likemommademe" cancellata |
| 11/11/2026 | Istruzioni di GitHub spostate in `riassunto-github.md` |
| 11/11/2026 | Prima bozza dello showreel in `lab/showreel.html` (HTML, CSS e JavaScript, senza librerie) |
| 11/11/2026 | Showreel più spinto (camera, titoli giganti, generatore AI con cursore, MOTION cinetico) e messo come header della home |
| 11/11/2026 | Showreel v4: Web Design al posto di UI/UX, lettere che cadono intere, menu che nasce da una pallina alla fine dello showreel |
| 11/11/2026 | Showreel v3: intro LIKE · MOM · MADE · ME, Brand con i blocchi 3D, titoli a sinistra che non coprono gli elementi, cinque mondi (via Digital & Social) |

---

## 10. Prossimi passi

1. **Verificare che su Cloudflare ci sia il codice più recente del server**, quello con le statistiche e il salvataggio nuovo. Se il pannello non salva o le visite non compaiono, va rincollato (vedi "Come si fa").
2. **Facoltativo**: eliminare il sito del portfolio su DecapBridge (https://decapbridge.com). La chiave **decapbridge** su GitHub non esiste più e il KV **login** su Cloudflare è già cancellato.
3. **Facoltativo**: sul client Google creare un client secret nuovo ed eliminare quello vecchio, finito in chat per errore. Non lo usiamo, quindi non è urgente.
4. **Sito in inglese**: pagine `/en/` che usano i testi `_en` del pannello, con il selettore di lingua.
5. **Inserire i contenuti veri** al posto di quelli di esempio: Materia Viva, Progetto di esempio, Cliente di esempio e le immagini SVG di prova.
6. **Grafica del sito pubblico**: partire dalle bozze fatte in Claude Design.
7. **Consigli su skill e connettori** per Claude e GitHub utili per UI, UX e animazioni del sito (richiesti "alla fine di tutto").

---

## 11. Link utili

- Sito: https://likemommademe.github.io
- Pannello: https://likemommademe.github.io/admin/
- Repo GitHub: https://github.com/likemommademe/likemommademe.github.io
- Impostazioni di GitHub Pages: https://github.com/likemommademe/likemommademe.github.io/settings/pages
- Worker (impostazioni): https://dash.cloudflare.com/?to=/:account/workers/services/view/portfolio-login/production/settings
- Worker (codice): https://dash.cloudflare.com/?to=/:account/workers/services/edit/portfolio-login/production
- Database D1: https://dash.cloudflare.com/?to=/:account/workers/d1
- Resend (chiavi): https://resend.com/api-keys
- Google Cloud (accesso con Google): https://console.cloud.google.com/auth/clients
- Chiavi GitHub: https://github.com/settings/personal-access-tokens
