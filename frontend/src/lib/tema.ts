import type { Site } from '@/types/content'

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
 * Las variables CSS que hay que pisar, o cadena vacía si no hay nada que
 * cambiar. Se devuelve texto y no un objeto porque va directo a un `<style>`.
 */
export function variablesDelTema(site: Site | null | undefined): string {
  const reglas: string[] = []

  const marca = site?.brandColors?.brand ? aRgb(site.brandColors.brand) : null

  if (marca) {
    const sobreLaMarca = luminancia(marca) > 0.45 ? '#081520' : '#ffffff'

    reglas.push(
      `--bg-brand-solid: ${aHex(marca)}`,
      `--bg-brand-solid-hover: ${aHex(oscurecer(marca, 0.12))}`,
      `--bg-brand-solid-active: ${aHex(oscurecer(marca, 0.28))}`,
      `--bg-brand-primary: ${aHex(aclarar(marca, 0.94))}`,
      `--bg-brand-secondary: ${aHex(aclarar(marca, 0.78))}`,
      `--bg-brand-secondary-hover: ${aHex(aclarar(marca, 0.55))}`,
      `--fg-brand-primary: ${aHex(oscurecer(marca, 0.6))}`,
      `--fg-brand-secondary: ${aHex(oscurecer(marca, 0.12))}`,
      `--fg-brand-tertiary: ${aHex(marca)}`,
      // No se fuerza a blanco: con un color de marca claro, el texto de los
      // botones se volvería ilegible sin que nadie lo avisara.
      `--fg-brand-on-solid: ${sobreLaMarca}`,
      `--border-brand-solid: ${aHex(oscurecer(marca, 0.12))}`,
      `--border-brand-primary: ${aHex(aclarar(marca, 0.5))}`,
      `--border-brand-secondary: ${aHex(aclarar(marca, 0.78))}`,
      `--tint-brand: ${aHex(aclarar(marca, 0.92))}`,
      `--tint-brand-strong: ${aHex(aclarar(marca, 0.82))}`,
    )
  }

  const oscuro = site?.brandColors?.dark ? aRgb(site.brandColors.dark) : null

  if (oscuro) {
    reglas.push(`--bg-solid: ${aHex(oscuro)}`)
  }

  return reglas.length ? `:root{${reglas.join(';')}}` : ''
}
