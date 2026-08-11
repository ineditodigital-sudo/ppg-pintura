import type { BusinessLine, Market } from '@/types/content'

/**
 * Todas las páginas del sitio, vengan de donde vengan.
 *
 * La pantalla «Páginas» sólo listaba cuatro, y el sitio tiene catorce. Las
 * otras diez existen igual, pero no son documentos de página: nueve las genera
 * una plantilla a partir de `business-lines.json` y `markets.json`, y la carta
 * de color se dibuja desde el catálogo. Quien entraba al panel veía cuatro y
 * daba por hecho que el resto no se podía tocar.
 *
 * Este mapa las junta todas y dice de cada una **dónde se edita**. No cambia
 * dónde vive el contenido: sólo deja de esconderlo.
 */

export type OrigenPagina = 'documento' | 'plantilla' | 'catalogo'

export interface PaginaDelSitio {
  /** Lo que se lee en la lista. */
  titulo: string
  /** Ruta pública, para el botón «Ver». */
  ruta: string
  origen: OrigenPagina
  /** A dónde lleva «Editar» dentro del panel. */
  destino: string
  /** Qué se edita ahí, en una línea. */
  nota: string
  /** Sólo para documentos: cuántos bloques tiene. */
  bloques?: number
  /** Sólo para documentos: si se puede borrar. */
  slug?: string
}

const TITULOS: Record<string, string> = {
  home: 'Inicio',
  'quienes-somos': 'Quiénes Somos',
  mercados: 'Mercados',
  contacto: 'Contacto',
}

export function construirMapa(
  paginas: { slug: string; title: string; blockCount: number }[],
  lineas: BusinessLine[],
  mercados: Market[],
): PaginaDelSitio[] {
  const mapa: PaginaDelSitio[] = []

  for (const p of paginas) {
    mapa.push({
      titulo: TITULOS[p.slug] ?? p.title,
      ruta: p.slug === 'home' ? '/' : `/${p.slug}`,
      origen: 'documento',
      destino: `/admin/paginas/${p.slug}`,
      nota: `${p.blockCount} bloque${p.blockCount === 1 ? '' : 's'} · se editan uno a uno`,
      bloques: p.blockCount,
      slug: p.slug,
    })
  }

  for (const l of lineas) {
    mapa.push({
      titulo: l.name,
      ruta: `/productos/${l.slug}`,
      origen: 'plantilla',
      destino: '/admin/lineas',
      nota: 'Su texto e imagen salen de Líneas de producto',
    })
  }

  for (const m of mercados) {
    mapa.push({
      titulo: m.name,
      ruta: `/mercados/${m.slug}`,
      origen: 'plantilla',
      destino: '/admin/mercados',
      nota: 'Su texto e imagen salen de Mercados',
    })
  }

  mapa.push({
    titulo: 'Carta de colores',
    ruta: '/colores',
    origen: 'catalogo',
    destino: '/admin/colores',
    nota: 'Se dibuja con las referencias de la Carta de color',
  })

  return mapa
}

export const ETIQUETA_ORIGEN: Record<OrigenPagina, string> = {
  documento: 'Página propia',
  plantilla: 'Desde plantilla',
  catalogo: 'Desde el catálogo',
}
