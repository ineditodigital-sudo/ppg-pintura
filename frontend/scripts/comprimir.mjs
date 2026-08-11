/**
 * Deja una copia `.gz` de cada bundle junto al original.
 *
 * Este hosting no comprime. Se intentó activarlo desde `.htaccess` y no se
 * puede: sin el envoltorio `<IfModule>` el servidor devuelve 500 en cada
 * petición, y con él la condición da falsa y no comprime nada. Encenderlo de
 * verdad es entrar al panel de cPanel, que no es algo que se pueda hacer desde
 * el despliegue.
 *
 * Así que se comprime aquí, una vez, al compilar: quedan los dos archivos y una
 * regla del `.htaccess` sirve el `.gz` a quien lo acepta. Sale mejor que la
 * compresión al vuelo —se comprime con el nivel máximo, no con el que el
 * servidor pueda permitirse en caliente— y no depende de ningún módulo.
 *
 * Medido antes de esto: 359 KB de JS y 75 de CSS viajando en crudo.
 */
import { createReadStream, createWriteStream } from 'node:fs'
import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { createGzip } from 'node:zlib'
import { fileURLToPath } from 'node:url'

const dist = fileURLToPath(new URL('../dist', import.meta.url))

/** Sólo lo que se comprime bien y se sirve muchas veces. */
const COMPRIMIBLES = /\.(js|css|svg|json|xml|txt|webmanifest)$/i

/** Por debajo de esto el envoltorio gzip cuesta más de lo que ahorra. */
const MINIMO_BYTES = 1024

async function* archivos(dir) {
  for (const entrada of await readdir(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name)
    if (entrada.isDirectory()) yield* archivos(ruta)
    else yield ruta
  }
}

let hechos = 0
let crudo = 0
let comprimido = 0

for await (const ruta of archivos(dist)) {
  if (!COMPRIMIBLES.test(ruta) || ruta.endsWith('.gz')) continue

  const { size } = await stat(ruta)
  if (size < MINIMO_BYTES) continue

  await pipeline(
    createReadStream(ruta),
    createGzip({ level: 9 }),
    createWriteStream(ruta + '.gz'),
  )

  hechos++
  crudo += size
  comprimido += (await stat(ruta + '.gz')).size
}

const kb = (n) => Math.round(n / 1024)
console.log(
  `Comprimidos ${hechos} archivos: ${kb(crudo)} KB → ${kb(comprimido)} KB ` +
    `(se ahorran ${kb(crudo - comprimido)} KB por primera visita)`,
)
