/**
 * Escribe la política de contenido en `dist/index.html`, con las huellas de
 * los scripts en línea calculadas del propio archivo.
 *
 * Va en un `<meta>` y no en el `.htaccess` a propósito. `index.html` lleva dos
 * scripts en línea que tienen que ejecutarse mientras se analiza el HTML —uno
 * adelanta las peticiones de contenido, otro quita el velo de entrada—, así
 * que la política necesita su SHA-256. Escrita a mano en la configuración del
 * servidor se desincronizaría en cuanto alguien tocara ese HTML, y el sitio
 * dejaría de arrancar sin que nada lo avisara. Generada aquí, no puede.
 *
 * `frame-ancestors` no se puede declarar desde un `<meta>`; para eso está el
 * `X-Frame-Options` del `.htaccess`.
 */
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const archivo = fileURLToPath(new URL('../frontend/dist/index.html', import.meta.url))
const html = await readFile(archivo, 'utf8')

/**
 * Sólo los scripts ejecutables. Los que tienen `src` los cubre `'self'`, y un
 * bloque `application/ld+json` es un dato, no código: el navegador no lo
 * ejecuta y la política no lo mira.
 */
const huellas = [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(([, atributos]) => !/\ssrc=/.test(atributos) && !/ld\+json/.test(atributos))
  .map(([, , cuerpo]) => {
    // Los saltos de línea van normalizados a LF: al analizar el HTML el
    // navegador convierte CRLF en LF antes de calcular la huella, así que
    // hashear el archivo tal cual da un valor que no coincide con ninguno y
    // el navegador bloquea los dos scripts. Se vio en la vista previa local,
    // que es justo para lo que sirve probar antes de publicar.
    const normalizado = cuerpo.replace(/\r\n/g, '\n')
    return `'sha256-${createHash('sha256').update(normalizado, 'utf8').digest('base64')}'`
  })

if (huellas.length === 0) {
  throw new Error('No se encontró ningún script en línea: revisa el patrón antes de publicar.')
}

/**
 * `unsafe-inline` en estilos es inevitable hoy: cada muestra de color se pinta
 * con un `style` en línea —83 sólo en la carta— y los colores de marca se
 * aplican con una etiqueta `<style>` que genera la aplicación. En scripts no
 * se permite, que es donde de verdad importa.
 */
/**
 * Google Analytics necesita tres permisos, no uno: cargar su script desde
 * `googletagmanager.com`, mandar los eventos a `google-analytics.com` y —en
 * navegadores que bloquean `fetch` a terceros— caer a un píxel de imagen.
 * Si falta cualquiera de los tres, la etiqueta no mide y no avisa: falla en
 * silencio, que es la peor forma de tener analítica.
 */
const ANALITICA = {
  script: ['https://www.googletagmanager.com'],
  conectar: [
    'https://www.google-analytics.com',
    'https://*.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.googletagmanager.com',
  ],
  imagen: ['https://www.google-analytics.com', 'https://*.google-analytics.com'],
}

const politica = [
  "default-src 'self'",
  `script-src 'self' ${ANALITICA.script.join(' ')} ${huellas.join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: https://i.ytimg.com ${ANALITICA.imagen.join(' ')}`,
  "font-src 'self'",
  "media-src 'self'",
  `connect-src 'self' ${ANALITICA.conectar.join(' ')}`,
  // El bloque de vídeo abre YouTube en un diálogo.
  'frame-src https://www.youtube-nocookie.com https://www.youtube.com',
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join('; ')

const meta = `<meta http-equiv="Content-Security-Policy" content="${politica}" />`

if (html.includes('http-equiv="Content-Security-Policy"')) {
  throw new Error('Ya hay una política en el HTML: se estaría duplicando.')
}

await writeFile(archivo, html.replace('<head>', `<head>\n    ${meta}`), 'utf8')

console.log(`Política de contenido escrita con ${huellas.length} huella(s) de script en línea.`)
