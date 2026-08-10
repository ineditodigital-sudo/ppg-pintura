import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { CatalogColor, ColorCatalog as Catalogo } from '@/types/content'
import { getColors } from '@/lib/api'
import { esEnStock, FAMILIA_STOCK, NOMBRE_STOCK } from '@/lib/stock'
import { Container, Section } from '@/components/ui'
import '@/pages/colors.css'

/**
 * Navegador de la carta de color: pestañas por familia, buscador y rejilla.
 *
 * Vive aquí y no dentro de `ColorsPage` porque lo usan dos sitios —la página
 * `/colores` y la de pintura en polvo— y antes la página de producto se
 * conformaba con el carrusel: quince muestras sueltas sin forma de buscar. Si
 * la lógica estuviera duplicada, el buscador y las pestañas acabarían
 * comportándose distinto en cada sitio.
 */

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export function Muestra({ color }: { color: CatalogColor }) {
  return (
    <li className="carta__muestra">
      {/* El código y el sello van sobre placa clara, no directamente sobre el
          color. Elegir tinta blanca o negra según la luminancia parecía más
          elegante, pero en los tonos medios el contraste caía a 3,3:1: con 83
          colores repartidos por todo el espectro siempre hay unos cuantos que
          se quedan cortos. La placa lo garantiza en todos. */}
      <div className="carta__color placa" style={{ '--muestra': color.hex } as CSSProperties}>
        <span className="carta__codigo">{color.code}</span>
        {color.stock && <span className="carta__sello">En existencia</span>}
      </div>
      <div className="carta__pie">
        <p className="carta__nombre">{color.name}</p>
        <p className="carta__datos">
          {color.ral && (
            <span>
              RAL {color.ral}
              {color.ralName && ` · ${color.ralName}`}
            </span>
          )}
          {color.finish && <span>{color.finish}</span>}
          {color.gloss && <span>Brillo {color.gloss}</span>}
        </p>
      </div>
    </li>
  )
}

/** Controles + rejilla, sin `Section` ni `Container`: los pone quien lo use. */
export function ExploradorColores({ catalogo }: { catalogo: Catalogo }) {
  const [familia, setFamilia] = useState<string>(FAMILIA_STOCK)
  const [busqueda, setBusqueda] = useState('')
  const [soloExistencia, setSoloExistencia] = useState(false)

  const enStock = useMemo(() => catalogo.colors.filter(esEnStock), [catalogo])

  useEffect(() => {
    // Las existencias son la categoría principal y abre en ella. Pero si aún no
    // hay ninguna marcada, abrir en una pestaña vacía haría parecer que la
    // carta está rota.
    if (enStock.length === 0) setFamilia('todas')
  }, [enStock.length])

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())

    return catalogo.colors.filter((c) => {
      // La pestaña de existencias no es una familia del catálogo: cruza a
      // todas, así que se resuelve antes de comparar contra `family`.
      if (familia === FAMILIA_STOCK) {
        if (!esEnStock(c)) return false
      } else if (familia !== 'todas' && c.family !== familia) {
        return false
      }
      if (soloExistencia && !esEnStock(c)) return false
      if (!q) return true
      return (
        normalizar(c.code).includes(q) ||
        normalizar(c.name).includes(q) ||
        // Buscar «traffic white» tiene que encontrar el RAL 9016: es el nombre
        // por el que PPG lo pide en su propio catálogo.
        (c.ralName ? normalizar(c.ralName).includes(q) : false) ||
        (c.ral ? `ral ${c.ral}`.includes(q) || c.ral.includes(q) : false)
      )
    })
  }, [catalogo, familia, busqueda, soloExistencia])

  const hayExistencias = enStock.length > 0

  return (
    <>
      <div className="carta__controles">
        <div className="carta__familias" role="tablist" aria-label="Familias">
          {/* Primera y destacada: es la categoría que más se consulta, porque
              es lo que se puede servir sin esperar fabricación. */}
          <button
            type="button"
            role="tab"
            aria-selected={familia === FAMILIA_STOCK}
            className={`carta__pestana carta__pestana--stock${
              familia === FAMILIA_STOCK ? ' is-active' : ''
            }`}
            onClick={() => setFamilia(FAMILIA_STOCK)}
          >
            {NOMBRE_STOCK}
            <span>{enStock.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={familia === 'todas'}
            className={`carta__pestana${familia === 'todas' ? ' is-active' : ''}`}
            onClick={() => setFamilia('todas')}
          >
            Todas
            <span>{catalogo.colors.length}</span>
          </button>
          {catalogo.families.map((f) => {
            const n = catalogo.colors.filter((c) => c.family === f.id).length
            return (
              <button
                type="button"
                role="tab"
                key={f.id}
                aria-selected={familia === f.id}
                className={`carta__pestana${familia === f.id ? ' is-active' : ''}`}
                onClick={() => setFamilia(f.id)}
              >
                {f.name}
                <span>{n}</span>
              </button>
            )
          })}
        </div>

        <div className="carta__filtros">
          <label className="carta__buscador">
            <span className="visually-hidden">Buscar color</span>
            <input
              type="search"
              value={busqueda}
              placeholder="Busca por código, nombre o RAL"
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </label>
          {hayExistencias && (
            <label className="carta__check">
              <input
                type="checkbox"
                checked={soloExistencia}
                onChange={(e) => setSoloExistencia(e.target.checked)}
              />
              Sólo los que hay en existencia
            </label>
          )}
        </div>
      </div>

      {familia !== 'todas' && familia !== FAMILIA_STOCK && (
        <p className="carta__descripcion">
          {catalogo.families.find((f) => f.id === familia)?.description}
        </p>
      )}

      <p className="carta__cuenta" aria-live="polite">
        {visibles.length === catalogo.colors.length
          ? `${visibles.length} referencias`
          : `${visibles.length} de ${catalogo.colors.length} referencias`}
      </p>

      {visibles.length === 0 ? (
        <p className="carta__vacio">
          {/* Sin búsqueda escrita, «no coincide nada» sería mentira: lo que
              pasa es que esa categoría todavía no tiene referencias. */}
          {busqueda.trim() ? (
            <>
              Ninguna referencia coincide con «{busqueda}». Prueba con el código
              PPG (PCTH…), con el número RAL o con el nombre con el que PPG lo
              publica (Traffic White, Jet Black…).
            </>
          ) : familia === FAMILIA_STOCK ? (
            <>
              Todavía no hay referencias marcadas en existencia. Se marcan desde
              el panel, o llegan al actualizar la carta desde la hoja de cálculo.
            </>
          ) : (
            <>Esta familia todavía no tiene referencias.</>
          )}
        </p>
      ) : (
        <ul className="carta__rejilla">
          {visibles.map((c) => (
            <Muestra key={c.code} color={c} />
          ))}
        </ul>
      )}
    </>
  )
}

/**
 * Bloque `colorCatalog`: la carta entera dentro de una página de contenido.
 *
 * Carga sus propios datos, igual que `colorCarousel`, así que se inserta sin
 * configurar nada.
 */
export function ColorCatalogBlock() {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null)

  useEffect(() => {
    let vivo = true
    getColors().then((d) => {
      if (vivo) setCatalogo(d)
    })
    return () => {
      vivo = false
    }
  }, [])

  if (!catalogo) return null

  return (
    <Section className="carta-bloque">
      <Container>
        <span className="eyebrow">Carta de colores</span>
        <h2>{catalogo.colors.length} referencias de catálogo</h2>
        <ExploradorColores catalogo={catalogo} />
      </Container>
    </Section>
  )
}
