---
name: "likemommademe-portfolio"
description: "Stile, regole di design e motion per il portfolio di LIKEMOMMADEME: usala per qualsiasi pagina, componente, animazione o grafica del sito portfolio."
---

# LIKEMOMMADEME — Portfolio

Usa questa skill ogni volta che crei o modifichi qualcosa per il portfolio di LIKEMOMMADEME: pagine, sezioni, componenti, animazioni, header, grafiche, testi, contenuti del CMS. Vale anche per materiali coordinati (presentazioni, caroselli, post) quando devono avere la stessa identità. Se è installata anche `frontend-design`, questa skill ha la precedenza sulle scelte di stile.

## Chi è

- Nome d'arte: **LIKEMOMMADEME** (sempre maiuscolo, tutto attaccato).
- Ruolo: **Marketing & Creative Designer**. Identità visive, brand communication, contenuti per digital, stampa ed eventi.
- Approccio: hands-on, orientato alla soluzione. Segue i progetti dal concept alla produzione, coordinando clienti, team interni, fornitori e partner. Visione d'insieme senza perdere il controllo sui dettagli. Versatile, ma sempre focalizzato sull'obiettivo e sull'identità del brand.
- Strumenti:
  - Adobe Creative Suite: Photoshop, Illustrator, InDesign, Premiere Pro, After Effects, Firefly.
  - Creative AI: ChatGPT, Claude, Midjourney, Firefly e strumenti AI per design, content creation e workflow creativi.
  - UI/UX e prototipazione: Figma, Sketch, Adobe XD, Framer.

Il sito deve dimostrare tre cose: **visione** (concept), **execution** (qualità del lavoro finito), **coordinamento** (processo e metodo).

## Personalità: audace e ironica

- **Audace e grintosa**: titoli enormi, contrasti forti, scelte nette. Niente timidezza, niente design "carino e basta".
- **Ironica e giocosa**: il nome LIKEMOMMADEME ("come me l'ha fatto mamma") è già una battuta: il sito può giocarci. Micro-interazioni inaspettate, piccoli easter egg, testi con una punta di autoironia, hover che sorprendono.
- Equilibrio: l'ironia sta nei dettagli, la struttura resta seria e chiarissima. Il lavoro si deve sempre vedere e capire per primo.

## Obiettivo del sito

Un portfolio **interattivo, intuitivo e moderno**, ma **facile da leggere**. Chi lo visita (recruiter, clienti, agenzie) deve capire in 5 secondi chi è LIKEMOMMADEME e cosa fa, e trovare i progetti in un clic. L'interattività serve a far scoprire il lavoro, mai a nasconderlo.

Regola d'oro: **prima la leggibilità, poi l'effetto.** Se un'animazione rallenta la lettura o la navigazione, si toglie.

## Colori

Il sito è **principalmente bianco e nero**, con **modalità giorno e notte**, e **2–3 colori di contrasto**. I colori di contrasto **non sono ancora definitivi**: i candidati sono **blu elettrico** e **verde smeraldo**, anche sfumati sul nero e sul bianco.

Definisci tutti i colori come variabili CSS in un solo punto, con due set (giorno/notte), così cambiarli è immediato. Prima di consegnare un lavoro importante, ricorda all'utente che gli accenti sono provvisori.

### Token provvisori

| Token | Giorno | Notte | Uso |
|---|---|---|---|
| `--bg` | `#FAFAF7` | `#0A0A0A` | sfondo principale |
| `--fg` | `#0A0A0A` | `#F5F5F2` | testo principale |
| `--muted` | `#5E5E5E` | `#9A9A9A` | testi secondari, didascalie |
| `--line` | `#E2E2DD` | `#262626` | bordi, divisori |
| `--accent-1` | `#1F3BFF` | `#3D5AFF` | blu elettrico: link, CTA, hover, focus |
| `--accent-2` | `#00936B` | `#12C08E` | verde smeraldo: tag, dettagli, stati attivi |
| `--accent-3` | da decidere | da decidere | terzo colore opzionale, solo se serve |

### Regole colore

- Bianco e nero fanno il 90% del lavoro. Gli accenti coprono al massimo il 10% della superficie.
- Mai più di 3 accenti. Mai aggiungere colori nuovi senza chiedere.
- In modalità notte gli accenti sono leggermente più chiari, per mantenere il contrasto.
- Contrasto testo/sfondo almeno WCAG AA (4.5:1 per il testo normale) in entrambe le modalità.
- **Sfumature**: ammesse solo come sfumature morbide di un accento verso il nero (notte) o verso il bianco (giorno), per hero, copertine e sfondi di sezione. Al massimo due accenti nella stessa sfumatura. Mai arcobaleni, mai i classici gradienti viola-rosa da template, mai sfumature dietro al testo lungo.
- I colori dei progetti (le immagini dei lavori) sono liberi: il sito fa da cornice.

### Modalità giorno/notte

- Di default segui la preferenza del sistema (`prefers-color-scheme`), con un interruttore visibile nel menu.
- Ricorda la scelta dell'utente (localStorage, con try/catch).
- Il passaggio tra le modalità è un'animazione progettata (es. un cerchio che si espande dall'interruttore), non uno scatto. Con `prefers-reduced-motion` è istantaneo.
- L'interruttore è un buon posto per un tocco ironico.

Quando l'utente vuole decidere gli accenti, proponi 3 combinazioni diverse con un'anteprima visiva della home in giorno e in notte, non solo una lista di codici.

## Tipografia

- Stile scelto: **grotesk con carattere**, forme riconoscibili e moderne, adatto a titoli enormi e audaci.
- Candidati per i titoli (gratuiti): *Clash Display* o *Cabinet Grotesk* (Fontshare), *Bricolage Grotesque* (Google Fonts). Font definitivo da confermare con l'utente.
- Testo: un sans molto leggibile (*Inter* o *General Sans*). Mai più di due famiglie.
- Titoli enormi e decisi (hero fino a `clamp(3rem, 10vw, 10rem)`), interlinea stretta (0.9–1.0), tracking leggermente negativo.
- Testo: 17–19px, interlinea 1.5–1.6, righe di 60–75 caratteri al massimo.
- Scala tipografica coerente (rapporto 1.25 o 1.333). Niente dimensioni a caso.
- Font self-hosted o da CDN affidabile, con `font-display: swap`.

## Layout

- Griglia a 12 colonne su desktop, 4 su mobile. Margini laterali generosi (min 16px su mobile, 4–6vw su desktop).
- Contrasti di scala forti: titoli giganti accanto a testi piccoli e precisi.
- Tanto spazio vuoto. Una idea per schermata.
- **Mobile first**: ogni sezione deve funzionare a 375px di larghezza senza scroll orizzontale.
- Navigazione sempre raggiungibile (menu fisso o compatto) con: Progetti, Chi sono, Contatti, interruttore giorno/notte, selettore lingua IT/EN.

## Struttura del sito

1. **Home / Hero**: nome LIKEMOMMADEME enorme, ruolo in una riga, un'animazione di apertura breve (max 2–3 s, poi il contenuto è subito leggibile). Accesso diretto ai progetti.
2. **Progetti**: griglia di case study filtrabili per categoria:
   - Brand identity
   - Digital & social
   - Print & eventi
   - AI & motion
   - Illustrazioni
   - UI/UX
   Ogni card: immagine o video in loop, titolo, cliente, categoria. Hover con anteprima.
3. **Case study** (una pagina per progetto), sempre con questa struttura:
   - Brief e obiettivo
   - Concept
   - Execution (immagini grandi, mockup, video)
   - Coordinamento e processo (chi, tempi, fornitori, fasi)
   - Risultato
   - Strumenti usati
   - Link al progetto successivo
4. **Chi sono**: bio breve in prima persona, approccio hands-on, strumenti divisi in Adobe / Creative AI / UI-UX.
5. **Contatti**: email, LinkedIn, Instagram/Behance. Una CTA chiara, magari con un tocco ironico.

## Lingue: italiano e inglese

- Il sito è bilingue IT/EN, con selettore sempre visibile.
- Nessun testo scritto direttamente nei componenti: tutti i testi stanno in file di traduzione o nel CMS, con una versione per lingua.
- URL distinti per lingua (es. `/it/...` e `/en/...`) e attributo `lang` corretto.
- L'inglese è un adattamento naturale, non una traduzione parola per parola: deve mantenere lo stesso tono ironico.

## Tecnologia e CMS

- Il sito e il suo CMS sono costruiti su misura in VS Code, con il codice su GitHub.
- Prima di modificare qualcosa, leggi la struttura del progetto (framework, cartelle, come il CMS salva i contenuti) e segui le convenzioni già presenti. Non introdurre nuovi framework o librerie senza chiedere.
- I contenuti dei progetti arrivano dal CMS: non scrivere mai testi o immagini dei progetti direttamente nel codice delle pagine.
- Commit piccoli e descritti in modo chiaro.

## Interazione e motion

L'animazione deve sembrare progettata da un motion designer, non da un template. Audace nei movimenti, ironica nei dettagli.

Sì:
- Easing esponenziali o spring senza rimbalzo (es. `cubic-bezier(0.16, 1, 0.3, 1)`).
- Durate: 150–250 ms per hover e micro-interazioni, 400–700 ms per entrate di sezione, max 1.2 s per transizioni di pagina.
- Testo che entra dal basso dentro una maschera (riga per riga o parola per parola).
- Elementi che si trasformano uno nell'altro (una card che si espande nella pagina del case study) invece di dissolvenze generiche.
- Micro-interazioni ironiche: un hover che fa una piccola battuta visiva, un easter egg sul nome, un cursore che reagisce ai progetti. Sempre brevi e mai di intralcio.
- Animare solo `transform` e `opacity` per restare fluidi.
- Animazioni legate allo scroll solo dove aiutano a raccontare il progetto.
- Rispettare sempre `prefers-reduced-motion`: con questa preferenza attiva, niente movimento, solo contenuto statico.

Vietato:
- Glow, lens flare, particelle, camera shake, effetti RGB split.
- Easing con rimbalzo o elastico.
- Gradienti generici da template (vedi le regole sulle sfumature sopra).
- Cursori custom che rallentano o nascondono il puntatore.
- Loader lunghi o intro che bloccano il sito.
- Testi che compaiono così lentamente da costringere ad aspettare.
- Tutto ciò che sembra un template già visto.

## Voce e testi

- Prima persona, tono diretto, concreto e sicuro, con una punta di ironia. Frasi brevi.
- Parole chiave dell'identità: concept, execution, coordinamento, identità del brand, hands-on.
- L'ironia gioca con il nome d'arte e con il mestiere, mai a scapito della chiarezza o della professionalità nei case study.
- Niente frasi vuote da agenzia ("soluzioni innovative a 360 gradi").

## Accessibilità e performance

- HTML semantico, testo alternativo su ogni immagine (in entrambe le lingue), focus visibile, navigazione da tastiera.
- Contrasto verificato in modalità giorno e notte.
- Immagini in WebP/AVIF, dimensioni responsive, lazy loading sotto la piega.
- Video dei progetti muti, in loop, con poster, caricati solo quando visibili.
- Obiettivo Lighthouse: almeno 90 su Performance e Accessibilità.

## Prima di consegnare

1. Controlla la pagina a 1440px e a 375px, in modalità giorno e notte (con la skill `webapp-testing` o screenshot, se disponibili).
2. Verifica che testi e pulsanti siano leggibili e che nulla si sovrapponga.
3. Verifica entrambe le lingue: nessun testo mancante o rimasto nell'altra lingua.
4. Verifica che le animazioni siano fluide e che con `prefers-reduced-motion` il sito resti completo.
5. Verifica che colori e font usino solo i token definiti sopra.
6. In una o due righe, di' all'utente cosa hai fatto e cosa resta da decidere (es. gli accenti definitivi o il font).