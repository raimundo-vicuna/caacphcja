// ─────────────────────────────────────────────────────────────
//  Todo el contenido editable de la página está en este archivo.
//  Reemplaza los textos genéricos por los datos reales del centro.
// ─────────────────────────────────────────────────────────────

export const SCHOOL = {
  nombre: 'Colegio Padre Hurtado y Juanita de Los Andes',
  sigla: 'CPH CJA',
  sitio: 'https://www.cph-cja.com/',
  // Logo tomado del sitio oficial. Si prefieres, descarga la imagen,
  // ponla en /public y cambia esta ruta por '/escudo.png'.
  escudo:
    'https://static.wixstatic.com/media/61a2c1_27e0f01db31c4b79acd4e9daf83b9701~mv2.png',
  direccion: 'Av. Francisco Bulnes Correa 3000, Las Condes. Santiago. Chile',
}

export const CENTRO = {
  nombre: 'Centro de Alumnos',
  lema: 'Lema del Centro de Alumnos',
  bienvenida: 'Bienvenidos al Centro de Alumnos',
  email: 'correo@centrodealumnos.cl', // reemplazar
  instagram: '@usuario_instagram', // reemplazar
}

export const NAV = [
  { id: 'inicio', label: 'INICIO' },
  { id: 'nosotros', label: 'NOSOTROS' },
  { id: 'noticias', label: 'NOTICIAS Y EVENTOS' },
  { id: 'propuestas', label: 'PROPUESTAS Y PROYECTOS' },
  { id: 'contacto', label: 'CONTACTO' },
]

export const NOSOTROS = {
  titulo: 'Quiénes somos',
  texto:
    'Aquí va la descripción del Centro de Alumnos: qué es, cuál es su misión y cómo representa a los estudiantes del colegio.',
  mision: 'Texto de la misión del Centro de Alumnos.',
  vision: 'Texto de la visión del Centro de Alumnos.',
}

export const DIRECTIVA = [
  { cargo: 'Presidente/a' },
  { cargo: 'Vicepresidente/a' },
  { cargo: 'Secretario/a' },
  { cargo: 'Tesorero/a' },
  { cargo: 'Delegado/a de Deportes' },
  { cargo: 'Delegado/a de Cultura' },
]

export const NOTICIAS = [
  { titulo: 'Título de la noticia', fecha: 'Fecha', resumen: 'Breve resumen de la noticia. Reemplaza este texto por el contenido real.' },
  { titulo: 'Título de la noticia', fecha: 'Fecha', resumen: 'Breve resumen de la noticia. Reemplaza este texto por el contenido real.' },
  { titulo: 'Título de la noticia', fecha: 'Fecha', resumen: 'Breve resumen de la noticia. Reemplaza este texto por el contenido real.' },
]

export const EVENTOS = [
  { dia: '00', mes: 'MES', titulo: 'Nombre del evento', detalle: 'Lugar u hora del evento' },
  { dia: '00', mes: 'MES', titulo: 'Nombre del evento', detalle: 'Lugar u hora del evento' },
  { dia: '00', mes: 'MES', titulo: 'Nombre del evento', detalle: 'Lugar u hora del evento' },
  { dia: '00', mes: 'MES', titulo: 'Nombre del evento', detalle: 'Lugar u hora del evento' },
]

export const PROPUESTAS = [
  { titulo: 'Nombre del proyecto', estado: 'En curso', texto: 'Descripción breve del proyecto o propuesta.' },
  { titulo: 'Nombre del proyecto', estado: 'Próximamente', texto: 'Descripción breve del proyecto o propuesta.' },
  { titulo: 'Nombre del proyecto', estado: 'Completado', texto: 'Descripción breve del proyecto o propuesta.' },
]
