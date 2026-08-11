/**
 * Esquema de campos por tipo de bloque.
 *
 * Es la única descripción de qué se puede editar. `BlockForm` lo interpreta y
 * genera el formulario; no hay formularios escritos a mano por tipo.
 *
 * Añadir un tipo de bloque al CMS es: describirlo aquí, crear el componente en
 * `components/blocks/` y registrarlo en el `switch` de `BlockRenderer.tsx`.
 */

export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'number'
  | 'boolean'
  | 'color'
  | 'image'
  | 'link'
  | 'list'
  | 'stringList'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  help?: string
  /** Para `select`. */
  options?: { value: string | number; label: string }[]
  /** Para `list`: campos de cada elemento. */
  itemFields?: FieldDef[]
  /** Para `list`: campo que se usa como título del elemento en la interfaz. */
  itemLabelKey?: string
  /** Marca el campo como obligatorio en la interfaz (el servidor revalida). */
  required?: boolean
}

import { ICON_NAMES } from '@/lib/icons'

export interface BlockDef {
  label: string
  description: string
  fields: FieldDef[]
  /** Valores iniciales al insertar el bloque. */
  defaults: Record<string, unknown>
}

/* --- Opciones reutilizables ------------------------------------------------ */

const themeOptions = [
  { value: 'transparent', label: 'Sin fondo' },
  { value: 'light', label: 'Gris claro' },
  { value: 'brand', label: 'Azul de marca' },
  { value: 'dark', label: 'Oscuro' },
]

const columnOptions = [
  { value: 2, label: '2 columnas' },
  { value: 3, label: '3 columnas' },
  { value: 4, label: '4 columnas' },
]

const linkField = (key: string, label: string): FieldDef => ({
  key,
  label,
  type: 'link',
})

const cardItemFields: FieldDef[] = [
  { key: 'title', label: 'Título', type: 'text', required: true },
  { key: 'description', label: 'Descripción', type: 'textarea' },
  { key: 'label', label: 'Etiqueta', type: 'text', help: 'Distintivo pequeño sobre el título.' },
  { key: 'image', label: 'Imagen', type: 'image' },
  { key: 'href', label: 'Enlace', type: 'text', help: 'Ruta interna (/mercados) o URL completa.' },
  {
    key: 'icon',
    label: 'Icono',
    type: 'select',
    help: 'Se dibuja sobre el título. Vectorial: no pesa ni pierde nitidez.',
    options: ICON_NAMES.map((n) => ({ value: n, label: n })),
  },
  {
    key: 'highlight',
    label: 'Destacar en color de marca',
    type: 'boolean',
    help: 'Rellena esta tarjeta en azul. Usa sólo una por rejilla.',
  },
]

/* --- Definiciones ---------------------------------------------------------- */

export const BLOCK_SCHEMA: Record<string, BlockDef> = {
  hero: {
    label: 'Cabecera',
    description: 'Bloque de apertura de la página.',
    fields: [
      {
        key: 'variant',
        label: 'Estilo',
        type: 'select',
        options: [
          { value: 'full', label: 'Imagen a pantalla completa' },
          { value: 'split', label: 'Texto e imagen en dos columnas' },
          { value: 'compact', label: 'Sólo texto, fondo azul claro' },
          { value: 'feature', label: 'Panel azul con foto enmarcada' },
        ],
      },
      { key: 'eyebrow', label: 'Antetítulo', type: 'text' },
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
      { key: 'image', label: 'Imagen', type: 'image' },
      {
        key: 'icon',
        label: 'Icono',
        type: 'select',
        help: 'Sólo en el estilo «Panel azul con foto enmarcada».',
        options: ICON_NAMES.map((n) => ({ value: n, label: n })),
      },
      linkField('cta', 'Botón principal'),
      linkField('secondaryCta', 'Botón secundario'),
    ],
    defaults: { type: 'hero', variant: 'compact', title: 'Nuevo título' },
  },

  heroSlider: {
    label: 'Cabecera con diapositivas',
    description: 'Carrusel de apertura con avance automático.',
    fields: [
      {
        key: 'video',
        label: 'Vídeo de fondo',
        type: 'text',
        help: 'Ruta del archivo, por ejemplo /assets/video/hero-2026-08.mp4. Es el mismo fondo para todas las diapositivas.',
      },
      {
        key: 'poster',
        label: 'Imagen de fondo mientras carga el vídeo',
        type: 'image',
        help: 'Es también lo único que ve quien navega con ahorro de datos o con el movimiento reducido.',
      },
      {
        key: 'autoplaySeconds',
        label: 'Segundos por diapositiva',
        type: 'number',
        help: 'Pon 0 para que no avance solo. Por defecto, 7.',
      },
      {
        key: 'slides',
        label: 'Diapositivas',
        type: 'list',
        required: true,
        itemLabelKey: 'title',
        // Sin imagen: el fondo de esta cabecera es el vídeo, que es común a
        // todas. La imagen por diapositiva se pedía como obligatoria y no se
        // pintaba en ningún sitio.
        itemFields: [
          { key: 'eyebrow', label: 'Antetítulo', type: 'text' },
          { key: 'title', label: 'Título', type: 'text', required: true },
          { key: 'subtitle', label: 'Subtítulo', type: 'textarea' },
          linkField('cta', 'Botón principal'),
          linkField('secondaryCta', 'Botón secundario'),
        ],
      },
    ],
    defaults: {
      type: 'heroSlider',
      autoplaySeconds: 7,
      slides: [
        { title: 'Nueva diapositiva' },
      ],
    },
  },

  richText: {
    label: 'Texto',
    description: 'Uno o varios párrafos.',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text' },
      { key: 'title', label: 'Título', type: 'text' },
      {
        key: 'align',
        label: 'Alineación',
        type: 'select',
        options: [
          { value: 'left', label: 'Izquierda' },
          { value: 'center', label: 'Centrado' },
        ],
      },
      {
        key: 'paragraphs',
        label: 'Párrafos',
        type: 'stringList',
        required: true,
        help: 'Cada entrada es un párrafo independiente.',
      },
    ],
    defaults: { type: 'richText', align: 'left', paragraphs: ['Escribe aquí.'] },
  },

  cardGrid: {
    label: 'Rejilla de tarjetas',
    description: 'Conjunto de tarjetas en columnas.',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text' },
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'columns', label: 'Columnas', type: 'select', options: columnOptions },
      {
        key: 'variant',
        label: 'Estilo',
        type: 'select',
        options: [
          { value: 'image', label: 'Imagen arriba' },
          { value: 'thumb', label: 'Miniatura al lado' },
          { value: 'overlay', label: 'Texto sobre la imagen' },
          { value: 'text', label: 'Sólo texto' },
          { value: 'compact', label: 'Compacto' },
        ],
      },
      { key: 'theme', label: 'Fondo', type: 'select', options: themeOptions },
      {
        key: 'items',
        label: 'Tarjetas',
        type: 'list',
        required: true,
        itemFields: cardItemFields,
        itemLabelKey: 'title',
      },
    ],
    defaults: {
      type: 'cardGrid',
      columns: 3,
      variant: 'text',
      items: [{ title: 'Nueva tarjeta', description: '' }],
    },
  },

  mediaGrid: {
    label: 'Rejilla de vídeos',
    description: 'Tarjetas con miniatura y botón de reproducción.',
    fields: [
      { key: 'title', label: 'Título', type: 'text' },
      {
        key: 'items',
        label: 'Vídeos',
        type: 'list',
        required: true,
        itemLabelKey: 'title',
        itemFields: [
          { key: 'title', label: 'Título', type: 'text', required: true },
          { key: 'label', label: 'Etiqueta', type: 'text' },
          { key: 'thumbnail', label: 'Miniatura', type: 'image', required: true },
          { key: 'href', label: 'Enlace al vídeo', type: 'text', required: true },
        ],
      },
    ],
    defaults: {
      type: 'mediaGrid',
      title: 'Vídeos',
      items: [{ title: 'Nuevo vídeo', label: 'Video', thumbnail: { src: '', alt: '' }, href: '' }],
    },
  },

  contentBanner: {
    label: 'Banda de contenido',
    description: 'Texto e imagen enfrentados. Alterna el lado para dar ritmo.',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text' },
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'subtitle', label: 'Subtítulo', type: 'text' },
      { key: 'body', label: 'Cuerpo', type: 'textarea' },
      { key: 'image', label: 'Imagen', type: 'image' },
      {
        key: 'fit',
        label: 'Encaje de la imagen',
        type: 'select',
        help: 'Usa «completa» si la imagen lleva texto dentro o es vertical: recortada se pierde.',
        options: [
          { value: 'cover', label: 'Recortada al marco' },
          { value: 'natural', label: 'Completa, con su proporción' },
        ],
      },
      {
        key: 'imageSide',
        label: 'Lado de la imagen',
        type: 'select',
        options: [
          { value: 'right', label: 'Derecha' },
          { value: 'left', label: 'Izquierda' },
        ],
      },
      { key: 'theme', label: 'Fondo', type: 'select', options: themeOptions },
      linkField('cta', 'Botón'),
    ],
    defaults: {
      type: 'contentBanner',
      title: 'Nuevo título',
      theme: 'transparent',
      imageSide: 'right',
    },
  },

  videoFeature: {
    label: 'Vídeo destacado',
    description: 'Texto a un lado y vídeo al otro; se abre en ventana.',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text' },
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'paragraphs', label: 'Párrafos', type: 'stringList' },
      { key: 'video', label: 'Enlace de YouTube', type: 'text', required: true },
      { key: 'videoTitle', label: 'Título del vídeo', type: 'text' },
      { key: 'thumbnail', label: 'Miniatura', type: 'image', required: true },
      { key: 'theme', label: 'Fondo', type: 'select', options: themeOptions },
    ],
    defaults: {
      type: 'videoFeature',
      title: 'Título del vídeo',
      video: 'https://youtu.be/',
      thumbnail: { src: '', alt: '' },
      theme: 'light',
    },
  },

  statGrid: {
    label: 'Cifras',
    description: 'Datos destacados en columnas.',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text' },
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'theme', label: 'Fondo', type: 'select', options: themeOptions },
      {
        key: 'items',
        label: 'Cifras',
        type: 'list',
        required: true,
        itemLabelKey: 'label',
        itemFields: [
          { key: 'value', label: 'Cifra', type: 'text', required: true },
          { key: 'label', label: 'Etiqueta', type: 'text', required: true },
          { key: 'detail', label: 'Detalle', type: 'textarea' },
          {
            key: 'highlight',
            label: 'Destacar en color de marca',
            type: 'boolean',
            help: 'Rellena este mosaico en azul. Usa sólo uno por grupo.',
          },
        ],
      },
    ],
    defaults: {
      type: 'statGrid',
      theme: 'brand',
      items: [{ value: '0', label: 'Nueva cifra' }],
    },
  },

  timeline: {
    label: 'Cronología',
    description: 'Hitos ordenados en el tiempo.',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text' },
      { key: 'title', label: 'Título', type: 'text' },
      {
        key: 'entries',
        label: 'Hitos',
        type: 'list',
        required: true,
        itemLabelKey: 'period',
        itemFields: [
          { key: 'period', label: 'Periodo', type: 'text', required: true },
          { key: 'title', label: 'Título', type: 'text' },
          { key: 'description', label: 'Descripción', type: 'textarea', required: true },
        ],
      },
    ],
    defaults: {
      type: 'timeline',
      entries: [{ period: '2026', description: 'Nuevo hito.' }],
    },
  },

  ctaBanner: {
    label: 'Llamada a la acción',
    description: 'Panel azul de cierre, con imagen opcional a la derecha.',
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      {
        key: 'image',
        label: 'Imagen',
        type: 'image',
        help: 'Opcional. Se coloca sangrando por el lado derecho del panel.',
      },
      { key: 'theme', label: 'Fondo de la sección', type: 'select', options: themeOptions },
      linkField('cta', 'Botón principal'),
      linkField('secondaryCta', 'Botón secundario'),
    ],
    defaults: {
      type: 'ctaBanner',
      theme: 'dark',
      title: '¿Hablamos?',
      cta: { label: 'Contáctenos', href: '/contacto' },
    },
  },

  linkList: {
    label: 'Grupos de enlaces',
    description: 'Tarjetas con listas de enlaces.',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text' },
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'columns', label: 'Columnas', type: 'select', options: columnOptions },
      {
        key: 'groups',
        label: 'Grupos',
        type: 'list',
        required: true,
        itemLabelKey: 'title',
        itemFields: [
          { key: 'title', label: 'Título del grupo', type: 'text', required: true },
          { key: 'description', label: 'Descripción', type: 'textarea' },
          {
            key: 'links',
            label: 'Enlaces',
            type: 'list',
            itemLabelKey: 'label',
            itemFields: [
              { key: 'label', label: 'Texto', type: 'text', required: true },
              { key: 'href', label: 'Destino', type: 'text', required: true },
            ],
          },
        ],
      },
    ],
    defaults: {
      type: 'linkList',
      columns: 3,
      groups: [{ title: 'Nuevo grupo', links: [{ label: 'Enlace', href: '/' }] }],
    },
  },

  quote: {
    label: 'Cita',
    description: 'Testimonio destacado.',
    fields: [
      { key: 'quote', label: 'Cita', type: 'textarea', required: true },
      { key: 'author', label: 'Autor', type: 'text', required: true },
      { key: 'role', label: 'Cargo', type: 'text' },
    ],
    defaults: { type: 'quote', quote: 'Texto de la cita.', author: 'Nombre' },
  },

  contactForm: {
    label: 'Formulario de contacto',
    description: 'Formulario funcional conectado a la API.',
    fields: [
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      {
        key: 'topics',
        label: 'Temas del desplegable',
        type: 'stringList',
        required: true,
      },
      {
        key: 'messagePlaceholder',
        label: 'Texto de ejemplo del campo «Mensaje»',
        type: 'textarea',
        help: 'El gris que se ve dentro del recuadro antes de escribir. Sirve para decirle al visitante qué datos te son útiles.',
      },
      {
        key: 'submitLabel',
        label: 'Texto del botón de envío',
        type: 'text',
        help: 'Por defecto, «Enviar mensaje».',
      },
      {
        key: 'aside',
        label: 'Datos junto al formulario',
        type: 'list',
        help: 'Deja la lista vacía si prefieres el formulario solo, a todo el ancho.',
        itemLabelKey: 'title',
        itemFields: [
          { key: 'logo', label: 'Logotipo', type: 'image', help: 'Va arriba del todo.' },
          { key: 'title', label: 'Título de la columna', type: 'text' },
          { key: 'subtitle', label: 'Línea secundaria', type: 'text' },
          {
            key: 'details',
            label: 'Datos de contacto',
            type: 'list',
            itemLabelKey: 'label',
            itemFields: [
              { key: 'label', label: 'Etiqueta', type: 'text', required: true },
              { key: 'value', label: 'Valor', type: 'text', required: true },
              { key: 'href', label: 'Enlace', type: 'text', help: 'tel:, mailto: o URL.' },
              {
                key: 'extra',
                label: 'Valores adicionales',
                type: 'list',
                help: 'Bajo la misma etiqueta, cada uno con su propio enlace.',
                itemLabelKey: 'value',
                itemFields: [
                  { key: 'value', label: 'Valor', type: 'text', required: true },
                  { key: 'href', label: 'Enlace', type: 'text', help: 'tel:, mailto: o URL.' },
                ],
              },
              { key: 'note', label: 'Nota', type: 'text' },
            ],
          },
          {
            key: 'addresses',
            label: 'Direcciones',
            type: 'list',
            itemLabelKey: 'label',
            itemFields: [
              { key: 'label', label: 'Etiqueta', type: 'text', required: true },
              { key: 'value', label: 'Dirección', type: 'textarea', required: true },
            ],
          },
        ],
      },
    ],
    defaults: {
      type: 'contactForm',
      title: 'Escríbenos',
      topics: ['Consulta comercial', 'Soporte técnico', 'Otra consulta'],
    },
  },

  brandStrip: {
    label: 'Marcas representadas',
    description: 'Tira con los logotipos de las marcas que distribuye la empresa.',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text' },
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'theme', label: 'Fondo', type: 'select', options: themeOptions },
      {
        key: 'brands',
        label: 'Marcas',
        type: 'list',
        required: true,
        itemLabelKey: 'name',
        itemFields: [
          { key: 'name', label: 'Nombre', type: 'text', required: true },
          { key: 'logo', label: 'Logotipo', type: 'image', required: true },
          { key: 'description', label: 'Descripción', type: 'textarea' },
          { key: 'href', label: 'Sitio de la marca', type: 'text' },
        ],
      },
    ],
    defaults: {
      type: 'brandStrip',
      theme: 'light',
      eyebrow: 'Marcas',
      title: 'Distribuidores autorizados',
      brands: [{ name: 'Nueva marca', logo: { src: '', alt: '' } }],
    },
  },

  productShowcase: {
    label: 'Productos destacados',
    description: 'Los tres productos PPG que abren el sitio. Se editan en «Productos».',
    fields: [],
    defaults: { type: 'productShowcase' },
  },

  colorCarousel: {
    label: 'Carrusel de colores',
    description: 'Adelanto de la carta de colores, sobre fondo oscuro.',
    fields: [],
    defaults: { type: 'colorCarousel' },
  },

  colorCatalog: {
    label: 'Carta de colores completa',
    description:
      'La carta entera con pestañas por familia y buscador. Se alimenta sola de la Carta de color; no hay nada que configurar.',
    fields: [],
    defaults: { type: 'colorCatalog' },
  },

  specList: {
    label: 'Ficha técnica',
    description: 'Listado de términos con su nota. Para materiales, normas o acabados.',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text' },
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'theme', label: 'Fondo', type: 'select', options: themeOptions },
      {
        key: 'columns',
        label: 'Columnas',
        type: 'select',
        options: [
          { value: '2', label: 'Dos' },
          { value: '1', label: 'Una' },
        ],
      },
      {
        key: 'items',
        label: 'Filas',
        type: 'list',
        required: true,
        itemLabelKey: 'term',
        itemFields: [
          { key: 'term', label: 'Término', type: 'text', required: true },
          {
            key: 'note',
            label: 'Nota',
            type: 'textarea',
            help: 'Qué implica en la práctica. Sin nota, la fila se lee como relleno.',
          },
          {
            key: 'icon',
            label: 'Icono',
            type: 'select',
            options: ICON_NAMES.map((n) => ({ value: n, label: n })),
          },
        ],
      },
    ],
    defaults: { type: 'specList', columns: 2, items: [] },
  },

  colorShowcase: {
    label: 'Muestrario de color',
    description: 'Muestras de color y acabados disponibles.',
    fields: [
      { key: 'eyebrow', label: 'Antetítulo', type: 'text' },
      { key: 'title', label: 'Título', type: 'text', required: true },
      { key: 'description', label: 'Descripción', type: 'textarea' },
      { key: 'theme', label: 'Fondo', type: 'select', options: themeOptions },
      {
        key: 'swatches',
        label: 'Muestras de color',
        type: 'list',
        required: true,
        itemLabelKey: 'code',
        itemFields: [
          { key: 'hex', label: 'Color', type: 'color', required: true },
          { key: 'code', label: 'Código', type: 'text', help: 'Por ejemplo, RAL 5015.' },
          { key: 'name', label: 'Nombre', type: 'text' },
        ],
      },
      {
        key: 'finishes',
        label: 'Acabados',
        type: 'list',
        itemLabelKey: 'name',
        help: 'La textura de la muestra se elige por el nombre: metálico, martillado, mate o brillante.',
        itemFields: [
          { key: 'name', label: 'Acabado', type: 'text', required: true },
          { key: 'description', label: 'Descripción', type: 'textarea' },
        ],
      },
      {
        key: 'note',
        label: 'Nota al pie',
        type: 'textarea',
        help: 'Aclaración sobre la fidelidad del color en pantalla.',
      },
      linkField('cta', 'Botón'),
    ],
    defaults: {
      type: 'colorShowcase',
      title: 'Color y acabados',
      swatches: [{ hex: '#0078a9', code: 'RAL 5015' }],
      finishes: [{ name: 'Brillante' }],
    },
  },
}

export const BLOCK_TYPES = Object.keys(BLOCK_SCHEMA)

export function blockLabel(type: string): string {
  return BLOCK_SCHEMA[type]?.label ?? type
}

/** Resumen de una línea para mostrar el bloque plegado en la lista. */
export function blockSummary(block: Record<string, unknown>): string {
  for (const key of ['title', 'quote', 'eyebrow']) {
    const value = block[key]
    if (typeof value === 'string' && value.trim() !== '') {
      return value.length > 70 ? `${value.slice(0, 70)}…` : value
    }
  }

  const items = block.items ?? block.entries ?? block.groups ?? block.paragraphs

  if (Array.isArray(items)) {
    return `${items.length} elemento${items.length === 1 ? '' : 's'}`
  }

  return '—'
}
