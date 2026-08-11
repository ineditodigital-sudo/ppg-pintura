/**
 * Genera `public/sitemap.xml` a partir del contenido real.
 *
 * Se genera y no se escribe a mano porque las rutas de sectores y de líneas de
 * producto salen de los JSON: en cuanto alguien añada un sector desde el CMS y
 * se vuelva a compilar, aparece en el sitemap solo. Un sitemap desactualizado
 * es peor que no tenerlo, porque manda al buscador a páginas que ya no existen.
 *
 * El panel y la API no entran nunca: no son contenido y además están
 * bloqueados en `robots.txt`.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const aqui = dirname(fileURLToPath(import.meta.url))
const raiz = join(aqui, '..', '..')
const datos = join(raiz, 'backend', 'data')

const SITIO = process.env.SITE_URL ?? 'https://ppg.pinturaenpolvo-mx.com'

const leer = (ruta) => JSON.parse(readFileSync(ruta, 'utf8'))

/** Prioridad orientativa: la portada manda, y el contenido comercial va antes. */
function prioridad(ruta) {
  if (ruta === '/') return '1.0'
  if (ruta.startsWith('/productos/') || ruta.startsWith('/mercados/')) return '0.8'
  if (ruta === '/contacto') return '0.7'
  return '0.6'
}

/**
 * Cuándo cambió de verdad el contenido que alimenta una ruta.
 *
 * Antes se ponía la fecha de hoy en las catorce, en cada compilación: el
 * sitemap afirmaba que el sitio entero había cambiado cada vez que se
 * publicaba, aunque sólo se hubiera tocado una coma. Google desconfía de un
 * `lastmod` así y acaba ignorándolo, que es justo perder la señal que sirve
 * para pedir que vuelvan a rastrear lo que sí cambió.
 *
 * Se toma la fecha del último commit que tocó el archivo de contenido. Si no
 * hay git a mano —una copia descargada, por ejemplo— se cae a la fecha de
 * modificación del archivo, que es lo mejor que se puede saber ahí.
 */
const cacheFechas = new Map()

function fechaDe(...archivos) {
  const fechas = archivos.map((archivo) => {
    if (cacheFechas.has(archivo)) return cacheFechas.get(archivo)

    let fecha
    try {
      fecha = execFileSync('git', ['log', '-1', '--format=%cs', '--', archivo], {
        cwd: raiz,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim()
    } catch {
      fecha = ''
    }

    if (!fecha) {
      fecha = statSync(archivo).mtime.toISOString().slice(0, 10)
    }

    cacheFechas.set(archivo, fecha)
    return fecha
  })

  // La más reciente: una página de sector cambia si cambia el sector o si
  // cambia el texto de la plantilla que la envuelve.
  return fechas.sort().at(-1)
}

const F = {
  markets: join(datos, 'markets.json'),
  lineas: join(datos, 'business-lines.json'),
  colores: join(datos, 'colors.json'),
  plantillas: join(datos, 'templates.json'),
  site: join(datos, 'site.json'),
}

/** @type {{ruta: string, fuentes: string[], imagenes?: {url: string, titulo: string}[]}[]} */
const entradas = []

// Páginas sueltas, por su nombre de archivo.
const mapa = {
  home: '/',
  mercados: '/mercados',
  contacto: '/contacto',
  'quienes-somos': '/quienes-somos',
}

for (const archivo of readdirSync(join(datos, 'pages'))) {
  if (!archivo.endsWith('.json')) continue
  const slug = archivo.replace(/\.json$/, '')
  entradas.push({
    ruta: mapa[slug] ?? `/${slug}`,
    fuentes: [join(datos, 'pages', archivo)],
  })
}

// Sectores y líneas de producto. Se declara su imagen: en un catálogo de color
// y de acabados, la búsqueda por imágenes trae visitas que la de texto no.
const mercados = leer(F.markets)
for (const m of mercados.markets ?? mercados) {
  entradas.push({
    ruta: `/mercados/${m.slug}`,
    fuentes: [F.markets, F.plantillas],
    imagenes: m.image?.src ? [{ url: m.image.src, titulo: `${m.name} · ${m.headline}` }] : [],
  })
}

const lineas = leer(F.lineas)
for (const l of lineas.lines ?? lineas) {
  entradas.push({
    ruta: `/productos/${l.slug}`,
    fuentes: [F.lineas, F.plantillas],
    imagenes: l.image?.src ? [{ url: l.image.src, titulo: `${l.name} · ${l.headline}` }] : [],
  })
}

// Ojo: aquí sólo pueden entrar rutas declaradas en el router de `App.tsx`.
// `/colores` estuvo un tiempo listado sin existir y mandaba al buscador a
// indexar la página de error; ahora es una página de verdad.
entradas.push({ ruta: '/colores', fuentes: [F.colores] })

/**
 * Las 83 referencias NO llevan URL propia, y es a propósito.
 *
 * Serían 83 páginas con ocho datos cada una y el mismo esqueleto: contenido
 * escaso y casi duplicado, que es lo que un buscador penaliza. La forma de
 * salir por «PCTH80109» o por «RAL 9016 pintura en polvo» es que esos códigos
 * estén en el HTML de `/colores`, y ahí están: el prerenderizado lista las 83
 * con su código, su nombre, su RAL y su acabado.
 */

const esc = (v) =>
  String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const cuerpo = entradas
  .sort((a, b) => a.ruta.localeCompare(b.ruta))
  .map((e) => {
    const imagenes = (e.imagenes ?? [])
      .map(
        (i) =>
          `    <image:image>\n` +
          `      <image:loc>${SITIO}${esc(i.url)}</image:loc>\n` +
          `      <image:title>${esc(i.titulo)}</image:title>\n` +
          `    </image:image>\n`,
      )
      .join('')

    return (
      `  <url>\n` +
      // Con barra final: cada ruta es una carpeta prerenderizada y el servidor
      // redirige la forma sin barra. Listarlas sin ella mandaba al buscador a
      // un 301 en cada una de las catorce.
      `    <loc>${SITIO}${e.ruta === '/' ? '/' : e.ruta + '/'}</loc>\n` +
      `    <lastmod>${fechaDe(...e.fuentes)}</lastmod>\n` +
      `    <priority>${prioridad(e.ruta)}</priority>\n` +
      imagenes +
      `  </url>`
    )
  })
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${cuerpo}
</urlset>
`

const destino = join(aqui, '..', 'public', 'sitemap.xml')
writeFileSync(destino, xml, 'utf8')

const conImagen = entradas.filter((e) => (e.imagenes ?? []).length > 0).length
console.log(`Sitemap generado: ${entradas.length} rutas, ${conImagen} con imagen declarada.`)
