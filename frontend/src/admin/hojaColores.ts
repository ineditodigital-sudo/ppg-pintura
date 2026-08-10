import type { CatalogColor, ColorCatalog } from '@/types/content'

/**
 * Carta de color como hoja de cálculo.
 *
 * El formato es CSV y no `.xlsx` a propósito. La única librería de Excel
 * disponible en npm (`xlsx@0.18`) arrastra dos vulnerabilidades altas sin
 * parche —contaminación de prototipo y ReDoS— y ambas se disparan justo al
 * analizar el archivo que sube el usuario, que es exactamente lo que hace esta
 * pantalla. Escribir el CSV a mano no tiene dependencias, Excel lo abre y lo
 * guarda de forma nativa, y el analizador es nuestro: por eso puede decir con
 * precisión qué está mal en vez de fallar en silencio.
 *
 * Se emite con BOM y separador `;`, que es lo que Excel en español abre
 * directamente en columnas sin pasar por el asistente de importación.
 */

/**
 * Columnas de la hoja, en orden.
 *
 * `clave` es el identificador interno y `titulo` lo que ve el usuario en
 * Excel. Se acepta cualquiera de los dos al leer —quien edita no tiene por qué
 * saber que «en_stock» y «En stock (MTS)» son lo mismo—, y al escribir se usa
 * siempre el título: una cabecera de `nombre_ral` no dice nada, y `En stock`
 * con la casilla en `sí`/`no` sí.
 */
export const CAMPOS = [
  { clave: 'codigo', titulo: 'Código PPG' },
  { clave: 'nombre', titulo: 'Nombre' },
  { clave: 'ral', titulo: 'RAL' },
  { clave: 'nombre_ral', titulo: 'Nombre del RAL' },
  { clave: 'acabado', titulo: 'Acabado' },
  { clave: 'brillo', titulo: 'Brillo' },
  { clave: 'hex', titulo: 'Color (hex)' },
  { clave: 'familia', titulo: 'Familia' },
  { clave: 'texturizado', titulo: '¿Texturizado?' },
  { clave: 'en_stock', titulo: '¿En stock (MTS)?' },
] as const

/** Sólo las claves, para el resto del módulo. */
export const COLUMNAS = CAMPOS.map((c) => c.clave) as unknown as readonly string[]

/** Cabecera legible, la que se escribe en el archivo. */
export const TITULOS = CAMPOS.map((c) => c.titulo)

/** Normaliza una cabecera para compararla: sin tildes, signos ni espacios. */
function normalizarCabecera(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

/** Mapa de cualquier forma aceptada de cabecera → clave interna. */
const ALIAS = new Map<string, string>()
for (const c of CAMPOS) {
  ALIAS.set(normalizarCabecera(c.clave), c.clave)
  ALIAS.set(normalizarCabecera(c.titulo), c.clave)
}

const SEPARADOR = ';'
const BOM = '﻿'

const siNo = (v: boolean) => (v ? 'sí' : 'no')

/** `sí/no`, `true/false`, `1/0`, `x`… Cualquiera de las formas que la gente escribe. */
function aBooleano(valor: string): boolean | null {
  const v = valor.trim().toLowerCase()
  if (v === '') return false
  if (['sí', 'si', 'yes', 'true', 'verdadero', '1', 'x'].includes(v)) return true
  if (['no', 'false', 'falso', '0', '-'].includes(v)) return false
  return null
}

/** Escapa un valor: comillas dobles si lleva separador, comillas o saltos. */
function celda(valor: string | null | undefined): string {
  const s = valor ?? ''
  return /[";\n\r,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/* --- Exportar -------------------------------------------------------------- */

export function generarCsv(catalogo: ColorCatalog): string {
  const lineas = [TITULOS.join(SEPARADOR)]

  for (const c of catalogo.colors) {
    lineas.push(
      [
        celda(c.code),
        celda(c.name),
        celda(c.ral),
        celda(c.ralName),
        celda(c.finish),
        celda(c.gloss),
        celda(c.hex),
        celda(c.family),
        siNo(c.textured),
        siNo(c.stock),
      ].join(SEPARADOR),
    )
  }

  // CRLF: es lo que espera Excel y evita que una sola línea larga aparezca
  // como un único registro al abrirlo en Windows.
  return BOM + lineas.join('\r\n') + '\r\n'
}

/** Hoja vacía con sólo la cabecera, para quien necesite el formato correcto. */
export function generarPlantilla(catalogo: ColorCatalog): string {
  const ejemplo = catalogo.colors[0]
  const filas = [TITULOS.join(SEPARADOR)]
  if (ejemplo) {
    filas.push(
      [
        celda(ejemplo.code),
        celda(ejemplo.name),
        celda(ejemplo.ral),
        celda(ejemplo.ralName),
        celda(ejemplo.finish),
        celda(ejemplo.gloss),
        celda(ejemplo.hex),
        celda(ejemplo.family),
        siNo(ejemplo.textured),
        siNo(ejemplo.stock),
      ].join(SEPARADOR),
    )
  }
  return BOM + filas.join('\r\n') + '\r\n'
}

export function descargar(nombre: string, contenido: string) {
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/* --- Analizar -------------------------------------------------------------- */

/** Divide una línea CSV respetando las comillas dobles. */
function partirLinea(linea: string, sep: string): string[] {
  const salida: string[] = []
  let actual = ''
  let enComillas = false

  for (let i = 0; i < linea.length; i++) {
    const ch = linea[i]

    if (enComillas) {
      if (ch === '"') {
        if (linea[i + 1] === '"') {
          actual += '"'
          i++
        } else {
          enComillas = false
        }
      } else {
        actual += ch
      }
    } else if (ch === '"') {
      enComillas = true
    } else if (ch === sep) {
      salida.push(actual)
      actual = ''
    } else {
      actual += ch
    }
  }

  salida.push(actual)
  return salida
}

export interface Cambio {
  code: string
  campo: string
  antes: string
  despues: string
}

export interface Analisis {
  ok: boolean
  /** Por qué no se puede aplicar. Vacío si `ok`. */
  errores: string[]
  /** Cosas que conviene saber pero no impiden aplicar. */
  avisos: string[]
  /** Catálogo resultante, listo para guardar. Sólo si `ok`. */
  resultado?: ColorCatalog
  cambios: Cambio[]
  nuevas: string[]
  /** Referencias que estaban y el archivo no trae: se conservan. */
  ausentes: string[]
  filasLeidas: number
}

/**
 * Compara la hoja subida contra el catálogo actual.
 *
 * No escribe nada: devuelve el resultado y la lista de cambios para que la
 * pantalla los enseñe y el usuario confirme. Una actualización masiva a ciegas
 * sobre 83 referencias es justo lo que no se puede deshacer de un vistazo.
 */
export function analizar(texto: string, actual: ColorCatalog): Analisis {
  const errores: string[] = []
  const avisos: string[] = []

  const limpio = texto.replace(/^﻿/, '')
  const lineas = limpio.split(/\r\n|\n|\r/).filter((l) => l.trim() !== '')

  if (lineas.length === 0) {
    return { ok: false, errores: ['El archivo está vacío.'], avisos: [], cambios: [], nuevas: [], ausentes: [], filasLeidas: 0 }
  }

  // El separador se deduce de la cabecera: Excel guarda con `;` en español y
  // con `,` en inglés, y no hay motivo para rechazar el segundo.
  const cabeceraCruda = lineas[0]
  const sep = cabeceraCruda.split(';').length >= cabeceraCruda.split(',').length ? ';' : ','

  // Se acepta la cabecera legible («Código PPG») y también la clave interna
  // («codigo»): quien edita el archivo no tiene por qué distinguirlas, y una
  // hoja guardada por una versión anterior sigue siendo válida.
  const crudas = partirLinea(cabeceraCruda, sep).map((h) => h.trim())
  const cabecera = crudas.map((h) => ALIAS.get(normalizarCabecera(h)) ?? h)

  if (cabecera.length !== COLUMNAS.length || COLUMNAS.some((c, i) => cabecera[i] !== c)) {
    errores.push(
      `Las columnas no coinciden. El archivo trae: ${crudas.join(', ') || '(ninguna)'}.`,
    )
    errores.push(`Se esperaban exactamente estas, en este orden: ${TITULOS.join(', ')}.`)
    return { ok: false, errores, avisos, cambios: [], nuevas: [], ausentes: [], filasLeidas: 0 }
  }

  const familiasValidas = new Set(actual.families.map((f) => f.id))
  const porCodigo = new Map(actual.colors.map((c) => [c.code, c]))

  const cambios: Cambio[] = []
  const nuevas: string[] = []
  const vistos = new Set<string>()
  const resultado: CatalogColor[] = []

  for (let i = 1; i < lineas.length; i++) {
    const fila = partirLinea(lineas[i], sep)
    const nFila = i + 1
    const val = (n: string) => (fila[COLUMNAS.indexOf(n)] ?? '').trim()

    const code = val('codigo')
    if (!code) {
      errores.push(`Fila ${nFila}: falta el código.`)
      continue
    }
    if (vistos.has(code)) {
      errores.push(`Fila ${nFila}: el código «${code}» está repetido en el archivo.`)
      continue
    }
    vistos.add(code)

    const nombre = val('nombre')
    if (!nombre) errores.push(`Fila ${nFila} (${code}): falta el nombre.`)

    const hex = val('hex')
    if (!/^#[0-9a-f]{6}$/i.test(hex)) {
      errores.push(`Fila ${nFila} (${code}): «${hex}» no es un hexadecimal de seis dígitos, como #A12222.`)
    }

    const familia = val('familia')
    if (!familiasValidas.has(familia)) {
      errores.push(
        `Fila ${nFila} (${code}): la familia «${familia}» no existe. Válidas: ${[...familiasValidas].join(', ')}.`,
      )
    }

    const texturizado = aBooleano(val('texturizado'))
    const enStock = aBooleano(val('en_stock'))
    if (texturizado === null) errores.push(`Fila ${nFila} (${code}): «texturizado» debe ser sí o no.`)
    if (enStock === null) errores.push(`Fila ${nFila} (${code}): «en_stock» debe ser sí o no.`)

    const oNulo = (s: string) => (s === '' ? null : s)

    const nuevo: CatalogColor = {
      code,
      name: nombre,
      ral: oNulo(val('ral')),
      ralName: oNulo(val('nombre_ral')),
      finish: oNulo(val('acabado')),
      gloss: oNulo(val('brillo')),
      hex,
      family: familia,
      textured: texturizado ?? false,
      stock: enStock ?? false,
    }

    const previo = porCodigo.get(code)
    if (!previo) {
      nuevas.push(code)
    } else {
      const campos: Array<[string, unknown, unknown]> = [
        ['nombre', previo.name, nuevo.name],
        ['ral', previo.ral, nuevo.ral],
        ['nombre_ral', previo.ralName ?? null, nuevo.ralName],
        ['acabado', previo.finish, nuevo.finish],
        ['brillo', previo.gloss, nuevo.gloss],
        ['hex', previo.hex, nuevo.hex],
        ['familia', previo.family, nuevo.family],
        ['texturizado', previo.textured, nuevo.textured],
        ['en_stock', previo.stock, nuevo.stock],
      ]
      for (const [campo, antes, despues] of campos) {
        if (antes !== despues) {
          cambios.push({
            code,
            campo,
            antes: antes === null || antes === undefined ? '—' : String(antes),
            despues: despues === null || despues === undefined ? '—' : String(despues),
          })
        }
      }
    }

    resultado.push(nuevo)
  }

  // Lo que el archivo no menciona se conserva: subir una hoja recortada no
  // puede borrar medio catálogo sin decirlo.
  const ausentes = actual.colors.filter((c) => !vistos.has(c.code)).map((c) => c.code)
  for (const code of ausentes) {
    const previo = porCodigo.get(code)
    if (previo) resultado.push(previo)
  }
  if (ausentes.length > 0) {
    avisos.push(
      `${ausentes.length} referencia(s) del catálogo no venían en el archivo y se conservan sin cambios.`,
    )
  }

  return {
    ok: errores.length === 0,
    errores,
    avisos,
    resultado: errores.length === 0 ? { families: actual.families, colors: resultado } : undefined,
    cambios,
    nuevas,
    ausentes,
    filasLeidas: lineas.length - 1,
  }
}
