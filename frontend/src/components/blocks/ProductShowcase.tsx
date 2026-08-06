import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { FeaturedProduct } from '@/types/content'
import { getFeaturedProducts } from '@/lib/api'
import { Container, Section } from '@/components/ui'
import './productos.css'

/**
 * Los productos PPG, en rejilla de fotos.
 *
 * Antes era un carrusel de tarjetas blancas con foto arriba, párrafo y lista
 * de puntos. Dos problemas: pedía leer tres bloques de texto para entender
 * qué se vende, y no se parecía a nada más de la portada. Ahora usa el mismo
 * lenguaje que la rejilla de mercados —foto de fondo, velo, texto encima— así
 * que la página se recorre de un vistazo en vez de leerse.
 *
 * Rejilla y no carrusel: con tres productos el carrusel escondía el tercero
 * tras una flecha, y las flechas eran el único control del sitio en azul
 * pálido sobre blanco. Si el catálogo crece, la rejilla envuelve sola.
 */
export function ProductShowcase() {
  const [productos, setProductos] = useState<FeaturedProduct[] | null>(null)

  useEffect(() => {
    let vivo = true
    getFeaturedProducts().then((d) => {
      if (vivo) setProductos(d)
    })
    return () => {
      vivo = false
    }
  }, [])

  if (!productos || productos.length === 0) return null

  return (
    <Section className="productos-seccion">
      <Container>
        <header className="productos__cabecera">
          <span className="eyebrow">Productos PPG</span>
          <h2>Lo que suministramos</h2>
          <p className="productos__nota">
            Recubrimiento de marca con respaldo técnico del fabricante, para
            volumen industrial.
          </p>
        </header>

        <ul className="productos__rejilla">
          {productos.map((p) => (
            <li className="producto" key={p.slug}>
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
                {p.cta && (
                  <Link className="producto__enlace" to={p.cta.href}>
                    {p.cta.label}
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M7 17 17 7M9 7h8v8" />
                    </svg>
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  )
}
