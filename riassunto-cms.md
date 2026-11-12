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
| Home | `/` | Header animato (lo showreel, che avanza con lo scroll e gira una volta sola, poi resta fisso dietro come header), poi il motto con l'occhio, la frase di apertura e i progetti scelti, nell'ordine deciso nel pannello, in **scorrimento orizzontale** come bitwip: la sezione resta ferma e i progetti scorrono da destra a sinistra mentre si scende (su telefono si scorrono col dito) |
| Progetti | `/work/` | Tutti i progetti con filtri a tendina (Categoria, Settore e Paese del cliente), vista Mosaico o Griglia. Mosaico = un progetto grande a tutta larghezza (foto 16:9, testo accanto) e poi due affiancati, e si ripete; Griglia = tre colonne uguali |
| Categoria | `/work/<categoria>/` | Progetti della categoria, nell'ordine deciso nel pannello |
| Progetto | `/progetti/<progetto>/` | Come le pagine progetto di bitwip: titolo gigante con la copertina quadrata che si appoggia sul foglio; foglio a colori opposti con "Il progetto", la frase-titolo, la scheda fissa a sinistra (cliente, settore, categoria, anno, strumenti) e il racconto a destra (Brief, Concept, Execution, Coordinamento, Risultato, Crediti); galleria divisa in bande a tutta larghezza, una per ogni **Titolo di sezione** (titolo, due righe, le sue immagini), che alternano i colori; dentro, le foto "Metà" a coppie su righe piene, alte uguali (la larghezza segue la forma di ogni foto, niente tagli e niente spazi vuoti; se ne resta una sola va a tutta larghezza); progetto precedente e successivo affiancati |
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
- Campi: titolo, **Pubblicato sul sito** (spento = bozza), **Link esterno** e **Testo del pulsante** (pulsante blu nella scheda del progetto, es. la pagina IED), categoria, cliente, anno, copertina, descrizione breve, **SEO** (descrizione per Google e immagine di anteprima per i link condivisi), **Mostra in home**.
- **Case study**: **Frase-titolo del progetto** (la frase grande in cima al racconto), poi le sezioni fisse **Brief e obiettivo**, **Concept**, **Execution**, **Galleria**, **Coordinamento e processo**, **Risultato**, **Strumenti usati** (caselle da spuntare divise in Adobe, Creative AI e UI/UX, più un campo per gli altri), **Crediti**. Sul sito compaiono solo le sezioni compilate, e in fondo c'è il link al progetto successivo della stessa categoria.
- I progetti nuovi partono come bozza.
- **Galleria**: si trascinano le foto dal Finder (anche tante insieme), si aggiungono video YouTube o Vimeo, prototipi Figma (link `figma.com/proto/...`) e file video `.mp4` caricati sul sito (partono da soli, muti e in loop, quando sono sullo schermo; l'anteprima è un'immagine `.webp` con lo stesso nome), e **titoli di sezione** (titolo + due righe) per dividere la galleria in parti. Ogni foto ha un **titolo** e **una riga** che la spiega: su computer compaiono sopra la foto al passaggio del mouse, su telefono restano sotto, si riordinano con la maniglia ⋮⋮, e per ogni elemento si sceglie **Tutta larghezza** o **Metà**.
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
| `_progetti/*.md` | Un file per progetto (online: `ikea-voglia-di-casa`, `dcd-studi-estetici`, `beyou`, `il-mio-marchio`, `animazioni`, `audible-il-classico-si-unisce-al-futuro`, `audible-video-animation`, `blue-origin`, `situation`, `sagra-dei-stringozzi`, `accademia-dei-romani`, `joker`, `model-sheet`, `patch`, `malika-favre`; in bozza gli esempi `materia-viva`, `progetto-di-esempio`) |
| `_categorie/*.md` | Un file per categoria: `illustration`, `motion-design`, `generative-ai`, `branding`, `web-design` |
| `_clienti/*.md` | Un file per cliente (per ora: `ikea`, `cliente-di-esempio`, `ied`, `accademia-dei-romani`, `dcd-studi-estetici`) |
| `_data/home.yml` | Frase della home e progetti in home (in ordine) |
| `_data/impostazioni.yml` | Nome e contatti |
| `_data/cms.yml` | Impostazioni delle immagini. Viene creato la prima volta che salvi Sistema → Immagini |

### Pannello
| File | A cosa serve |
|---|---|
| `admin/index.html` | Pagina del pannello. Il numero `?v=` va aumentato a ogni aggiornamento, così il browser carica i file nuovi (ora è `?v=14`) |
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
| 12/11/2026 | SITUATION: è la tesi del Master in User Interface Design and AI (IED Roma). Aggiunti il video YouTube di IED in cima alla galleria e il pulsante "Il progetto sul sito IED" (ied.edu/projects/situation). Nuovo campo del pannello **Link esterno** |
| 12/11/2026 | Video da `_materiali/video`: lo spot Audible nel progetto Audible, lo spot; nuovo progetto **Animazioni** (Motion Design: logo animation Adidas, Apple, Ichnusa e l'illustrazione animata del sushi); nuovo progetto **Il mio marchio** (Branding: il monogramma CE dalla griglia alla stationery, con il video del logo). Video caricati direttamente sul sito, muti e in loop quando sono sullo schermo |
| 12/11/2026 | Nuovo progetto **DCD Studi Estetici** (Branding, 2022, fatto lavorando da Pixell): tutta la comunicazione del brand seguita da me dentro Pixell: restyling del marchio, brand identity manual di 116 pagine, logo animato, social, volantini e materiali dei centri. Immagini dal manuale (`~/Desktop/materiale x portfolio`) e dalla pagina Pixell, logo animato da `_materiali/video`, pulsante verso pixell.it. Nuovo cliente DCD Studi Estetici (Beauty & Cosmetics) |
---

## 10. Prossimi passi

1. **Verificare che su Cloudflare ci sia il codice più recente del server**, quello con le statistiche e il salvataggio nuovo. Se il pannello non salva o le visite non compaiono, va rincollato (vedi "Come si fa").
2. **Facoltativo**: eliminare il sito del portfolio su DecapBridge (https://decapbridge.com). La chiave **decapbridge** su GitHub non esiste più e il KV **login** su Cloudflare è già cancellato.
3. **Facoltativo**: sul client Google creare un client secret nuovo ed eliminare quello vecchio, finito in chat per errore. Non lo usiamo, quindi non è urgente.
4. **Sito in inglese**: pagine `/en/` che usano i testi `_en` del pannello, con il selettore di lingua.
5. **Contenuti che mancano**: i video delle animazioni del PORTFOLIO, lo spot Audible e il video della Sagra caricato su Behance (vanno dati come file o link YouTube/Vimeo); foto di Blue Origin a risoluzione più alta (su Behance arrivano al massimo a 1920 px); gli anni di Accademia dei Romani, Joker, Model sheet e Patch / Malika Favre. Poi si possono eliminare gli esempi (Materia Viva, Progetto di esempio, Cliente di esempio, immagini SVG di prova).
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
