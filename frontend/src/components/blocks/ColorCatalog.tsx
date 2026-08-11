import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import type { CatalogColor, ColorCatalog as Catalogo } from '@/types/content'
import { getColors } from '@/lib/api'
import { enlaceWhatsApp } from '@/lib/social'
import { esEnStock, FAMILIA_STOCK, FICHA_POR_DEFECTO, NOMBRE_STOCK } from '@/lib/stock'
import { useSitio } from '@/lib/useSitio'
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

export function Muestra({
  color,
  onAbrir,
}: {
  color: CatalogColor
  onAbrir: (color: CatalogColor) => void
}) {
  return (
    <li className="carta__muestra">
      {/* La ficha se abre desde un botón y no desde el `li`: así llega por
          teclado y el lector de pantalla la anuncia como lo que es. */}
      <button type="button" className="carta__abrir" onClick={() => onAbrir(color)}>
        {/* El código y el sello van sobre placa clara, no directamente sobre el
            color. Elegir tinta blanca o negra según la luminancia parecía más
            elegante, pero en los tonos medios el contraste caía a 3,3:1: con 83
            colores repartidos por todo el espectro siempre hay unos cuantos que
            se quedan cortos. La placa lo garantiza en todos. */}
        <span
          className="carta__color placa"
          style={{ '--muestra': color.hex } as CSSProperties}
        >
          <span className="carta__codigo">{color.code}</span>
          {color.stock && <span className="carta__sello">En existencia</span>}
        </span>
        <span className="carta__pie">
          <span className="carta__nombre">{color.name}</span>
          <span className="carta__datos">
            {color.ral && (
              <span>
                RAL {color.ral}
                {color.ralName && ` · ${color.ralName}`}
              </span>
            )}
            {color.finish && <span>{color.finish}</span>}
            {color.gloss && <span>Brillo {color.gloss}</span>}
          </span>
        </span>
        <span className="carta__ver">Ver ficha técnica</span>
      </button>
    </li>
  )
}

/**
 * Ficha técnica de una referencia.
 *
 * Usa `<dialog>` nativo: da el foco atrapado, el cierre con `Esc` y el fondo
 * inerte sin escribir nada de eso a mano.
 *
 * **Sólo enseña lo que consta.** El catálogo de PPG publica por referencia el
 * código, el color, la equivalencia RAL, el acabado y el rango de brillo; las
 * horas de niebla salina, el espesor de película y la curva de curado son de
 * la ficha técnica del producto, que no tenemos para estos códigos. Inventar
 * un dato de resistencia en una ficha técnica sería lo peor que podría hacer
 * esta ventana, así que en su lugar ofrece pedirla.
 */
function FichaColor({
  color,
  familia,
  textos,
  onCerrar,
}: {
  color: CatalogColor | null
  familia?: { name: string; description: string }
  /** Textos de la ficha, editables desde la Carta de color. */
  textos?: Catalogo['ficha']
  onCerrar: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  // El número sale de Ajustes, no de aquí: estaba escrito a mano y cambiarlo
  // en el CMS no llegaba a este botón.
  const whatsapp = enlaceWhatsApp(useSitio())

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (color && !d.open) d.showModal()
    if (!color && d.open) d.close()
  }, [color])

  if (!color) return null

  const asunto = `Ficha técnica ${color.code}`
  const cuerpo = `Hola, ¿me pueden enviar la ficha técnica de la referencia ${color.code}${
    color.ral ? ` (RAL ${color.ral})` : ''
  }?`

  return (
    <dialog className="ficha" ref={ref} onClose={onCerrar} aria-labelledby="ficha-titulo">
      {/* Dos columnas en escritorio: la muestra a un lado, ocupando todo el
          alto, y los datos al otro. Antes era una banda de 16/7 encima del
          texto —un color que se vende no se enseña en una tira— y sin límite
          de alto, así que en una pantalla corta la ficha se cortaba por abajo
          sin manera de bajar. En móvil se apila y sube como hoja inferior. */}
      <div
        className="ficha__muestra"
        style={{ '--muestra': color.hex } as CSSProperties}
      >
        <button
          type="button"
          className="ficha__cerrar"
          onClick={onCerrar}
          aria-label="Cerrar la ficha"
        >
          ✕
        </button>

        {/* Las placas garantizan el contraste sobre cualquiera de los 83
            colores; elegir tinta clara u oscura por luminancia se quedaba
            corto en los tonos medios. */}
        <span className="ficha__placa ficha__codigo">{color.code}</span>
        {color.stock && <span className="ficha__placa ficha__sello">En existencia</span>}
        <span className="ficha__placa ficha__hex-muestra">{color.hex.toUpperCase()}</span>
      </div>

      <div className="ficha__cuerpo">
        <div className="ficha__scroll">
        <span className="eyebrow">Referencia {color.code}</span>
        <h2 id="ficha-titulo">
          {color.name}
          {color.ralName && ` · ${color.ralName}`}
        </h2>

        <dl className="ficha__datos">
          <div>
            <dt>Código PPG</dt>
            <dd>{color.code}</dd>
          </div>
          {color.ral && (
            <div>
              <dt>Equivalencia RAL</dt>
              <dd>
                RAL {color.ral}
                {color.ralName && ` · ${color.ralName}`}
              </dd>
            </div>
          )}
          {familia && (
            <div>
              <dt>Química</dt>
              <dd>{familia.name}</dd>
            </div>
          )}
          <div>
            <dt>Acabado</dt>
            <dd>
              {color.finish ?? (color.textured ? 'Texturizado' : 'Liso')}
            </dd>
          </div>
          {color.gloss && (
            <div>
              <dt>Brillo (60°)</dt>
              <dd>{color.gloss}</dd>
            </div>
          )}
          <div>
            <dt>Disponibilidad</dt>
            <dd>{color.stock ? 'En existencia (MTS)' : 'Bajo pedido'}</dd>
          </div>
          {/* El hexadecimal ya va sobre la muestra, que es donde significa
              algo. Repetirlo aquí era una fila más que leer. */}
        </dl>

        {familia && <p className="ficha__nota">{familia.description}</p>}

        <p className="ficha__aviso">
          {textos?.aviso ?? FICHA_POR_DEFECTO.aviso}
        </p>
        </div>

        {/* Fuera del área que se desplaza: en una ficha larga, los botones
            quedaban por debajo del corte y no se llegaba a ellos. */}
        <div className="ficha__acciones">
          <a
            className="btn btn--primary"
            href={`/contacto?asunto=${encodeURIComponent(asunto)}`}
          >
            {textos?.ctaFicha ?? FICHA_POR_DEFECTO.ctaFicha}
          </a>
          {whatsapp && (
            <a
              className="btn btn--secondary"
              href={`${whatsapp}${whatsapp.includes('?') ? '&' : '?'}text=${encodeURIComponent(cuerpo)}`}
              target="_blank"
              rel="noreferrer noopener"
            >
              {textos?.ctaWhatsApp ?? FICHA_POR_DEFECTO.ctaWhatsApp}
            </a>
          )}
        </div>
      </div>
    </dialog>
  )
}

/** Controles + rejilla, sin `Section` ni `Container`: los pone quien lo use. */
export function ExploradorColores({ catalogo }: { catalogo: Catalogo }) {
  const [familia, setFamilia] = useState<string>(FAMILIA_STOCK)
  const [busqueda, setBusqueda] = useState('')
  const [soloExistencia, setSoloExistencia] = useState(false)
  const [ficha, setFicha] = useState<CatalogColor | null>(null)

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
            <Muestra key={c.code} color={c} onAbrir={setFicha} />
          ))}
        </ul>
      )}

      <FichaColor
        color={ficha}
        familia={catalogo.families.find((f) => f.id === ficha?.family)}
        textos={catalogo.ficha}
        onCerrar={() => setFicha(null)}
      />
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
        <span className="eyebrow">Catálogo PPG</span>
        <h2>Carta de color</h2>
        <p className="carta__entradilla-bloque">
          {catalogo.colors.length} referencias con equivalencia RAL y rango de
          brillo. Busca por código, nombre o número RAL.
        </p>
        <ExploradorColores catalogo={catalogo} />
      </Container>
    </Section>
  )
}
