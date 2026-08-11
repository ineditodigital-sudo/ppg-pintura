/**
 * Escribe un HTML por ruta, con el texto de esa página dentro.
 *
 * Hasta ahora las catorce rutas servían el mismo `index.html`: cero caracteres
 * de texto en el cuerpo, el mismo `<title>` en todas, sin `<h1>` y sin
 * canonical. Google ejecuta JavaScript y sí veía el contenido, pero los
 * rastreadores de las IA —GPTBot, ClaudeBot, PerplexityBot, CCBot— leen el
 * HTML crudo y no ejecutan nada: para ellos el sitio era una sola página vacía.
 *
 * No es renderizado en servidor. Se saca el texto del mismo JSON que alimenta
 * los componentes y se emite como encabezados y párrafos. El contenido es
 * idéntico porque la fuente es la misma; React lo reemplaza al montar, así que
 * el visitante ve exactamente lo de siempre —sólo que antes, porque hay algo
 * pintado mientras el bundle llega—.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const dist = join(raiz, 'frontend', 'dist')
const datos = join(raiz, 'backend', 'data')
const SITIO = 'https://ppg.pinturaenpolvo-mx.com'

const leer = async (ruta) => JSON.parse(await readFile(join(datos, ruta), 'utf8'))

const [site, lineas, mercados, colores, plantillas] = await Promise.all([
  leer('site.json'),
  leer('business-lines.json'),
  leer('markets.json'),
  leer('colors.json'),
  leer('templates.json'),
])

/** Escapa lo que va a ir dentro del HTML. */
const esc = (v) =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * Saca el texto de un bloque, sea del tipo que sea.
 *
 * Se recorre la estructura en vez de tener un renderizador por tipo de bloque:
 * así, al añadir un bloque nuevo al CMS, su texto entra aquí solo. Lo que se
 * busca son las claves que de verdad llevan prosa.
 */
function textoDelBloque(bloque) {
  const partes = []

  const recorrer = (valor) => {
    if (typeof valor === 'string') return
    if (Array.isArray(valor)) return valor.forEach(recorrer)
    if (!valor || typeof valor !== 'object') return

    for (const [clave, v] of Object.entries(valor)) {
      if (typeof v === 'string' && v.trim() !== '') {
        if (clave === 'title') partes.push(`<h2>${esc(v)}</h2>`)
        else if (['description', 'body', 'subtitle', 'note', 'quote'].includes(clave)) {
          partes.push(`<p>${esc(v)}</p>`)
        }
      } else if (clave === 'paragraphs' && Array.isArray(v)) {
        v.forEach((p) => typeof p === 'string' && partes.push(`<p>${esc(p)}</p>`))
      } else {
        recorrer(v)
      }
    }
  }

  recorrer(bloque)
  return partes
}

/** El cuerpo de una página a partir de sus bloques. */
function cuerpoDeBloques(bloques, titulo) {
  const dentro = bloques.flatMap(textoDelBloque)
  return `<h1>${esc(titulo)}</h1>\n${dentro.join('\n')}`
}

/** «a, b y c», igual que en la plantilla de sector. */
const enumerar = (items) =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`

/* --- Las catorce rutas ------------------------------------------------------ */

const rutas = []

/**
 * El titular de la página: el primero que se lee arriba del todo.
 *
 * La cabecera con diapositivas guarda su texto en `slides`, no en `title`, así
 * que buscar la primera clave `title` daba con un bloque de más abajo: la
 * portada salía encabezada por «Dónde trabajamos» en vez de por su frase
 * clave. Se mira el primer bloque, que es el que hace de titular.
 */
function titularDe(bloques, deReserva) {
  const primero = bloques[0]

  if (primero?.type === 'heroSlider') return primero.slides?.[0]?.title ?? deReserva

  return primero?.title ?? bloques.find((b) => b.title)?.title ?? deReserva
}

for (const slug of ['home', 'quienes-somos', 'mercados', 'contacto']) {
  const pagina = await leer(`pages/${slug}.json`)
  const titulo = titularDe(pagina.blocks, pagina.seo.title)

  rutas.push({
    url: slug === 'home' ? '/' : `/${slug}`,
    titulo: pagina.seo.title,
    descripcion: pagina.seo.description,
    cuerpo: cuerpoDeBloques(pagina.blocks, titulo),
  })
}

for (const linea of lineas) {
  const patron = plantillas.lineas?.seoTitle ?? '{nombre} | PPG'
  const servicios = plantillas.lineas?.comoTrabajamos?.items ?? []

  rutas.push({
    url: `/productos/${linea.slug}`,
    titulo: patron.split('{nombre}').join(linea.name),
    descripcion: linea.description,
    // Se declara como producto: es lo que un buscador —y una IA— necesita
    // para saber que esta página describe algo que se vende.
    entidad: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: linea.name,
      description: linea.description,
      brand: { '@type': 'Brand', name: 'PPG' },
      url: `${SITIO}/productos/${linea.slug}/`,
      image: linea.image?.src ? SITIO + linea.image.src : undefined,
    },
    cuerpo:
      `<h1>${esc(linea.headline)}</h1>\n<p>${esc(linea.description)}</p>\n` +
      servicios.map((s) => `<h2>${esc(s.title)}</h2>\n<p>${esc(s.description)}</p>`).join('\n'),
  })
}

for (const m of mercados) {
  const patron = plantillas.mercados?.seoTitle ?? '{nombre} | Recubrimientos PPG'
  const exigencias = enumerar(m.exigencias.map((e) => e.title.toLowerCase()))
  const rellenar = (t) =>
    t.split('{sector}').join(m.name.toLowerCase()).split('{exigencias}').join(exigencias)

  const exige = plantillas.mercados?.exige ?? {}

  rutas.push({
    url: `/mercados/${m.slug}`,
    titulo: patron.split('{nombre}').join(m.name),
    descripcion: m.description,
    entidad: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: `Recubrimiento en polvo para ${m.name.toLowerCase()}`,
      description: m.description,
      areaServed: { '@type': 'State', name: 'Aguascalientes' },
      provider: { '@type': 'LocalBusiness', name: site.name },
      url: `${SITIO}/mercados/${m.slug}/`,
    },
    cuerpo:
      `<h1>${esc(m.headline)}</h1>\n<p>${esc(m.description)}</p>\n` +
      (exige.title ? `<h2>${esc(rellenar(exige.title))}</h2>\n` : '') +
      (exige.body ? `<p>${esc(rellenar(exige.body))}</p>\n` : '') +
      m.exigencias.map((e) => `<h3>${esc(e.title)}</h3>\n<p>${esc(e.description)}</p>`).join('\n') +
      `\n<h2>Sustratos habituales</h2>\n<p>${esc(m.sustratos.join(', '))}</p>` +
      `\n<h2>Sistema recomendado</h2>\n<p>${esc(m.recomendado)}</p>`,
  })
}

rutas.push({
  url: '/colores',
  titulo: colores.seo?.title ?? 'Carta de colores | Pintura en polvo PPG',
  descripcion: colores.seo?.description ?? '',
  cuerpo:
    `<h1>${esc(colores.portada?.title ?? 'Carta de color')}</h1>\n` +
    `<p>${esc((colores.portada?.entradilla ?? '').split('{n}').join(String(colores.colors.length)))}</p>\n` +
    colores.families
      .map((f) => `<h2>${esc(f.name)}</h2>\n<p>${esc(f.description ?? '')}</p>`)
      .join('\n') +
    // Las 83 referencias con su nombre y su RAL: es exactamente lo que se
    // busca cuando alguien pregunta por un color concreto.
    `\n<h2>Referencias</h2>\n<ul>` +
    colores.colors
      .map(
        (c) =>
          `<li>${esc(c.code)} · ${esc(c.name)}${c.ral ? ` · RAL ${esc(c.ral)}` : ''}` +
          `${c.finish ? ` · ${esc(c.finish)}` : ''}${c.stock ? ' · en existencia' : ''}</li>`,
      )
      .join('') +
    `</ul>`,
})

/* --- Escribir ---------------------------------------------------------------- */

const plantilla = await readFile(join(dist, 'index.html'), 'utf8')
let escritas = 0

for (const r of rutas) {
  let html = plantilla

  // Título y descripción propios. El `<title>` de la plantilla es el de la
  // portada, así que se sustituye en vez de añadir otro.
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(r.titulo)}</title>`)
  html = html.replace(
    /(<meta\s+name="description"\s+content=")[\s\S]*?(")/,
    `$1${esc(r.descripcion)}$2`,
  )

  // Canonical: no había ninguno en el sitio. Sin él, la misma página bajo
  // parámetros distintos —una campaña con `?utm_source=`— cuenta como
  // duplicada.
  // Con barra final: es la forma que sirve el servidor. Sin ella devuelve un
  // 301 a la que sí la lleva, y el canonical acabaría señalando una URL que
  // redirige. Se probó apagar ese redirect en el servidor y responde 403.
  const canonica = r.url === '/' ? SITIO + '/' : `${SITIO}${r.url}/`
  const extras = [`<link rel="canonical" href="${canonica}" />`]

  if (r.entidad) {
    const limpia = JSON.parse(JSON.stringify(r.entidad))
    extras.push(
      `<script type="application/ld+json">${JSON.stringify(limpia)}</script>`,
    )
  }

  html = html.replace('</head>', `  ${extras.join('\n    ')}\n  </head>`)

  // El contenido va dentro de `#root`. React lo reemplaza al montar, así que
  // el visitante ve lo de siempre; quien no ejecuta JavaScript, lee esto.
  html = html.replace('<div id="root"></div>', `<div id="root">${r.cuerpo}</div>`)

  const destino =
    r.url === '/' ? join(dist, 'index.html') : join(dist, r.url.slice(1), 'index.html')

  await mkdir(dirname(destino), { recursive: true })
  await writeFile(destino, html, 'utf8')
  escritas++
}

console.log(`Prerenderizadas ${escritas} rutas con su título, canonical y texto.`)
