/**
 * Genera `public/sitemap.xml` a partir del contenido real.
 *
 * Se genera y no se escribe a mano porque las rutas de sectores y de líneas de
 * producto salen de los JSON: en cuanto alguien añada un sector desde el CMS y
 * se vuelva a compilar, aparece en el sitemap solo. Un sitemap desactualizado
 * es peor que no tenerlo, porque manda al buscador a páginas que ya no existen.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
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

const rutas = new Set(['/'])

// Páginas sueltas, por su nombre de archivo.
const mapa = { home: '/', mercados: '/mercados', contacto: '/contacto', 'quienes-somos': '/quienes-somos' }
for (const archivo of readdirSync(join(datos, 'pages'))) {
  if (!archivo.endsWith('.json')) continue
  const slug = archivo.replace(/\.json$/, '')
  rutas.add(mapa[slug] ?? `/${slug}`)
}

// Sectores y líneas de producto.
const mercados = leer(join(datos, 'markets.json'))
for (const m of mercados.markets ?? mercados) {
  rutas.add(`/mercados/${m.slug}`)
}

const lineas = leer(join(datos, 'business-lines.json'))
for (const l of lineas.lines ?? lineas) {
  rutas.add(`/productos/${l.slug}`)
}

// Ojo: aquí sólo pueden entrar rutas declaradas en el router de `App.tsx`.
// `/colores` estuvo un tiempo listado sin existir y mandaba al buscador a
// indexar la página de error; ahora es una página de verdad.
rutas.add('/colores')

const hoy = new Date().toISOString().slice(0, 10)

const cuerpo = [...rutas]
  .sort()
  .map(
    (ruta) =>
      `  <url>\n` +
      // Con barra final: cada ruta es una carpeta prerenderizada y el servidor
      // redirige la forma sin barra. Listarlas sin ella mandaba al buscador a
      // un 301 en cada una de las catorce.
      `    <loc>${SITIO}${ruta === '/' ? '/' : ruta + '/'}</loc>\n` +
      `    <lastmod>${hoy}</lastmod>\n` +
      `    <priority>${prioridad(ruta)}</priority>\n` +
      `  </url>`,
  )
  .join('\n')

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${cuerpo}
</urlset>
`

const destino = join(aqui, '..', 'public', 'sitemap.xml')
writeFileSync(destino, xml, 'utf8')

console.log(`Sitemap generado: ${rutas.size} rutas`)
