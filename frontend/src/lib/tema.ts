import type { CSSProperties } from 'react'
import type { ColoresDeBloque, Site } from '@/types/content'

/**
 * Colores de marca configurables desde el panel.
 *
 * Vivían sólo en `tokens.css`, así que cambiar el azul de PPG era tocar código
 * y volver a compilar. Ahora salen de Ajustes y se aplican pisando las mismas
 * variables CSS que ya usa todo el sitio: no hay una segunda forma de pintar
 * un botón, sólo otro valor en la de siempre.
 *
 * **Se pide un color, no doce.** Los tonos de hover, pulsado y borde se
 * calculan a partir del principal. Pedirle al cliente que elija cinco azules
 * coherentes entre sí es pedirle que haga de diseñador; pedirle uno es una
 * decisión que sí puede tomar.
 */

/** `#0078a9` → `[0, 120, 169]`. Devuelve null si no es un hexadecimal válido. */
function aRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) return null

  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const aHex = ([r, g, b]: [number, number, number]) =>
  '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')

/** Oscurece hacia el negro. `factor` 0 no cambia nada; 1 lo deja negro. */
function oscurecer(rgb: [number, number, number], factor: number): [number, number, number] {
  return rgb.map((v) => v * (1 - factor)) as [number, number, number]
}

/** Aclara hacia el blanco. */
function aclarar(rgb: [number, number, number], factor: number): [number, number, number] {
  return rgb.map((v) => v + (255 - v) * factor) as [number, number, number]
}

/** Mezcla dos colores. `factor` 0 devuelve el primero; 1, el segundo. */
function mezclar(
  a: [number, number, number],
  b: [number, number, number],
  factor: number,
): [number, number, number] {
  return a.map((v, i) => v + (b[i] - v) * factor) as [number, number, number]
}

/**
 * Luminancia relativa según WCAG. Sirve para decidir si el texto que va encima
 * del color de marca debe ser blanco o casi negro: si el cliente elige un
 * amarillo, el texto blanco de los botones dejaría de leerse.
 */
function luminancia([r, g, b]: [number, number, number]): number {
  const c = [r, g, b].map((v) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

/**
 * Las quince variables de marca derivadas de un solo color. Se comparten entre
 * el color global de Ajustes y el acento propio de un bloque: si el hover del
 * botón se calculara dos veces, acabarían siendo dos azules distintos.
 */
function tokensDeMarca(marca: [number, number, number]): [string, string][] {
  // No se fuerza a blanco: con un color claro, el texto de los botones se
  // volvería ilegible sin que nadie lo avisara.
  const sobreLaMarca = luminancia(marca) > 0.45 ? '#081520' : '#ffffff'

  return [
    ['--bg-brand-solid', aHex(marca)],
    ['--bg-brand-solid-hover', aHex(oscurecer(marca, 0.12))],
    ['--bg-brand-solid-active', aHex(oscurecer(marca, 0.28))],
    ['--bg-brand-primary', aHex(aclarar(marca, 0.94))],
    ['--bg-brand-secondary', aHex(aclarar(marca, 0.78))],
    ['--bg-brand-secondary-hover', aHex(aclarar(marca, 0.55))],
    ['--fg-brand-primary', aHex(oscurecer(marca, 0.6))],
    ['--fg-brand-secondary', aHex(oscurecer(marca, 0.12))],
    ['--fg-brand-tertiary', aHex(marca)],
    ['--fg-brand-on-solid', sobreLaMarca],
    ['--border-brand-solid', aHex(oscurecer(marca, 0.12))],
    ['--border-brand-primary', aHex(aclarar(marca, 0.5))],
    ['--border-brand-secondary', aHex(aclarar(marca, 0.78))],
    ['--tint-brand', aHex(aclarar(marca, 0.92))],
    ['--tint-brand-strong', aHex(aclarar(marca, 0.82))],
  ]
}

/**
 * Las variables CSS que hay que pisar, o cadena vacía si no hay nada que
 * cambiar. Se devuelve texto y no un objeto porque va directo a un `<style>`.
 */
export function variablesDelTema(site: Site | null | undefined): string {
  const reglas: string[] = []

  const marca = site?.brandColors?.brand ? aRgb(site.brandColors.brand) : null

  if (marca) {
    reglas.push(...tokensDeMarca(marca).map(([k, v]) => `${k}: ${v}`))
  }

  const oscuro = site?.brandColors?.dark ? aRgb(site.brandColors.dark) : null

  if (oscuro) {
    reglas.push(`--bg-solid: ${aHex(oscuro)}`)
  }

  return reglas.length ? `:root{${reglas.join(';')}}` : ''
}

/* --- Colores propios de un bloque ------------------------------------------ */

/**
 * Contraste entre dos colores según WCAG: de 1 (idénticos) a 21 (blanco sobre
 * negro). Devuelve null si alguno no es un hexadecimal válido.
 *
 * Se exporta para el panel, que avisa antes de guardar cuando una combinación
 * no llega al mínimo legible. Es más útil que prohibirla: quien edita ve el
 * número y decide.
 */
export function contraste(a: string, b: string): number | null {
  const uno = aRgb(a)
  const dos = aRgb(b)
  if (!uno || !dos) return null

  const claro = Math.max(luminancia(uno), luminancia(dos))
  const oscuro = Math.min(luminancia(uno), luminancia(dos))

  return (claro + 0.05) / (oscuro + 0.05)
}

/**
 * El texto que se lee sobre un fondo: casi negro sobre claro, blanco sobre
 * oscuro. Se exporta para que el panel enseñe el mismo color que pintará la
 * página cuando no se elige ninguno.
 */
export function textoLegibleSobre(fondo: string): string | null {
  const rgb = aRgb(fondo)
  if (!rgb) return null

  return luminancia(rgb) > 0.45 ? '#081520' : '#ffffff'
}

/**
 * Las variables que pinta un bloque con colores propios, o `undefined` si no
 * tiene ninguno —así el sitio no se llena de envoltorios vacíos.
 *
 * El texto se calcula cuando hay fondo y no se ha elegido: un fondo oscuro con
 * el texto gris de la página no se lee, y dejar que eso pase en silencio sería
 * regalarle al cliente una sección ilegible.
 */
export function variablesDeBloque(
  colores: ColoresDeBloque | undefined,
): CSSProperties | undefined {
  if (!colores) return undefined

  const fondo = colores.background ? aRgb(colores.background) : null
  const acento = colores.accent ? aRgb(colores.accent) : null
  const texto =
    (colores.text ? aRgb(colores.text) : null) ??
    (colores.background ? aRgb(textoLegibleSobre(colores.background) ?? '') : null)

  if (!fondo && !acento && !texto) return undefined

  const estilo: Record<string, string> = {}

  if (fondo) estilo['--bloque-fondo'] = aHex(fondo)

  if (texto) {
    // Los tonos apagados se mezclan hacia el fondo, no hacia un gris fijo: es
    // lo que hace que una descripción sobre azul oscuro se vea como un blanco
    // atenuado y no como el gris de la página.
    const hacia = fondo ?? (luminancia(texto) > 0.45 ? aRgb('#081520')! : aRgb('#ffffff')!)

    estilo.color = aHex(texto)
    estilo['--fg-primary'] = aHex(texto)
    estilo['--fg-heading'] = aHex(texto)
    estilo['--fg-secondary'] = aHex(mezclar(texto, hacia, 0.22))
    estilo['--fg-tertiary'] = aHex(mezclar(texto, hacia, 0.38))
    estilo['--fg-quaternary'] = aHex(mezclar(texto, hacia, 0.5))
  }

  if (acento) {
    for (const [clave, valor] of tokensDeMarca(acento)) {
      estilo[clave] = valor
    }
  }

  return estilo as CSSProperties
}
