import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import type { CatalogColor } from '@/types/content'
import { getColors } from '@/lib/api'
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
function seleccionar(colores: CatalogColor[], cuantos = 16): CatalogColor[] {
  const enStock = colores.filter((c) => c.stock)
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
  const porCada = Math.ceil(cuantos / familias.length)

  for (const lista of familias) {
    const paso = Math.max(1, Math.floor(lista.length / porCada))
    for (let i = 0; i < lista.length && salida.length < cuantos; i += paso) {
      salida.push(lista[i])
    }
  }

  return salida.slice(0, cuantos)
}

export function ColorCarousel() {
  const [colores, setColores] = useState<CatalogColor[] | null>(null)
  const [total, setTotal] = useState(0)
  const pista = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let vivo = true
    getColors().then((d) => {
      if (!vivo) return
      setColores(seleccionar(d.colors))
      setTotal(d.colors.length)
    })
    return () => {
      vivo = false
    }
  }, [])

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
            <span className="eyebrow">Carta de colores</span>
            <h2>Color de catálogo, con equivalencia RAL</h2>
            <p className="carrusel__texto">
              {total} referencias entre poliéster e híbridos, lisos,
              texturizados y gofrados.
            </p>
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

      <Container>
        <Link className="carrusel__enlace" to="/colores">
          Ver las {total} referencias
        </Link>
      </Container>
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
