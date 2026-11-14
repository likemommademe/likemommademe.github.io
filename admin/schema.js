// Sezioni e campi del pannello. Per aggiungere un campo basta aggiungere una riga qui
// (e poi usarlo nei layout del sito).
// Tipi di campo: string, text, markdown, number, boolean, publish, select, country, image, relation,
// relationList, gallery, checklist, hidden.
// Il campo "body" è il testo sotto le impostazioni del file (il contenuto della pagina).
// "i18n: true" = il campo ha anche la versione inglese, salvata con "_en" in fondo al nome (title_en, body_en…).
// "group" = titoletto che separa i campi nel modulo (es. Case study, SEO).

window.CMS = {
  collections: [
    {
      name: 'progetti',
      label: 'Progetti',
      singular: 'progetto',
      icon: 'folder',
      folder: '_progetti',
      permalink: '/progetti/:slug/',
      sort: ['categoria', 'ordine', 'title'],
      orderField: 'ordine',
      orderWithin: 'categoria',
      alsoIn: 'altre_categorie',   // categorie in più: il progetto compare anche lì
      orderMap: 'ordini',          // ordine del progetto dentro ogni categoria in più
      filters: ['categoria', 'cliente'],
      thumb: 'copertina',
      subtitle: ['categoria', 'cliente', 'anno'],
      home: { file: '_data/home.yml', field: 'progetti' },
      fields: [
        { name: 'title', label: 'Titolo', type: 'string', required: true, i18n: true },
        { side: true, name: 'published', label: 'Pubblicato sul sito', type: 'publish', default: false, hint: 'Spento = bozza: resta qui nel pannello ma non compare sul sito.' },
        { side: true, name: 'categoria', label: 'Categoria', type: 'relation', collection: 'categorie', required: true },
        { side: true, name: 'altre_categorie', label: 'Anche in', type: 'relationList', collection: 'categorie', addLabel: '+ Aggiungi un\'altra categoria…', removeTitle: 'Togli', hint: 'Facoltativo: il progetto compare anche in queste categorie.' },
        { side: true, name: 'cliente', label: 'Cliente', type: 'relation', collection: 'clienti' },
        { side: true, name: 'anno', label: 'Anno', type: 'number' },
        { side: true, name: 'copertina', label: 'Immagine di copertina', type: 'image', required: true },
        { side: true, name: 'link', label: 'Link esterno', type: 'string', hint: 'Facoltativo: la pagina del progetto su un altro sito. Diventa un pulsante nella scheda.' },
        { side: true, name: 'link_testo', label: 'Testo del pulsante', type: 'string', i18n: true, hint: 'Es. "Il progetto sul sito IED".' },
        { name: 'sottotitolo', label: 'Descrizione breve', type: 'string', i18n: true, hint: 'Una riga, compare sotto la copertina negli elenchi.' },
        // Il case study: ogni sezione compare sul sito solo se è compilata.
        { name: 'domanda', label: 'Frase-titolo del progetto', type: 'text', i18n: true, group: 'Case study', hint: 'Una frase grande in cima al racconto, come una domanda o una promessa. Es. "Come si porta un classico nelle cuffie di chi ha vent\'anni?"' },
        { name: 'body', label: 'Brief e obiettivo', type: 'markdown', rows: 5, i18n: true, group: 'Case study', hint: 'Cosa chiedeva il cliente e qual era l’obiettivo.' },
        { name: 'concept', label: 'Concept', type: 'markdown', rows: 5, i18n: true, group: 'Case study', hint: 'L’idea e perché funziona.' },
        { name: 'execution', label: 'Execution', type: 'markdown', rows: 5, i18n: true, group: 'Case study', hint: 'Come l’hai realizzato. Immagini e video vanno nella Galleria qui sotto.' },
        { name: 'galleria', label: 'Galleria', type: 'gallery', group: 'Case study', hint: 'Trascina qui le foto dal Finder. Riordina con la maniglia ⋮⋮ a sinistra.' },
        { name: 'coordinamento', label: 'Coordinamento e processo', type: 'markdown', rows: 5, i18n: true, group: 'Case study', hint: 'Chi era coinvolto, tempi, fornitori, fasi.' },
        { name: 'risultato', label: 'Risultato', type: 'markdown', rows: 4, i18n: true, group: 'Case study', hint: 'Cosa è cambiato per il cliente: numeri, riscontri, uscite.' },
        { name: 'crediti', label: 'Crediti', type: 'markdown', rows: 4, i18n: true, group: 'Case study' },
        { name: 'ruolo', label: 'Il mio ruolo', type: 'text', rows: 3, i18n: true, group: 'Dietro le quinte', hint: 'Cosa hai fatto tu nel progetto. Es. "Art direction, illustrazioni e coordinamento della stampa."' },
        {
          name: 'strumenti', label: 'Strumenti usati', type: 'checklist', other: true, group: 'Dietro le quinte',
          options: [
            { group: 'Adobe', items: ['Photoshop', 'Illustrator', 'InDesign', 'Premiere Pro', 'After Effects', 'Firefly'] },
            { group: 'Creative AI', items: ['ChatGPT', 'Claude', 'Midjourney'] },
            { group: 'UI/UX', items: ['Figma', 'Sketch', 'Adobe XD', 'Framer'] },
          ],
        },
        { name: 'recensione', label: 'Recensione', type: 'text', i18n: true, group: 'Recensione', hint: 'Solo parole vere di un cliente o di un collega. Se è vuota la sezione non compare.' },
        { name: 'recensione_autore', label: 'Chi l’ha scritta', type: 'string', group: 'Recensione', hint: 'Nome e cognome.' },
        { name: 'recensione_ruolo', label: 'Ruolo e azienda', type: 'string', i18n: true, group: 'Recensione', hint: 'Es. Marketing manager, DCD Studi Estetici.' },
        { name: 'seo_descrizione', label: 'Descrizione per Google', type: 'text', i18n: true, group: 'SEO', hint: 'La scrive Claude per ogni progetto: non serve toccarla. Se resta vuota si usa la descrizione breve. Come immagine di anteprima dei link condivisi si usa sempre la copertina.' },
        { name: 'ordine', type: 'hidden' },
      ],
    },
    {
      name: 'categorie',
      label: 'Categorie',
      singular: 'categoria',
      icon: 'tag',
      folder: '_categorie',
      permalink: '/work/:slug/',
      sort: ['ordine', 'title'],
      orderField: 'ordine',
      thumb: 'copertina',
      count: { collection: 'progetti', field: 'categoria', alsoField: 'altre_categorie' },
      fields: [
        { name: 'title', label: 'Nome', type: 'string', required: true, i18n: true },
        { name: 'copertina', label: 'Immagine', type: 'image', hint: 'Compare nella pagina Work.' },
        { name: 'body', label: 'Descrizione', type: 'markdown', rows: 4, i18n: true },
        { name: 'ordine', type: 'hidden' },
      ],
    },
    {
      name: 'news',
      label: 'News',
      singular: 'news',
      icon: 'send',
      folder: '_news',
      sort: ['-data', 'title'],
      thumb: 'immagine',
      filters: ['categoria'],
      subtitle: ['fonte', 'data'],
      fields: [
        { name: 'title', label: 'Titolo', type: 'string', required: true, hint: 'Il titolo dell’articolo, anche riscritto a parole tue.' },
        { side: true, name: 'data', label: 'Data', type: 'string', required: true, placeholder: 'AAAA-MM-GG', hint: 'Es. 2026-11-14. Le news più recenti vanno in cima.' },
        { side: true, name: 'categoria', label: 'Categoria', type: 'select', required: true, options: ['siti', 'grafica', 'ai'], hint: 'siti = Siti del giorno · grafica · ai' },
        { side: true, name: 'fonte', label: 'Fonte', type: 'string', required: true, hint: 'Es. Awwwards · Sito del giorno, It’s Nice That, Anthropic.' },
        { side: true, name: 'link', label: 'Link all’articolo', type: 'string', required: true, placeholder: 'https://…' },
        { side: true, name: 'immagine', label: 'Immagine', type: 'image', hint: 'Facoltativa: se manca, la copertina è il nome della fonte su un colore.' },
        { name: 'body', label: 'Il tuo commento', type: 'markdown', rows: 3, hint: 'Una o due frasi: perché ti è piaciuto.' },
      ],
    },
    {
      name: 'clienti',
      label: 'Clienti',
      singular: 'cliente',
      icon: 'briefcase',
      folder: '_clienti',
      sort: ['title'],
      thumb: 'logo',
      filters: ['settore', 'paese'],
      subtitle: ['settore', 'paese'],
      count: { collection: 'progetti', field: 'cliente' },
      fields: [
        { name: 'title', label: 'Nome', type: 'string', required: true },
        { name: 'logo', label: 'Logo', type: 'image' },
        {
          name: 'settore', label: 'Settore', type: 'select',
          options: [
            'Food & Beverage', 'Fashion & Luxury', 'Beauty & Cosmetics', 'Home & Interior Design', 'Retail & E-commerce',
            'Tech & Digital', 'Media & Entertainment', 'Music', 'Publishing', 'Art & Culture', 'Travel & Hospitality',
            'Sport & Wellness', 'Automotive', 'Healthcare & Pharma', 'Finance & Insurance', 'Education',
            'Non-profit & Public Sector', 'Agency & Studio', 'Altro',
          ],
        },
        { name: 'paese', label: 'Paese', type: 'country' },
        { name: 'sito', label: 'Sito web', type: 'string', placeholder: 'https://…' },
      ],
    },
  ],

  pages: [
    {
      name: 'home',
      label: 'Home',
      icon: 'home',
      file: '_data/home.yml',
      format: 'yaml',
      url: '/',
      fields: [
        { name: 'intro', label: 'Frase di apertura', type: 'text', i18n: true },
        { name: 'apertura_testo', label: 'Testo sotto la frase di apertura', type: 'text', i18n: true },
        { name: 'apertura_link', label: 'Testo del link a About me', type: 'string', default: 'Chi sono', i18n: true },
        { name: 'titolo_progetti', label: 'Titolo sezione progetti', type: 'string', default: 'Lavori selezionati', i18n: true },
        { name: 'progetti', label: 'Progetti in home', type: 'relationList', collection: 'progetti', hint: 'Scegli quali progetti mostrare in home e trascinali nell’ordine che vuoi.' },
      ],
    },
    {
      name: 'about',
      label: 'About me',
      icon: 'user',
      file: 'about.md',
      url: '/about/',
      fields: [
        { name: 'layout', type: 'hidden', default: 'about' },
        { name: 'permalink', type: 'hidden', default: '/about/' },
        { name: 'title', label: 'Titolo', type: 'string', required: true, i18n: true },
        { name: 'foto', label: 'Foto', type: 'image' },
        { name: 'body', label: 'Testo', type: 'markdown', i18n: true },
        { name: 'mostra_clienti', label: 'Mostra i loghi dei clienti', type: 'boolean', default: true },
      ],
    },
  ],

  settings: [
    {
      name: 'impostazioni',
      label: 'Nome e contatti',
      icon: 'sliders',
      file: '_data/impostazioni.yml',
      format: 'yaml',
      fields: [
        { name: 'nome', label: 'Nome', type: 'string', required: true },
        { name: 'email', label: 'Email', type: 'string' },
        { name: 'instagram', label: 'Instagram (link)', type: 'string', placeholder: 'https://instagram.com/…' },
        { name: 'linkedin', label: 'LinkedIn (link)', type: 'string', placeholder: 'https://linkedin.com/in/…' },
      ],
    },
    {
      name: 'immagini',
      label: 'Immagini',
      icon: 'image',
      file: '_data/cms.yml',
      format: 'yaml',
      intro: 'Queste regole valgono per ogni foto che carichi da adesso in poi. Le foto già caricate non cambiano.',
      fields: [
        { name: 'webp', label: 'Converti automaticamente JPG e PNG in WebP', type: 'boolean', default: true, hint: 'WebP pesa molto meno a parità di qualità: il sito si carica più in fretta. Mantiene anche la trasparenza dei PNG.' },
        {
          name: 'qualita', label: 'Qualità', type: 'select', default: 92,
          options: [
            { value: 100, label: '100% · massima (file più pesanti)' },
            { value: 95, label: '95% · altissima' },
            { value: 92, label: '92% · consigliata, nessuna differenza visibile' },
            { value: 85, label: '85% · alta' },
            { value: 80, label: '80% · buona, file leggeri' },
          ],
        },
        {
          name: 'lato_max', label: 'Dimensione massima', type: 'select', default: 2560,
          hint: 'Il lato più lungo della foto viene ridotto a questa misura, se più grande.',
          options: [
            { value: 1920, label: '1920 px' },
            { value: 2560, label: '2560 px · consigliata' },
            { value: 3200, label: '3200 px' },
            { value: 0, label: 'Originale, non ridurre' },
          ],
        },
      ],
    },
  ],
};
