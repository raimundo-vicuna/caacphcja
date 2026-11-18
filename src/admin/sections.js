
const today = () => new Date().toISOString().slice(0, 10)

export const SECTIONS = [
  {
    path: 'noticias',
    title: 'Noticias',
    table: 'news',
    singular: 'noticia',
    order: { column: 'published_at', ascending: false },
    defaults: () => ({ title: '', summary: '', body: '', image_url: '', published: true, published_at: today() }),
    row: (r) => ({ title: r.title, sub: `${r.published_at}${r.published ? '' : ' · BORRADOR'}`, image: r.image_url }),
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'summary', label: 'Resumen (se ve en la tarjeta)', type: 'textarea', rows: 3 },
      { name: 'body', label: 'Texto completo (opcional)', type: 'textarea', rows: 6 },
      { name: 'image_url', label: 'Imagen', type: 'image', folder: 'news' },
      { name: 'published_at', label: 'Fecha', type: 'date', required: true },
      { name: 'published', label: 'Publicada (desmárcala para dejarla como borrador)', type: 'checkbox' },
    ],
  },
  {
    path: 'eventos',
    title: 'Eventos',
    table: 'events',
    singular: 'evento',
    order: { column: 'event_date', ascending: true },
    defaults: () => ({ title: '', detail: '', event_date: today() }),
    row: (r) => ({ title: r.title, sub: `${r.event_date}${r.detail ? ' · ' + r.detail : ''}` }),
    fields: [
      { name: 'title', label: 'Nombre del evento', type: 'text', required: true },
      { name: 'detail', label: 'Lugar u hora', type: 'text' },
      { name: 'event_date', label: 'Fecha', type: 'date', required: true },
    ],
  },
  {
    path: 'propuestas',
    title: 'Propuestas y proyectos',
    table: 'proposals',
    singular: 'proyecto',
    order: { column: 'sort', ascending: true },
    defaults: () => ({ title: '', text: '', status: 'En curso', sort: 0 }),
    row: (r) => ({ title: r.title, sub: r.status }),
    fields: [
      { name: 'title', label: 'Nombre', type: 'text', required: true },
      { name: 'text', label: 'Descripción', type: 'textarea', rows: 4 },
      { name: 'status', label: 'Estado', type: 'select', options: ['Próximamente', 'En curso', 'Completado'] },
      { name: 'sort', label: 'Orden (número menor aparece primero)', type: 'number' },
    ],
  },
  {
    path: 'directiva',
    title: 'Directiva',
    table: 'board_members',
    singular: 'integrante',
    order: { column: 'sort', ascending: true },
    defaults: () => ({ role: '', name: '', course: '', photo_url: '', sort: 0 }),
    row: (r) => ({ title: r.role, sub: [r.name, r.course].filter(Boolean).join(' · ') || 'Sin nombre', image: r.photo_url }),
    fields: [
      { name: 'role', label: 'Cargo', type: 'text', required: true },
      { name: 'name', label: 'Nombre', type: 'text' },
      { name: 'course', label: 'Curso', type: 'text' },
      { name: 'photo_url', label: 'Foto', type: 'image', folder: 'board' },
      { name: 'sort', label: 'Orden (número menor aparece primero)', type: 'number' },
    ],
  },
]
