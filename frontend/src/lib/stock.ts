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

/**
 * Textos de la ficha que se abre al pulsar un color.
 *
 * Viven aquí y no dentro del componente para que el panel pueda enseñar el
 * texto que hoy se publica en lugar de un campo vacío. Un recuadro en blanco
 * con un «si lo dejas vacío se usa otra cosa» no es editar: es adivinar.
 */
export const FICHA_POR_DEFECTO = {
  aviso:
    'El color de pantalla es orientativo. Los datos de resistencia, espesor de película y curva de curado vienen en la ficha técnica del producto: pídenosla y te la enviamos.',
  ctaFicha: 'Solicitar la ficha técnica',
  ctaWhatsApp: 'Preguntar por WhatsApp',
} as const

/** La banda oscura que abre `/colores`, cuando el catálogo aún no la trae. */
export const PORTADA_POR_DEFECTO = {
  eyebrow: 'Catálogo PPG',
  title: 'Carta de color · Pintura en polvo PPG',
  entradilla:
    '{n} referencias de catálogo en poliéster e híbridos, lisas, texturizadas y gofradas. Cada una con su equivalencia RAL y su rango de brillo, tal como los publica PPG. Suministro en Aguascalientes.',
  aviso:
    'El color de pantalla es orientativo: el acabado final depende de la iluminación, el sustrato y la aplicación. Para decidir, pide la carta física.',
  ctaLabel: 'Solicitar carta física',
  ctaHref: '/contacto',
  seoTitle: 'Carta de colores | Pintura en polvo PPG',
  seoDescription:
    'Catálogo completo de pintura electrostática en polvo PPG: 83 referencias en poliéster e híbridos, con equivalencia RAL, acabado y rango de brillo.',
} as const
