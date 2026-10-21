// Sezioni e campi del pannello. Per aggiungere un campo basta aggiungere una riga qui
// (e poi usarlo nei layout del sito).
// Tipi di campo: string, text, markdown, number, boolean, image, relation, gallery, hidden.
// Il campo "body" è il testo sotto le impostazioni del file (il contenuto della pagina).

window.CMS = {
  collections: [
    {
      name: 'progetti',
      label: 'Progetti',
      singular: 'progetto',
      icon: 'folder',
      folder: '_progetti',
      sort: ['categoria', 'ordine', 'title'],
      thumb: 'copertina',
      subtitle: ['categoria', 'cliente', 'anno', 'in_evidenza'],
      fields: [
        { name: 'title', label: 'Titolo', type: 'string', required: true },
        { name: 'categoria', label: 'Categoria', type: 'relation', collection: 'categorie', required: true },
        { name: 'cliente', label: 'Cliente', type: 'relation', collection: 'clienti' },
        { name: 'anno', label: 'Anno', type: 'number' },
        { name: 'copertina', label: 'Immagine di copertina', type: 'image', required: true },
        { name: 'sottotitolo', label: 'Descrizione breve', type: 'string', hint: 'Una riga, compare sotto la copertina negli elenchi.' },
        { name: 'body', label: 'Descrizione', type: 'markdown' },
        { name: 'galleria', label: 'Galleria', type: 'gallery', hint: 'Foto e video nell’ordine in cui vuoi mostrarli. Usa le frecce per riordinarli.' },
        { name: 'crediti', label: 'Crediti', type: 'markdown', rows: 4 },
        { name: 'in_evidenza', label: 'In evidenza in home', type: 'boolean', short: 'In home' },
        { name: 'ordine', label: 'Ordine', type: 'number', default: 10, hint: 'Numero più basso = più in alto nella sua categoria.' },
      ],
    },
    {
      name: 'categorie',
      label: 'Categorie',
      singular: 'categoria',
      icon: 'tag',
      folder: '_categorie',
      sort: ['ordine', 'title'],
      thumb: 'copertina',
      subtitle: ['ordine'],
      fields: [
        { name: 'title', label: 'Nome', type: 'string', required: true },
        { name: 'copertina', label: 'Immagine', type: 'image', hint: 'Compare nella pagina Work.' },
        { name: 'body', label: 'Descrizione', type: 'markdown', rows: 4 },
        { name: 'ordine', label: 'Ordine', type: 'number', default: 10, hint: 'Numero più basso = più in alto nella pagina Work.' },
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
      fields: [
        { name: 'intro', label: 'Frase di apertura', type: 'text' },
        { name: 'titolo_progetti', label: 'Titolo sezione progetti', type: 'string', default: 'Lavori selezionati' },
      ],
    },
    {
      name: 'about',
      label: 'About me',
      icon: 'user',
      file: 'about.md',
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
  ],
};
