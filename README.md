# Portfolio · likemommademe

Sito online: **https://likemommademe.github.io**
Pannello per caricare i progetti: **https://likemommademe.github.io/admin/**

Il sito è pubblicato gratis da GitHub Pages. Tutto (testi, progetti, immagini) vive in questa repository: non ci sono altri servizi.

## Come aggiungere un progetto

1. Vai su **https://likemommademe.github.io/admin/**
2. La prima volta clicca **Sign In with Token** e incolla il tuo token GitHub (`github_pat_...`)
3. Apri **Progetti → New** e compila i campi
4. Clicca **Save**
5. Dopo 1–2 minuti il progetto è online

## Cosa c'è nel pannello

- **Progetti**: titolo, cliente, anno, categorie, copertina, descrizione, galleria (immagini o link YouTube/Vimeo), crediti
  - **In evidenza** → il progetto compare per primo in home
  - **Ordine** → numero più basso = più in alto
- **Pagine → About**: testo e foto della pagina About
- **Impostazioni → Nome e contatti**: il tuo nome, la frase in home, email, Instagram, LinkedIn

## Consigli per le immagini

Le immagini vengono salvate nella repository, quindi caricale già leggere:

- larghezza massima circa **2000 px**
- formato **JPG** (qualità 80%) o **WebP**
- peso sotto **1 MB** l'una

Per i video usa YouTube o Vimeo e incolla il link nella galleria.

## Il token

Il token si gestisce da https://github.com/settings/personal-access-tokens.
Deve avere accesso a questa repository con il permesso **Contents: Read and write**.
Se lo rigeneri, usa quello nuovo per entrare nel pannello.

## Struttura (per chi mette mano al codice)

| Cartella / file | Cosa contiene |
|---|---|
| `_progetti/` | un file per ogni progetto |
| `about.md` | pagina About |
| `_data/impostazioni.yml` | nome, frase in home, contatti |
| `assets/uploads/` | immagini caricate dal pannello |
| `assets/css/style.css` | stile grafico |
| `_layouts/`, `_includes/` | struttura delle pagine |
| `admin/config.yml` | campi del pannello (Sveltia CMS) |
