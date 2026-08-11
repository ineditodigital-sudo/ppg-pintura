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
  /**
   * Miniatura. Reconocer una página por su foto es inmediato; leer su nombre
   * en una lista, no. Las páginas de plantilla ya tienen imagen propia, así
   * que se reutiliza la misma que el visitante ve en el sitio.
   */
  imagen?: string
  /** Icono para las que no tienen imagen. */
  icono?: string
}

const TITULOS: Record<string, string> = {
  home: 'Inicio',
  'quienes-somos': 'Quiénes Somos',
  mercados: 'Mercados',
  contacto: 'Contacto',
}

/**
 * El orden del menú de navegación: Inicio · Quiénes Somos · Productos ·
 * Mercados · Contacto. Se ordena así y no alfabéticamente porque es el orden
 * en el que el cliente recorre su propio sitio, y buscar una página en el
 * panel debería sentirse como buscarla en el menú.
 */
const ORDEN_MENU = ['home', 'quienes-somos', 'mercados', 'contacto']

/** Icono de las páginas propias, que no tienen imagen que enseñar. */
const ICONOS: Record<string, string> = {
  home: 'edificio',
  'quienes-somos': 'escudo',
  mercados: 'engrane',
  contacto: 'perfil',
}

export function construirMapa(
  paginas: { slug: string; title: string; blockCount: number }[],
  lineas: BusinessLine[],
  mercados: Market[],
): PaginaDelSitio[] {
  const mapa: PaginaDelSitio[] = []

  const ordenadas = [...paginas].sort((a, b) => {
    const ia = ORDEN_MENU.indexOf(a.slug)
    const ib = ORDEN_MENU.indexOf(b.slug)
    // Lo que no esté en el menú va al final, en orden alfabético.
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.slug.localeCompare(b.slug)
  })

  for (const p of ordenadas) {
    mapa.push({
      titulo: TITULOS[p.slug] ?? p.title,
      ruta: p.slug === 'home' ? '/' : `/${p.slug}`,
      origen: 'documento',
      destino: `/admin/paginas/${p.slug}`,
      nota: `${p.blockCount} bloque${p.blockCount === 1 ? '' : 's'} · se editan uno a uno`,
      bloques: p.blockCount,
      slug: p.slug,
      icono: ICONOS[p.slug] ?? 'capas',
    })
  }

  for (const l of lineas) {
    mapa.push({
      titulo: l.name,
      ruta: `/productos/${l.slug}`,
      origen: 'plantilla',
      destino: '/admin/lineas',
      nota: 'Su texto e imagen salen de Líneas de producto',
      imagen: l.image?.src,
      icono: 'capas',
    })
  }

  for (const m of mercados) {
    mapa.push({
      titulo: m.name,
      ruta: `/mercados/${m.slug}`,
      origen: 'plantilla',
      destino: '/admin/mercados',
      nota: 'Su texto e imagen salen de Mercados',
      imagen: m.image?.src,
      icono: m.icon ?? 'engrane',
    })
  }

  mapa.push({
    titulo: 'Carta de colores',
    ruta: '/colores',
    origen: 'catalogo',
    destino: '/admin/colores',
    nota: 'Se dibuja con las referencias de la Carta de color',
    icono: 'paleta',
  })

  return mapa
}

export const ETIQUETA_ORIGEN: Record<OrigenPagina, string> = {
  documento: 'Página propia',
  plantilla: 'Desde plantilla',
  catalogo: 'Desde el catálogo',
}
