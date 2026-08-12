import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { CatalogColor, ColorCarouselBlock } from '@/types/content'
import { getColors } from '@/lib/api'
import { esEnStock } from '@/lib/stock'
import { Container, Section } from '@/components/ui'
import './carrusel.css'

/**
 * Adelanto del catálogo en la portada.
 *
 * Va sobre fondo oscuro a propósito: las muestras claras necesitan un fondo
 * que las sostenga, y sobre blanco los blancos y grises del catálogo —que son
 * casi la mitad— desaparecían.
 *
 * Se muestran los colores en existencia si los hay; mientras el cliente no
 * mande esa lista, se toma una selección repartida por familias para que el
 * adelanto no salga entero en tonos parecidos.
 */
const POR_DEFECTO = {
  eyebrow: 'Carta de colores',
  title: 'Color de catálogo, con equivalencia RAL',
  description:
    '{total} referencias entre poliéster e híbridos, lisos, texturizados y gofrados.',
  linkLabel: 'Ver las {total} referencias',
  linkHref: '/colores',
  count: 16,
} as const

function seleccionar(colores: CatalogColor[], cuantos = 16): CatalogColor[] {
  const enStock = colores.filter(esEnStock)
  if (enStock.length > 0) return enStock.slice(0, cuantos)

  // Reparto por familia, tomando de cada una a intervalos regulares.
  const porFamilia = new Map<string, CatalogColor[]>()
  for (const c of colores) {
    const lista = porFamilia.get(c.family) ?? []
    lista.push(c)
    porFamilia.set(c.family, lista)
  }

  const salida: CatalogColor[] = []
  const familias = [...porFamilia.values()]

  // Ronda a ronda, una muestra de cada familia. El reparto anterior tomaba a
  // intervalos dentro de cada familia y se quedaba corto —pedirle 16 devolvía
  // 10—, lo que convertía el número en una promesa que no cumplía. Así el
  // adelanto sigue sin salir entero en tonos parecidos y, cuando una familia
  // se agota, las demás completan el cupo.
  for (let ronda = 0; salida.length < cuantos; ronda++) {
    let quedaAlguna = false

    for (const lista of familias) {
      if (ronda >= lista.length) continue
      quedaAlguna = true
      salida.push(lista[ronda])
      if (salida.length === cuantos) break
    }

    if (!quedaAlguna) break
  }

  return salida
}

export function ColorCarousel({
  eyebrow = POR_DEFECTO.eyebrow,
  title = POR_DEFECTO.title,
  description = POR_DEFECTO.description,
  linkLabel = POR_DEFECTO.linkLabel,
  linkHref = POR_DEFECTO.linkHref,
  count = POR_DEFECTO.count,
}: Omit<ColorCarouselBlock, 'type'> = {}) {
  const [colores, setColores] = useState<CatalogColor[] | null>(null)
  const [total, setTotal] = useState(0)
  const pista = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let vivo = true
    getColors().then((d) => {
      if (!vivo) return
      setColores(seleccionar(d.colors, count))
      setTotal(d.colors.length)
    })
    return () => {
      vivo = false
    }
  }, [count])

  // El número de referencias no se escribe a mano: sale del catálogo, así que
  // sigue siendo cierto cuando el cliente sube una carta nueva. Con `split` y
  // no con una expresión regular porque el texto lo escribe quien edita.
  const conTotal = (texto: string) => texto.split('{total}').join(String(total))

  const desplazar = (signo: number) => {
    const nodo = pista.current
    if (!nodo) return
    // Un paso equivalente a lo que se ve, menos una muestra: así siempre queda
    // una a la vista y no se pierde el hilo de dónde estabas.
    nodo.scrollBy({ left: signo * (nodo.clientWidth - 120), behavior: 'smooth' })
  }

  if (!colores || colores.length === 0) return null

  return (
    <Section theme="dark" className="carrusel">
      <Container>
        <div className="carrusel__cabecera">
          <div>
            {eyebrow && <span className="eyebrow">{eyebrow}</span>}
            {title && <h2>{conTotal(title)}</h2>}
            {description && (
              <p className="carrusel__texto">{conTotal(description)}</p>
            )}
          </div>
          <div className="carrusel__acciones">
            <button
              type="button"
              className="carrusel__flecha"
              aria-label="Ver colores anteriores"
              onClick={() => desplazar(-1)}
            >
              <Flecha dir="izq" />
            </button>
            <button
              type="button"
              className="carrusel__flecha"
              aria-label="Ver más colores"
              onClick={() => desplazar(1)}
            >
              <Flecha dir="der" />
            </button>
          </div>
        </div>
      </Container>

      {/* La pista se sale del contenedor a propósito: que las muestras se
          corten por el borde es lo que indica que hay más al deslizar. */}
      <div className="carrusel__pista" ref={pista}>
        {colores.map((c) => (
          <article className="carrusel__muestra" key={c.code}>
            <div
              className="carrusel__color placa"
              style={{ '--muestra': c.hex } as CSSProperties}
            />
            <p className="carrusel__nombre">{c.name}</p>
            {/* El nombre con el que PPG publica el RAL acompaña al número:
                es como el cliente lo pide en el catálogo del fabricante. */}
            <p className="carrusel__meta">
              {c.ral
                ? `RAL ${c.ral}${c.ralName ? ` · ${c.ralName}` : ''}`
                : c.code}
            </p>
          </article>
        ))}
      </div>

      {linkLabel && linkHref && (
        <Container>
          <Link className="carrusel__enlace" to={linkHref}>
            {conTotal(linkLabel)}
          </Link>
        </Container>
      )}
    </Section>
  )
}

function Flecha({ dir }: { dir: 'izq' | 'der' }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={dir === 'izq' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
    </svg>
  )
}
