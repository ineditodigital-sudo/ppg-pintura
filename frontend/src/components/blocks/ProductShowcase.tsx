import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { FeaturedProduct } from '@/types/content'
import { getFeaturedProducts } from '@/lib/api'
import { Container, Section } from '@/components/ui'
import './productos.css'

/**
 * Los productos PPG, en carrusel.
 *
 * Antes era una rejilla con uno grande y dos pequeños. En carrusel todos
 * pesan lo mismo y el catálogo puede crecer sin rehacer la composición: al
 * añadir un cuarto producto la sección sigue funcionando igual.
 *
 * El desplazamiento es scroll nativo con `scroll-snap`, no un carrusel
 * programado: funciona con gesto táctil, con rueda horizontal y con teclado
 * sin escribir nada de eso a mano, y no se rompe si JavaScript falla.
 */
export function ProductShowcase() {
  const [productos, setProductos] = useState<FeaturedProduct[] | null>(null)
  const pista = useRef<HTMLDivElement>(null)
  const [alInicio, setAlInicio] = useState(true)
  const [alFinal, setAlFinal] = useState(false)

  useEffect(() => {
    let vivo = true
    getFeaturedProducts().then((d) => {
      if (vivo) setProductos(d)
    })
    return () => {
      vivo = false
    }
  }, [])

  /** Deshabilita la flecha que no lleva a ninguna parte. */
  const revisarBordes = () => {
    const n = pista.current
    if (!n) return
    setAlInicio(n.scrollLeft <= 4)
    setAlFinal(n.scrollLeft + n.clientWidth >= n.scrollWidth - 4)
  }

  useEffect(revisarBordes, [productos])

  const desplazar = (signo: number) => {
    const n = pista.current
    if (!n) return
    const tarjeta = n.querySelector<HTMLElement>('.producto')
    const paso = tarjeta ? tarjeta.offsetWidth + 24 : n.clientWidth * 0.8
    n.scrollBy({ left: signo * paso, behavior: 'smooth' })
  }

  if (!productos || productos.length === 0) return null

  return (
    <Section className="productos-seccion">
      <Container>
        <header className="productos__cabecera">
          <div>
            <span className="eyebrow">Productos PPG</span>
            <h2>Lo que distribuimos</h2>
          </div>
          <div className="productos__acciones">
            <p className="productos__nota">
              Producto de marca con respaldo técnico, disponible en
              Aguascalientes.
            </p>
            <div className="productos__flechas">
              <button
                type="button"
                aria-label="Producto anterior"
                disabled={alInicio}
                onClick={() => desplazar(-1)}
              >
                <Flecha dir="izq" />
              </button>
              <button
                type="button"
                aria-label="Siguiente producto"
                disabled={alFinal}
                onClick={() => desplazar(1)}
              >
                <Flecha dir="der" />
              </button>
            </div>
          </div>
        </header>
      </Container>

      {/* La pista sangra hasta el borde: que la última tarjeta se corte es lo
          que indica que la fila continúa. */}
      <div className="productos__pista" ref={pista} onScroll={revisarBordes}>
        {productos.map((p) => (
          <article className="producto" key={p.slug}>
            <div className="producto__foto">
              <img
                src={p.image.src}
                alt={p.image.alt}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="producto__cuerpo">
              <p className="producto__tagline">{p.tagline}</p>
              <h3 className="producto__nombre">{p.name}</h3>
              {p.sku && <p className="producto__sku">Ref. {p.sku}</p>}
              <p className="producto__texto">{p.description}</p>
              {p.highlights.length > 0 && (
                <ul className="producto__puntos">
                  {p.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              )}
              {p.cta && (
                <Link className="producto__enlace" to={p.cta.href}>
                  {p.cta.label}
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
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
