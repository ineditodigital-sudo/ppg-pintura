/**
 * Copia backend/data → src/content.
 *
 * `backend/data` es la fuente de verdad (y será lo que el CMS escriba). El
 * frontend guarda una copia para poder renderizar el sitio completo cuando la
 * API PHP no está levantada. Ejecutar con `npm run sync:content`.
 *
 * La copia es no destructiva a propósito: borrar el directorio falla en Windows
 * mientras el dev server mantiene abiertos los JSON que importa. Se sobrescribe
 * archivo a archivo y se podan los sobrantes, tolerando que alguno esté en uso.
 */
import { cp, readdir, rm } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { fileURLToPath, URL } from 'node:url'

const source = fileURLToPath(new URL('../../backend/data', import.meta.url))
const target = fileURLToPath(new URL('../src/content', import.meta.url))

/** Rutas relativas de todos los archivos bajo `dir`. */
async function listFiles(dir) {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => relative(dir, resolve(entry.parentPath ?? entry.path, entry.name)))
}

await cp(source, target, { recursive: true, force: true })

// Podar lo que ya no existe en el origen (p. ej. una página eliminada del CMS).
let stale = []
try {
  const [sourceFiles, targetFiles] = await Promise.all([
    listFiles(source),
    listFiles(target),
  ])
  const keep = new Set(sourceFiles)
  stale = targetFiles.filter((file) => !keep.has(file))

  for (const file of stale) {
    await rm(resolve(target, file), { force: true })
  }
} catch (error) {
  console.warn(`Aviso: no se pudieron podar archivos sobrantes (${error.code ?? error.message}).`)
}

console.log(
  `Contenido sincronizado: backend/data → src/content` +
    (stale.length ? ` (${stale.length} archivo(s) obsoleto(s) eliminados)` : ''),
)
