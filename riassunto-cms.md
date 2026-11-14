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
- **Grafica del pannello** (dal 14/11/2026): uguale al sito. Color carta di giorno e nero di notte, che seguono l'impostazione del computer; font Cabinet Grotesk e Clash Display; pulsanti a pillola blu che si riempiono di nero; in alto a sinistra **LIKEMOMMADEME** con il quadratino rosa e accanto **CMS**. La vecchia sfumatura viola → arancio non c'è più.
- **File con un errore**: se un file di contenuto è scritto male, nella lista compare **Errore nel file** e solo quel file non si apre. Tutto il resto del pannello funziona. Per sistemarlo si chiede a Claude.
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
| Home | `/` | Header animato (lo showreel, che avanza con lo scroll e gira una volta sola, poi resta fisso dietro come header), poi il motto con l'occhio, la frase di apertura e i progetti scelti, nell'ordine deciso nel pannello, in **scorrimento orizzontale** come bitwip: la sezione resta ferma e i progetti scorrono da destra a sinistra mentre si scende (su telefono si scorrono col dito) |
| Progetti | `/work/` | Tutti i progetti con filtri a tendina (Categoria, Settore e Paese del cliente), vista Mosaico o Griglia. Mosaico = un progetto grande a tutta larghezza (foto 16:9, testo accanto) e poi due affiancati, e si ripete; Griglia = tre colonne uguali |
| Categoria | `/work/<categoria>/` | Progetti della categoria, nell'ordine deciso nel pannello |
| Progetto | `/progetti/<progetto>/` | Come le pagine progetto di bitwip: titolo gigante con la copertina quadrata che si appoggia sul foglio; foglio a colori opposti con "Il progetto", la frase-titolo, la scheda fissa a sinistra (cliente, settore, categoria, anno, strumenti) e il racconto a destra (Brief, Concept, Execution, Coordinamento, Risultato, Crediti); galleria divisa in bande a tutta larghezza, una per ogni **Titolo di sezione** (titolo, due righe, le sue immagini), che alternano i colori; dentro, le foto "Metà" a coppie divise esattamente a metà, con la stessa forma (media delle due foto, la foto riempie la cornice): righe sempre allineate, niente buchi; progetto precedente e successivo affiancati |
| About | `/about/` | Testo, foto, loghi dei clienti, contatti |
| Privacy | `/privacy/` | Richiesta da Google per l'accesso con Google |
| Showreel principale | `/lab/showreel-principale.html` | L'animazione dell'header ("Uno schizzo diventa tutto"), anche da sola: guidata dallo scroll. La home la carica con `?embed` e le passa la posizione dello scroll |
| Showreel secondaria | `/lab/showreel-secondaria.html` | La versione precedente, con i mondi separati: spenta ma salvata. In home si rivede con `?secondaria` |

I progetti in **bozza** non compaiono da nessuna parte sul sito.

---

## 5. Il pannello (CMS)

### Accesso
- **Accedi con Google**, oppure **magic link**: scrivi l'email e ricevi un link valido 15 minuti. La mail spesso finisce nello **spam**, perché parte da un indirizzo di prova di Resend: conviene segnarla come "Non è spam".
- Una volta dentro resti collegata/o **30 giorni** su quel browser.
- **Chi può entrare**: le email scritte in `EMAIL` su Cloudflare, separate da virgola. Chi viene tolto dalla lista viene buttato fuori subito. Il magic link arriva solo all'email dell'account Resend: le altre persone entrano con Google.

### Menu
- **Generale** → Dashboard
- **Contenuti** → Progetti, Categorie, Clienti, Media
- **Pagine** → Home, About me
- **Sistema** → Nome e contatti, Immagini

### Dashboard
- Numeri: progetti attivi, bozze, progetti in home, categorie, clienti.
- **Visite al sito** (ultimi 7, 30 o 90 giorni): grafico giorno per giorno, visitatori unici, nazioni, pagine più viste, da dove arrivano i visitatori, dispositivi. Conta solo il sito pubblico, non il pannello.
- Ultimi progetti e ultime modifiche.
- **Stato del sito**: "Sito aggiornato" oppure "In pubblicazione…". Ogni salvataggio va online in 1–2 minuti.

### Progetti
- Campi: titolo, **Pubblicato sul sito** (spento = bozza), **Anche in** (altre categorie in cui compare il progetto), **Link esterno** e **Testo del pulsante** (pulsante blu nella scheda del progetto, es. la pagina IED), categoria, cliente, anno, copertina, descrizione breve, **SEO** (descrizione per Google e immagine di anteprima per i link condivisi), **Mostra in home**.
- **Case study**: **Frase-titolo del progetto** (la frase grande in cima al racconto), poi le sezioni fisse **Brief e obiettivo**, **Concept**, **Execution**, **Galleria**, **Coordinamento e processo**, **Risultato**, **Strumenti usati** (caselle da spuntare divise in Adobe, Creative AI e UI/UX, più un campo per gli altri), **Crediti**. Sul sito compaiono solo le sezioni compilate, e in fondo c'è il link al progetto successivo della stessa categoria.
- I progetti nuovi partono come bozza.
- **Galleria**: si trascinano le foto dal Finder (anche tante insieme), si aggiungono video YouTube o Vimeo, prototipi Figma (link `figma.com/proto/...`) e file video `.mp4` caricati sul sito (partono da soli, muti e in loop, quando sono sullo schermo; l'anteprima è un'immagine `.webp` con lo stesso nome), e **titoli di sezione** (titolo + due righe) per dividere la galleria in parti. Ogni foto ha un **titolo** e **una riga** che la spiega: su computer compaiono sopra la foto al passaggio del mouse, su telefono restano sotto, si riordinano con la maniglia ⋮⋮, e per ogni elemento si sceglie **Tutta larghezza** o **Metà**.
- **Testo con pulsanti**: grassetto, corsivo, titolo, elenco, link.
- Pulsanti **Duplica**, **Vedi sul sito**, **Elimina**.
- **Più categorie**: la categoria principale più quelle in **Anche in**. Il progetto compare in tutte, con il suo posto in ognuna.
- **Ordine dentro ogni categoria**: nella lista scegli la categoria nel filtro e trascini le righe. Vale anche per le categorie in più: i progetti che ci stanno con **Anche in** hanno l'etichetta "Anche in questa categoria" e un ordine separato (`ordini` nel file). Finché non li riordini, vanno in fondo in ordine alfabetico.
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
- **Media**: tutte le foto caricate, divise per progetto (copertina e galleria), poi categorie, clienti e pagine, e in fondo quelle **non usate**, che si possono eliminare. I file restano tutti in `assets/uploads`: i gruppi dipendono da dove sono usati, quindi una foto usata in due progetti compare in tutti e due. Ricerca per nome e filtro per progetto. Anche la finestra "Dai media", per scegliere una foto, è divisa per progetto.
- **Conversione automatica in WebP** di JPG e PNG, mantenendo la trasparenza.
- **Sistema → Immagini**: attivi o spegni la conversione, scegli la qualità (92% consigliata) e la dimensione massima (2560 px consigliata).
- La conversione funziona da **Chrome**. Da Safari la foto resta nel formato originale.

### Social (gestione dei post)
- Nel menu **Social → Calendario post**: calendario di due settimane con frecce e **Oggi**. Ogni post ha il colore del suo stato: **Bozza**, **Programmato**, **Pubblicato**, **Eliminato**. Il **+** su un giorno crea un post per quel giorno.
- **Da portare sui social**: i progetti pubblicati sul sito e mai usati in un post. Ogni progetto nuovo finisce qui da solo.
- **Nuovo post**: scegli un progetto (ricerca e filtro per categoria; quelli mai usati hanno l'etichetta "Mai sui social") oppure **Carica dal computer** per un post libero.
- **Grafiche 4:5 (1080 × 1350) rifatte in automatico** dal pannello: clicchi le foto nell'ordine delle slide (al massimo 10), la prima diventa la copertina con etichetta, titolo grande e firma LIKEMOMMADEME; le altre hanno la foto, la firma e il numero. Opzioni: con titolo e firma oppure solo foto, sfondo carta o nero, foto intere o che riempiono la slide. Si possono aggiungere foto dal computer, dai Media o trascinandole dal Finder.
- **Testo del post** già scritto dal progetto (frase-titolo, descrizione, link al progetto, hashtag della categoria), con il conteggio dei caratteri e **Copia il testo**.
- **Dove**: Instagram, TikTok, LinkedIn. **Giorno** e **ora**.
- **Social → Account social**: una scheda per Instagram, TikTok e LinkedIn, con lo stato del collegamento, cosa farà, i limiti e i passi per collegarlo. Il pulsante **Collega** si attiva quando le chiavi dell'app di quel social sono su Cloudflare.
- **La pubblicazione per ora è a mano**: **Scarica grafiche** salva i JPG, poi pubblichi e segni il post come **Pubblicato**. La pubblicazione automatica richiede di collegare gli account di Meta e LinkedIn (vedi Prossimi passi).
- I post sono file in `_social/` (non vanno sul sito), le grafiche finite in `assets/social/`. Le foto caricate per un post vanno nei Media, nel gruppo "Post social".

---

## 6. File del progetto

### Sito (Jekyll)
| File | A cosa serve |
|---|---|
| `_config.yml` | Impostazioni tecniche: indirizzi delle pagine, sezioni, file esclusi |
| `index.html` | Home |
| `work.html` | Pagina Progetti: filtri, vista Mosaico/Griglia |
| `assets/js/work.js` | Filtri e cambio vista della pagina Progetti |
| `_data/testi.yml` | Testi fissi delle pagine (menu, footer, pagina Progetti, home). Non ancora nel pannello |
| `about.md` | Pagina About (testo modificabile dal pannello) |
| `privacy.md` | Pagina privacy |
| `_layouts/default.html` | Struttura comune: intestazione, piè di pagina, tag SEO e contatore visite |
| `_layouts/progetto.html` | Pagina di un progetto, sul modello di bitwip. Usa `_includes/progetto-media.html` (foto o video della galleria) e `_includes/progetto-pn.html` (precedente/successivo). Testi fissi in `_data/testi.yml` → `progetto` |
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
| `_progetti/*.md` | Un file per progetto (online: `ikea-voglia-di-casa`, `dcd-studi-estetici`, `etica`, `north-face`, `juniors`, `chrome-nails`, `fight-club`, `architecture`, `lettering-3d`, `scomodo`, `beyou`, `il-mio-marchio`, `animazioni`, `audible-il-classico-si-unisce-al-futuro`, `audible-video-animation`, `blue-origin`, `situation`, `sagra-dei-stringozzi`, `accademia-dei-romani`, `joker`, `model-sheet`, `patch`, `malika-favre`; in bozza gli esempi `materia-viva`, `progetto-di-esempio`) |
| `_categorie/*.md` | Un file per categoria: `illustration`, `motion-design`, `generative-ai`, `branding`, `web-design` |
| `_clienti/*.md` | Un file per cliente (per ora: `ikea`, `cliente-di-esempio`, `ied`, `accademia-dei-romani`, `dcd-studi-estetici`, `etica`) |
| `_data/home.yml` | Frase della home e progetti in home (in ordine) |
| `_data/impostazioni.yml` | Nome e contatti |
| `_data/cms.yml` | Impostazioni delle immagini. Viene creato la prima volta che salvi Sistema → Immagini |

### Pannello
| File | A cosa serve |
|---|---|
| `admin/index.html` | Pagina del pannello. Il numero `?v=` va aumentato a ogni aggiornamento, così il browser carica i file nuovi (ora è `?v=22`) |
| `admin/cms.js` | Tutto il funzionamento del pannello |
| `admin/cms.css` | Grafica del pannello |
| `admin/social.js` | Gestione social: calendario, scelta del progetto, grafiche 4:5, testo del post |
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
- Aggiungi `?v=` e un numero in fondo all'indirizzo, per esempio https://likemommademe.github.io/admin/?v=22, oppure premi **Cmd + Shift + R**.

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
| 11/11/2026 | Font delle categorie: **Yink** da Adobe Fonts, progetto web "LIKEMOMMADEME portfolio" (kit `rtt3djn`, domini likemommademe.github.io e localhost). Showreel: scambio d'importanza tra titolo e scena, passaggi di nuovo collegati |
| 11/11/2026 | Showreel: titoli delle categorie al centro (Cabinet, lettere che salgono dalla maschera, come all'inizio) con l'animazione rimpicciolita sotto, come MOTION. In home le lettere del nome si ingrandiscono al passaggio del mouse e accanto alla freccia compare la pillola SCROLL. Tolto Shrikhand |
| 11/11/2026 | Showreel di nuovo 15 s: ogni titolo entra ed esce con la sua scena (Branding disegnato sotto il monogramma, Illustration scritto dalla matita, Gen AI che si genera, Web Design che si carica come una pagina; MOTION resta cinetico). Font delle categorie: Shrikhand, provvisorio al posto di Baila |
| 11/11/2026 | Showreel 19 s: dopo ogni mondo tutto si raccoglie in un punto e il titolo (BRANDING, ILLUSTRATION, GEN AI, WEB DESIGN) entra al centro come MOTION, poi viene risucchiato. File CSS, JS e showreel con ?v= per evitare la cache |
| 11/11/2026 | Scheletro del sito come bitwip: menu a pillola, giorno/notte con il cerchio, passaggio animato tra le pagine, footer scuro con invito, home con "Cosa faccio", pagina Progetti con filtri e Mosaico/Griglia. Intro dello showreel automatica, poi si continua scorrendo |
| 11/11/2026 | Showreel v4: Web Design al posto di UI/UX, lettere che cadono intere, menu che nasce da una pallina alla fine dello showreel |
| 11/11/2026 | Showreel v3: intro LIKE · MOM · MADE · ME, Brand con i blocchi 3D, titoli a sinistra che non coprono gli elementi, cinque mondi (via Digital & Social) |
| 12/11/2026 | Showreel 17,5 s: dopo Web Design il browser si stringe in un occhio e si compone MORE THAN *meets* THE EYE (la O è l'occhio che fa l'occhiolino); la frase scende e diventa il titolo della prima sezione della home (testo in `_data/testi.yml`, `home.motto`). Poi l'header finale: LIKEMOMMADEME al centro, le categorie ai lati, il cubo e la forma piccoli intorno. Le categorie stanno in basso per tutta l'intro. Tolto il logo in alto a sinistra dello showreel. L'intro gira una volta sola: a fine corsa lo showreel si chiude a un solo schermo e resta fermo dietro la pagina; riparte ricaricando o cliccando HOME / il logo |
| 12/11/2026 | Schermata finale dello showreel: LIKEMOMMADEME grande come all'inizio, la frase sotto, le categorie in basso e intorno, più grandi, il cubo, la faccina che strizza l'occhio, la forma rosa di Gen AI, la timeline di Motion e una finestra web con il cursore. Scorrendo, la frase si stacca dall'header, cresce e si posa come titolo della prima sezione (che ora ha lo stesso colore dell'header). Corretta la L del nome che restava chiara |
| 12/11/2026 | Prima sezione della home di nuovo di colore opposto all'header, con più contenuti come bitwip: testo, secondo testo, link a About me e quattro numeri che si contano da zero (nuovi campi nel pannello → Home: "Testo sotto la frase di apertura", "Testo del link a About me", Numero 1–4 con etichetta; per ora valori di esempio). La frase vola dall'header in un livello fisso, senza tremare, e cambia colore da sola sopra la sezione scura |
| 12/11/2026 | Nero del sito e dello showreel: `#121414`, lo stesso di bitwip (al posto di `#0A0A0A`), con card e linee scure ritinte. Musica della home automatica: prova a partire allo scroll e, se il browser la blocca (lo scroll non conta come gesto), parte al primo clic, tocco o tasto; se la si spegne con "Suono" resta spenta |
| 12/11/2026 | Motto senza Yink: MORE THAN MEETS THE EYE tutto in Cabinet. Occhio più tondo e chiuso; la S di MEETS è un tracciato della penna (ancoraggi e maniglie rosa) e l'ultima E di EYE una timeline (testina rosa e tre clip). In `_data/testi.yml` i segnaposto sono `[occhio]`, `[esse]`, `[timeline]` |
| 12/11/2026 | Motto: al posto della S e della E, due disegni che hanno proprio la forma della lettera: la A di THAN è un compasso, la T di THE una riga a T (segnaposto `[compasso]`, `[squadra]`). Showreel: la finestra di Web Design è di nuovo centrata. Parola speciale dei titoli: **TAN Nimbus**, caricato solo dal computer su cui è installato (`local()` in `style.css`, nessun file pubblicato: la licenza per ora è solo personale); chi non ce l'ha vede Yink. Con la licenza web basterà aggiungere il file woff2 nella stessa `@font-face` |
| 12/11/2026 | Parola speciale dei titoli usata come Baila su bitwip: una parola (al massimo due) dentro un titolo in Cabinet 500, scritta com'è, al 94% del titolo, spaziatura 0, interlinea 0; titoli con spaziatura -0,035em e titoli di sezione larghi al massimo 14 caratteri. Nel pannello si segna con `<em>parola</em>` |
| 12/11/2026 | Motto: MEETS in TAN Nimbus, stampatello e fucsia come l'iride dell'occhio (0,72em: M e T alte esattamente come le maiuscole di Cabinet, misurate), nello showreel e nella prima sezione |
| 12/11/2026 | Motto: tolti il compasso (A) e la riga a T (T). Restano l'occhio al posto della O e MEETS in TAN Nimbus fucsia |
| 12/11/2026 | Motto: un 7 al posto della T di THE ("7HE"), nero, che si nota al secondo sguardo. Per gli screen reader il titolo si legge "More than meets the eye" (`home.motto_leggibile` in `_data/testi.yml`) |
| 13/11/2026 | Showreel: quando la scena è rimpicciolita sotto il titolo (es. WEB DESIGN) ora sta più in alto e non tocca più le categorie in basso |
| 13/11/2026 | Gen AI nuovo: il prompt scrive "Creami un personaggio 3D, stile pop"; dopo il clic la scena si ferma (2,6 s di scroll) e da una nuvola di pixel, passo dopo passo (contatore "passo n/30"), nasce un omino di cubetti 3D con i colori del brand che gira su se stesso, strizza l'occhio e si raccoglie nel pallino rosa che va a Motion. Showreel 20,1 s. Ordine delle categorie nel sito per importanza: Branding, Generative AI, Web Design, Motion Design, Illustration (lo showreel resta nell'ordine della sua catena di passaggi) |
| 13/11/2026 | Gen AI: tornato alla versione di prima (poster con quattro varianti), il personaggio 3D non è piaciuto. Showreel di nuovo 17,5 s. L'ordine delle categorie nel sito resta quello per importanza |
| 13/11/2026 | Prova di un nuovo showreel, `lab/showreel-v2.html` ("Uno schizzo diventa tutto"): un solo occhio attraversa il lavoro nell'ordine del processo: schizzo a matita (Illustration) → segno pulito sulla griglia e blocco 3D con palette e carattere (Branding) → logo di un sito che gli si costruisce intorno (Web Design) → prende vita sulla timeline, con tracciato e fantasmi (Motion) → prompt ed esplosione di 24 varianti (Gen AI) → tutte si richiudono nell'occhio che diventa la O della frase. Intro e finale identici. Si vede in home aggiungendo `?v2` all'indirizzo; la home normale resta con lo showreel attuale |
| 13/11/2026 | Showreel v2: Branding rifatto in 3D (il segno pulito prende spessore e gira come una moneta, atterra sull'icona dell'app; la camera si inclina su una tavola con biglietto da visita, adesivo, campioni colore e carattere); lo schizzo si "inchiostra" nel logo invece di sparire; Motion senza arco (l'occhio prende la rincorsa e scatta in linea retta con i fantasmi); la timeline sale e diventa la barra del prompt, più grande e in inglese ("an eye, 24 variations, pop style", Generate); tolto l'occhio che restava dietro LIKEMOMMADEME. Due link: attuale `lab/showreel.html` (home), nuova `lab/showreel-v2.html` (home con `?v2`) |
| 13/11/2026 | Showreel v2: corretto l'occhio sdoppiato (il logo 3D restava acceso dietro a tutto, fino a Gen AI). Branding senza il giro: il segno atterra sull'icona e la tavola del marchio dura di più. Il giro 3D dell'occhio ora è la seconda chiave di Motion (chiavi: palpebre, giro 3D, scatto con i fantasmi) |
| 13/11/2026 | Showreel v2: un'unica forma d'occhio in tutta la storia (quella della O della frase, con le stesse proporzioni di spessore, iride e pupilla); Motion: dopo l'occhiolino esce la scritta, l'occhio cresce e gira in 3D sopra la timeline, poi si ribalta di taglio e diventa la barra del prompt; Branding: la tavola pende da un lato e poi dall'altro e i suoi oggetti volano nel sito diventandone i pezzi; Gen AI: le varianti escono dalla barra e si richiudono a spirale; tolti i colpi di zoom a ogni battuta (gli "scatti"); sfocatura di movimento sulle mosse veloci; nel finale gli oggetti intorno al nome sono quelli della nuova storia (icona 3D, varianti, matita con lo schizzo, timeline, finestra) |
| 13/11/2026 | Showreel v2: tolte le ultime modifiche che non funzionavano (occhio spesso, volo degli oggetti nel sito, occhio di taglio, sfocatura). Tornati all'occhio e al giro 3D di prima. Motion: occhiolino, giro 3D, saltello (si carica, si allunga, atterra); poi l'occhio si chiude e la linea diventa la barra di Gen AI. Restano: tavola del marchio che pende da un lato all'altro, niente colpi di zoom, varianti che escono dalla barra e si richiudono a spirale, oggetti nuovi nel finale |
| 13/11/2026 | Showreel v2: il titolo WEB DESIGN non tocca più la finestra (titolo più in alto, pagina più in basso finché è piccola, e cresce solo dopo che il titolo è uscito). L'occhio ha grandezze vicine in tutta la storia (circa 200–220) e le stesse proporzioni, appena più tonde, a metà strada verso la O; solo alla fine si arrotonda nella forma della O |
| 13/11/2026 | Showreel v2: il prompt di Gen AI dice "Create an eye, 24 variations, pop style"; barra più lunga (1240 px) |
| 13/11/2026 | Schermata finale (in tutte e due le versioni dello showreel): LIKEMOMMADEME reagisce al mouse come all'inizio, e gli elementi intorno si scostano morbidi dal puntatore, crescono appena e ruotano un poco. La pillola SCROLL resta solo all'inizio |
| 13/11/2026 | Showreel v2: tre proposte per il passaggio Motion → Gen AI, da confrontare con `?mg=1` (il contorno dell'occhio si apre nella barra, l'iride diventa il pulsante, la pupilla il cursore), `?mg=2` (tuffo nella pupilla) e `?mg=3` (l'occhio si rimpicciolisce nel cursore e la barra gli si disegna intorno); in home `?v2&mg=N`. L'occhio finale nasce dalle varianti già con forma e spessore della O. Reazione al mouse nella schermata finale più leggera |
| 13/11/2026 | Showreel v2: scelto il passaggio "la pupilla diventa il cursore" (ora predefinito), con il cursore che nasce al centro dello schermo, la barra del prompt al centro che gli si allarga intorno; poi il cursore scivola all'inizio del campo e la frase si scrive allineata a sinistra. Lo schizzo di Illustration ha la stessa forma del segno di Branding. Finestra del sito più in alto, lontana dalle categorie |
| 13/11/2026 | Showreel v2: lo schizzo e il segno usano la stessa curva; iride e pupilla si riempiono dentro il cerchio a matita; tolto il salto di grandezza quando il logo passa sull'icona; dopo il saltello di Motion la pupilla si riempie di viola (`#8A5CFF`, colore nuovo solo qui) e il puntino diventa il cursore |
| 14/11/2026 | Showreel v2: MOTION animato come nella versione originale (lettere cinetiche che reagiscono alla testina e volano nella timeline); occhiolino più morbido; dopo il saltello la pupilla diventa rosa e si unisce all'iride, poi il contorno dell'occhio diventa la barra del prompt e la pallina rosa il tasto Generate (proposta 4, predefinita); finto desktop più grande e centrato sotto il titolo; un colpo di camera leggero a ogni cambio di mondo |
| 14/11/2026 | Showreel v2: MOTION come l'originale anche nella scena (parola grande sopra la timeline, l'occhio diventa la pallina rosa che ci corre sotto, poi torna occhio per il giro 3D e il saltello); la matita si muove come una mano (tratti che accelerano e rallentano, si alza tra un tratto e l'altro); movimenti di camera per ogni mondo (vicino allo schizzo, spinta sulla tavola, verso il pulsante, segue la pallina, vicino alla barra, indietro sull'esplosione, dentro quando le varianti si richiudono) |
| 14/11/2026 | Showreel v2: le lettere di MOTION entrano quando l'occhio è già la pallina; passaggio a Gen AI senza deformare l'occhio: la pallina rosa si stacca e diventa il tasto Generate, l'occhio diventa l'icona a sinistra del campo e la barra si disegna da lì; in Web Design la camera fa solo un leggero zoom centrato |
| 14/11/2026 | Showreel v2: Web Design senza movimenti di camera e centrato (nello zoom finale la card scivola al centro); MOTION entra subito, appena l'occhio ha lasciato il centro |
| 14/11/2026 | Showreel v2: passaggio Motion → Gen AI: la pupilla si fa rosa, prima svanisce il contorno dell'occhio, la pallina resta un attimo ferma al centro e poi scende a saltelli (tre) fino al posto del tasto Generate, dove si allunga e diventa il tasto; la barra del prompt è più in basso; finto sito centrato in verticale tra menu e categorie |
| 14/11/2026 | Showreel v2: barra del prompt di nuovo al centro; la pallina resta dove si riempie e rimbalza con una fisica realistica (quattro salti sempre più bassi e più brevi, rallenta a ogni contatto, si allunga in volo e si schiaccia negli impatti) fino al tasto Generate; finto sito più basso (640 px) e, nello zoom verso la card, la pagina svanisce prima di toccare le categorie |
| 14/11/2026 | La v2 diventa l'animazione **principale** della home (`lab/showreel-principale.html`); quella di prima è la **secondaria**, spenta ma salvata (`lab/showreel-secondaria.html`, in home con `?secondaria`). I vecchi indirizzi `showreel.html` e `showreel-v2.html` non esistono più |
| 14/11/2026 | Animazione principale, rifinitura: l'occhio atterra nella O in 0,6 s invece di 0,3, con la camera che si ferma prima; i tratti in basso dello schizzo alla stessa velocità di quelli in alto, con i tempi della matita riequilibrati per finire quando entra BRANDING |
| 14/11/2026 | Animazione principale: tolto il colpo di zoom a tempo di musica anche nel finale (faceva "scattare" la frase); l'occhio, appena atterrato nella O, guarda a destra, a sinistra, torna al centro e poi fa l'occhiolino; nella schermata finale continua a guardarsi intorno piano |
| 14/11/2026 | Animazione principale, MOTION più fluido: la pallina parte e arriva morbida; le lettere reagiscono con un'onda a campana che si accende piano (la M non scatta più) e partono per l'uscita dalla loro altezza; ingresso un po' più lungo con scia, inclinazione e sfocatura più contenute |

| 12/11/2026 | Progetti da Behance (behance.net/calfa639164) nel pannello, **in bozza**: Audible (Branding), Audible video animation (Motion Design), Blue Origin (Web Design), Sagra dei Stringozzi (Branding), SITUATION (Web Design), con le copertine originali in WebP. Nuovo cliente **IED** per i progetti di scuola (Audible e Blue Origin non sono clienti veri). Escluso il progetto PORTFOLIO. Behance blocca la lettura automatica delle pagine dei progetti: foto interne e testi vanno ancora aggiunti |
| 12/11/2026 | Contenuti veri da Behance (pagine salvate in `_materiali/`): foto alla massima risoluzione, ritagliate senza titoli e grafiche delle presentazioni, in WebP; testi trascritti dalle slide e riscritti nelle sezioni del case study, in italiano e inglese. Online: Audible, Blue Origin (con il prototipo Figma), Sagra dei Stringozzi (con i video Vimeo), e dal vecchio PORTFOLIO solo Accademia dei Romani, Joker, Model sheet, Patch e Omaggio a Malika Favre (niente About, Social e branding personale). In bozza: Audible spot (manca il video), SITUATION (manca la pagina salvata), animazioni del PORTFOLIO (mancano i video). Esempi in bozza, home con i progetti veri. Nuova pagina progetto sul modello di bitwip, nuovo campo **Frase-titolo del progetto**, prototipi Figma incorporabili nella galleria |
| 12/11/2026 | Aggiunti **IKEA, Voglia di casa** (Generative AI: Workspace, KOMPISHÄNG, Visual Display, dalla cartella `~/Desktop/Claude/IKEA Voglia di casa`; tolti tutti i riferimenti alla candidatura, la parte "Chi sono" e le foto personali) e **SITUATION** (Web Design). Audible spot online anche senza il video. Corrette le foto con parti trasparenti (righe e bande nere: la conversione ora le appoggia su bianco) e tolta da Blue Origin un'immagine troppo piccola |
| 12/11/2026 | About me con la foto (seduto sulla propria testa). IKEA: gallerie divise in quattro sezioni (Workspace, KOMPISHÄNG, Visual Display) con due righe su cosa ho fatto, aggiunte le foto su FRAKTA e su BLÅHAJ. Nel pannello: nuovo elemento della galleria **Titolo di sezione**, e video `.mp4` riproducibili direttamente nella pagina |
| 12/11/2026 | **BeYOU** tolto da IKEA e diventato un progetto a parte in Branding (logo e communication package per un hotel di lusso accessibile) |
| 12/11/2026 | About me: foto con lo sfondo tutto rosso (`06_…_ok.jpg`). IKEA: copertina con la foto su FRAKTA; le foto su FRAKTA e su BLÅHAJ a tutta larghezza nella sezione Visual Display |
| 12/11/2026 | Gallerie dei progetti divise in sezioni, ognuna in una banda con titolo e due righe su cosa ho fatto, a colori alternati (es. SITUATION: L'identità, L'app, I social, In palestra e fuori). Fatto per tutti i 12 progetti. La banda finale con precedente/successivo prende sempre il colore opposto all'ultima |
| 12/11/2026 | Ogni foto delle gallerie ha titolo e una riga di spiegazione (italiano e inglese), in overlay al passaggio del mouse su computer e sotto la foto su telefono. Nuovi campi nel pannello per ogni foto |
| 12/11/2026 | Mosaico (Works e home): la card piccola ha il testo sopra e la foto sotto, allineata in basso con la foto grande accanto. Corretta la card che mostrava il cliente della card precedente (BeYOU con "Accademia dei Romani"). IKEA: nuova copertina su FRAKTA (`01_Cover_…_ok.jpg`) |
| 12/11/2026 | Via i collage sfalsati: nel mosaico (Works e home) ogni riga ha le due foto alla stessa altezza e il testo sotto; nelle gallerie le foto "Metà" vanno a coppie su righe piene della stessa altezza, senza spazi vuoti |
| 12/11/2026 | Mosaico ripensato: ritmo fisso "uno grande, due affiancati". Il grande ha la foto 16:9 su 8 colonne e il titolo grande accanto; i due affiancati hanno foto 4:3 e testo sotto. Vale su Works (anche con i filtri) e in home |
| 12/11/2026 | Home: "Lavori selezionati" in scorrimento orizzontale come la home di bitwip. La sezione resta ferma, i progetti scorrono da destra a sinistra (0,7 px di scroll per ogni pixel di spostamento), il titolo a sinistra scivola via e svanisce, in fondo "Vedi tutti i progetti" e una barra di avanzamento. Ogni card: copertina, cliente, categoria, anno, titolo e la frase-titolo del progetto. Su telefono e con "riduci movimento" si scorre col dito. Testi in `_data/testi.yml` → `home.lavori_*` |
| 12/11/2026 | SITUATION: è la tesi del Master in Digital Art Direction (IED Roma, 2021). Aggiunti il video YouTube di IED in cima alla galleria e il pulsante "Il progetto sul sito IED" (ied.edu/projects/situation). Nuovo campo del pannello **Link esterno** |
| 12/11/2026 | Video da `_materiali/video`: lo spot Audible nel progetto Audible, lo spot; nuovo progetto **Animazioni** (Motion Design: logo animation Adidas, Apple, Ichnusa e l'illustrazione animata del sushi); nuovo progetto **Il mio marchio** (Branding: il monogramma CE dalla griglia alla stationery, con il video del logo). Video caricati direttamente sul sito, muti e in loop quando sono sullo schermo |
| 12/11/2026 | Nuovo progetto **DCD Studi Estetici** (Branding, 2022, fatto lavorando da Pixell): tutta la comunicazione del brand seguita da me dentro Pixell: restyling del marchio, brand identity manual di 116 pagine, logo animato, social, volantini e materiali dei centri. Immagini dal manuale (`~/Desktop/materiale x portfolio`) e dalla pagina Pixell, logo animato da `_materiali/video`, pulsante verso pixell.it. Nuovo cliente DCD Studi Estetici (Beauty & Cosmetics) |
| 12/11/2026 | Nuovo progetto **Etic.a Labels** (Web Design, 2022, dentro Pixell con il team grafico): wireframe e design del sito poi passato al reparto IT, schermate del sito online (eticasrl.net, senza banner dei cookie), brand manual e logo animato (`_materiali/etica`), stand per Cosmopack, Ipack Ima e Marca, pannelli, social, firme mail, pieghevole, cartellina, campionario e coordinato (dalla chiavetta USB, cartella PIXELL/PROGETTI/ETICA, solo i file miei). Pulsante "Vai al sito di Etic.a" |
| 12/11/2026 | Etic.a: aggiunti spunti e foto dalla pagina Pixell (pixell.it/progetti/etic-a): restyling del logo e payoff «Dress your brand», valori, virtual tour; nuova sezione «Shooting e video» con le foto still life, il backstage, il feed social e il video corporate «a ritroso» (crediti: Pixell) |
| 12/11/2026 | SITUATION: il video originale (`_Main_1.mp4`, compresso da 32 a 4,6 MB) al posto di quello YouTube. Animazioni: aggiunte le Icone mare (`__Icone Mare.mp4`) accanto al sushi, nella sezione Illustrazioni animate |
| 12/11/2026 | Cinque progetti nuovi in Generative AI, dalle cartelle di `_materiali`: **The North Face, Tokyo** (campagna immaginata, 2026), **Fight Club, la saponetta** (still life in tanti materiali, 2024), **Architecture** (una scultura in sette materiali, 2024), **Lettering 3D** (Chaos, Topboy con il video tutorial, M Gradient, Come mamma mi ha fatto, Hardnails Art, Monkey) e **Scomodo** a parte. Tutti segnati come progetti personali; testi scritti nel mio tono. Non usata la cartella `Malika Favre` |
| 12/11/2026 | Nuovo progetto **Juniors** (Generative AI, 2026, serie AI x Creatives): i volti di bambola generati con Firefly e 5 video da 8 secondi (uno in cui si sciolgono), compressi a 1280 px. Esclusa l'immagine di riferimento di un'altra artista |
| 12/11/2026 | Nuovo progetto **Chrome Nails** (Generative AI, 2026, cartella `Unghie ragazza`): la foto e tre spezzoni dei video Firefly scelti dall'utente (lo zoom sulle unghie, le mani che si allungano, il terzo video intero) |
| 12/11/2026 | Fight Club: aggiunto il video del processo (Illustrator 3D → Firefly), ritrovato dall'utente in bassa risoluzione (480×848) e migliorato: riduzione del rumore, ingrandimento a 1080 px, nitidezza. Affiancato alla saponetta di partenza nella sezione «Il processo» |
| 12/11/2026 | Gallerie: una foto da sola non supera più l'altezza dello schermo. Malika Favre rifatto con i file originali in alta (`_materiali/Malika Favre`), più l'illustrazione «La luna» che mancava |
| 12/11/2026 | Copertine nuove: The North Face (i due che si baciano nel vicolo), Lettering 3D (Chaos in argento liquido), Fight Club (la muffa rosa), Architecture (il vetro rotto). Fight Club più corto: da 17 a 10 foto, due per materiale; dove due foto erano uguali ora c'è la foto intera più un dettaglio zoomato; tolto il pon pon |
| 12/11/2026 | Copertine: SITUATION (fermo immagine delle particelle), Audible spot (la città animata), Animazioni (il logo Adidas a metà trasformazione), Il mio vecchio logo (i biglietti da visita; rinominato da «Il mio marchio»). Patch e Model sheet: copertina con un foglio unico che raccoglie tutto, poi una schermata per ogni elemento (presi dalle slide originali a 3840 px). Sagra dei Stringozzi e Blue Origin tolti dal sito: restano nel pannello come bozza |
| 12/11/2026 | Foto verticali o quadrate rimaste da sole (scelta dell'utente, al posto del blocco editoriale): si accoppiano sempre con la foto successiva o, se non c'è, con un loro dettaglio ingrandito, alte uguali (JS in `_layouts/progetto.html`). Animazioni: aggiunto in apertura lo showreel di questo portfolio, registrato fotogramma per fotogramma da `lab/showreel.html` (17,5 s, 30 fps, 2 MB) |
| 12/11/2026 | Gallerie: coppie sempre divise a metà e alte uguali (cornice con la forma media delle due foto), così le righe sono allineate. Nuovo movimento per foto e video in tutti i progetti: tendina che si apre dal basso, immagine che si assesta da 1,18 a 1,06, la seconda della coppia in ritardo, parallasse leggera allo scroll; su telefono solo la tendina; niente movimento con «riduci movimento» |
| 12/11/2026 | Foto dei progetti: niente più movimento, solo uno zoom out (da 1,15 a 1) quando arrivano sullo schermo. Nessuna foto resta da sola: si accoppia con la successiva o con un suo dettaglio (tranne le strisce molto larghe); i video da soli sono più piccoli. **Sottomenu di Works** come bitwip: pannello scuro con «Cinque mondi, un solo metodo.», «Tutti i progetti» e le categorie (testi in `_data/testi.yml` → `footer.sub_*`). **Dietro le quinte** in fondo a ogni progetto: gli strumenti in cerchi che si disegnano e quattro numeri che si contano (foto, video, strumenti, capitoli; sostituibili dal pannello). **Recensioni**: nuovo gruppo nel pannello (testo, autore, ruolo); compaiono in fondo al progetto e in una sezione della home, solo se ce n'è almeno una vera |
| 12/11/2026 | **About me** rifatto dal profilo LinkedIn: bio in prima persona (IT e EN), timeline vera (Liceo Pinturicchio 2015, stage Gps 2019, Accademia di Belle Arti 110 e lode e Accademia dei Romani 2020, Master Digital Art Direction IED 2021, Pixell 2022, Ficacci Olive Company 2023 e 2025, Futura AI Academy 2026), tre parole (Visione, Execution, Coordinamento), nuova sezione Strumenti, clienti solo se hanno progetti pubblicati, Roma. Strisce di foto: scorrono da sole, lente e continue (copertine sopra, una foto per progetto sotto), si fermano al passaggio del mouse. SITUATION corretto: Master in Digital Art Direction, 2021. Patch: galleria che parte dalla prima patch. Dettagli zoomati di Fight Club rifatti dagli originali in alta |
| 12/11/2026 | **Joker** diviso per film, in ordine (Batman 1966, Batman 1989, Il cavaliere oscuro, Suicide Squad, Joker 2019): ogni ritratto ritagliato dalle slide originali accanto alla foto di scena dell'attore, ritagliata alla stessa forma; crediti per le foto di scena. **About me**: tolti i riferimenti contrattuali (stage, contratto), link ai progetti citati nella timeline (Accademia dei Romani, SITUATION, DCD, Etic.a), ultima tappa «∞ · Non smetterò di stupirmi.» |
| 12/11/2026 | Nuovo progetto **LIKEMOMMADEME, questo sito** (Web Design e Motion Design, 2026): fatto con Claude in Visual Studio Code, con lo showreel e le schermate del sito (desktop e telefono). Nuovo campo **Anche in**: un progetto può stare in più categorie (pagine categoria e filtri di Works lo rispettano). Motion Design ora raccoglie anche SITUATION, il portfolio, Il mio vecchio logo, DCD, Etic.a, Juniors e Chrome Nails. Joker: aggiunta la serie animata del 1992 (la carta) e l'HAHAHA a parte; manca la foto di scena. Model sheet tolto dal sito (bozza) |
| 12/11/2026 | Etic.a: al posto delle schermate un **volo 3D sulla pagina Azienda** del sito (14,5 s, la pagina stesa su un piano chiaro, camera continua, salita, tuffo sull'hero e card finale «Creiamo etichette con un'impronta positiva. *Dress your brand.*»), costruito in HTML con `seek(t)` e registrato fotogramma per fotogramma. Wireframe ridotti a due tavole; Il marchio dallo studio della forma al logo animato; tolti shooting e video (non miei); fiere due foto; social solo il carosello. DCD: costruzione centrata. Gallerie: righe da tre |
| 12/11/2026 | «LIKEMOMMADEME, questo sito»: nuovo **promo** di 15 s (1080×1080, 120 BPM): il punto rosa del logo chiude la frase «Un portfolio che non sembra un template», diventa la spia di un computer che resta aperto, fa da cursore sul sito vero (showreel, sottomenu di Works, un progetto) e torna punto di LIKEMOMMADEME con «likemommademe.github.io»; musica scritta in codice (Web Audio). File di lavoro nello scratchpad (`promo.html`, `volo/film.html`) |
| 14/11/2026 | Pannello bloccato da un campo doppio in Lettering 3D: sistemato. Ora un file rotto blocca solo sé stesso. Grafica del pannello rifatta come il sito |
| 14/11/2026 | Progetti in più categorie: il filtro del pannello li mostra anche nelle categorie in più, con un ordine separato per ognuna, usato anche dal sito |
| 14/11/2026 | Pannello: modulo del progetto a due colonne (testi a sinistra; pubblicazione, categorie, cliente, anno, copertina e link a destra, con la lingua in cima). Galleria a griglia di miniature: si trascinano per riordinarle, un clic apre titolo, didascalia IT/EN e larghezza. Nuova sezione **Media** con le immagini divise per progetto. Gli strumenti tengono l'ordine in cui li hai messi |
| 14/11/2026 | "Dietro le quinte": tolti i numeri e la frase generica. Ora mostra **Il mio ruolo** (campo nuovo, IT/EN), gli strumenti e la recensione, e compare solo se c'è almeno una di queste cose. Descrizioni per Google (IT/EN) scritte da Claude per tutti i progetti veri |
| 14/11/2026 | Nuova **gestione social** nel pannello: calendario dei post, progetti da portare sui social, grafiche 4:5 rifatte in automatico, testo già pronto, foto anche dal computer |
| 14/11/2026 | Social: i post vanno su Instagram, TikTok e LinkedIn (tolti Facebook e Threads). Nuova pagina **Account social** con stato e passi per collegare ogni social via API |

---

## 10. Prossimi passi

1. **Pubblicazione automatica sui social** (i passi sono anche in Social → Account social): creare insieme le app sviluppatore di Instagram (account professionale + app Meta "Instagram API with Instagram Login"), LinkedIn (pagina LIKEMOMMADEME + app con "Share on LinkedIn") e TikTok (app con "Content Posting API" e dominio verificato; senza la revisione di TikTok i post via API vanno nelle bozze o restano privati). Poi Claude scrive la parte del server che collega gli account e pubblica i post programmati all'ora giusta. Finché non c'è, i post si pubblicano a mano.
2. **Verificare che su Cloudflare ci sia il codice più recente del server**, quello con le statistiche e il salvataggio nuovo. Se il pannello non salva o le visite non compaiono, va rincollato (vedi "Come si fa").
3. **Facoltativo**: eliminare il sito del portfolio su DecapBridge (https://decapbridge.com). La chiave **decapbridge** su GitHub non esiste più e il KV **login** su Cloudflare è già cancellato.
4. **Facoltativo**: sul client Google creare un client secret nuovo ed eliminare quello vecchio, finito in chat per errore. Non lo usiamo, quindi non è urgente.
5. **Sito in inglese**: pagine `/en/` che usano i testi `_en` del pannello, con il selettore di lingua.
6. **Contenuti che mancano**: i video delle animazioni del PORTFOLIO, lo spot Audible e il video della Sagra caricato su Behance (vanno dati come file o link YouTube/Vimeo); foto di Blue Origin a risoluzione più alta (su Behance arrivano al massimo a 1920 px); gli anni di Accademia dei Romani, Joker, Model sheet e Patch / Malika Favre. Poi si possono eliminare gli esempi (Materia Viva, Progetto di esempio, Cliente di esempio, immagini SVG di prova).
7. **Grafica del sito pubblico**: partire dalle bozze fatte in Claude Design.
8. **Consigli su skill e connettori** per Claude e GitHub utili per UI, UX e animazioni del sito (richiesti "alla fine di tutto").

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
| 13/11/2026 | Video orizzontali 16:9. **Etic.a**: nuovo volo 3D di 25 s su più pagine del sito (Azienda, Portfolio, Sostenibilità, Servizi posate a scalinata, partenza lenta, salita su tutto il sito e tuffo nella home che diventa la card finale); nuova sezione **Le pagine** con quattro schermate dentro un monitor. **LIKEMOMMADEME, questo sito**: il promo quadrato lascia il posto a **portfolio-navigazione.mp4** (30 s, 1920×1080): il sito vero registrato mentre lo navigo (showreel, home, sottomenu di Works, Works, Fight Club fino a Dietro le quinte) dentro un portatile sempre aperto, avvicinamento lento 1.0 → 1.08 e cursore con i click; tutte le schermate della galleria ora sono dentro un monitor (`*-monitor.webp`). Il promo resta in `assets/uploads/portfolio-promo.mp4`. Corretto il conteggio dei numeri (home e Dietro le quinte) che in certi casi partiva da valori negativi |
| 13/11/2026 | «LIKEMOMMADEME, questo sito»: tornato il **promo** con la stessa idea di prima (frase «Un portfolio che non sembra un template», il quadrato rosa che diventa spia, cursore e punto del logo, zoom sui dettagli, musica in codice) ma in **16:9** (1600×900, 37 s) e con dentro la registrazione nuova del sito (showreel, home, sottomenu di Works, Works, Fight Club fino a Dietro le quinte); la frase iniziale entra più lenta. Stesso file `portfolio-promo.mp4`; tolto il video del portatile chiaro (`portfolio-navigazione.mp4`) |
| 13/11/2026 | Promo del portfolio: lo showreel della home dentro lo schermo scorre a circa metà velocità (registrazione rifatta con il doppio dei fotogrammi), il video ora dura 46 s |
| 13/11/2026 | DCD: il logo nuovo nel confronto Prima/Dopo ora è quadrato, centrato alla stessa altezza del vecchio e senza la striscia blu sul bordo. |
| 13/11/2026 | DCD: nuova sezione «I social» con il carosello sponsorizzato e i post (dalla pagina Pixell del progetto), più la schermata Instagram. Le metro ora sono a tutta larghezza. |
| 13/11/2026 | Patch: accanto a ogni patch disegnata c'è la foto della patch ricamata (decollo, lancio, astronauta, pianeta). |
| 13/11/2026 | Malika Favre: acconciature centrate e ridisegnate in alta risoluzione; «Due donne» e acconciature senza dettaglio accanto (nuovo formato «Da sola» nel pannello). Patch: foto ricamata del lancio ritagliata come le altre, così il disegno non si taglia. |
| 13/11/2026 | Gallerie: nelle righe da due ogni foto tiene la sua forma e prende una larghezza proporzionale, così nessuna viene più tagliata. Audible: «Riprendi, tre volte» da sola. Malika Favre: acconciature con nome file nuovo (niente cache). Patch: copertina con la patch ricamata. |
| 13/11/2026 | Chrome Nails: nuove foto in alta risoluzione, la posa (anche copertina) e il dettaglio della maglia con la placca cromata, affiancate. |
| 13/11/2026 | Scomodo: tolta la foto «Col pennello» (e il suo dettaglio). |
| 13/11/2026 | Scomodo: nuova sezione «L'ispirazione» con la foto originale dei lecca lecca con le venature (scomodo-06), spostata dagli stecchi; negli stecchi restano tre foto in una riga. |
| 13/11/2026 | Audible: il maxi poster ora in due foto, di giorno e di notte, affiancate; copertina del progetto: il maxi poster di notte. Materiali locali: 70 file con nomi tipo «Firefly…» o «ChatGPT Image…» rinominati con nomi descrittivi in italiano. |
| 13/11/2026 | Audible: nuova foto della pensilina con Il corsaro nero, di notte sotto la pioggia, al posto della vecchia. |
| 13/11/2026 | IKEA: tolti i dettagli ingranditi accanto alle foto da sole (scrivania, parete galleria, layout, tappa 5, Emotion); la foto finale sul BLÅHAJ è grande a tutta larghezza. Nuovo formato «Grande, a tutta larghezza» nel pannello. |
| 13/11/2026 | Accademia dei Romani: nuova foto dell'insegna (anche copertina) affiancata dal dettaglio delle lettere in acciaio, al posto della vecchia. |
| 13/11/2026 | IKEA: le 6 foto di KOMPISHÄNG ora in tre righe da due, nessuna da sola. |
| 13/11/2026 | IKEA: anche «Emotion» grande a tutta larghezza. |
| 13/11/2026 | Gallerie: le coppie di foto con forme simili sono allineate (stessa larghezza e altezza, ritaglio minimo); solo le coppie molto diverse restano a mosaico. |
| 13/11/2026 | Accademia dei Romani: insegna più vicina e dettaglio ritagliato senza il muro vuoto sotto, tutte e due della stessa forma. |
| 13/11/2026 | Portfolio LIKEMOMMADEME: tolta la sezione «Su telefono». |
| 13/11/2026 | Accademia dei Romani: a sinistra torna la foto originale dell'insegna (anche copertina), a destra resta il dettaglio delle lettere in acciaio. |
| 14/11/2026 | Accademia dei Romani: nuova copertina, il primo piano della placca e delle lettere in acciaio. |
| 14/11/2026 | Nuovo tasto **Cerca** (lente) nel menu, anche da telefono e con il tasto /: apre un pannello con i primi 6 lavori selezionati della home e filtra tutti i progetti per titolo, sottotitolo, categoria, cliente, anno e strumenti. Testi in testi.yml (sezione cerca). |
| 14/11/2026 | SITUATION: copertina quadrata con la scritta intera; galleria snellita da 17 a 9 immagini (identità 2, app 3, social 2, palestra 2), tutte in coppie della stessa forma o grandi a tutta larghezza, senza tagli. |
| 14/11/2026 | Didascalie: non perdono più le prime lettere (il riquadro arrotondato le tagliava), su tutto il sito. Menu: la lente ora è solo l'icona, senza cerchio, per non sembrare un doppione dell'interruttore giorno/notte. SITUATION: tolte le schermate con i telefoni tagliati (database e statistiche), aggiunto il carosello «Perché Situation?». |
| 14/11/2026 | Pagine progetto: la copertina in cima tiene la sua forma (niente tagli, niente bande). Cerca: la lente sul computer sta a sinistra di Works e apre una tendina nello stile del menu Works (titolo, campo di ricerca, Tutti i progetti; a destra i 5 lavori migliori che si filtrano). SITUATION: copertina originale e, per l'app, la foto con tutte le schermate. |
| 14/11/2026 | Cerca: torna il pannello di prima (con le miniature), la lente resta accanto a Works. Home: le card dello scorrimento orizzontale sono più larghe. Pagine progetto: la copertina in cima torna quadrata come all'inizio. |
| 14/11/2026 | Menu Works: la tendina ora è chiara di giorno e scura di notte, come la ricerca. |
| 14/11/2026 | Work, vista Mosaico: i titoli dei progetti grandi sono più piccoli e vanno a capo, così non escono più dal riquadro. |
| 14/11/2026 | North Face: tolta la foto delle mani; «Sotto l'insegna» senza dettaglio ingrandito, la campagna ora è in due righe da due. |
| 14/11/2026 | Audible, lo spot: lo storyboard è una foto sola grande, senza dettaglio accanto. |
| 14/11/2026 | Titoli con due font: TAN Nimbus ricalibrato (size-adjust 74%) perché le minuscole siano alte come quelle di Cabinet in tutte le frasi; il motto MORE THAN MEETS THE EYE resta identico. |
| 14/11/2026 | Parole speciali dei titoli in vettori: le parole tra <em> sono disegnate in SVG dalle forme di TAN Nimbus (assets/js/parole.js), così tutti le vedono uguali senza pubblicare il font; il testo resta nascosto per Google e screen reader. Il motto animato resta in testo. **Se dal pannello cambi o aggiungi una parola speciale**, va rilanciato `python3 _strumenti/parole-vettoriali.py` (serve il font sul computer e fonttools + uharfbuzz); finché non lo fai, la parola nuova si vede in Yink. |
| 14/11/2026 | Anche MEETS del motto è in vettori, in home e nei due showreel. |
| 14/11/2026 | Pagine categoria: in alto a destra, piccolo, il pezzo di showreel di quel mondo in loop (campo `mondo` nelle categorie, showreel con ?loop=a,b). About: tolti i voti; la tappa Pixell racconta cosa facevo, senza clienti; LIKEMOMMADEME nasce nel 2027, poi ∞. |
| 14/11/2026 | About, Clienti: al posto dei nomi i loghi (assets/clienti, neri su trasparente, bianchi di notte). Accademia dei Romani, DCD ed Etic.a dai materiali dei progetti; IED e IKEA da Wikimedia Commons. Campo **logo** nei clienti. |
| 14/11/2026 | Footer, Contatti: email, telefono e curriculum scaricabile (PDF in assets/docs). Nuovi campi **telefono** e **curriculum** nelle impostazioni. |
| 14/11/2026 | Footer: la scritta LIKEMOMMADEME arriva larga e si stringe al suo posto solo quando si arriva in fondo alla pagina; al passaggio del mouse le lettere crescono e si scostano come nello showreel. About: i loghi dei clienti portano al loro sito (Accademia dei Romani non ha un sito nel pannello). Categorie: animazione del mondo più grande, più lenta e senza riquadro, sullo sfondo della pagina. |
| 14/11/2026 | Form **Raccontami un progetto**: il pulsante Scrivimi del footer apre un form (nome, email, telefono, progetto, budget indicativo, reference; anche con /#scrivimi). Le risposte vanno al Worker (POST /richiesta, tabella `richieste` nel database D1, max 5 al giorno per connessione, campo trappola per i bot) e arriva un avviso per email. Nel pannello: nuova pagina **Richieste** (filtri, stato Nuova/Letta/Risposta/Archiviata, elimina) e riquadro «Richieste nuove» in dashboard. **Il Worker va incollato di nuovo su Cloudflare** perché funzioni. |
