import type { CatalogColor } from '@/types/content'

/**
 * Qué cuenta como color en existencia.
 *
 * Dos vías, y por eso está aquí y no repartido: el catálogo de PPG marca estas
 * referencias con las siglas **MTS** en el código, y además el panel permite
 * marcarlas a mano —o en masa desde la hoja de Excel—. Cualquiera de las dos
 * basta.
 *
 * Si la comprobación viviera suelta en cada pantalla, la carta y el carrusel
 * acabarían discrepando sobre qué hay en existencia.
 */
export function esEnStock(color: CatalogColor): boolean {
  return color.stock === true || /mts/i.test(color.code)
}

/** Identificador de la pestaña de existencias en la carta de color. */
export const FAMILIA_STOCK = 'en-stock'

/** Etiqueta visible. Lleva las siglas para que el cliente reconozca las suyas. */
export const NOMBRE_STOCK = 'En stock (MTS)'
