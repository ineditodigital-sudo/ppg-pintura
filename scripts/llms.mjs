/**
 * Genera `llms.txt`: el resumen del sitio para modelos de lenguaje.
 *
 * Es la convención que están adoptando los rastreadores de IA para saber de
 * qué va un sitio sin tener que reconstruirlo página a página. Se genera del
 * mismo contenido que el sitio, así que no puede quedarse desfasado: si el
 * cliente añade un sector o cambia el teléfono desde el panel, la próxima
 * publicación lo recoge.
 *
 * Sólo datos que ya son públicos en la web. Nada de precios ni condiciones
 * comerciales: el listado del distribuidor es confidencial y no sale de aquí.
 */
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const raiz = fileURLToPath(new URL('..', import.meta.url))
const datos = join(raiz, 'backend', 'data')
const SITIO = 'https://ppg.pinturaenpolvo-mx.com'

const leer = async (n) => JSON.parse(await readFile(join(datos, n), 'utf8'))

const [site, lineas, mercados, colores] = await Promise.all([
  leer('site.json'),
  leer('business-lines.json'),
  leer('markets.json'),
  leer('colors.json'),
])

const enStock = colores.colors.filter((c) => c.stock).length
const conRal = colores.colors.filter((c) => c.ral).length
const whatsapp = site.social?.find((s) => s.network === 'whatsapp')?.href ?? ''

const texto = `# ${site.name}

> ${site.tagline}

Distribuidor autorizado de PPG en Aguascalientes, México. Suministro de
recubrimiento en polvo (pintura electrostática), pintura líquida industrial y
pretratamientos metálicos para proyectos industriales, franquicias y empresas.

## Qué es este sitio

Catálogo y punto de contacto del distribuidor. No es una tienda: no hay
carrito ni precios publicados. Las cotizaciones se piden por el formulario de
contacto o por WhatsApp.

## Datos de contacto

- Ubicación: Aguascalientes, Aguascalientes, México
- Correo: ${site.social ? 'ventas@coatingsystemsmx.com' : ''}
${whatsapp ? `- WhatsApp: ${whatsapp}` : ''}
- Formulario: ${SITIO}/contacto

## Líneas de producto

${lineas.map((l) => `- [${l.name}](${SITIO}/productos/${l.slug}): ${l.headline}. ${l.description}`).join('\n')}

## Sectores atendidos

${mercados.map((m) => `- [${m.name}](${SITIO}/mercados/${m.slug}): ${m.headline}. Sustratos habituales: ${m.sustratos.join(', ')}.`).join('\n')}

## Carta de color

${colores.colors.length} referencias de catálogo PPG en ${colores.families.map((f) => f.name.toLowerCase()).join(', ')}.
${conRal} de ellas con equivalencia RAL publicada y ${enStock} marcadas con
existencia local. La carta completa, con buscador y ficha por referencia, está
en ${SITIO}/colores

Cada referencia publica su código PPG, su nombre, su equivalencia RAL cuando
existe, el acabado y el rango de brillo. Los datos de resistencia, espesor de
película y curva de curado no se publican aquí: vienen en la ficha técnica del
producto y se piden al distribuidor.

## Páginas

- [Inicio](${SITIO}/)
- [Quiénes somos](${SITIO}/quienes-somos)
- [Mercados](${SITIO}/mercados)
- [Carta de color](${SITIO}/colores)
- [Contacto](${SITIO}/contacto)
`

await writeFile(join(raiz, 'frontend', 'dist', 'llms.txt'), texto, 'utf8')

console.log(`llms.txt generado: ${texto.length} caracteres.`)
