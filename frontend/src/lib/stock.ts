import type { CatalogColor } from '@/types/content'

/**
 * Qué cuenta como color en existencia.
 *
 * En el listado de precios de PPG la existencia va en una columna aparte,
 * `CLASS`, con tres valores: **MTS** (lo que hay en almacén), `MTO` y `ATO`
 * (contra pedido). No es parte del código de producto —`PCTH80108` no dice
 * nada por sí solo—, así que aquí la fuente de verdad es el campo `stock`, que
 * se marca desde el panel o llega en masa por la hoja de cálculo.
 *
 * Está en un único sitio porque si la comprobación viviera suelta en cada
 * pantalla, la carta y el carrusel de la portada acabarían discrepando sobre
 * qué hay disponible.
 */
export function esEnStock(color: CatalogColor): boolean {
  return color.stock === true
}

/** Identificador de la pestaña de existencias en la carta de color. */
export const FAMILIA_STOCK = 'en-stock'

/** Etiqueta visible. Lleva las siglas para que el cliente reconozca las suyas. */
export const NOMBRE_STOCK = 'En stock (MTS)'
