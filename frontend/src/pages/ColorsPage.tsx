import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import type { CatalogColor, ColorCatalog } from '@/types/content'
import { getColors } from '@/lib/api'
import { useSeo } from '@/lib/useSeo'
import { useCabeceraSobreHero } from '@/lib/useCabeceraSobreHero'
import { esEnStock, FAMILIA_STOCK, NOMBRE_STOCK } from '@/lib/stock'
import { ButtonLink, Container, Section } from '@/components/ui'
import { PageSkeleton } from './PageSkeleton'
import './colors.css'

/**
 * Carta de colores del catálogo PPG de pintura en polvo.
 *
 * Los 83 colores salen del PDF oficial: código, nombre, equivalencia RAL,
 * brillo y el hexadecimal leído del vector del documento, no muestreado a ojo.
 *
 * La página es la respuesta a algo que llamaba la atención: una empresa que
 * vende color no enseñaba ninguno.
 */

function normalizar(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function Muestra({ color }: { color: CatalogColor }) {
  return (
    <li className="carta__muestra">
      {/* El código y el sello van sobre placa clara, no directamente sobre el
          color. Elegir tinta blanca o negra según la luminancia parecía más
          elegante, pero en los tonos medios el contraste caía a 3,3:1: con 83
          colores repartidos por todo el espectro siempre hay unos cuantos que
          se quedan cortos. La placa lo garantiza en todos. */}
      {/* La placa es una sola foto para las 83 referencias: el color entra por
          la variable y se recorta con la silueta de la pieza, y el relieve lo
          pone encima el mapa de sombras. Así el catálogo enseña el acabado
          real —cómo cae la luz sobre el recubrimiento— sin 83 fotografías. */}
      <div className="carta__color placa" style={{ '--muestra': color.hex } as CSSProperties}>
        <span className="carta__codigo">{color.code}</span>
        {color.stock && <span className="carta__sello">En existencia</span>}
      </div>
      <div className="carta__pie">
        <p className="carta__nombre">{color.name}</p>
        <p className="carta__datos">
          {/* El RAL y el nombre con el que PPG lo publica van en el mismo
              dato: separarlos en dos sellos los leía como dos cosas
              distintas cuando son la misma referencia. */}
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

export function ColorsPage() {
  const [catalogo, setCatalogo] = useState<ColorCatalog | null>(null)
  const [familia, setFamilia] = useState<string>(FAMILIA_STOCK)
  const [busqueda, setBusqueda] = useState('')
  const [soloExistencia, setSoloExistencia] = useState(false)

  useEffect(() => {
    let vivo = true
    getColors().then((d) => {
      if (!vivo) return
      setCatalogo(d)
      // Las existencias son la categoría principal y abre en ella. Pero si aún
      // no hay ninguna marcada, abrir en una pestaña vacía haría parecer que
      // la carta está rota: en ese caso arranca en «Todas».
      if (!d.colors.some(esEnStock)) setFamilia('todas')
    })
    return () => {
      vivo = false
    }
  }, [])

  useSeo({
    title: 'Carta de colores | Pintura en polvo PPG',
    description:
      'Catálogo completo de pintura electrostática en polvo PPG: 83 referencias en poliéster e híbridos, con equivalencia RAL, acabado y rango de brillo.',
  })

  // La portada de la carta es oscura y también monta bajo la cabecera.
  useCabeceraSobreHero(true)

  const visibles = useMemo(() => {
    if (!catalogo) return []
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
        // Buscar «traffic white» tiene que encontrar el RAL 9016: es el
        // nombre por el que PPG lo pide en su propio catálogo.
        (c.ralName ? normalizar(c.ralName).includes(q) : false) ||
        (c.ral ? `ral ${c.ral}`.includes(q) || c.ral.includes(q) : false)
      )
    })
  }, [catalogo, familia, busqueda, soloExistencia])

  if (!catalogo) return <PageSkeleton />

  const enStock = catalogo.colors.filter(esEnStock)
  const hayExistencias = enStock.length > 0

  return (
    <>
      {/* Sin migas: la banda oscura sube por detrás de la cabecera y las
          taparía. El titular ya dice dónde estás, y el menú sigue arriba. */}
      <Section theme="dark" className="carta__portada">
        <Container>
          <span className="eyebrow">Catálogo PPG</span>
          <h1>
            {catalogo.colors.length} referencias de pintura en polvo
          </h1>
          <p className="carta__entradilla">
            Poliéster para exterior, híbridos para interior y sus versiones
            texturizadas y gofradas. Cada referencia con su equivalencia RAL y
            su rango de brillo, tal como los publica PPG.
          </p>
          <p className="carta__aviso">
            El color de pantalla es orientativo: el acabado final depende de la
            iluminación, el sustrato y la aplicación. Para decidir, pide la
            carta física.
          </p>
          <ButtonLink href="/contacto">Solicitar carta física</ButtonLink>
        </Container>
      </Section>

      <Section>
        <Container>
          <div className="carta__controles">
            <div className="carta__familias" role="tablist" aria-label="Familias">
              {/* Primera y destacada: es la categoría que más se consulta,
                  porque es lo que se puede servir sin esperar fabricación. */}
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

          {familia !== 'todas' && (
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
                  Ninguna referencia coincide con «{busqueda}». Prueba con el
                  código PPG (PCTH…), con el número RAL o con el nombre con el
                  que PPG lo publica (Traffic White, Jet Black…).
                </>
              ) : familia === FAMILIA_STOCK ? (
                <>
                  Todavía no hay referencias marcadas en existencia. Se marcan
                  desde el panel, o llegan con las siglas MTS al actualizar la
                  carta desde la hoja de Excel.
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
        </Container>
      </Section>
    </>
  )
}
