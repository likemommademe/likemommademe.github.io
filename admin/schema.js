// Sezioni e campi del pannello. Per aggiungere un campo basta aggiungere una riga qui
// (e poi usarlo nei layout del sito).
// Tipi di campo: string, text, markdown, number, boolean, publish, select, image, relation,
// relationList, gallery, hidden.
// Il campo "body" è il testo sotto le impostazioni del file (il contenuto della pagina).

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
      filters: ['categoria', 'cliente'],
      thumb: 'copertina',
      subtitle: ['categoria', 'cliente', 'anno'],
      home: { file: '_data/home.yml', field: 'progetti' },
      fields: [
        { name: 'title', label: 'Titolo', type: 'string', required: true },
        { name: 'published', label: 'Pubblicato sul sito', type: 'publish', default: false, hint: 'Spento = bozza: resta qui nel pannello ma non compare sul sito.' },
        { name: 'categoria', label: 'Categoria', type: 'relation', collection: 'categorie', required: true },
        { name: 'cliente', label: 'Cliente', type: 'relation', collection: 'clienti' },
        { name: 'anno', label: 'Anno', type: 'number' },
        { name: 'copertina', label: 'Immagine di copertina', type: 'image', required: true },
        { name: 'sottotitolo', label: 'Descrizione breve', type: 'string', hint: 'Una riga, compare sotto la copertina negli elenchi.' },
        { name: 'body', label: 'Descrizione', type: 'markdown' },
        { name: 'galleria', label: 'Galleria', type: 'gallery', hint: 'Trascina qui le foto dal Finder. Riordina con la maniglia ⋮⋮ a sinistra.' },
        { name: 'crediti', label: 'Crediti', type: 'markdown', rows: 4 },
        { name: 'seo_descrizione', label: 'Descrizione per Google', type: 'text', group: 'SEO', hint: 'Circa 150 caratteri. Se vuota si usa la descrizione breve.' },
        { name: 'seo_immagine', label: 'Immagine di anteprima', type: 'image', group: 'SEO', hint: 'Compare quando condividi il link (WhatsApp, social…). Se vuota si usa la copertina.' },
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
      count: { collection: 'progetti', field: 'categoria' },
      fields: [
        { name: 'title', label: 'Nome', type: 'string', required: true },
        { name: 'copertina', label: 'Immagine', type: 'image', hint: 'Compare nella pagina Work.' },
        { name: 'body', label: 'Descrizione', type: 'markdown', rows: 4 },
        { name: 'ordine', type: 'hidden' },
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
      subtitle: ['sito'],
      count: { collection: 'progetti', field: 'cliente' },
      fields: [
        { name: 'title', label: 'Nome', type: 'string', required: true },
        { name: 'logo', label: 'Logo', type: 'image' },
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
        { name: 'intro', label: 'Frase di apertura', type: 'text' },
        { name: 'titolo_progetti', label: 'Titolo sezione progetti', type: 'string', default: 'Lavori selezionati' },
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
        { name: 'title', label: 'Titolo', type: 'string', required: true },
        { name: 'foto', label: 'Foto', type: 'image' },
        { name: 'body', label: 'Testo', type: 'markdown' },
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
